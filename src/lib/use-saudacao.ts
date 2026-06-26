"use client";

import { useEffect, useState } from "react";

/**
 * Saudação por horário (Bom dia / Boa tarde / Boa noite).
 * Calculada após a montagem para evitar divergência de hidratação.
 */
export function useSaudacao(): string {
  const [periodo, setPeriodo] = useState("Olá");
  useEffect(() => {
    const h = new Date().getHours();
    setPeriodo(h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite");
  }, []);
  return periodo;
}
