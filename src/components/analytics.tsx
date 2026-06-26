"use client";

/**
 * Google Analytics 4 com consentimento de cookies (LGPD).
 * - O GA só é carregado DEPOIS que a pessoa clica em "Aceitar".
 * - Sem o ID configurado (NEXT_PUBLIC_GA_ID), nada é carregado nem exibido.
 * - O ID vem da variável de ambiente, definida no painel da Netlify.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import Script from "next/script";
import { useEffect, useState } from "react";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;
const CHAVE = "trampopb-consent"; // localStorage: "granted" | "denied"

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

/** Carrega o gtag e registra a navegação entre páginas (SPA). */
function GoogleAnalytics({ gaId }: { gaId: string }) {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window.gtag === "function") {
      window.gtag("config", gaId, { page_path: pathname });
    }
  }, [pathname, gaId]);

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
        strategy="afterInteractive"
      />
      <Script id="ga-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${gaId}', { anonymize_ip: true });
        `}
      </Script>
    </>
  );
}

export function Analytics() {
  const [consent, setConsent] = useState<"granted" | "denied" | null>(null);
  const [montado, setMontado] = useState(false);

  useEffect(() => {
    setMontado(true);
    const salvo = localStorage.getItem(CHAVE);
    if (salvo === "granted" || salvo === "denied") setConsent(salvo);
  }, []);

  // Sem ID configurado, analytics desligado por completo.
  if (!GA_ID) return null;
  if (!montado) return null;

  const decidir = (valor: "granted" | "denied") => {
    localStorage.setItem(CHAVE, valor);
    setConsent(valor);
  };

  return (
    <>
      {consent === "granted" && <GoogleAnalytics gaId={GA_ID} />}

      {consent === null && (
        <div className="cookie-banner" role="dialog" aria-label="Consentimento de cookies">
          <p>
            Usamos cookies para entender como o app é usado e melhorá-lo. Você pode
            recusar sem perder nenhuma função. Saiba mais na{" "}
            <Link href="/privacidade">Política de Privacidade</Link>.
          </p>
          <div className="cookie-acoes">
            <button
              type="button"
              className="cookie-btn ghost"
              onClick={() => decidir("denied")}
            >
              Recusar
            </button>
            <button
              type="button"
              className="cookie-btn primary"
              onClick={() => decidir("granted")}
            >
              Aceitar
            </button>
          </div>
        </div>
      )}
    </>
  );
}
