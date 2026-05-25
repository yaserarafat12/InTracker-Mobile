export type BreathingPhase = 'Inhale' | 'Hold' | 'Exhale' | 'Hold2';
const PHASES: BreathingPhase[] = ['Inhale', 'Hold', 'Exhale', 'Hold2'];

export function getBreathingPhase(elapsedSeconds: number) {
  const phase = PHASES[Math.floor(elapsedSeconds / 4) % 4];
  const phaseProgress = (elapsedSeconds % 4) / 4;
  const cycleCount = Math.floor(elapsedSeconds / 16);
  return { phase, phaseProgress, cycleCount };
}
