"use client";

import { useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { toggleFavorite } from "@/app/actions/favorites";
import { cn } from "@/lib/utils";

export function FavoriteButton({
  vehicleId,
  initialSaved,
  className,
  withLabel = false,
}: {
  vehicleId: string;
  initialSaved: boolean;
  className?: string;
  withLabel?: boolean;
}) {
  const [saved, setSaved] = useState(initialSaved);
  const [pending, start] = useTransition();
  const router = useRouter();
  const pathname = usePathname();

  function onClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    start(async () => {
      const res = await toggleFavorite(vehicleId, saved);
      if (res.ok) setSaved(res.saved);
      else if (res.reason === "login") router.push(`/login?next=${encodeURIComponent(pathname)}`);
    });
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      aria-pressed={saved}
      aria-label={saved ? "Remove from saved cars" : "Save this car"}
      className={cn(
        "inline-flex items-center justify-center gap-2 transition",
        withLabel
          ? "btn-outline w-full"
          : "size-9 rounded-full bg-black/60 text-white backdrop-blur hover:bg-black/80",
        className,
      )}
    >
      <Heart className={cn("size-4", saved && "fill-accent text-accent")} />
      {withLabel && (saved ? "Saved" : "Save to Favourites")}
    </button>
  );
}
