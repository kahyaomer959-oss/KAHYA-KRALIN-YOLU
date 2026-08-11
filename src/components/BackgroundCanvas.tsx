import React, { useEffect, useRef } from 'react';

interface BackgroundCanvasProps {
  particleCount?: number;
}

interface Ember {
  x: number;
  y: number;
  size: number;
  speedY: number;
  speedX: number;
  opacity: number;
  fadeSpeed: number;
  color: string;
}

export const BackgroundCanvas: React.FC<BackgroundCanvasProps> = ({ particleCount = 70 }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    // Color palette: deep crimson, royal amber, gold dust, blood red
    const colors = [
      'rgba(239, 68, 68, ',
      'rgba(220, 38, 38, ',
      'rgba(245, 158, 11, ',
      'rgba(217, 119, 6, ',
      'rgba(251, 191, 36, ',
    ];

    const embers: Ember[] = Array.from({ length: particleCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2.8 + 0.8,
      speedY: -(Math.random() * 0.8 + 0.3),
      speedX: (Math.random() - 0.5) * 0.6,
      opacity: Math.random() * 0.8 + 0.2,
      fadeSpeed: Math.random() * 0.006 + 0.002,
      color: colors[Math.floor(Math.random() * colors.length)],
    }));

    let time = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // 1. Majestic Imperial Dark Gradient Background
      const baseGrad = ctx.createLinearGradient(0, 0, width, height);
      baseGrad.addColorStop(0, '#06080f');
      baseGrad.addColorStop(0.5, '#0b0f19');
      baseGrad.addColorStop(1, '#040508');
      ctx.fillStyle = baseGrad;
      ctx.fillRect(0, 0, width, height);

      // 2. Dynamic Volumetric God-Rays / Light Beams sweeping from the top-right corner
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      for (let i = 0; i < 3; i++) {
        const rayGrad = ctx.createRadialGradient(
          width,
          0,
          10,
          width,
          0,
          width * (0.8 + i * 0.2)
        );
        rayGrad.addColorStop(0, `rgba(239, 68, 68, ${0.22 - i * 0.05})`);
        rayGrad.addColorStop(0.35, `rgba(245, 158, 11, ${0.1 - i * 0.025})`);
        rayGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = rayGrad;
        ctx.beginPath();
        ctx.moveTo(width, 0);
        ctx.lineTo(width * (0.2 + i * 0.2), height);
        ctx.lineTo(width * (0.5 + i * 0.2), height);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();

      // 3. Strong ambient crimson & gold glow anchored precisely at the top-right corner
      const spotlight = ctx.createRadialGradient(
        width,
        0,
        20,
        width,
        0,
        width * 0.85
      );
      spotlight.addColorStop(0, 'rgba(239, 68, 68, 0.38)');
      spotlight.addColorStop(0.4, 'rgba(185, 28, 28, 0.18)');
      spotlight.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = spotlight;
      ctx.fillRect(0, 0, width, height);

      // 4. Floating Embers & Royal Gold Dust
      embers.forEach((ember) => {
        ember.y += ember.speedY;
        ember.x += ember.speedX + Math.sin(time + ember.y * 0.015) * 0.3;

        if (ember.y < -10) {
          ember.y = height + 10;
          ember.x = Math.random() * width;
          ember.opacity = Math.random() * 0.8 + 0.2;
        }

        ctx.beginPath();
        ctx.arc(ember.x, ember.y, ember.size, 0, Math.PI * 2);
        ctx.fillStyle = `${ember.color}${ember.opacity})`;
        ctx.shadowColor = 'rgba(245, 158, 11, 0.9)';
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // 5. Heavy Cinematic Vignette
      const vignette = ctx.createRadialGradient(
        width / 2,
        height / 2,
        Math.min(width, height) * 0.3,
        width / 2,
        height / 2,
        Math.max(width, height) * 0.8
      );
      vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
      vignette.addColorStop(0.6, 'rgba(3, 5, 10, 0.5)');
      vignette.addColorStop(1, 'rgba(2, 3, 6, 0.96)');
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, width, height);

      time += 0.015;
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [particleCount]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
    />
  );
};

