import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

const WORDS = ["Run", "Track", "Compare"];
const INTERVAL_MS = 1800;

/** A single word that cycles through `WORDS`, sliding the next one up into
    place — sits next to the MODEL_ARENA label as a quick preview of what
    the app actually does. */
export function ShuffleWords() {
  const [index, setIndex] = useState(0);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (prefersReducedMotion) return;
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % WORDS.length);
    }, INTERVAL_MS);
    return () => clearInterval(id);
  }, [prefersReducedMotion]);

  // The animated word is absolutely positioned (so the outgoing/incoming
  // words can stack during the crossfade), which means it never
  // contributes to this span's width — without something else holding the
  // box open, it collapses to fit whichever word happens to be shortest
  // and clips every other word. This invisible, in-flow copy of the
  // longest word reserves the right amount of space instead.
  const longest = WORDS.reduce((a, b) => (b.length > a.length ? b : a));

  return (
    <span className="relative inline-block overflow-hidden align-bottom leading-none">
      <span className="invisible" aria-hidden="true">
        {longest}
      </span>
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={WORDS[index]}
          initial={prefersReducedMotion ? false : { y: "60%", opacity: 0 }}
          animate={{ y: "0%", opacity: 1 }}
          exit={prefersReducedMotion ? undefined : { y: "-60%", opacity: 0 }}
          transition={{ duration: 0.32, ease: "easeInOut" }}
          className="absolute left-0 top-0 block leading-none text-signal"
        >
          {WORDS[index]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
