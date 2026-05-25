import { useState, useRef, useCallback, useEffect } from 'react';

interface UseCountdownTimerOptions {
  initialSeconds: number;
  onComplete?: () => void;
  onTick?: (remaining: number) => void;
}

export function useCountdownTimer({ initialSeconds, onComplete, onTick }: UseCountdownTimerOptions) {
  const [remaining, setRemaining] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onCompleteRef = useRef(onComplete);
  const onTickRef = useRef(onTick);

  // Keep refs up to date
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    onTickRef.current = onTick;
  }, [onTick]);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const start = useCallback(() => {
    clearTimer();
    setRemaining(initialSeconds);
    setIsRunning(true);
    setIsPaused(false);

    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        const next = prev - 1;
        if (next <= 0) {
          clearTimer();
          setIsRunning(false);
          setIsPaused(false);
          onCompleteRef.current?.();
          return 0;
        }
        onTickRef.current?.(next);
        return next;
      });
    }, 1000);
  }, [initialSeconds, clearTimer]);

  const pause = useCallback(() => {
    if (isRunning && !isPaused) {
      clearTimer();
      setIsPaused(true);
    }
  }, [isRunning, isPaused, clearTimer]);

  const resume = useCallback(() => {
    if (isPaused) {
      setIsPaused(false);
      intervalRef.current = setInterval(() => {
        setRemaining((prev) => {
          const next = prev - 1;
          if (next <= 0) {
            clearTimer();
            setIsRunning(false);
            setIsPaused(false);
            onCompleteRef.current?.();
            return 0;
          }
          onTickRef.current?.(next);
          return next;
        });
      }, 1000);
    }
  }, [isPaused, clearTimer]);

  const stop = useCallback(() => {
    clearTimer();
    setIsRunning(false);
    setIsPaused(false);
    setRemaining(initialSeconds);
  }, [initialSeconds, clearTimer]);

  const reset = useCallback(() => {
    clearTimer();
    setIsRunning(false);
    setIsPaused(false);
    setRemaining(initialSeconds);
  }, [initialSeconds, clearTimer]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimer();
    };
  }, [clearTimer]);

  return { remaining, isRunning, isPaused, start, pause, resume, stop, reset };
}
