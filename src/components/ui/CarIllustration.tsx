import { useId } from "react";

/**
 * Generic, original car illustration used as a stand-in when a listing has no photo
 * (and for the hero until licensed photography is supplied). Not a depiction of any specific model.
 */
export function CarIllustration({
  body = "sedan",
  color = "#1a1c22",
  className,
  label,
}: {
  body?: "sedan" | "suv";
  color?: string;
  className?: string;
  label?: string;
}) {
  const id = useId().replace(/:/g, "");
  const sedan = "M20 112 L30 96 Q36 88 52 84 L108 72 Q130 52 170 48 L238 48 Q268 50 290 72 L340 80 Q372 86 380 104 L384 120 Q384 128 376 128 L26 128 Q16 128 20 112 Z";
  const suv = "M18 118 L24 92 Q28 84 44 80 L88 74 L118 40 Q122 36 130 36 L300 36 Q312 36 318 44 L344 76 L372 84 Q384 88 386 100 L388 122 Q388 128 380 128 L24 128 Q16 128 18 118 Z";
  const glass = body === "suv" ? "M126 46 L294 46 L330 78 L96 78 Z" : "M120 74 Q140 56 172 54 L236 54 Q260 56 278 74 Z";
  return (
    <svg
      viewBox="0 0 400 160"
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={className}
    >
      <defs>
        <linearGradient id={`g${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.22" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.35" />
        </linearGradient>
      </defs>
      <ellipse cx="200" cy="140" rx="180" ry="9" fill="#000" opacity="0.55" />
      <path d={body === "suv" ? suv : sedan} fill={color} />
      <path d={body === "suv" ? suv : sedan} fill={`url(#g${id})`} />
      <path d={glass} fill="#0b0d12" opacity="0.92" />
      <path d={glass} fill="#8fa3bd" opacity="0.14" />
      <rect x="372" y="98" width="14" height="6" rx="2" fill="#ffe9b0" opacity="0.9" />
      <rect x="16" y="98" width="12" height="6" rx="2" fill="#ed1026" opacity="0.9" />
      {[95, 305].map((cx) => (
        <g key={cx}>
          <circle cx={cx} cy="128" r="25" fill="#07080b" />
          <circle cx={cx} cy="128" r="14" fill="#2a2d35" />
          <circle cx={cx} cy="128" r="5" fill="#0b0d12" />
        </g>
      ))}
    </svg>
  );
}
