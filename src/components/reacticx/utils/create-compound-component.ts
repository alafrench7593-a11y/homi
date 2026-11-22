/**
 * Repris de Reacticx (https://github.com/rit3zh/reacticx, commit ca19ee8) — licence MIT, © 2026 rit3zh.
 * Texte de la licence : src/components/reacticx/LICENSE. Modifications HOMI signalées par « HOMI : ».
 */
import type { ComponentType } from "react";

function createCompoundComponent<
  T extends ComponentType<any>,
  TCompound extends Record<string, unknown> = {},
>(
  name: string,
  component: T,
  compound: TCompound = {} as TCompound,
): T & TCompound {
  component.displayName = name;

  return Object.assign(component, compound);
}

export { createCompoundComponent };
