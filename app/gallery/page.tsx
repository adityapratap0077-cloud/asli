import Image from "next/image";
import Link from "next/link";
import { DESIGNS } from "@/lib/catalog";

export default function GalleryPage() {
  return (
    <div className="mx-auto max-w-6xl px-5 py-10">
      <h1 className="font-display text-3xl sm:text-4xl">FRESH DROPS</h1>
      <p className="mt-2 max-w-xl text-[#c9c9ce]">
        Pre-made artwork from the studio. Like one? Open it in the studio to
        put it on any garment and colour, add your text, and order.
      </p>

      <div className="mt-10 grid grid-cols-2 gap-5 md:grid-cols-3">
        {DESIGNS.map((d) => (
          <div
            key={d.id}
            className="group overflow-hidden rounded-2xl border border-white/10 bg-[#101014]"
          >
            <div className="relative aspect-square">
              <Image
                src={d.src}
                alt={`${d.name} artwork`}
                fill
                className="object-cover transition duration-300 group-hover:scale-105"
              />
            </div>
            <div className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="font-semibold">{d.name}</p>
                <p className="font-spacemono text-xs text-[#8f8f96]">{d.tag}</p>
              </div>
              <Link
                href={`/studio?design=${encodeURIComponent(d.src)}`}
                className="rounded-full border border-white/25 px-4 py-2 text-sm hover:border-white/60"
              >
                Customize
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
