import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Camera,
  User,
  Sparkles,
  QrCode,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Coffee,
  Coins,
  Tag,
  RefreshCw,
  X,
  Lock
} from 'lucide-react';
import {
  getFaceLandmarker,
  extractFaceVector,
  findBestMatchedProfile,
  detectHeadPoseAndExpression,
} from '../lib/mediaPipeFace';
import { UserProfile, Voucher, ClaimedVoucher } from '../types';
import { useToast } from '../lib/ToastContext';
import { playNotificationSound } from '../lib/audio';

interface KioskFaceScannerProps {
  candidates: UserProfile[];
  vouchers?: Voucher[];
  userClaimedVouchers?: ClaimedVoucher[];
  onCustomerRecognized: (customer: UserProfile) => void;
  onOrderAsGuest: () => void;
  onOpenQrScanner: () => void;
  onOpenIdLogin: () => void;
}

export function KioskFaceScanner({
  candidates = [],
  vouchers = [],
  userClaimedVouchers = [],
  onCustomerRecognized,
  onOrderAsGuest,
  onOpenQrScanner,
  onOpenIdLogin,
}: KioskFaceScannerProps) {
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastScanTimestampRef = useRef<number>(0);
  const autoProceedTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [matchedCustomer, setMatchedCustomer] = useState<UserProfile | null>(null);
  const [matchConfidence, setMatchConfidence] = useState<number>(0);
  const [autoProceedCountdown, setAutoProceedCountdown] = useState<number>(5);

  // Initialize camera
  useEffect(() => {
    let isMounted = true;

    async function initCamera() {
      try {
        setCameraError(null);
        await getFaceLandmarker(); // Warm up AI engine

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
            setIsCameraActive(true);
            startContinuousScanLoop();
          };
        }
      } catch (err: any) {
        console.warn('Kiosk Face Camera access failed:', err);
        setCameraError('Camera offline. Use Member QR or 5-Char ID.');
      }
    }

    initCamera();

    return () => {
      isMounted = false;
      stopCamera();
    };
  }, []);

  const stopCamera = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (autoProceedTimerRef.current) {
      clearInterval(autoProceedTimerRef.current);
      autoProceedTimerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  // Continuous Scan Loop
  const startContinuousScanLoop = useCallback(() => {
    const scanFrame = async () => {
      const now = Date.now();
      const video = videoRef.current;

      // Throttle scanning to ~5-8 FPS for light CPU usage
      if (
        video &&
        !video.paused &&
        !video.ended &&
        !matchedCustomer &&
        now - lastScanTimestampRef.current > 160
      ) {
        lastScanTimestampRef.current = now;
        setIsScanning(true);

        try {
          const liveVector = await extractFaceVector(video);
          if (liveVector && candidates.length > 0) {
            const { matchedProfile, confidence } = findBestMatchedProfile(
              liveVector,
              candidates,
              65 // Minimum confidence threshold
            );

            if (matchedProfile && confidence >= 65) {
              setMatchedCustomer(matchedProfile);
              setMatchConfidence(confidence);
              playNotificationSound(); // Friendly greeting chime
              toast.success(`Face Recognized! Welcome, ${matchedProfile.displayName || 'Customer'}`);
              startAutoProceedCountdown(matchedProfile);
            }
          }
        } catch (e) {
          // ignore transient video frame error
        } finally {
          setIsScanning(false);
        }
      }

      if (!matchedCustomer) {
        animationFrameRef.current = requestAnimationFrame(scanFrame);
      }
    };

    animationFrameRef.current = requestAnimationFrame(scanFrame);
  }, [candidates, matchedCustomer]);

  // Auto Proceed Countdown when recognized
  const startAutoProceedCountdown = (customer: UserProfile) => {
    setAutoProceedCountdown(5);
    if (autoProceedTimerRef.current) {
      clearInterval(autoProceedTimerRef.current);
    }

    let remaining = 5;
    autoProceedTimerRef.current = setInterval(() => {
      remaining -= 1;
      setAutoProceedCountdown(remaining);
      if (remaining <= 0) {
        if (autoProceedTimerRef.current) {
          clearInterval(autoProceedTimerRef.current);
        }
        onCustomerRecognized(customer);
      }
    }, 1000);
  };

  const handleConfirmLogin = () => {
    if (autoProceedTimerRef.current) {
      clearInterval(autoProceedTimerRef.current);
    }
    if (matchedCustomer) {
      onCustomerRecognized(matchedCustomer);
    }
  };

  const handleResetRecognition = () => {
    if (autoProceedTimerRef.current) {
      clearInterval(autoProceedTimerRef.current);
    }
    setMatchedCustomer(null);
    setMatchConfidence(0);
    // Restart scan loop
    setTimeout(() => {
      startContinuousScanLoop();
    }, 500);
  };

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col items-center">
      {/* Recognition Result Modal / Overlay */}
      {matchedCustomer ? (
        <div className="w-full bg-[#0e131f]/90 border border-green-500/40 backdrop-blur-2xl p-6 sm:p-8 rounded-[2.5rem] shadow-[0_0_50px_rgba(74,222,128,0.15)] flex flex-col items-center text-center space-y-6 animate-in zoom-in-95 duration-300">
          <div className="relative">
            <div className="w-24 h-24 rounded-3xl overflow-hidden bg-slate-900 border-2 border-green-400 p-1 shadow-2xl">
              {matchedCustomer.photoURL ? (
                <img
                  src={matchedCustomer.photoURL}
                  alt={matchedCustomer.displayName || 'Customer'}
                  className="w-full h-full object-cover rounded-2xl"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full bg-green-500/10 text-green-400 font-black text-3xl flex items-center justify-center">
                  {(matchedCustomer.displayName || 'C').charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="absolute -bottom-2 -right-2 bg-green-500 text-slate-950 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-lg">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {matchConfidence}% Match
            </div>
          </div>

          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/30 text-green-400 text-xs font-black uppercase tracking-widest mb-2">
              <Sparkles className="w-3.5 h-3.5" /> Face ID Recognized
            </div>
            <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase italic">
              Welcome back,{' '}
              <span className="text-amber-400">
                {matchedCustomer.displayName || 'Valued Member'}!
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-1 font-mono">
              Member ID: #{matchedCustomer.shortId || matchedCustomer.uid.slice(0, 5).toUpperCase()}
            </p>
          </div>

          {/* Member Rewards Pill summary */}
          <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
            <div className="bg-white/5 border border-white/10 p-3 rounded-2xl flex items-center justify-between">
              <div className="text-left">
                <span className="text-[9px] font-black uppercase text-slate-400 block leading-none mb-1">
                  Points Balance
                </span>
                <span className="text-lg font-black text-amber-400">
                  {matchedCustomer.points || 0} Pts
                </span>
              </div>
              <Coins className="w-6 h-6 text-amber-500" />
            </div>

            <div className="bg-white/5 border border-white/10 p-3 rounded-2xl flex items-center justify-between">
              <div className="text-left">
                <span className="text-[9px] font-black uppercase text-slate-400 block leading-none mb-1">
                  Vouchers
                </span>
                <span className="text-lg font-black text-purple-400">
                  {userClaimedVouchers.filter((v) => v.userId === matchedCustomer.uid && !v.isUsed).length} Ready
                </span>
              </div>
              <Tag className="w-6 h-6 text-purple-400" />
            </div>
          </div>

          {/* Action Confirmation Buttons */}
          <div className="w-full max-w-sm space-y-3">
            <button
              type="button"
              onClick={handleConfirmLogin}
              className="w-full py-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm uppercase tracking-widest rounded-2xl shadow-xl shadow-amber-500/20 active:scale-98 transition-all flex items-center justify-center gap-3 group"
            >
              <span>Start Ordering ({autoProceedCountdown}s)</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              type="button"
              onClick={handleResetRecognition}
              className="w-full py-2.5 text-xs font-bold text-slate-400 hover:text-white uppercase tracking-wider transition-colors"
            >
              Not {matchedCustomer.displayName || 'you'}? Re-scan or Order as Guest
            </button>
          </div>
        </div>
      ) : (
        /* Standby Live Scanner UI */
        <div className="w-full bg-[#0a0e1a]/80 border border-white/10 backdrop-blur-2xl p-5 sm:p-6 rounded-[2.5rem] shadow-2xl flex flex-col items-center text-center space-y-5">
          {/* Live Mini Viewfinder */}
          <div className="relative w-44 h-44 sm:w-48 sm:h-48 rounded-full overflow-hidden bg-black/60 border-2 border-amber-500/40 shadow-[0_0_30px_rgba(245,158,11,0.15)] flex items-center justify-center group">
            {cameraError ? (
              <div className="p-4 text-center text-slate-400 space-y-1">
                <Camera className="w-8 h-8 mx-auto text-amber-500/50" />
                <p className="text-[10px] font-bold">{cameraError}</p>
              </div>
            ) : (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover scale-x-[-1]"
                />
                {/* Biometric Scanning Reticle */}
                <div className="absolute inset-0 rounded-full border-2 border-amber-500/30 animate-pulse pointer-events-none" />
                <div className="absolute inset-4 rounded-full border border-dashed border-amber-400/50 pointer-events-none" />
                <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent absolute top-1/2 -translate-y-1/2 animate-bounce opacity-70" />
              </>
            )}

            {/* Live Indicator Pill */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-2.5 py-0.5 bg-black/70 backdrop-blur-md rounded-full border border-white/10 text-[9px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-ping" />
              Face ID Active
            </div>
          </div>

          <div>
            <h3 className="text-lg sm:text-xl font-black uppercase tracking-tight text-white">
              Self-Ordering Kiosk
            </h3>
            <p className="text-xs text-slate-400 mt-0.5 max-w-xs">
              Look at the camera for instant Face ID login, or choose an option below.
            </p>
          </div>

          {/* Quick Alternative Login Action Row */}
          <div className="grid grid-cols-3 gap-2 w-full max-w-md pt-1">
            <button
              type="button"
              onClick={onOpenQrScanner}
              className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-amber-500/40 rounded-2xl flex flex-col items-center gap-1.5 transition-all group active:scale-95"
            >
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                <QrCode className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-black uppercase text-slate-300 group-hover:text-amber-400">
                Scan QR
              </span>
            </button>

            <button
              type="button"
              onClick={onOpenIdLogin}
              className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-amber-500/40 rounded-2xl flex flex-col items-center gap-1.5 transition-all group active:scale-95"
            >
              <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <KeyRound className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-black uppercase text-slate-300 group-hover:text-purple-400">
                Member ID
              </span>
            </button>

            <button
              type="button"
              onClick={onOrderAsGuest}
              className="p-3 bg-gradient-to-br from-amber-500/20 to-amber-600/10 hover:from-amber-500/30 hover:to-amber-600/20 border border-amber-500/30 rounded-2xl flex flex-col items-center gap-1.5 transition-all group active:scale-95"
            >
              <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center group-hover:scale-110 transition-transform font-black">
                <Coffee className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-black uppercase text-amber-400">
                Guest Order
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
