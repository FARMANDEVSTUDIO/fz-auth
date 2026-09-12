import confetti from 'canvas-confetti';
import { soundReward } from './sounds';

export function fireConfetti() {
  soundReward();
  const defaults = {
    spread: 360,
    ticks: 70,
    gravity: 0.6,
    decay: 0.94,
    startVelocity: 20,
    colors: ['#8b5cf6', '#a855f7', '#d946ef', '#f0abfc', '#c084fc'],
  };

  confetti({ ...defaults, particleCount: 30, origin: { x: 0.3, y: 0.6 } });
  confetti({ ...defaults, particleCount: 30, origin: { x: 0.7, y: 0.6 } });

  setTimeout(() => {
    confetti({ ...defaults, particleCount: 20, origin: { x: 0.5, y: 0.4 }, startVelocity: 30 });
  }, 150);
}

export function fireSparkle() {
  confetti({
    particleCount: 15,
    spread: 50,
    startVelocity: 15,
    gravity: 0.5,
    ticks: 50,
    origin: { x: 0.5, y: 0.5 },
    colors: ['#8b5cf6', '#d946ef', '#f0abfc'],
    shapes: ['circle'],
    scalar: 0.8,
  });
}
