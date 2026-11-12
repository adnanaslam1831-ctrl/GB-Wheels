import Image from "next/image";
import Link from "next/link";

/** The supplied GB Wheels logo (white/red version for the dark theme). Aspect ratio is fixed so it is never distorted. */
export function Logo({ className = "", priority = false }: { className?: string; priority?: boolean }) {
  return (
    <Link href="/" aria-label="GB Wheels home" className={`inline-block shrink-0 ${className}`}>
      <Image
        src="/brand/logo.png"
        alt="GB Wheels"
        width={1200}
        height={348}
        priority={priority}
        className="h-auto w-full"
        sizes="(min-width:1024px) 230px, 150px"
      />
    </Link>
  );
}
