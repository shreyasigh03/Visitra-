import { useEffect, useState } from "react";

const STEP_MS = 2200;
const STEPS = 4;
const PEOPLE = 3;
const prefersStill = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

// Moves the landing page pass along its steps, one visitor after another. It stands
// still on the finished pass for people who prefer less motion.
export function useHeroStep() {
  const [tick, setTick] = useState(() => (prefersStill() ? STEPS - 1 : 0));

  useEffect(() => {
    if (prefersStill()) return undefined;
    const timer = setInterval(() => setTick((t) => (t + 1) % (STEPS * PEOPLE)), STEP_MS);
    return () => clearInterval(timer);
  }, []);

  return { step: tick % STEPS, person: Math.floor(tick / STEPS) };
}
