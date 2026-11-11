"use client";

export default function AdminError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div role="alert" className="glass-card p-6">
      <h2 className="font-display text-xl uppercase">That didn&apos;t work</h2>
      <p className="mt-2 text-sm text-red-200">{error.message || "Something went wrong."}</p>
      <button onClick={reset} className="btn-outline mt-4">Back</button>
    </div>
  );
}
