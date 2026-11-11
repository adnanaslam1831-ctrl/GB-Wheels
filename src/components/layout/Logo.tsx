import Link from "next/link";

/**
 * Text-based wordmark used until the supplied logo file is added.
 * To use the real logo, drop it at public/logo.png and swap the body for next/image
 * (keep width/height proportional so it is never distorted).
 */
export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link href="/" aria-label="GB Wheels home" className={`flex items-center gap-2 ${className}`}>
      <span className="grid size-9 place-items-center rounded-md bg-accent font-display text-lg font-bold text-white">
        GB
      </span>
      <span className="font-display text-xl font-semibold uppercase tracking-wider text-white">
        Wheels
      </span>
    </Link>
  );
}
