"use client";

import type { ReactNode } from "react";
import { AppProvider } from "@/context/app-context";
import { Analytics } from "./analytics";
import { BottomNav } from "./bottom-nav";
import { Header } from "./header";
import { JobSheet } from "./job-sheet";
import { Toast } from "./toast";

/** Moldura "telefone" + provider de estado, compartilhada por todas as telas. */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <AppProvider>
      <div className="app" id="app">
        <div className="sunline" />
        <Header />
        <main className="appmain">{children}</main>
        <BottomNav />
        <JobSheet />
        <Toast />
        <Analytics />
      </div>
    </AppProvider>
  );
}
