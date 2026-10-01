import React, { useEffect, useState, useRef } from 'react';
import { Volume2, VolumeX, Music, Sparkles } from 'lucide-react';
import { ShopSettings } from '../types';
import {
  startAmbientLoop,
  stopAmbientLoop,
  subscribeAmbientState,
  getIsAmbientPlaying,
  setAmbientVolume
} from '../lib/audio';

interface AmbientAudioWidgetProps {
  shopSettings: ShopSettings | null;
  className?: string;
  hidden?: boolean;
}

export function AmbientAudioWidget({ shopSettings, className = '', hidden = false }: AmbientAudioWidgetProps) {
  const [isPlaying, setIsPlaying] = useState(getIsAmbientPlaying());
  const [isUserMuted, setIsUserMuted] = useState(false);
  const [showVolumePopup, setShowVolumePopup] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const initialAutoplayAttempted = useRef(false);

  const activeTheme = shopSettings?.activeTheme || 'none';
  const customAmbientUrl = shopSettings?.themeSounds?.[activeTheme]?.ambientSoundUrl;
  const adminAmbientVolume = shopSettings?.ambientSoundVolume ?? 0.35;
  const isEnabledByAdmin = shopSettings?.ambientSoundEnabled !== false;
  const isAdminMuted = shopSettings?.ambientSoundMuted || false;

  const isActuallyMuted = isUserMuted || isAdminMuted;

  // Subscribe to audio engine state changes
  useEffect(() => {
    const unsubscribe = subscribeAmbientState((playing) => {
      setIsPlaying(playing);
    });
    return () => unsubscribe();
  }, []);

  // Update ambient loop when theme or custom sound changes while active
  useEffect(() => {
    if (!isEnabledByAdmin || isActuallyMuted || hidden) {
      stopAmbientLoop();
      return;
    }

    if (isPlaying || hasInteracted) {
      startAmbientLoop({
        theme: activeTheme,
        customUrl: customAmbientUrl,
        volume: adminAmbientVolume,
        muted: isActuallyMuted
      });
    }
  }, [activeTheme, customAmbientUrl, adminAmbientVolume, isEnabledByAdmin, isActuallyMuted, hidden]);

  // Adjust volume dynamically
  useEffect(() => {
    if (isPlaying) {
      setAmbientVolume(isActuallyMuted ? 0 : adminAmbientVolume);
    }
  }, [adminAmbientVolume, isActuallyMuted, isPlaying]);

  // Global first-interaction unlock to start ambient audio if admin enabled it
  useEffect(() => {
    if (!isEnabledByAdmin || isActuallyMuted || hidden) return;

    const startOnFirstInteraction = () => {
      setHasInteracted(true);
      if (!initialAutoplayAttempted.current) {
        initialAutoplayAttempted.current = true;
        startAmbientLoop({
          theme: activeTheme,
          customUrl: customAmbientUrl,
          volume: adminAmbientVolume,
          muted: isActuallyMuted
        });
      }
      window.removeEventListener('click', startOnFirstInteraction);
      window.removeEventListener('touchstart', startOnFirstInteraction);
    };

    window.addEventListener('click', startOnFirstInteraction, { passive: true });
    window.addEventListener('touchstart', startOnFirstInteraction, { passive: true });

    return () => {
      window.removeEventListener('click', startOnFirstInteraction);
      window.removeEventListener('touchstart', startOnFirstInteraction);
    };
  }, [activeTheme, customAmbientUrl, adminAmbientVolume, isEnabledByAdmin, isActuallyMuted, hidden]);

  if (hidden || !isEnabledByAdmin) {
    return null;
  }

  const handleTogglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    setHasInteracted(true);
    if (isPlaying && !isActuallyMuted) {
      setIsUserMuted(true);
      stopAmbientLoop();
    } else {
      setIsUserMuted(false);
      startAmbientLoop({
        theme: activeTheme,
        customUrl: customAmbientUrl,
        volume: adminAmbientVolume,
        muted: false
      });
    }
  };

  const themeThemeColors = {
    none: {
      border: 'border-amber-500/30 hover:border-amber-500/60',
      bg: 'bg-[#1e1713]/90 text-amber-400',
      activeBadge: 'bg-amber-500 text-slate-950',
      glow: 'shadow-amber-500/20',
      label: 'Cafe Ambience',
      emoji: '☕'
    },
    christmas: {
      border: 'border-cyan-400/40 hover:border-cyan-400/80',
      bg: 'bg-[#0f242c]/90 text-cyan-300',
      activeBadge: 'bg-cyan-400 text-slate-950',
      glow: 'shadow-cyan-400/25',
      label: 'Winter Holiday',
      emoji: '❄️'
    },
    halloween: {
      border: 'border-orange-500/40 hover:border-orange-500/80',
      bg: 'bg-[#22130c]/90 text-orange-400',
      activeBadge: 'bg-orange-500 text-slate-950',
      glow: 'shadow-orange-500/25',
      label: 'Spooky Season',
      emoji: '🎃'
    }
  };

  const styleConfig = themeThemeColors[activeTheme as keyof typeof themeThemeColors] || themeThemeColors.none;

  return (
    <div className={`fixed bottom-5 right-5 z-40 select-none ${className}`}>
      <div className="relative group">
        {/* Floating pill button */}
        <button
          type="button"
          onClick={handleTogglePlay}
          onMouseEnter={() => setShowVolumePopup(true)}
          onMouseLeave={() => setShowVolumePopup(false)}
          className={`flex items-center gap-2 px-3 py-2 rounded-full backdrop-blur-xl border shadow-xl transition-all duration-300 active:scale-95 ${styleConfig.bg} ${styleConfig.border} ${styleConfig.glow}`}
          title={`${isPlaying ? 'Mute' : 'Play'} theme ambient music`}
        >
          {/* Animated sound wave bars when playing */}
          <div className="flex items-center gap-0.5 h-3.5 px-0.5">
            {isPlaying && !isActuallyMuted ? (
              <>
                <span className="w-0.5 bg-current rounded-full animate-[pulse_0.6s_ease-in-out_infinite]" style={{ height: '60%' }} />
                <span className="w-0.5 bg-current rounded-full animate-[pulse_0.8s_ease-in-out_infinite_0.15s]" style={{ height: '100%' }} />
                <span className="w-0.5 bg-current rounded-full animate-[pulse_0.5s_ease-in-out_infinite_0.3s]" style={{ height: '40%' }} />
                <span className="w-0.5 bg-current rounded-full animate-[pulse_0.7s_ease-in-out_infinite_0.45s]" style={{ height: '80%' }} />
              </>
            ) : (
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 opacity-60" />
            )}
          </div>

          <span className="text-xs">{styleConfig.emoji}</span>

          <span className="text-[10px] font-black uppercase tracking-wider hidden sm:inline-block pr-0.5">
            {isPlaying && !isActuallyMuted ? styleConfig.label : 'Audio Paused'}
          </span>

          <div className="w-5 h-5 rounded-full bg-black/20 flex items-center justify-center shrink-0">
            {isPlaying && !isActuallyMuted ? (
              <Volume2 className="w-3 h-3" />
            ) : (
              <VolumeX className="w-3 h-3 text-slate-400" />
            )}
          </div>
        </button>

        {/* Hover / Status tooltip */}
        {showVolumePopup && (
          <div className="absolute bottom-full right-0 mb-2 p-2.5 rounded-xl bg-slate-950/95 backdrop-blur-xl border border-white/10 text-white shadow-2xl w-48 text-left space-y-1.5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Music className="w-3 h-3 text-amber-400" /> Theme Ambience
              </span>
              <span className="text-[9px] font-bold text-slate-400 font-mono">
                {isActuallyMuted ? 'Muted' : `${Math.round(adminAmbientVolume * 100)}%`}
              </span>
            </div>
            <div className="text-[11px] font-bold text-slate-200 truncate">
              {styleConfig.emoji} {styleConfig.label}
            </div>
            <div className="text-[9px] text-slate-400">
              {isPlaying && !isActuallyMuted ? 'Click to mute ambient sound' : 'Click to enable relaxing soundscape'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
