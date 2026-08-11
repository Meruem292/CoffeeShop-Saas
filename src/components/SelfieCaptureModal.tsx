import React, { useEffect, useRef, useState } from 'react';
import { Camera, X, RefreshCw, Check, Sparkles, Upload, ScanFace, AlertCircle } from 'lucide-react';

interface SelfieCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPhotoCaptured: (base64Image: string) => Promise<void>;
}

export function SelfieCaptureModal({
  isOpen,
  onClose,
  onPhotoCaptured,
}: SelfieCaptureModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [hasCamera, setHasCamera] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const startCamera = async () => {
    stopCamera();
    setErrorMessage('');
    setCapturedImage(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setHasCamera(false);
      setErrorMessage('Camera is not supported on this browser or phone device.');
      return;
    }

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: facingMode, // 'user' forces front selfie camera on phone
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
      }
    } catch (err: any) {
      console.error('Selfie Camera Error:', err);
      setHasCamera(false);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setErrorMessage('Camera access was denied. Please allow camera permissions in your browser or phone settings.');
      } else {
        setErrorMessage('Unable to access phone front camera.');
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

  const toggleCameraFacing = () => {
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
  };

  const takeSelfieSnapshot = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;

    // Crop to square for clean avatar / face scan
    const size = Math.min(video.videoWidth || 640, video.videoHeight || 640);
    canvas.width = size;
    canvas.height = size;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle mirror effect if using front camera
    if (facingMode === 'user') {
      ctx.translate(size, 0);
      ctx.scale(-1, 1);
    }

    const sx = ((video.videoWidth || size) - size) / 2;
    const sy = ((video.videoHeight || size) - size) / 2;

    ctx.drawImage(video, sx, sy, size, size, 0, 0, size, size);

    const base64 = canvas.toDataURL('image/jpeg', 0.88);
    setCapturedImage(base64);
    stopCamera();
  };

  const handleConfirmSelfie = async () => {
    if (!capturedImage || isSaving) return;
    setIsSaving(true);
    try {
      await onPhotoCaptured(capturedImage);
      onClose();
    } catch (err) {
      console.error('Failed saving selfie:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setCapturedImage(base64);
      stopCamera();
    };
    reader.readAsDataURL(file);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border border-amber-500/30 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-4 bg-slate-950 border-b border-white/10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/20 text-amber-500 rounded-xl">
              <ScanFace className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white uppercase italic tracking-wider flex items-center gap-1.5">
                Take <span className="text-amber-500">Selfie</span>
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              </h3>
              <p className="text-[10px] text-slate-400 font-bold">Register phone selfie for Kiosk AI Face ID</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Camera / Snapshot Viewport */}
        <div className="relative flex-1 bg-black min-h-[320px] flex items-center justify-center overflow-hidden">
          {capturedImage ? (
            <div className="relative w-full h-full flex flex-col items-center justify-center p-4">
              <div className="relative w-64 h-64 rounded-full overflow-hidden border-4 border-amber-500 shadow-2xl">
                <img src={capturedImage} alt="Selfie Preview" className="w-full h-full object-cover" />
              </div>
              <span className="mt-3 text-xs font-black uppercase tracking-widest text-emerald-400 flex items-center gap-1">
                <Check className="w-4 h-4" /> Selfie Captured
              </span>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                className={`w-full h-full object-cover ${facingMode === 'user' ? 'transform scale-x-[-1]' : ''}`}
                playsInline
                muted
              />
              <canvas ref={canvasRef} className="hidden" />

              {/* Face Frame Guide */}
              {hasCamera && (
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none p-4">
                  <div className="w-60 h-60 rounded-full border-4 border-amber-500/80 shadow-[0_0_40px_rgba(245,158,11,0.4)] flex items-center justify-center">
                    <span className="text-[10px] font-black uppercase text-amber-300 tracking-widest bg-black/50 px-3 py-1 rounded-full backdrop-blur-sm">
                      Center Face Here
                    </span>
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

          {/* Error fallback */}
          {hasCamera === false && !capturedImage && (
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
            onChange={handleFileUpload}
            className="hidden"
          />

          {capturedImage ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleConfirmSelfie}
                disabled={isSaving}
                className="flex-1 py-3.5 px-4 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                <span>{isSaving ? 'Saving Face ID...' : 'Save As My Face ID'}</span>
              </button>
              <button
                type="button"
                onClick={startCamera}
                disabled={isSaving}
                className="py-3.5 px-4 bg-white/10 hover:bg-white/20 text-white font-black text-xs uppercase tracking-wider rounded-2xl transition-all"
              >
                Retake
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={takeSelfieSnapshot}
                disabled={!hasCamera}
                className="flex-1 py-3.5 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Camera className="w-4 h-4" />
                <span>Snap Selfie Photo</span>
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-3.5 bg-white/10 hover:bg-white/20 text-white rounded-2xl transition-all"
                title="Upload from Phone Gallery"
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
