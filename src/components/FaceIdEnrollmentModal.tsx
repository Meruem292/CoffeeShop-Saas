import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Camera,
  X,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sparkles,
  Upload,
  User,
  ShieldCheck,
  Smile,
  ArrowLeft,
  ArrowRight,
  Eye,
  Check,
  ChevronRight,
  Flame
} from 'lucide-react';
import {
  getFaceLandmarker,
  detectHeadPoseAndExpression,
  extractFaceVector,
  assessFaceQuality,
  detectFaceLandmarks,
} from '../lib/mediaPipeFace';
import { useToast } from '../lib/ToastContext';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { UserProfile } from '../types';

interface FaceIdEnrollmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUser: { uid: string; displayName?: string; photoURL?: string; email?: string };
  onSuccess?: () => void;
}

type EnrollmentStep = 'front' | 'left' | 'right' | 'smile' | 'complete';

interface CapturedData {
  front?: { vector: number[]; photo: string };
  left?: { vector: number[]; photo: string };
  right?: { vector: number[]; photo: string };
  smile?: { vector: number[]; photo: string };
}

export function FaceIdEnrollmentModal({
  isOpen,
  onClose,
  targetUser,
  onSuccess,
}: FaceIdEnrollmentModalProps) {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState<EnrollmentStep>('front');
  const [capturedData, setCapturedData] = useState<CapturedData>({});
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<string>('Align your face in the oval');
  const [isPoseMatched, setIsPoseMatched] = useState(false);
  const [qualityScore, setQualityScore] = useState(100);

  const currentStepRef = useRef<EnrollmentStep>('front');
  const isCapturingRef = useRef<boolean>(false);

  // Keep refs synchronized with state
  useEffect(() => {
    currentStepRef.current = currentStep;
  }, [currentStep]);

  useEffect(() => {
    isCapturingRef.current = isCapturing;
  }, [isCapturing]);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const poseHoldTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize camera & MediaPipe landmarker
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      return;
    }

    let isMounted = true;

    async function init() {
      setIsInitializing(true);
      setCameraError(null);

      try {
        // Pre-warm landmarker
        await getFaceLandmarker();

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: 'user',
          },
          audio: false,
        });

        if (!isMounted) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play();
            setIsInitializing(false);
            startPoseDetectionLoop();
          };
        }
      } catch (err: any) {
        console.error('Camera initialization error:', err);
        setCameraError(
          err.name === 'NotAllowedError'
            ? 'Camera access was denied. Please allow camera permissions in your browser.'
            : 'Unable to access camera device. You can upload a high-quality photo instead.'
        );
        setIsInitializing(false);
      }
    }

    init();

    return () => {
      isMounted = false;
      stopCamera();
    };
  }, [isOpen]);

  const stopCamera = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (poseHoldTimerRef.current) {
      clearTimeout(poseHoldTimerRef.current);
      poseHoldTimerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  // Helper to capture high-res frame from video
  const captureFrame = useCallback((): string | null => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0 || video.videoHeight === 0) return null;

    const canvas = document.createElement('canvas');
    const size = Math.min(video.videoWidth, video.videoHeight);
    canvas.width = 400;
    canvas.height = 400;

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const sx = (video.videoWidth - size) / 2;
    const sy = (video.videoHeight - size) / 2;

    // Mirror horizontal for intuitive selfie view
    ctx.translate(400, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, sx, sy, size, size, 0, 0, 400, 400);

    return canvas.toDataURL('image/jpeg', 0.9);
  }, []);

  // Real-time pose evaluation loop reading live refs (no stale closures)
  const startPoseDetectionLoop = useCallback(() => {
    const checkPose = async () => {
      const video = videoRef.current;
      const step = currentStepRef.current;

      if (!video || video.paused || video.ended || step === 'complete') {
        animationFrameRef.current = requestAnimationFrame(checkPose);
        return;
      }

      try {
        const poseResult = await detectHeadPoseAndExpression(video);
        if (poseResult && poseResult.hasFace) {
          // Quality check
          const quality = assessFaceQuality(video, null);
          setQualityScore(quality.qualityScore);

          let matched = false;
          let message = '';

          switch (step) {
            case 'front':
              if (poseResult.isCenter) {
                matched = true;
                message = 'Looking good! Hold steady looking straight ahead...';
              } else if (poseResult.isTurnLeft || poseResult.isTurnRight) {
                message = 'Face the camera directly with neutral expression';
              } else {
                message = 'Look directly at the camera with neutral face';
              }
              break;

            case 'left':
              if (poseResult.isTurnLeft) {
                matched = true;
                message = 'Great! Hold head turned left...';
              } else if (poseResult.isTurnRight) {
                message = 'Turn head to the other side (to your left ←)';
              } else {
                message = 'Turn head slightly to the left (←)';
              }
              break;

            case 'right':
              if (poseResult.isTurnRight) {
                matched = true;
                message = 'Great! Hold head turned right...';
              } else if (poseResult.isTurnLeft) {
                message = 'Turn head to the other side (to your right →)';
              } else {
                message = 'Turn head slightly to the right (→)';
              }
              break;

            case 'smile':
              if (poseResult.isSmiling) {
                matched = true;
                message = 'Awesome smile! Capturing...';
              } else {
                message = 'Give a bright, natural smile :)';
              }
              break;
          }

          setFeedback(message);
          setIsPoseMatched(matched);

          // Auto-trigger capture if matched and not already capturing
          if (matched && poseResult.vector && !isCapturingRef.current) {
            if (!poseHoldTimerRef.current) {
              poseHoldTimerRef.current = setTimeout(() => {
                handleAutoCapture(step, poseResult.vector!);
              }, 350); // 350ms smooth hold
            }
          } else {
            if (poseHoldTimerRef.current) {
              clearTimeout(poseHoldTimerRef.current);
              poseHoldTimerRef.current = null;
            }
          }
        } else {
          setFeedback('Position your face clearly within the oval frame');
          setIsPoseMatched(false);
          if (poseHoldTimerRef.current) {
            clearTimeout(poseHoldTimerRef.current);
            poseHoldTimerRef.current = null;
          }
        }
      } catch (e) {
        // ignore frame skip
      }

      animationFrameRef.current = requestAnimationFrame(checkPose);
    };

    animationFrameRef.current = requestAnimationFrame(checkPose);
  }, []);

  const handleAutoCapture = (step: EnrollmentStep, vector: number[]) => {
    if (isCapturingRef.current) return;
    isCapturingRef.current = true;
    setIsCapturing(true);

    if (poseHoldTimerRef.current) {
      clearTimeout(poseHoldTimerRef.current);
      poseHoldTimerRef.current = null;
    }

    const photo = captureFrame();
    if (!photo) {
      isCapturingRef.current = false;
      setIsCapturing(false);
      return;
    }

    setCapturedData((prev) => ({
      ...prev,
      [step]: { vector, photo },
    }));

    toast.success(`Captured ${step.toUpperCase()} angle!`);

    // Advance to next step synchronously in ref and state
    let nextStep: EnrollmentStep = 'front';
    if (step === 'front') nextStep = 'left';
    else if (step === 'left') nextStep = 'right';
    else if (step === 'right') nextStep = 'smile';
    else if (step === 'smile') nextStep = 'complete';

    currentStepRef.current = nextStep;
    setCurrentStep(nextStep);

    setTimeout(() => {
      isCapturingRef.current = false;
      setIsCapturing(false);
    }, 450);
  };

  // Manual capture button handler
  const handleManualCapture = async () => {
    const video = videoRef.current;
    if (!video || isCapturingRef.current) return;

    isCapturingRef.current = true;
    setIsCapturing(true);
    const step = currentStepRef.current;

    try {
      const vector = await extractFaceVector(video);
      if (!vector) {
        toast.error('Could not detect a clear face. Please center your face in good lighting.');
        return;
      }

      const photo = captureFrame();
      if (!photo) return;

      setCapturedData((prev) => ({
        ...prev,
        [step]: { vector, photo },
      }));

      toast.success(`Captured ${step.toUpperCase()} angle!`);

      let nextStep: EnrollmentStep = 'front';
      if (step === 'front') nextStep = 'left';
      else if (step === 'left') nextStep = 'right';
      else if (step === 'right') nextStep = 'smile';
      else if (step === 'smile') nextStep = 'complete';

      currentStepRef.current = nextStep;
      setCurrentStep(nextStep);
    } catch (err) {
      toast.error('Failed to extract face features.');
    } finally {
      setTimeout(() => {
        isCapturingRef.current = false;
        setIsCapturing(false);
      }, 400);
    }
  };

  // Upload photo fallback handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file (JPEG or PNG).');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string;
      const img = new Image();
      img.onload = async () => {
        try {
          const vector = await extractFaceVector(img);
          if (!vector) {
            toast.error('No clear face detected in the uploaded photo. Please try a clear portrait.');
            return;
          }

          // Use this photo for front and baseline
          setCapturedData({
            front: { vector, photo: dataUrl },
            left: { vector, photo: dataUrl },
            right: { vector, photo: dataUrl },
            smile: { vector, photo: dataUrl },
          });
          currentStepRef.current = 'complete';
          setCurrentStep('complete');
          toast.success('Face photo processed successfully!');
        } catch (err) {
          toast.error('Error analyzing photo features.');
        }
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  // Save enrolled biometrics to Firestore
  const handleSaveEnrollment = async () => {
    if (!targetUser?.uid) return;
    if (!capturedData.front) {
      toast.error('Front face vector is required.');
      return;
    }

    setIsSaving(true);
    try {
      const frontVec = capturedData.front.vector;
      const leftVec = capturedData.left?.vector || frontVec;
      const rightVec = capturedData.right?.vector || frontVec;
      const smileVec = capturedData.smile?.vector || frontVec;

      const profileRef = doc(db, 'profiles', targetUser.uid);
      await setDoc(
        profileRef,
        {
          faceVector_front: frontVec,
          faceVector_left: leftVec,
          faceVector_right: rightVec,
          faceVector_smile: smileVec,
          faceAngles: {
            front: frontVec,
            left: leftVec,
            right: rightVec,
            smile: smileVec,
          },
          // Store serialized vectors in string array so Firestore doesn't error on nested arrays
          faceVectors: [
            JSON.stringify(frontVec),
            JSON.stringify(leftVec),
            JSON.stringify(rightVec),
            JSON.stringify(smileVec),
          ],
          photoURL: capturedData.front.photo || targetUser.photoURL || '',
          updatedAt: Date.now(),
        },
        { merge: true }
      );

      toast.success('🎉 Face ID Biometrics successfully registered!');
      onSuccess?.();
      onClose();
    } catch (err: any) {
      console.error('Error saving face enrollment:', err);
      toast.error('Failed to save biometric data. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const stepsOrder: { id: EnrollmentStep; label: string; icon: React.ReactNode }[] = [
    { id: 'front', label: 'Front', icon: <Eye className="w-3.5 h-3.5" /> },
    { id: 'left', label: 'Left Angle', icon: <ArrowLeft className="w-3.5 h-3.5" /> },
    { id: 'right', label: 'Right Angle', icon: <ArrowRight className="w-3.5 h-3.5" /> },
    { id: 'smile', label: 'Smile', icon: <Smile className="w-3.5 h-3.5" /> },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#0a0a0c] border border-white/10 rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 shadow-inner">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black uppercase tracking-tight text-white flex items-center gap-2">
                Face ID Enrollment
                <span className="px-2 py-0.5 rounded-full text-[9px] bg-amber-500/20 text-amber-400 font-mono">
                  MediaPipe AI
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Register biometric face profile for {targetUser.displayName || 'Customer'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step Progress Indicators */}
        <div className="px-6 py-3 bg-black/40 border-b border-white/5 flex items-center justify-between gap-2 overflow-x-auto scrollbar-hide">
          {stepsOrder.map((stepItem, idx) => {
            const isDone = !!capturedData[stepItem.id as keyof CapturedData];
            const isCurrent = currentStep === stepItem.id;
            return (
              <button
                key={stepItem.id}
                onClick={() => isDone && setCurrentStep(stepItem.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all shrink-0 ${
                  isCurrent
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 scale-105'
                    : isDone
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                    : 'bg-white/5 text-slate-500 border border-white/5'
                }`}
              >
                {isDone ? <Check className="w-3 h-3" /> : stepItem.icon}
                <span>
                  {idx + 1}. {stepItem.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 flex flex-col items-center">
          {currentStep !== 'complete' ? (
            <div className="w-full flex flex-col items-center">
              {/* Live Camera View with Oval Reticle */}
              <div className="relative w-full max-w-[320px] aspect-square rounded-[2rem] overflow-hidden bg-black/60 border-2 border-white/10 shadow-2xl flex items-center justify-center group">
                {cameraError ? (
                  <div className="p-6 text-center text-rose-400 space-y-3">
                    <AlertCircle className="w-10 h-10 mx-auto text-rose-500" />
                    <p className="text-xs font-bold leading-relaxed">{cameraError}</p>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 bg-amber-500 text-slate-950 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-amber-400 transition-all inline-flex items-center gap-2"
                    >
                      <Upload className="w-3.5 h-3.5" /> Upload Photo Instead
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Mirrored Video Element */}
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover scale-x-[-1]"
                    />

                    {/* Oval Biometric Guide Frame */}
                    <div
                      className={`absolute inset-6 rounded-[50%] border-2 pointer-events-none transition-all duration-300 flex items-center justify-center ${
                        isPoseMatched
                          ? 'border-green-400 shadow-[0_0_30px_rgba(74,222,128,0.4)] bg-green-500/5'
                          : 'border-amber-500/60 shadow-[0_0_20px_rgba(245,158,11,0.2)]'
                      }`}
                    >
                      {/* Scanning Line Animation */}
                      <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent animate-bounce opacity-50" />
                    </div>

                    {/* Step Icon Overlay */}
                    <div className="absolute top-3 left-3 px-3 py-1 bg-black/60 backdrop-blur-md rounded-full border border-white/10 text-[10px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3 text-amber-400 animate-spin" />
                      Step: {currentStep.toUpperCase()}
                    </div>

                    {/* Quality Indicator */}
                    <div className="absolute top-3 right-3 px-2.5 py-1 bg-black/60 backdrop-blur-md rounded-full border border-white/10 text-[9px] font-bold text-slate-300 flex items-center gap-1">
                      <div
                        className={`w-1.5 h-1.5 rounded-full ${
                          qualityScore > 70 ? 'bg-green-400' : 'bg-amber-400'
                        }`}
                      />
                      Score: {qualityScore}%
                    </div>
                  </>
                )}
              </div>

              {/* Real-time Instruction Feedback Pill */}
              <div
                className={`mt-4 px-4 py-2 rounded-2xl border text-xs font-bold text-center max-w-sm transition-all duration-300 ${
                  isPoseMatched
                    ? 'bg-green-500/10 border-green-500/30 text-green-400 shadow-[0_0_15px_rgba(74,222,128,0.15)]'
                    : 'bg-white/5 border-white/10 text-slate-300'
                }`}
              >
                {feedback}
              </div>

              {/* Action Buttons */}
              <div className="w-full max-w-sm mt-6 flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleManualCapture}
                  disabled={isCapturing || !!cameraError}
                  className="flex-1 py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black uppercase tracking-wider text-xs rounded-2xl shadow-lg shadow-amber-500/20 active:scale-98 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Camera className="w-4 h-4" />
                  {isCapturing ? 'Analyzing...' : `Capture ${currentStep.toUpperCase()}`}
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-3.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-2xl transition-all"
                  title="Upload face image file"
                >
                  <Upload className="w-4 h-4 text-slate-300" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            </div>
          ) : (
            /* Complete & Review State */
            <div className="w-full flex flex-col items-center text-center space-y-6 animate-in zoom-in-95 duration-300">
              <div className="w-16 h-16 rounded-full bg-green-500/20 border border-green-500/40 text-green-400 flex items-center justify-center shadow-[0_0_30px_rgba(74,222,128,0.3)]">
                <ShieldCheck className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-xl font-black uppercase tracking-tight text-white">
                  Biometric Scans Ready!
                </h3>
                <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                  All 4 face angles and 3D landmark mesh vectors captured with high precision.
                </p>
              </div>

              {/* Angle Gallery Preview */}
              <div className="grid grid-cols-4 gap-2 w-full max-w-sm">
                {stepsOrder.map((step) => {
                  const data = capturedData[step.id as keyof CapturedData];
                  return (
                    <div
                      key={step.id}
                      className="flex flex-col items-center bg-white/5 border border-white/10 rounded-2xl p-2 gap-1.5"
                    >
                      <div className="w-14 h-14 rounded-xl overflow-hidden bg-black/50 border border-white/10 relative">
                        {data?.photo ? (
                          <img
                            src={data.photo}
                            alt={step.label}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-600">
                            <User className="w-5 h-5" />
                          </div>
                        )}
                        <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-green-500 text-slate-950 flex items-center justify-center">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                      </div>
                      <span className="text-[9px] font-black uppercase text-slate-300">
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="w-full max-w-sm space-y-2 pt-2">
                <button
                  type="button"
                  onClick={handleSaveEnrollment}
                  disabled={isSaving}
                  className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-slate-950 font-black uppercase tracking-widest text-xs rounded-2xl shadow-xl shadow-green-500/20 active:scale-98 transition-all flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {isSaving ? 'Registering to Database...' : 'Save Face ID Profile'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCapturedData({});
                    setCurrentStep('front');
                  }}
                  disabled={isSaving}
                  className="w-full py-2.5 text-xs text-slate-400 hover:text-white font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors"
                >
                  <RefreshCw className="w-3 h-3" /> Re-take Biometric Scans
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
