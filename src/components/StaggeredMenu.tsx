import React, { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { gsap } from 'gsap';
import './StaggeredMenu.css';

interface MenuItem {
  label: string;
  link: string;
  ariaLabel?: string;
  onClick?: () => void;
}

interface SocialItem {
  label: string;
  link: string;
}

interface StaggeredMenuProps {
  position?: 'left' | 'right';
  colors?: string[];
  items?: MenuItem[];
  socialItems?: SocialItem[];
  displaySocials?: boolean;
  displayItemNumbering?: boolean;
  className?: string;
  logoUrl?: string;
  menuButtonColor?: string;
  openMenuButtonColor?: string;
  accentColor?: string;
  changeMenuColorOnOpen?: boolean;
  isFixed?: boolean;
  onMenuOpen?: () => void;
  onMenuClose?: () => void;
}

export const StaggeredMenu: React.FC<StaggeredMenuProps> = ({
  position = 'right',
  colors = ['#B497CF', '#5227FF'],
  items = [],
  socialItems = [],
  displaySocials = true,
  displayItemNumbering = true,
  className = '',
  logoUrl = '',
  menuButtonColor = '#fff',
  openMenuButtonColor = '#fff',
  accentColor = '#5227FF',
  changeMenuColorOnOpen = true,
  isFixed = false,
  onMenuOpen,
  onMenuClose
}) => {
  const [open, setOpen] = useState(false);
  const openRef = useRef(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const preLayersRef = useRef<HTMLDivElement>(null);
  const preLayerElsRef = useRef<HTMLElement[]>([]);
  const plusHRef = useRef<HTMLDivElement>(null);
  const plusVRef = useRef<HTMLDivElement>(null);
  const iconRef = useRef<HTMLDivElement>(null);
  const textInnerRef = useRef<HTMLDivElement>(null);
  const toggleBtnRef = useRef<HTMLButtonElement>(null);
  const busyRef = useRef(false);
  const openTlRef = useRef<gsap.core.Timeline | null>(null);
  const closeTweenRef = useRef<gsap.core.Tween | null>(null);
  const itemEntranceTweenRef = useRef<gsap.core.Tween | null>(null);
  const [textLines] = useState(['Menu', 'Close']);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const panel = panelRef.current;
      const preContainer = preLayersRef.current;
      const plusH = plusHRef.current;
      const plusV = plusVRef.current;
      const icon = iconRef.current;
      const textInner = textInnerRef.current;
      if (!panel || !plusH || !plusV || !icon || !textInner) return;

      const preLayers = Array.from(preContainer?.querySelectorAll('.sm-prelayer') || []) as HTMLElement[];
      preLayerElsRef.current = preLayers;

      const offscreen = position === 'left' ? -100 : 100;
      
      // Ensure initial state is set
      gsap.set([panel, ...preLayers], { xPercent: offscreen, opacity: 1 });
      
      if (preContainer) {
        gsap.set(preContainer, { xPercent: 0, opacity: 1 });
      }
      gsap.set(plusH, { transformOrigin: '50% 50%', rotate: 0 });
      gsap.set(plusV, { transformOrigin: '50% 50%', rotate: 90 });
      gsap.set(icon, { rotate: 0, transformOrigin: '50% 50%' });
      gsap.set(textInner, { yPercent: 0 });
      if (toggleBtnRef.current) gsap.set(toggleBtnRef.current, { color: menuButtonColor });
    });
    return () => ctx.revert();
  }, [menuButtonColor, position, colors]);

  const buildOpenTimeline = useCallback(() => {
    const panel = panelRef.current;
    const layers = preLayerElsRef.current;
    if (!panel) return null;

    openTlRef.current?.kill();
    if (closeTweenRef.current) {
      closeTweenRef.current.kill();
      closeTweenRef.current = null;
    }
    itemEntranceTweenRef.current?.kill();

    const itemEls = Array.from(panel.querySelectorAll('.sm-panel-itemLabel'));
    const numberEls = Array.from(panel.querySelectorAll('.sm-panel-list.data-numbering .sm-panel-item'));
    const socialTitle = panel.querySelector('.sm-socials-title');
    const socialLinks = Array.from(panel.querySelectorAll('.sm-socials-link'));

    const offscreen = position === 'left' ? -100 : 100;
    const layerStates = layers.map(el => ({ el, start: offscreen }));
    const panelStart = offscreen;

    if (itemEls.length) {
      gsap.set(itemEls, { yPercent: 140, rotate: 10 });
    }
    if (numberEls.length) {
      gsap.set(numberEls, { '--sm-num-opacity': 0 });
    }
    if (socialTitle) {
      gsap.set(socialTitle, { opacity: 0 });
    }
    if (socialLinks.length) {
      gsap.set(socialLinks, { y: 25, opacity: 0 });
    }

    const tl = gsap.timeline({ paused: true });

    layerStates.forEach((ls, i) => {
      tl.fromTo(ls.el, { xPercent: ls.start }, { xPercent: 0, duration: 0.5, ease: 'power4.out' }, i * 0.07);
    });
    const lastTime = layerStates.length ? (layerStates.length - 1) * 0.07 : 0;
    const panelInsertTime = lastTime + (layerStates.length ? 0.08 : 0);
    const panelDuration = 0.65;
    tl.fromTo(
      panel,
      { xPercent: panelStart },
      { xPercent: 0, duration: panelDuration, ease: 'power4.out' },
      panelInsertTime
    );

    if (itemEls.length) {
      const itemsStartRatio = 0.15;
      const itemsStart = panelInsertTime + panelDuration * itemsStartRatio;
      tl.to(
        itemEls,
        {
          yPercent: 0,
          rotate: 0,
          duration: 1,
          ease: 'power4.out',
          stagger: { each: 0.1, from: 'start' }
        },
        itemsStart
      );
      if (numberEls.length) {
        tl.to(
          numberEls,
          {
            duration: 0.6,
            ease: 'power2.out',
            '--sm-num-opacity': 1,
            stagger: { each: 0.08, from: 'start' }
          },
          itemsStart + 0.1
        );
      }
    }

    if (socialTitle || socialLinks.length) {
      const socialsStart = panelInsertTime + panelDuration * 0.4;
      if (socialTitle) {
        tl.to(
          socialTitle,
          {
            opacity: 1,
            duration: 0.5,
            ease: 'power2.out'
          },
          socialsStart
        );
      }
      if (socialLinks.length) {
        tl.to(
          socialLinks,
          {
            y: 0,
            opacity: 1,
            duration: 0.55,
            ease: 'power3.out',
            stagger: { each: 0.08, from: 'start' },
            onComplete: () => {
              gsap.set(socialLinks, { clearProps: 'opacity' });
            }
          },
          socialsStart + 0.04
        );
      }
    }

    openTlRef.current = tl;
    return tl;
  }, [position]);

  const playOpen = useCallback(() => {
    if (busyRef.current) return;
    busyRef.current = true;
    const tl = buildOpenTimeline();
    if (tl) {
      tl.eventCallback('onComplete', () => {
        busyRef.current = false;
      });
      tl.play(0);
    } else {
      busyRef.current = false;
    }
  }, [buildOpenTimeline]);

  const playClose = useCallback(() => {
    openTlRef.current?.kill();
    openTlRef.current = null;
    itemEntranceTweenRef.current?.kill();

    const panel = panelRef.current;
    const layers = preLayerElsRef.current;
    if (!panel) return;

    const all = [...layers, panel];
    closeTweenRef.current?.kill();
    const offscreen = position === 'left' ? -100 : 100;
    closeTweenRef.current = gsap.to(all, {
      xPercent: offscreen,
      duration: 0.32,
      ease: 'power3.in',
      overwrite: 'auto',
      onComplete: () => {
        const itemEls = Array.from(panel.querySelectorAll('.sm-panel-itemLabel'));
        if (itemEls.length) {
          gsap.set(itemEls, { yPercent: 140, rotate: 10 });
        }
        const numberEls = Array.from(panel.querySelectorAll('.sm-panel-list.data-numbering .sm-panel-item'));
        if (numberEls.length) {
          gsap.set(numberEls, { '--sm-num-opacity': 0 });
        }
        const socialTitle = panel.querySelector('.sm-socials-title');
        if (socialTitle) gsap.set(socialTitle, { opacity: 0 });
        const socialLinks = Array.from(panel.querySelectorAll('.sm-socials-link'));
        if (socialLinks.length) gsap.set(socialLinks, { y: 25, opacity: 0 });
        
        busyRef.current = false;
      }
    });
  }, [position]);

  const toggleMenu = useCallback(() => {
    if (busyRef.current) return;
    const newState = !open;
    setOpen(newState);
    openRef.current = newState;

    if (newState) {
      if (onMenuOpen) onMenuOpen();
      playOpen();
      // Button animations
      gsap.to(plusHRef.current, { rotate: 45, duration: 0.4, ease: 'back.out(1.7)' });
      gsap.to(plusVRef.current, { rotate: 45 + 90, duration: 0.4, ease: 'back.out(1.7)' });
      gsap.to(iconRef.current, { rotate: 135, duration: 0.4, ease: 'back.out(1.7)' });
      gsap.to(textInnerRef.current, { yPercent: -50, duration: 0.4, ease: 'power2.inOut' });
      if (changeMenuColorOnOpen && toggleBtnRef.current) {
        gsap.to(toggleBtnRef.current, { color: openMenuButtonColor, duration: 0.4 });
      }
    } else {
      if (onMenuClose) onMenuClose();
      playClose();
      gsap.to(plusHRef.current, { rotate: 0, duration: 0.4, ease: 'back.out(1.7)' });
      gsap.to(plusVRef.current, { rotate: 90, duration: 0.4, ease: 'back.out(1.7)' });
      gsap.to(iconRef.current, { rotate: 0, duration: 0.4, ease: 'back.out(1.7)' });
      gsap.to(textInnerRef.current, { yPercent: 0, duration: 0.4, ease: 'power2.inOut' });
      if (changeMenuColorOnOpen && toggleBtnRef.current) {
        gsap.to(toggleBtnRef.current, { color: menuButtonColor, duration: 0.4 });
      }
    }
  }, [open, onMenuOpen, onMenuClose, playOpen, playClose, changeMenuColorOnOpen, openMenuButtonColor, menuButtonColor]);

  const handleItemClick = (onClick?: () => void) => {
    toggleMenu();
    if (onClick) onClick();
  };

  return (
    <div className={`sm-menu-container ${position} ${isFixed ? 'fixed' : ''} ${className}`}>
      <button 
        ref={toggleBtnRef}
        className="sm-toggle-btn" 
        onClick={toggleMenu}
        aria-label={open ? 'Close menu' : 'Open menu'}
      >
        <div className="sm-btn-content">
          <div ref={iconRef} className="sm-icon">
            <div ref={plusHRef} className="sm-plus-h" style={{ backgroundColor: 'currentColor' }} />
            <div ref={plusVRef} className="sm-plus-v" style={{ backgroundColor: 'currentColor' }} />
          </div>
          <div className="sm-text-wrap">
            <div ref={textInnerRef} className="sm-text-inner">
              {textLines.map((line, i) => (
                <div key={i} className="sm-line">{line}</div>
              ))}
            </div>
          </div>
        </div>
      </button>

      {createPortal(
        <>
          <div ref={preLayersRef} className="sm-prelayers-container">
            {colors.map((color, i) => (
              <div key={i} className="sm-prelayer" style={{ backgroundColor: color }} />
            ))}
          </div>

          <div ref={panelRef} className="sm-panel">
            <div className="sm-panel-content">
              {logoUrl && (
                <div className="sm-panel-logo">
                  <img src={logoUrl} alt="Logo" />
                </div>
              )}
              <nav className="sm-panel-nav">
                <ul className={`sm-panel-list ${displayItemNumbering ? 'data-numbering' : ''}`}>
                  {items.map((item, i) => (
                    <li key={i} className="sm-panel-item">
                      <a 
                        href={item.link} 
                        className="sm-panel-link"
                        aria-label={item.ariaLabel}
                        onClick={(e) => {
                          if (item.onClick) {
                            e.preventDefault();
                            handleItemClick(item.onClick);
                          }
                        }}
                      >
                        <span className="sm-panel-itemLabel">{item.label}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>

              {displaySocials && socialItems.length > 0 && (
                <div className="sm-socials">
                  <span className="sm-socials-title" style={{ color: accentColor }}>Follow us</span>
                  <div className="sm-socials-list">
                    {socialItems.map((social, i) => (
                      <a 
                        key={i} 
                        href={social.link} 
                        className="sm-socials-link"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {social.label}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
  );
};

export default StaggeredMenu;
