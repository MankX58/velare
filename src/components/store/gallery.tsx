"use client";

import Image from "next/image";
import { useState } from "react";

// Fotos de un producto en su página: una grande y, si hay más, miniaturas para cambiarla.
export function Gallery({ images, alt }: { images: string[]; alt: string }) {
  const [current, setCurrent] = useState(0);

  return (
    <div>
      <div className="relative aspect-[4/5] overflow-hidden bg-surface">
        {/* key: al cambiar de foto, la nueva entra con una transición corta. */}
        <Image
          key={images[current]}
          src={images[current]}
          alt={alt}
          fill
          priority
          sizes="(min-width: 1024px) 32rem, 100vw"
          className="object-cover motion-safe:animate-settle"
        />
      </div>

      {images.length > 1 && (
        <ul className="mt-3 grid grid-cols-5 gap-3">
          {images.map((src, index) => (
            <li key={src}>
              <button
                type="button"
                onClick={() => setCurrent(index)}
                aria-label={`Ver la foto ${index + 1} de ${images.length}`}
                aria-current={index === current}
                className="relative block aspect-square w-full overflow-hidden bg-surface opacity-60 transition-opacity duration-(--duration-quick) ease-smooth-out hover:opacity-100 aria-[current=true]:opacity-100 aria-[current=true]:outline-2 aria-[current=true]:outline-offset-2 aria-[current=true]:outline-ink"
              >
                <Image src={src} alt="" fill sizes="6rem" className="object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
