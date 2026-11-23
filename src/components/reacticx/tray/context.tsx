/**
 * Repris de Reacticx (https://github.com/rit3zh/reacticx, commit ca19ee8) — licence MIT, © 2026 rit3zh.
 * Texte de la licence : src/components/reacticx/LICENSE. Modifications HOMI signalées par « HOMI : ».
 */
import { createContext, useContext } from "react";

import type { ITrayContext } from "./types";

const TrayContext = createContext<ITrayContext | null>(null);

function useTrayContext(part: string): ITrayContext {
  const ctx = useContext(TrayContext);
  if (!ctx) {
    throw new Error(`<${part}> must be rendered inside <Tray>`);
  }
  return ctx;
}

function useTray() {
  const { open, close, setView, goBack, canGoBack, view, visible } =
    useTrayContext("useTray");
  return { open, close, setView, goBack, canGoBack, view, visible };
}

const TrayTintContext = createContext<string | null>(null);

function useTrayTint(fallback: string): string {
  return useContext(TrayTintContext) ?? fallback;
}

export { TrayContext, TrayTintContext, useTray, useTrayContext, useTrayTint };
