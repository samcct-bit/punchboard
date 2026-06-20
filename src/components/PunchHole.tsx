import React, { useState } from 'react';
import { Hole } from '../App';
import { audioSynth } from '../utils/audio';

interface PunchHoleProps {
  hole: Hole;
  onPunch: (id: number) => void;
}

interface Particle {
  id: number;
  color: string;
  dx: string;
  dy: string;
  size: number;
}

const PASTEL_COLORS = [
  '#FFADAD', // Pink
  '#FFD6A5', // Peach
  '#FDFFB6', // Yellow
  '#CAFFBF', // Mint
  '#9BF6FF', // Light Blue
  '#A0C4FF', // Blue
  '#BDB2FF', // Purple
  '#FFC6FF'  // Lavender
];

// Cover background designs using CSS gradients
const HOLE_GRADIENTS = [
  'linear-gradient(135deg, #FF9A9E 0%, #FECFEF 99%, #FECFEF 100%)',
  'linear-gradient(135deg, #A1C4FD 0%, #C2E9FB 100%)',
  'linear-gradient(135deg, #FDFCFB 0%, #E2D1C3 100%)',
  'linear-gradient(135deg, #D4FC79 0%, #96E6A1 100%)',
  'linear-gradient(135deg, #F6D365 0%, #FDA085 100%)',
  'linear-gradient(135deg, #E0C3FC 0%, #8EC5FC 100%)',
  'linear-gradient(135deg, #F093FB 0%, #F5576C 100%)',
  'linear-gradient(135deg, #4FACFE 0%, #00F2FE 100%)'
];

export const PunchHole: React.FC<PunchHoleProps> = ({ hole, onPunch }) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);

  // Get a stable pseudo-random cover style based on hole ID
  const coverStyle = {
    background: HOLE_GRADIENTS[hole.id % HOLE_GRADIENTS.length],
    boxShadow: 'inset 0 4px 6px rgba(255,255,255,0.6), 0 4px 8px rgba(0,0,0,0.1)'
  };

  const handlePunch = () => {
    if (hole.isPunched || isAnimating) return;

    // 1. Play ripping sound
    audioSynth.playPunch();
    setIsAnimating(true);

    // 2. Generate paper particles
    const newParticles: Particle[] = Array.from({ length: 16 }).map((_, i) => {
      const angle = (i * 360) / 16 + (Math.random() * 20 - 10);
      const rad = (angle * Math.PI) / 180;
      const velocity = 60 + Math.random() * 80;
      const dx = `${Math.cos(rad) * velocity}px`;
      const dy = `${Math.sin(rad) * velocity}px`;
      const color = PASTEL_COLORS[Math.floor(Math.random() * PASTEL_COLORS.length)];
      const size = 6 + Math.random() * 8;

      return {
        id: i,
        color,
        dx,
        dy,
        size
      };
    });
    setParticles(newParticles);

    // 3. Reveal prize and play appropriate sound after a brief delay
    setTimeout(() => {
      // Notify parent to record state
      onPunch(hole.id);
      
      // Play win or try-again audio
      if (hole.prizeName && hole.prizeName !== '感謝參與') {
        audioSynth.playWin();
      } else {
        audioSynth.playTryAgain();
      }
      setIsAnimating(false);
    }, 400); // match tearing transition time
  };

  return (
    <div className={`hole-wrapper ${hole.isPunched ? 'punched' : 'intact'}`}>
      {/* Visual background socket */}
      <div className="hole-socket">
        {hole.isPunched ? (
          <div className={`prize-card ${hole.prizeName === '感謝參與' ? 'no-prize' : 'has-prize'}`}>
            <span className="prize-icon">{hole.prizeName === '感謝參與' ? '💨' : '🎁'}</span>
            <div className="prize-name">{hole.prizeName}</div>
            <div className="punched-badge">已戳</div>
          </div>
        ) : (
          <button
            className={`hole-cover ${isAnimating ? 'tearing' : ''}`}
            style={coverStyle}
            onClick={handlePunch}
            disabled={hole.isPunched || isAnimating}
            aria-label={`戳戳樂格子第 ${hole.id + 1} 號`}
          >
            <div className="hand-drawn-border"></div>
            <span className="hole-number">{hole.id + 1}</span>
            <span className="punch-text">戳！</span>
            
            {/* Tearing effect elements */}
            <div className="tear-layer tear-left"></div>
            <div className="tear-layer tear-right"></div>
            <div className="tear-layer tear-center"></div>
          </button>
        )}

        {/* Paper tearing particles */}
        {particles.map((p) => (
          <span
            key={p.id}
            className="paper-particle"
            style={{
              backgroundColor: p.color,
              width: `${p.size}px`,
              height: `${p.size}px`,
              '--dx': p.dx,
              '--dy': p.dy,
            } as React.CSSProperties}
          />
        ))}
      </div>
    </div>
  );
};
