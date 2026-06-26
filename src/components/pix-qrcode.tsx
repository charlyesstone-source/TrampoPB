"use client";

import { useMemo } from "react";

/**
 * QR Code DECORATIVO (mesmo gerador determinístico do protótipo).
 * Não é um Pix real — na Fase 5 o QR vem do gateway de pagamento.
 */
export function PixQRCode() {
  const svg = useMemo(() => {
    const N = 25,
      m = 7,
      pad = 1,
      sz = (N + pad * 2) * m;
    const finders: [number, number][] = [
      [0, 0],
      [0, N - 7],
      [N - 7, 0],
    ];
    const finderFill = (r: number, c: number): boolean | null => {
      for (const [R0, C0] of finders) {
        const lr = r - R0,
          lc = c - C0;
        if (lr >= 0 && lr <= 6 && lc >= 0 && lc <= 6)
          return (
            lr === 0 ||
            lr === 6 ||
            lc === 0 ||
            lc === 6 ||
            (lr >= 2 && lr <= 4 && lc >= 2 && lc <= 4)
          );
      }
      return null;
    };
    let seed = 7;
    const rnd = () => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return seed / 0x7fffffff;
    };
    const rects: string[] = [];
    for (let r = 0; r < N; r++)
      for (let c = 0; c < N; c++) {
        const f = finderFill(r, c);
        const on = f !== null ? f : rnd() > 0.52;
        if (on)
          rects.push(
            `<rect x="${(c + pad) * m}" y="${(r + pad) * m}" width="${m}" height="${m}"/>`
          );
      }
    return `<svg viewBox="0 0 ${sz} ${sz}" xmlns="http://www.w3.org/2000/svg"><rect width="${sz}" height="${sz}" fill="#fff"/><g fill="#14201D">${rects.join(
      ""
    )}</g></svg>`;
  }, []);

  return (
    <div className="pix-qr" aria-hidden="true" dangerouslySetInnerHTML={{ __html: svg }} />
  );
}
