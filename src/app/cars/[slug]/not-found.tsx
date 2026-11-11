import Link from "next/link";

export default function NotFound() {
  return (
    <section className="container-gb py-24 text-center">
      <h1 className="font-display text-3xl uppercase">Car not found</h1>
      <p className="mt-2 text-muted">This listing may have been removed or is not yet approved.</p>
      <Link href="/buy" className="btn-primary mt-6">Browse cars</Link>
    </section>
  );
}
