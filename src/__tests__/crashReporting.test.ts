/** Étape 2 — rapports de plantage : rien sans accord, et jamais de donnée personnelle ou de santé. */
jest.mock('@sentry/react-native', () => ({ init: jest.fn(), captureException: jest.fn() }));

import { scrubEvent, scrubText, setCrashReportingAllowed } from '@/lib/crashReporting';

describe('nettoyage des rapports', () => {
  it('identifiants, e-mails, paramètres d’URL et nombres longs retirés', () => {
    const s = scrubText('Erreur sur /child/55b64dbb-f64e-48fc-8d5f-aae8ca6b1578?tab=sante pour sarah@exemple.fr (210000 ml)')!;
    expect(s).not.toMatch(/55b64dbb|sarah@|tab=sante|210000/);
    expect(s).toContain(':id');
  });

  it('sans accord, aucun événement ne part', () => {
    setCrashReportingAllowed(true); // pas de DSN en test : reste refusé
    expect(scrubEvent({ message: 'x' } as never)).toBeNull();
  });
});

describe('audit 04 — démarrage seulement après accord, aucun événement natif non filtré', () => {
  type Mod = typeof import('@/lib/crashReporting');
  const load = (): { mod: Mod; init: jest.Mock } => {
    let mod!: Mod;
    let init!: jest.Mock;
    jest.isolateModules(() => {
      init = (jest.requireMock('@sentry/react-native') as { init: jest.Mock }).init;
      mod = jest.requireActual('@/lib/crashReporting');
    });
    init.mockClear();
    return { mod, init };
  };
  const OLD = process.env.EXPO_PUBLIC_SENTRY_DSN;
  beforeEach(() => { process.env.EXPO_PUBLIC_SENTRY_DSN = 'https://cle@exemple.invalid/1'; });
  afterAll(() => { process.env.EXPO_PUBLIC_SENTRY_DSN = OLD; });

  it('le SDK n’est pas initialisé au démarrage sans accord', () => {
    const { mod, init } = load();
    mod.initCrashReporting();
    mod.setCrashReportingAllowed(false);
    expect(init).not.toHaveBeenCalled();
  });

  it('accord donné : initialisé une seule fois, sans suivi natif (blocage, arrêt système, NDK)', () => {
    const { mod, init } = load();
    mod.initCrashReporting();
    mod.setCrashReportingAllowed(true);
    mod.setCrashReportingAllowed(true);
    expect(init).toHaveBeenCalledTimes(1);
    expect(init.mock.calls[0][0]).toMatchObject({
      sendDefaultPii: false, enableNativeCrashHandling: false, enableAppHangTracking: false,
      enableWatchdogTerminationTracking: false, enableNdk: false, attachScreenshot: false, attachViewHierarchy: false,
    });
  });

  it('valeurs citées et détail Postgres retirés ; étiquettes et données du mécanisme supprimées', () => {
    const { mod } = load();
    mod.setCrashReportingAllowed(true);
    expect(mod.scrubText('duplicate key value violates unique constraint "kids_name_key" Key (first_name)=(Léa) already exists'))
      .not.toMatch(/Léa|kids_name_key/);
    expect(mod.scrubText('Traitement « Doliprane 2,4 % » introuvable')).not.toMatch(/Doliprane/);
    const ev = mod.scrubEvent({ tags: { pregnant: 'yes' }, exception: { values: [{ value: 'x', mechanism: { type: 'generic', data: { child: 'Léa' } } }] } } as never)!;
    expect(JSON.stringify(ev)).not.toMatch(/pregnant|Léa/);
  });
});
