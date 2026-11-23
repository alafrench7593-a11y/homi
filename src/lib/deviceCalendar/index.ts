/**
 * Calendrier de l'iPhone dans HOMI : service unique de l'application (adaptateur natif + stockage local).
 * Voir docs/CALENDRIER_IPHONE.md. La logique est dans model.ts et service.ts (testés), le natif dans native.ts.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { deviceTimeZone, nativeAdapter } from './native';
import { createDeviceCalendarService } from './service';

export const deviceCalendar = createDeviceCalendarService({ adapter: nativeAdapter, store: AsyncStorage, timeZone: deviceTimeZone });

export * from './types';
export { buildExport, canAdd, canRead, homiKey, sortAgenda, toAgendaItems, type DeviceAgendaItem, type ExportPlan, type ExportSource, type RecurrenceLimit } from './model';
export type { AddResult, LinkStatus, RemoveResult, UpdateResult } from './service';
