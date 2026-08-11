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
  const [analysisStatus, setAnalysisStatus] = useState<string>('');
  const [matchedUser, setMatchedUser] = useState<UserProfile | null>(null);
  const [isMediaPipeReady, setIsMediaPipeReady] = useState<boolean>(false);

  // Cache candidate landmarks so dynamic comparison is instantaneous
  const candidateVectorsRef = useRef<Map<string, number[]>>(new Map());

  const stopCamera = () => {
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

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setHasCamera(false);
      setErrorMessage('Camera is not supported on this browser or kiosk display.');
      return;
    }

    try {
      // Pre-warm Google MediaPipe Face Landmarker client-side
      setAnalysisStatus('Loading Google MediaPipe Face Mesh...');
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

  const handleScanFace = async () => {
    if (isAnalyzing || !videoRef.current) return;

    setIsAnalyzing(true);
    setErrorMessage('');
    setAnalysisStatus('Google MediaPipe: Detecting Face Mesh...');

    try {
      // 1. Extract 3D Face Landmarks from live video feed using MediaPipe
      const liveVector = await extractFaceVector(videoRef.current);

      if (!liveVector) {
        setIsAnalyzing(false);
        setErrorMessage('No face detected in camera view. Please align your face inside the circle.');
        return;
      }

      setAnalysisStatus('Matching face landmarks with customer accounts...');

      // 2. Filter candidates with photoURL
      const candidates = allProfiles.filter(p => p.photoURL && p.photoURL.length > 50);

      if (candidates.length === 0) {
        setIsAnalyzing(false);
        setErrorMessage('No customer accounts have registered Face ID photos yet. Please register Face ID in Customer Profile!');
        return;
      }

      let bestMatchUser: UserProfile | null = null;
      let highestSimilarity = 0;

      // 3. Process candidate vectors client-side
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

      console.log('Client-side MediaPipe Match Score:', highestSimilarity, bestMatchUser?.displayName);

      // Match threshold: >= 0.70 (70% match)
      if (bestMatchUser && highestSimilarity >= 0.68) {
        setMatchedUser(bestMatchUser);
        setIsAnalyzing(false);
        playSuccessBeep();
        setTimeout(() => {
          onFaceMatched(bestMatchUser!);
          onClose();
        }, 1500);
        return;
      }

      setIsAnalyzing(false);
      setErrorMessage(`Face not recognized (${Math.round(highestSimilarity * 100)}% match). Align face or scan member QR code.`);

    } catch (err: any) {
      console.error('Client-side MediaPipe face match failed:', err);
      setIsAnalyzing(false);
      setErrorMessage('Face detection error. Please try again or scan member QR code.');
    }
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
            <div className="p-2 bg-amber-500/20 text-amber-500 rounded-xl">
              <ScanFace className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white uppercase italic tracking-wider flex items-center gap-1.5">
                AI Face <span className="text-amber-500">Recognition</span>
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              </h3>
              <p className="text-[10px] text-slate-400 font-bold">Auto-login to earn points at Kiosk</p>
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
        <div className="relative flex-1 bg-black min-h-[300px] flex items-center justify-center overflow-hidden">
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
              <div className={`relative w-56 h-56 sm:w-64 sm:h-64 rounded-full border-4 ${isAnalyzing ? 'border-amber-400 animate-pulse' : 'border-amber-500/60'} shadow-[0_0_50px_rgba(245,158,11,0.3)] transition-all flex items-center justify-center`}>
                {/* Corner Marks */}
                <div className="absolute -top-2 -left-2 w-6 h-6 border-t-4 border-l-4 border-amber-500" />
                <div className="absolute -top-2 -right-2 w-6 h-6 border-t-4 border-r-4 border-amber-500" />
                <div className="absolute -bottom-2 -left-2 w-6 h-6 border-b-4 border-l-4 border-amber-500" />
                <div className="absolute -bottom-2 -right-2 w-6 h-6 border-b-4 border-r-4 border-amber-500" />

                {/* Animated Scanning Beam */}
                {isAnalyzing && (
                  <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent shadow-[0_0_15px_#f59e0b] animate-[bounce_2s_infinite]" />
                )}

                <div className="text-center p-3 bg-black/40 backdrop-blur-sm rounded-2xl border border-white/10">
                  <ScanFace className="w-8 h-8 text-amber-400 mx-auto mb-1 opacity-80" />
                  <span className="text-[10px] font-black uppercase text-amber-300 tracking-widest block">
                    {isAnalyzing ? 'AI Matching...' : 'Align Face Here'}
                  </span>
                </div>
              </div>

              {/* Facing Camera Switch Button */}
              <button
                type="button"
                onClick={toggleFacingMode}
                className="pointer-events-auto absolute bottom-3 right-3 p-2.5 bg-black/60 hover:bg-black/80 backdrop-blur text-white rounded-full border border-white/20 transition-all active:scale-95"
                title="Switch Camera"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Matched Success Card Overlay */}
          {matchedUser && (
            <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-in zoom-in-95 duration-300">
              <div className="w-16 h-16 bg-emerald-500 text-slate-950 rounded-3xl flex items-center justify-center font-black shadow-lg shadow-emerald-500/30 mb-3 animate-bounce">
                <UserCheck className="w-8 h-8" />
              </div>
              <span className="text-xs font-black uppercase tracking-widest text-emerald-400 mb-1">
                Face ID Recognized!
              </span>
              <h4 className="text-xl font-black text-white italic tracking-tight">
                Welcome, {matchedUser.displayName || 'Valued Customer'}!
              </h4>
              <div className="mt-3 px-4 py-2 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center gap-2 text-amber-400 text-xs font-black">
                <span>⚡ Loyalty Balance: {matchedUser.points || 0} Pts</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-2">Linking account to kiosk order...</p>
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
        <div className="p-4 bg-slate-950 border-t border-white/10 space-y-3 shrink-0">
          {errorMessage && hasCamera !== false && (
            <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-[11px] font-bold text-center">
              {errorMessage}
            </div>
          )}

          {isAnalyzing && (
            <div className="text-center text-xs font-black uppercase text-amber-400 tracking-wider flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
              <span>{analysisStatus}</span>
            </div>
          )}

          {!matchedUser && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleScanFace}
                disabled={isAnalyzing || !hasCamera}
                className="flex-1 py-3.5 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <ScanFace className="w-4 h-4" />
                <span>{isAnalyzing ? 'Analyzing...' : 'Scan My Face Now'}</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="py-3.5 px-4 bg-white/10 hover:bg-white/20 text-white font-black text-xs uppercase tracking-wider rounded-2xl transition-all"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
