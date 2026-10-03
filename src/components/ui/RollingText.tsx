import { useState } from "react";
import { motion } from "motion/react";

interface RollingTextProps {
  text: string;
  className?: string;
}

/** Splits text into characters, each with a duplicate copy stacked
    underneath — hovering rolls the visible copy up and out while the
    duplicate rolls up into its place, staggered slightly per character so
    the roll sweeps across the word instead of all letters moving at once. */
export function RollingText({ text, className = "" }: RollingTextProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <span
      className={`relative inline-flex ${className}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {text.split("").map((char, i) => (
        <span
          key={i}
          className="relative inline-block overflow-hidden"
          style={{ height: "1.2em", lineHeight: "1.2em" }}
        >
          <motion.span
            className="block"
            animate={{ y: hovered ? "-100%" : "0%" }}
            transition={{ duration: 0.35, ease: "easeInOut", delay: hovered ? i * 0.02 : 0 }}
          >
            {char === " " ? " " : char}
          </motion.span>
          <motion.span
            className="absolute left-0 top-0 block"
            aria-hidden
            animate={{ y: hovered ? "0%" : "100%" }}
            transition={{ duration: 0.35, ease: "easeInOut", delay: hovered ? i * 0.02 : 0 }}
          >
            {char === " " ? " " : char}
          </motion.span>
        </span>
      ))}
    </span>
  );
}
