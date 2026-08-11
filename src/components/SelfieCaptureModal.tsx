import React, { useEffect, useRef, useState } from 'react';
import { Camera, X, RefreshCw, Check, Sparkles, Upload, ScanFace, AlertCircle, ArrowLeft, ArrowRight, Smile, UserCheck, ShieldCheck } from 'lucide-react';
import { detectHeadPoseAndExpression, getFaceLandmarker, extractFaceVector } from '../lib/mediaPipeFace';

interface SelfieCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPhotoCaptured: (
    base64Image: string,
    angleVectors?: {
      front?: number[];
      left?: number[];
      right?: number[];
      smile?: number[];
    }
  ) => Promise<void>;
}

interface CapturedPose {
  stepIndex: number;
  label: string;
  base64: string;
  vector: number[];
}

const REGISTRATION_STEPS = [
  { index: 0, id: 'front', label: 'Front Neutral', hint: 'Look directly into camera', icon: ScanFace },
  { index: 1, id: 'left', label: 'Turn Left', hint: 'Turn head slightly to the LEFT', icon: ArrowLeft },
  { index: 2, id: 'right', label: 'Turn Right', hint: 'Turn head slightly to the RIGHT', icon: ArrowRight },
  { index: 3, id: 'smile', label: 'Smile', hint: 'Smile naturally at camera', icon: Smile },
];

