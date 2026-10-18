/**
 * « Découvrir sans compte » : démonstration avec une famille d'exemple, données fictives sur l'appareil.
 */
import { useEffect, useState } from 'react';
import { backend, enterDemoMode, exitDemoMode, hasRealBackend, isDemo, onBackendSwitch } from './backend';

const DEMO_EMAIL = 'demo@toietmoi.local';
const DEMO_PASSWORD = 'demonstration-locale-1';

/** Passe en démonstration et ouvre une session locale avec la famille d'exemple. */
export async function startDemoWithoutAccount(): Promise<void> {
  await enterDemoMode();
  try {
    await backend.auth.signIn(DEMO_EMAIL, DEMO_PASSWORD);
  } catch {
    await backend.auth.signUp(DEMO_EMAIL, DEMO_PASSWORD);
  }
  const kids = await backend.select<{ id: string }>({ table: 'children', limit: 1 });
  if (!kids.length) {
    const s = await backend.auth.getSession();
    await backend.insert('consents', [{ user_id: s?.userId, purpose: 'health_data', granted: true }, { user_id: s?.userId, purpose: 'ai_assistant', granted: true }]).catch(() => undefined);
    await backend.rpc('load_sample_family');
  }
}

/** Quitte la démonstration (seulement si les vrais services sont configurés). */
export async function leaveDemo(): Promise<void> {
  await backend.auth.signOut().catch(() => undefined);
  await exitDemoMode();
}

export function useBackendMode(): { isDemo: boolean; canLeave: boolean } {
  const [, force] = useState(0);
  useEffect(() => onBackendSwitch(() => force((n) => n + 1)), []);
  return { isDemo, canLeave: hasRealBackend && isDemo };
}
