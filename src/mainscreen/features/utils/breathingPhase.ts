export type BreathingPhase = 'Inhale' | 'Hold' | 'Exhale';
const PHASES: BreathingPhase[] = ['Inhale', 'Hold', 'Exhale'];

export function getBreathingPhase(elapsedSeconds: number) {
  const phase = PHASES[Math.floor(elapsedSeconds / 4) % 3];
  const phaseProgress = (elapsedSeconds % 4) / 4;
  const cycleCount = Math.floor(elapsedSeconds / 12);
  return { phase, phaseProgress, cycleCount };
}