export function SelfieCaptureModal({
  isOpen,
  onClose,
  onPhotoCaptured,
}: SelfieCaptureModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const detectIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const [currentStep, setCurrentStep] = useState<number>(0);
  const currentStepRef = useRef<number>(0);

  useEffect(() => {
    currentStepRef.current = currentStep;
  }, [currentStep]);

  const [capturedPoses, setCapturedPoses] = useState<CapturedPose[]>([]);
  const [hasCamera, setHasCamera] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [isPoseMatched, setIsPoseMatched] = useState<boolean>(false);
  const [poseStatusText, setPoseStatusText] = useState<string>('Center your face');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  const stopCamera = () => {
    if (detectIntervalRef.current) {
      clearInterval(detectIntervalRef.current);
      detectIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const startCamera = async () => {
    stopCamera();
    setErrorMessage('');
    setIsPoseMatched(false);
    setPoseStatusText('Initializing AI Face Engine...');

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setHasCamera(false);
      setErrorMessage('Camera is not supported on this browser or device.');
      return;
    }

    try {
      await getFaceLandmarker();

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1080 },
          height: { ideal: 1080 },
        },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        setHasCamera(true);
        startPoseDetectionLoop();
      }
    } catch (err: any) {
      console.error('Selfie Camera Error:', err);
      setHasCamera(false);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setErrorMessage('Camera access was denied. Please allow camera permissions.');
      } else {
        setErrorMessage('Unable to access device camera.');
      }
    }
  };

  const holdCountRef = useRef<number>(0);
  const isCapturingRef = useRef<boolean>(false);

  const startPoseDetectionLoop = () => {
    if (detectIntervalRef.current) clearInterval(detectIntervalRef.current);
    holdCountRef.current = 0;

    detectIntervalRef.current = setInterval(async () => {
      if (!videoRef.current || isCompleted || isCapturingRef.current) return;

      try {
        const stepIdx = currentStepRef.current;
        const step = REGISTRATION_STEPS[stepIdx] || REGISTRATION_STEPS[0];

        const poseRes = await detectHeadPoseAndExpression(videoRef.current);
        if (!poseRes || !poseRes.hasFace) {
          setIsPoseMatched(false);
          holdCountRef.current = 0;
          setPoseStatusText('Position face inside ring');
          return;
        }

        let matched = false;

        if (step.id === 'front') {
          matched = poseRes.isCenter;
          setPoseStatusText(matched ? 'Center pose locked! Hold...' : 'Look straight into camera');
        } else if (step.id === 'left') {
          matched = poseRes.isTurnLeft;
          setPoseStatusText(matched ? 'Left angle locked! Hold...' : 'Turn head slightly LEFT ⬅️ or tap Capture');
        } else if (step.id === 'right') {
          matched = poseRes.isTurnRight;
          setPoseStatusText(matched ? 'Right angle locked! Hold...' : 'Turn head slightly RIGHT ➡️ or tap Capture');
        } else if (step.id === 'smile') {
          matched = poseRes.isSmiling || poseRes.isCenter;
          setPoseStatusText(matched ? 'Nice smile locked! Hold...' : 'Smile into camera 😊 or tap Capture');
        }

        setIsPoseMatched(matched);

        if (matched) {
          holdCountRef.current += 1;
          if (holdCountRef.current >= 2 && !isCapturingRef.current) {
            isCapturingRef.current = true;
            holdCountRef.current = 0;
            await captureCurrentPose();
            setTimeout(() => {
              isCapturingRef.current = false;
            }, 600);
          }
        } else {
          holdCountRef.current = 0;
        }
      } catch (e) {
        // quiet error handle
      }
    }, 350);
  };

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
      setCapturedPoses([]);
      setIsCompleted(false);
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode]);

  const toggleCameraFacing = () => {
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
  };

  const captureCurrentPose = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;

    const size = Math.min(video.videoWidth || 640, video.videoHeight || 640);
    canvas.width = size;
    canvas.height = size;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (facingMode === 'user') {
      ctx.translate(size, 0);
      ctx.scale(-1, 1);
    }

    const sx = ((video.videoWidth || size) - size) / 2;
    const sy = ((video.videoHeight || size) - size) / 2;

    ctx.drawImage(video, sx, sy, size, size, 0, 0, size, size);

    const base64 = canvas.toDataURL('image/jpeg', 0.88);
    const vector = (await extractFaceVector(canvas)) || [];

    const stepIdx = currentStepRef.current;
    const stepData = REGISTRATION_STEPS[stepIdx] || REGISTRATION_STEPS[0];

    const newPose: CapturedPose = {
      stepIndex: stepIdx,
      label: stepData.label,
      base64,
      vector,
    };

    setCapturedPoses((prev) => {
      const filtered = prev.filter((p) => p.stepIndex !== stepIdx);
      return [...filtered, newPose];
    });

    if (stepIdx < REGISTRATION_STEPS.length - 1) {
      const nextStep = stepIdx + 1;
      setCurrentStep(nextStep);
      currentStepRef.current = nextStep;
      setIsPoseMatched(false);
      holdCountRef.current = 0;
    } else {
      // All 4 poses captured!
      setIsCompleted(true);
      stopCamera();
    }
  };

  const handleConfirmMultiPose = async () => {
    if (capturedPoses.length === 0 || isSaving) return;
    setIsSaving(true);
    try {
      const primaryPhoto = capturedPoses.find(p => p.stepIndex === 0)?.base64 || capturedPoses[0].base64;
      
      const angleVectors: {
        front?: number[];
        left?: number[];
        right?: number[];
        smile?: number[];
      } = {};

      capturedPoses.forEach((p) => {
        const stepInfo = REGISTRATION_STEPS[p.stepIndex];
        if (stepInfo && p.vector && p.vector.length > 0) {
          angleVectors[stepInfo.id as keyof typeof angleVectors] = p.vector;
        }
      });

      await onPhotoCaptured(primaryPhoto, angleVectors);
      onClose();
    } catch (err) {
      console.error('Failed saving 3D face vectors:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileUploadFallback = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      const img = new Image();
      img.onload = async () => {
        const vec = await extractFaceVector(img) || [];
        setCapturedPoses([{ stepIndex: 0, label: 'Uploaded Photo', base64, vector: vec }]);
        setIsCompleted(true);
        stopCamera();
      };
      img.src = base64;
    };
    reader.readAsDataURL(file);
  };

  if (!isOpen) return null;

  const currentStepInfo = REGISTRATION_STEPS[currentStep] || REGISTRATION_STEPS[REGISTRATION_STEPS.length - 1];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border border-amber-500/30 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 bg-slate-950 border-b border-white/10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/20 text-amber-500 rounded-xl">
              <ScanFace className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white uppercase italic tracking-wider flex items-center gap-1.5">
                3D Multi-Angle <span className="text-amber-500">Face ID</span>
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              </h3>
              <p className="text-[10px] text-slate-400 font-bold">Multi-vector registration for 100% accuracy</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Progress Tracker */}
        {!isCompleted && (
          <div className="bg-slate-950/80 px-4 py-2 border-b border-white/10 flex items-center justify-between gap-1">
            {REGISTRATION_STEPS.map((step) => {
              const isDone = capturedPoses.some((p) => p.stepIndex === step.index);
              const isActive = currentStep === step.index;
              const StepIcon = step.icon;

              return (
                <div
                  key={step.id}
                  onClick={() => {
                    if (isDone) setCurrentStep(step.index);
                  }}
                  className={`flex-1 py-1.5 px-1 rounded-xl text-center border transition-all cursor-pointer flex flex-col items-center gap-0.5 ${
                    isActive
                      ? 'bg-amber-500/20 border-amber-500 text-amber-400 scale-105'
                      : isDone
                      ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                      : 'bg-white/5 border-white/10 text-slate-500'
                  }`}
                >
                  <StepIcon className="w-3.5 h-3.5" />
                  <span className="text-[9px] font-black uppercase tracking-wider block truncate">
                    {step.label}
                  </span>
                  {isDone && <Check className="w-3 h-3 text-emerald-400" />}
                </div>
              );
            })}
          </div>
        )}

        {/* Main Body Viewport */}
        <div className="relative flex-1 bg-black min-h-[320px] flex items-center justify-center overflow-hidden">
          {isCompleted ? (
            /* Enrollment Completed Summary Screen */
            <div className="w-full h-full p-5 flex flex-col items-center justify-center text-center space-y-4 bg-gradient-to-b from-slate-950 to-slate-900">
              <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 border-2 border-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-base font-black text-white uppercase tracking-wider italic">
                  Multi-Angle 3D Profile Ready!
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  Captured {capturedPoses.length} biometric facial vectors for accurate kiosk recognition.
                </p>
              </div>

              {/* Angle Thumbnails */}
              <div className="grid grid-cols-4 gap-2 w-full pt-2">
                {capturedPoses.map((pose) => (
                  <div key={pose.stepIndex} className="relative rounded-2xl overflow-hidden border border-emerald-500/40 bg-slate-950 p-1">
                    <img src={pose.base64} alt={pose.label} className="w-full h-16 object-cover rounded-xl" />
                    <span className="block text-[8px] font-black uppercase text-slate-300 mt-1 truncate">
                      {pose.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Live Camera Stream & Target Overlay */
            <>
              <video
                ref={videoRef}
                className={`w-full h-full object-cover ${facingMode === 'user' ? 'transform scale-x-[-1]' : ''}`}
                playsInline
                muted
              />
              <canvas ref={canvasRef} className="hidden" />

              {hasCamera && (
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none p-4">
                  <div className={`relative w-60 h-60 rounded-full border-4 transition-all duration-300 ${
                    isPoseMatched
                      ? 'border-emerald-500 shadow-[0_0_50px_rgba(16,185,129,0.5)] scale-105'
                      : 'border-amber-500/70 shadow-[0_0_30px_rgba(245,158,11,0.3)]'
                  } flex flex-col items-center justify-center`}>
                    
                    {/* Direction Visual Guide Overlay */}
                    <div className="p-3 bg-black/60 backdrop-blur-md rounded-2xl border border-white/10 text-center max-w-[180px]">
                      <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 block mb-0.5">
                        Step {currentStep + 1} of 4
                      </span>
                      <p className="text-xs font-black text-white italic">
                        {currentStepInfo.hint}
                      </p>
                      <span className={`text-[9px] font-bold block mt-1 uppercase ${isPoseMatched ? 'text-emerald-400' : 'text-slate-400'}`}>
                        {poseStatusText}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Flip camera toggle button */}
              {hasCamera && (
                <button
                  type="button"
                  onClick={toggleCameraFacing}
                  className="absolute top-3 right-3 p-2.5 bg-black/60 hover:bg-black/80 text-white rounded-full border border-white/20 backdrop-blur transition-all active:scale-95"
                  title="Switch Camera"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              )}
            </>
          )}

          {/* Camera Error Fallback */}
          {hasCamera === false && !isCompleted && (
            <div className="p-6 text-center space-y-3">
              <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
              <p className="text-xs font-bold text-rose-300 max-w-xs">{errorMessage}</p>
              <button
                onClick={startCamera}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-black uppercase tracking-wider"
              >
                Try Again
              </button>
            </div>
          )}
        </div>

        {/* Modal Controls Footer */}
        <div className="p-4 bg-slate-950 border-t border-white/10 space-y-3 shrink-0">
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            onChange={handleFileUploadFallback}
            className="hidden"
          />

          {isCompleted ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleConfirmMultiPose}
                disabled={isSaving}
                className="flex-1 py-3.5 px-4 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
                <span>{isSaving ? 'Saving 3D Profile...' : 'Save 3D Face Profile'}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsCompleted(false);
                  setCurrentStep(0);
                  setCapturedPoses([]);
                  startCamera();
                }}
                disabled={isSaving}
                className="py-3.5 px-4 bg-white/10 hover:bg-white/20 text-white font-black text-xs uppercase tracking-wider rounded-2xl transition-all"
              >
                Re-scan
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={captureCurrentPose}
                disabled={!hasCamera}
                className={`flex-1 py-3.5 px-4 font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 ${
                  isPoseMatched
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
                    : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                }`}
              >
                <Camera className="w-4 h-4" />
                <span>Capture {currentStepInfo.label} Angle</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-3.5 bg-white/10 hover:bg-white/20 text-white rounded-2xl transition-all"
                title="Upload Photo Fallback"
              >
                <Upload className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
