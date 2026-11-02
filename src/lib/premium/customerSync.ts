/**
 * État RevenueCat de l'appareil (CustomerInfo) comparé à l'état du serveur (table `subscriptions`) — logique pure.
 * L'appareil ne décide JAMAIS des droits : quand les deux diffèrent, l'application demande au serveur de relire
 * RevenueCat (fonction subscription-sync), puis relit has_premium.
 */
import type { CustomerInfo } from 'react-native-purchases';
import { grants, type SubRow } from './entitlement';
import { baseProductId, PREMIUM_ENTITLEMENT } from './plans';

export interface DeviceState {
  active: boolean;
  productId: string | null;
  expiresAt: string | null;
  willRenew: boolean | null;
}

export function deviceState(info: Pick<CustomerInfo, 'entitlements'> | null | undefined, entitlement: string = PREMIUM_ENTITLEMENT): DeviceState {
  const e = info?.entitlements?.all?.[entitlement] ?? null;
  if (!e) return { active: false, productId: null, expiresAt: null, willRenew: null };
  return { active: !!e.isActive, productId: e.productIdentifier ?? null, expiresAt: e.expirationDate ?? null, willRenew: e.willRenew ?? null };
}

const SAME_DATE_MS = 5 * 60_000;

/** Vrai si l'état de l'appareil et celui du serveur (abonnement PERSONNEL) ne racontent pas la même chose. */
export function needsServerSync(device: DeviceState, server: SubRow | null | undefined, now: Date = new Date()): boolean {
  const serverActive = grants(server ?? null, now);
  if (device.active !== serverActive) return true;
  if (!device.active) return false;
  if (baseProductId(device.productId) !== baseProductId(server?.product_id)) return true;
  if (device.expiresAt && server?.expires_at && Math.abs(Date.parse(device.expiresAt) - Date.parse(server.expires_at)) > SAME_DATE_MS) return true;
  if (device.willRenew != null && server?.will_renew != null && device.willRenew !== server.will_renew) return true;
  return false;
}
