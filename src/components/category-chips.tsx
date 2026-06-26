"use client";

import { CHIPS_CATEGORIA } from "@/lib/mock-data";

/** Chips horizontais de filtro por categoria (controlado pela página). */
export function CategoryChips({
  ativa,
  onChange,
}: {
  ativa: string;
  onChange: (cat: string) => void;
}) {
  return (
    <div className="chips">
      {CHIPS_CATEGORIA.map((c) => (
        <button
          key={c}
          type="button"
          className="chip"
          aria-pressed={c === ativa}
          onClick={() => onChange(c)}
        >
          {c}
        </button>
      ))}
    </div>
  );
}
