import { Type, Image as ImageIcon, CircleHelp } from "lucide-react";

interface ModalityIconProps {
  modality: string;
  className?: string;
}

/** Small icon identifying an output modality (text, image, …) — used next
    to a model's name so its output types read at a glance instead of as a
    text badge. */
export function ModalityIcon({ modality, className = "h-3.5 w-3.5" }: ModalityIconProps) {
  if (modality === "image") {
    return <ImageIcon className={`shrink-0 ${className}`} strokeWidth={2} aria-hidden />;
  }

  if (modality === "text") {
    return <Type className={`shrink-0 ${className}`} strokeWidth={2} aria-hidden />;
  }

  // Fallback for a modality this UI doesn't have a dedicated glyph for yet
  // (e.g. audio) rather than rendering nothing at all.
  return <CircleHelp className={`shrink-0 ${className}`} strokeWidth={2} aria-hidden />;
}
