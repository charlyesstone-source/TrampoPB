/** Ícones SVG inline (mesmo traço do protótipo). */
import type { SVGProps } from "react";

const base = {
  fill: "none",
  stroke: "currentColor",
  viewBox: "0 0 24 24",
} as const;

export function IconHome(p: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} strokeWidth={2} {...p}>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V21h14V9.5" />
    </svg>
  );
}

export function IconSearch(p: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} strokeWidth={2} {...p}>
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4-4" />
    </svg>
  );
}

export function IconBookmark({
  filled,
  ...p
}: SVGProps<SVGSVGElement> & { filled?: boolean }) {
  return (
    <svg {...base} strokeWidth={2} fill={filled ? "currentColor" : "none"} {...p}>
      <path d="M19 21l-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  );
}

export function IconUser(p: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} strokeWidth={2} {...p}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
    </svg>
  );
}

export function IconClipboardCheck(p: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} strokeWidth={2} {...p}>
      <rect x="6" y="4" width="12" height="17" rx="2" />
      <path d="M9 4V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1" />
      <path d="m9 13 2 2 4-4" />
    </svg>
  );
}

export function IconBriefcase(p: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} strokeWidth={2} {...p}>
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M3 12h18" />
    </svg>
  );
}

export function IconPlus(p: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} strokeWidth={2.4} {...p}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function IconChevronRight(p: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} strokeWidth={2.4} {...p}>
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

export function IconBack(p: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} strokeWidth={2.4} {...p}>
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

export function IconPin(p: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} strokeWidth={2.4} {...p}>
      <path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11z" />
      <circle cx="12" cy="10" r="2.3" />
    </svg>
  );
}

export function IconCheckCircle(p: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} strokeWidth={2.2} {...p}>
      <path d="M9 12l2 2 4-4" />
      <circle cx="12" cy="12" r="9" />
    </svg>
  );
}

export function IconRefresh(p: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} strokeWidth={2.2} {...p}>
      <path d="M21 12a9 9 0 1 1-2.64-6.36" />
      <path d="M21 3v6h-6" />
    </svg>
  );
}

export function IconEye(p: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} strokeWidth={2} {...p}>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export function IconEyeOff(p: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} strokeWidth={2} {...p}>
      <path d="M9.9 4.2A9.5 9.5 0 0 1 12 4c6.5 0 10 7 10 7a17 17 0 0 1-2.2 3.2M6.7 6.7A17 17 0 0 0 2 11s3.5 7 10 7a9.5 9.5 0 0 0 3.3-.6M3 3l18 18M9.9 9.9a3 3 0 0 0 4.2 4.2" />
    </svg>
  );
}
