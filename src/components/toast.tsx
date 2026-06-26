"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/context/app-context";

/** Toast global (canto inferior), reagindo a toastSeq do contexto. */
export function Toast() {
  const { toastMsg, toastSeq } = useApp();
  const [visivel, setVisivel] = useState(false);

  useEffect(() => {
    if (toastSeq === 0) return;
    setVisivel(true);
    const t = setTimeout(() => setVisivel(false), 2200);
    return () => clearTimeout(t);
  }, [toastSeq]);

  return (
    <div
      className={`toast${visivel ? " show" : ""}`}
      role="status"
      aria-live="polite"
    >
      {toastMsg}
    </div>
  );
}
