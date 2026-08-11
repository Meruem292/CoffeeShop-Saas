import React, { useEffect, useRef, useState } from 'react';
import { Camera, X, RefreshCw, CheckCircle2, AlertCircle, ScanFace, Sparkles, UserCheck } from 'lucide-react';
import { UserProfile } from '../types';
import {
  getFaceLandmarker,
  extractFaceVector,
  loadImageElement,
  calculateCosineSimilarity,
  calculateDistanceSimilarity,
} from '../lib/mediaPipeFace';

interface FaceScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFaceMatched: (matchedUser: UserProfile) => void;
  allProfiles: UserProfile[];
}

export function FaceScannerModal({
  isOpen,
  onClose,
  onFaceMatched,
  allProfiles = []
}: FaceScannerModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [hasCamera, setHasCamera] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [isFaceDetected, setIsFaceDetected] = useState<boolean>(false);
  const [analysisStatus, setAnalysisStatus] = useState<string>('Center your face in the circle');
  const [matchedUser, setMatchedUser] = useState<UserProfile | null>(null);
  const [isMediaPipeReady, setIsMediaPipeReady] = useState<boolean>(false);

  // Cache candidate landmarks so dynamic comparison is instantaneous
  const candidateVectorsRef = useRef<Map<string, number[]>>(new Map());
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const stopCamera = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const startCamera = async () => {
    stopCamera();
    setErrorMessage('');
    setMatchedUser(null);
    setIsAnalyzing(false);
    setIsFaceDetected(false);
    setAnalysisStatus('Loading Google MediaPipe Face Mesh...');

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setHasCamera(false);
      setErrorMessage('Camera is not supported on this browser or kiosk display.');
      return;
    }

    try {
      const landmarker = await getFaceLandmarker();
      if (landmarker) {
        setIsMediaPipeReady(true);
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        setHasCamera(true);
        setAnalysisStatus('Center your face in the circle');
        startAutoScanLoop();
      }
    } catch (err: any) {
      console.error('Face Scanner Camera Error:', err);
      setHasCamera(false);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setErrorMessage('Camera permission was denied. Please allow camera access.');
      } else {
        setErrorMessage('Unable to access camera feed.');
      }
    }
  };

  const startAutoScanLoop = () => {
    if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);

    scanIntervalRef.current = setInterval(async () => {
      if (!videoRef.current || matchedUser || isAnalyzing) return;

      try {
        const liveVector = await extractFaceVector(videoRef.current);

        if (!liveVector) {
          setIsFaceDetected(false);
          setAnalysisStatus('Center your face in the circle');
          return;
        }

        // Face detected! Turn green
        setIsFaceDetected(true);
        setAnalysisStatus('Face detected! Verifying match...');

        const candidates = allProfiles.filter(p => p.photoURL && p.photoURL.length > 50);
        if (candidates.length === 0) {
          setAnalysisStatus('No registered Face ID photos in customer records');
          return;
        }

        let bestMatchUser: UserProfile | null = null;
        let highestSimilarity = 0;

        for (const candidate of candidates) {
          let candidateVector = candidateVectorsRef.current.get(candidate.uid);

          if (!candidateVector && candidate.photoURL) {
            try {
              const img = await loadImageElement(candidate.photoURL);
              candidateVector = await extractFaceVector(img) || undefined;
              if (candidateVector) {
                candidateVectorsRef.current.set(candidate.uid, candidateVector);
              }
            } catch (e) {
              console.warn(`Failed extracting face vector for candidate ${candidate.uid}:`, e);
            }
          }

          if (candidateVector) {
            const simCosine = calculateCosineSimilarity(liveVector, candidateVector);
            const simDistance = calculateDistanceSimilarity(liveVector, candidateVector);
            const similarityScore = (simCosine + simDistance) / 2;

            if (similarityScore > highestSimilarity) {
              highestSimilarity = similarityScore;
              bestMatchUser = candidate;
            }
          }
        }

        console.log('Auto-Scan MediaPipe Match Score:', highestSimilarity, bestMatchUser?.displayName);

        // High precision threshold >= 0.74
        if (bestMatchUser && highestSimilarity >= 0.74) {
          if (scanIntervalRef.current) {
            clearInterval(scanIntervalRef.current);
            scanIntervalRef.current = null;
          }
          setMatchedUser(bestMatchUser);
          setAnalysisStatus(`Verified! Welcome ${bestMatchUser.displayName}`);
          playSuccessBeep();
          setTimeout(() => {
            onFaceMatched(bestMatchUser!);
            onClose();
          }, 1400);
        } else {
          setAnalysisStatus('Align face inside circle for verification');
        }

      } catch (err) {
        console.warn('Auto scan loop error:', err);
      }
    }, 750);
  };

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode]);

  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
  };

  const playSuccessBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
      osc.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.1); // E5
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.3);
    } catch (_) {}
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border border-amber-500/30 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 bg-slate-950 border-b border-white/10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl transition-colors ${isFaceDetected ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-500'}`}>
              <ScanFace className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white uppercase italic tracking-wider flex items-center gap-1.5">
                AI Face <span className="text-amber-500">Recognition</span>
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              </h3>
              <p className="text-[10px] text-slate-400 font-bold">Auto-detecting customer profile</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Camera Display Area */}
        <div className="relative flex-1 bg-black min-h-[320px] flex items-center justify-center overflow-hidden">
          <video
            ref={videoRef}
            className="w-full h-full object-cover transform scale-x-[-1]"
            playsInline
            muted
          />
          <canvas ref={canvasRef} className="hidden" />

          {/* AI Face Target Overlay */}
          {hasCamera && !matchedUser && (
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none p-4">
              <div className={`relative w-56 h-56 sm:w-64 sm:h-64 rounded-full border-4 transition-all duration-300 ${
                isFaceDetected
                  ? 'border-emerald-500 shadow-[0_0_60px_rgba(16,185,129,0.5)] scale-105'
                  : 'border-amber-500/60 shadow-[0_0_40px_rgba(245,158,11,0.2)]'
              } flex items-center justify-center`}>
                {/* Corner Marks */}
                <div className={`absolute -top-2 -left-2 w-6 h-6 border-t-4 border-l-4 transition-colors ${isFaceDetected ? 'border-emerald-500' : 'border-amber-500'}`} />
                <div className={`absolute -top-2 -right-2 w-6 h-6 border-t-4 border-r-4 transition-colors ${isFaceDetected ? 'border-emerald-500' : 'border-amber-500'}`} />
                <div className={`absolute -bottom-2 -left-2 w-6 h-6 border-b-4 border-l-4 transition-colors ${isFaceDetected ? 'border-emerald-500' : 'border-amber-500'}`} />
                <div className={`absolute -bottom-2 -right-2 w-6 h-6 border-b-4 border-r-4 transition-colors ${isFaceDetected ? 'border-emerald-500' : 'border-amber-500'}`} />

                {/* Animated Scanning Beam */}
                <div className={`absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent ${isFaceDetected ? 'via-emerald-400 shadow-[0_0_15px_#10b981]' : 'via-amber-400 shadow-[0_0_15px_#f59e0b]'} animate-[bounce_2s_infinite]`} />

                <div className="text-center p-3 bg-black/50 backdrop-blur-sm rounded-2xl border border-white/10 max-w-[200px]">
                  {isFaceDetected ? (
                    <UserCheck className="w-8 h-8 text-emerald-400 mx-auto mb-1 animate-bounce" />
                  ) : (
                    <ScanFace className="w-8 h-8 text-amber-400 mx-auto mb-1 opacity-80" />
                  )}
                  <span className={`text-[10px] font-black uppercase tracking-widest block truncate ${isFaceDetected ? 'text-emerald-300' : 'text-amber-300'}`}>
                    {analysisStatus}
                  </span>
                </div>
              </div>

              {/* Facing Camera Switch Button */}
              <button
                type="button"
                onClick={toggleFacingMode}
                className="pointer-events-auto absolute bottom-3 right-3 p-2.5 bg-black/60 hover:bg-black/80 backdrop-blur text-white rounded-full border border-white/20 transition-all active:scale-95 shadow-lg"
                title="Switch Camera"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Matched Success Card Overlay */}
          {matchedUser && (
            <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-in zoom-in-95 duration-300">
              <div className="w-16 h-16 bg-emerald-500 text-slate-950 rounded-3xl flex items-center justify-center font-black shadow-lg shadow-emerald-500/30 mb-3 animate-bounce">
                <UserCheck className="w-8 h-8" />
              </div>
              <span className="text-xs font-black uppercase tracking-widest text-emerald-400 mb-1">
                Face ID Verified!
              </span>
              <h4 className="text-xl font-black text-white italic tracking-tight">
                Welcome, {matchedUser.displayName || 'Valued Customer'}!
              </h4>
              <div className="mt-3 px-4 py-2 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center gap-2 text-amber-400 text-xs font-black">
                <span>⚡ Loyalty Points: {matchedUser.points || 0} Pts</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-2">Linking account automatically...</p>
            </div>
          )}

          {/* Error / No Camera Overlay */}
          {hasCamera === false && (
            <div className="p-6 text-center space-y-3">
              <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
              <p className="text-xs font-bold text-rose-300 max-w-xs">{errorMessage}</p>
              <button
                onClick={startCamera}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-black uppercase tracking-wider"
              >
                Retry Camera
              </button>
            </div>
          )}
        </div>

        {/* Controls Footer */}
        <div className="p-4 bg-slate-950 border-t border-white/10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${isFaceDetected ? 'bg-emerald-500 animate-ping' : 'bg-amber-500 animate-pulse'}`} />
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              {isFaceDetected ? 'Face Locked & Verifying' : 'Position face in circle'}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-5 bg-white/10 hover:bg-white/20 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
