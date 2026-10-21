/** Types des lignes de la base (alignés sur supabase/migrations). */
import type { ReminderSchedule } from './domain/reminders';
import type { Multiplicity } from './domain/pregnancy';

export type Journey = 'avoid' | 'ttc' | 'cycle' | 'pregnant' | 'newborn' | 'child' | 'family';
export type Domain = 'daily' | 'health' | 'documents' | 'pregnancy' | 'lists' | 'names' | 'profile';
export const ALL_DOMAINS: Domain[] = ['daily', 'health', 'documents', 'pregnancy', 'lists', 'names', 'profile'];

export interface Profile {
  id: string;
  display_name: string | null;
  journeys: Journey[];
  interests: string[];
  locale: 'fr' | 'en';
  timezone: string;
  onboarding_completed: boolean;
  home_shortcuts: string[];
  hide_weight_module: boolean;
  theme: 'system' | 'light' | 'dark';
}

export interface Household { id: string; name: string; created_by: string; created_at: string }
export interface HouseholdMember {
  household_id: string;
  user_id: string;
  role: 'owner' | 'coparent' | 'caregiver';
  can_view: Domain[];
  can_edit: Domain[];
  joined_at: string;
  /** Profils partagés (null = tous les enfants) ; accès à la grossesse */
  child_scope?: string[] | null; pregnancy_access?: boolean;
}

export interface Pregnancy {
  id: string;
  household_id: string;
  carrier_user_id: string | null;
  due_date: string;
  lmp_date: string | null;
  due_date_source: 'due_date' | 'lmp' | 'professional' | 'conception' | 'positive_test';
  multiplicity: Multiplicity;
  status: 'active' | 'born' | 'ended';
  conception_date?: string | null;
  positive_test_date?: string | null;
  /** Motif de fin, choisi par la personne (« Je préfère ne pas préciser » possible). */
  end_reason?: 'born' | 'ended' | 'unspecified' | null;
  ended_on?: string | null;
  reminders_wanted: string[];
  topics: string[];
  created_at: string;
}

export interface ExpectedBaby { id: string; pregnancy_id: string; household_id: string; position: number; nickname: string | null; notes: string | null }

export interface Child {
  id: string;
  household_id: string;
  first_name: string;
  birth_date: string;
  sex: 'female' | 'male' | 'unspecified' | null;
  photo_path: string | null;
  from_pregnancy_id: string | null;
  multiple_group: string | null;
  birth_time?: string | null;
  birth_weight_g?: number | null;
  birth_length_cm?: number | null;
  birth_term_weeks?: number | null;
  enabled_tracking: string[];
  allergies_declared: string[];
  habits: string | null;
  archived: boolean;
  created_at: string;
}

export interface Measurement { id: string; child_id: string; household_id: string; measured_on: string; weight_kg: number | null; height_cm: number | null; head_cm: number | null; source: 'home' | 'professional'; note: string | null }

import type { StoolColor } from './domain/childCare';
interface LogBase { id: string; client_id?: string | null; child_id: string; household_id: string; note?: string | null; created_by?: string | null; created_at?: string }
export interface Bottle extends LogBase { at: string; prepared_ml: number | null; consumed_ml: number | null; milk_type: string | null }
export interface Breastfeed extends LogBase { side: 'left' | 'right' | 'both'; started_at: string; ended_at: string | null }
export interface Pumping extends LogBase { at: string; amount_ml: number; side: 'left' | 'right' | 'both' | null }
export interface Diaper extends LogBase { at: string; wet: boolean; stool: boolean; stool_color?: StoolColor | null; stool_consistency?: 'liquid' | 'soft' | 'formed' | 'hard' | null; blood_seen?: boolean }
export interface Sleep extends LogBase { started_at: string; ended_at: string | null; wakeups: number; kind?: 'nap' | 'night' | null; wake_events?: { at: string; minutes?: number; back_at?: string; open?: boolean }[] }
export interface Meal extends LogBase { at: string; description: string | null; foods: string[]; texture: 'smooth' | 'mashed' | 'pieces' | 'family' | null; reaction_note: string | null }
export type ObservationKind = 'temperature' | 'medication' | 'symptom' | 'note' | 'vomit' | 'regurgitation' | 'diarrhea' | 'abdominal_pain' | 'bloating' | 'crying';
export interface Observation extends LogBase { at: string; kind: ObservationKind; value_num: number | null; label: string | null; temp_method?: 'rectal' | 'axillary' | 'ear' | 'forehead' | 'other' | null; intensity?: 1 | 2 | 3 | null }

export type LogKind = 'bottle' | 'breastfeed' | 'pumping' | 'diaper' | 'sleep' | 'meal' | 'observation';
export const LOG_TABLE: Record<LogKind, string> = {
  bottle: 'bottles', breastfeed: 'breastfeeds', pumping: 'pumpings', diaper: 'diapers', sleep: 'sleeps', meal: 'meals', observation: 'child_observations',
};
export const LOG_TIME_COL: Record<LogKind, string> = {
  bottle: 'at', breastfeed: 'started_at', pumping: 'at', diaper: 'at', sleep: 'started_at', meal: 'at', observation: 'at',
};

export interface MaternalWeight { id: string; user_id: string; pregnancy_id: string | null; measured_on: string; weight_kg: number; note: string | null; professional_note: string | null }
export interface MoodCheckin { id: string; user_id: string; checked_at: string; mood: 1 | 2 | 3 | 4 | 5; feelings: string[]; safety_concern: boolean; journal: string | null }
export interface PeriodEntry { id: string; user_id: string; start_date: string; end_date: string | null; flow: 'spotting' | 'light' | 'medium' | 'heavy' | 'very_heavy' | null; note: string | null }
export interface TestResult { id: string; user_id: string; tested_at: string; result: string; note: string | null }

export type AppointmentKind = 'consultation' | 'ultrasound' | 'exam' | 'blood_test' | 'pediatric' | 'postnatal' | 'vaccination' | 'perineal_rehab' | 'other';
export interface Appointment {
  id: string; household_id: string; pregnancy_id: string | null; child_id: string | null; for_parent: boolean;
  kind: AppointmentKind; title: string; starts_at: string; location_label: string | null; notes: string | null; questions: string[];
  /** Réservé à la personne qui l'a créé (non visible du foyer). */
  private_to_creator?: boolean; created_by?: string | null;
}

export interface Reminder {
  id: string; user_id: string; household_id: string | null; child_id: string | null; pregnancy_id: string | null; appointment_id: string | null;
  treatment_id?: string | null; journey_type?: string | null;
  category: 'appointment' | 'ultrasound' | 'exam' | 'checklist' | 'bottle' | 'meal' | 'medication' | 'tracking' | 'postnatal' | 'custom';
  title: string; body: string | null; schedule: ReminderSchedule; timezone: string; enabled: boolean; snoozed_until: string | null; deep_link: string | null;
  created_at: string; updated_at: string;
}

export interface AppNotification {
  id: string; user_id: string; category: 'reminder' | 'community_reply' | 'community_comment' | 'community_like' | 'community_saved' | 'community_moderation' | 'assistant' | 'subscription' | 'product_recall' | 'system' | 'family';
  title: string; body: string | null; deep_link: string | null; payload: Record<string, unknown>; read_at: string | null; created_at: string;
}

export type ChecklistKind = 'maternity_bag' | 'baby_items' | 'home' | 'admin' | 'purchases' | 'coparent' | 'siblings' | 'multiples' | 'custom';
export interface Checklist { id: string; household_id: string; pregnancy_id: string | null; kind: ChecklistKind; title: string; created_at: string }
export interface ChecklistItem { id: string; checklist_id: string; household_id: string; label: string; done: boolean; done_by: string | null; position: number; note: string | null }

export type { DocCategory } from './documents/taxonomy';
import type { DocCategory } from './documents/taxonomy';
export interface DocumentRow {
  id: string; household_id: string; uploaded_by: string; pregnancy_id: string | null; child_id: string | null;
  category: DocCategory; custom_category: string | null; title: string; doc_date: string | null; notes: string | null;
  storage_path: string; mime_type: string; size_bytes: number; page_count: number;
  /** Privé par défaut : seule la personne qui l'a déposé le voit ; le partage avec le foyer est explicite. */
  private_to_uploader: boolean; favorite: boolean; archived: boolean;
  ocr_text: string | null; ocr_source: 'device' | 'server' | 'manual' | null; review_status: 'none' | 'to_verify' | 'verified';
  created_at: string; updated_at: string;
}
export type ExtractionStatus = 'to_verify' | 'verified' | 'professional' | 'rejected';
export interface DocumentExtraction {
  id: string; document_id: string; household_id: string; kind: 'fields' | 'reading' | 'summary'; level: 'quick' | 'detailed' | 'simple' | null;
  fields: Record<string, unknown>; status: ExtractionStatus; source: 'device' | 'server' | 'manual' | 'local' | null;
  verified_by: string | null; verified_at: string | null; professional_note: string | null; created_at: string;
}

export interface BabyName { id: string; name: string; usage: ('feminine' | 'masculine' | 'mixed')[]; origin: string | null; meaning: string | null; popularity_rank: number | null }
export interface NameFavorite { id: string; household_id: string; name: string; list_label: string; added_by: string | null; created_at: string }
export interface NameVote { favorite_id: string; household_id: string; user_id: string; vote: -1 | 0 | 1 }

export interface SourceRef { label: string; url: string; consulted_on?: string; published?: string }
export interface Article {
  id: string; slug: string; category_id: string | null; title: string; summary: string; body_md: string; journeys: Journey[];
  min_week: number | null; max_week: number | null; min_age_months: number | null; max_age_months: number | null; postpartum: boolean; tags: string[];
  author_name: string | null; reviewer_name: string | null; reviewer_qualification: string | null; sources: SourceRef[];
  validated_at: string | null; updated_on: string; status: string; is_premium: boolean; is_safety_critical: boolean;
  /** Statut éditorial : Brouillon généré par IA / À vérifier / Relu / Validé pour publication. */
  editorial_status?: 'ai_draft' | 'to_review' | 'reviewed' | 'validated';
}
export interface Category { id: string; slug: string; label: string; icon: string | null; position: number }
export interface EmergencyResource { id: string; country: string; label: string; phone: string; description: string; kind: string; available: string | null; position: number; active: boolean }

export interface Conversation { id: string; user_id: string; title: string; context_enabled?: boolean; created_at: string; updated_at: string }
export interface AssistantMessage {
  id: string; conversation_id: string; role: 'user' | 'assistant'; content: string;
  sources: { ref: number; title: string; slug: string; sources: SourceRef[] }[]; feedback: -1 | 1 | null; saved: boolean; created_at: string;
  /** Réponse structurée (sections, sources officielles) — absente pour les anciennes réponses. */
  structured?: import('../../supabase/functions/_shared/assistant-format').StructuredAnswer | null;
  safety_level?: 'none' | 'medical_urgent' | 'crisis';
}
export interface AssistantFeedback { id: string; message_id: string; user_id: string; value: -1 | 1; reason: string | null; created_at: string; updated_at: string }

export interface Forum { id: string; slug: string; title: string; description: string; journeys: Journey[]; icon: string | null; is_local: boolean; position: number }
export interface FeedPhoto { path: string; width: number | null; height: number | null }
export interface FeedPost {
  id: string; forum_id: string; forum_slug?: string | null; title: string | null; body: string; kind?: 'question' | 'testimony'; anonymous?: boolean;
  area_label: string | null; status: string; like_count: number; comment_count: number;
  created_at: string; edited_at: string | null; pseudonym: string | null; author_handle?: string | null; avatar_path?: string | null; avatar_preset?: string | null;
  is_mine: boolean; liked: boolean; saved: boolean; photos?: FeedPhoto[];
}
export interface FeedComment {
  id: string; post_id: string; parent_id: string | null; body: string; status: string; created_at: string; edited_at?: string | null;
  pseudonym: string | null; author_handle?: string | null; avatar_path?: string | null; avatar_preset?: string | null;
  is_mine: boolean; is_op?: boolean; anonymous?: boolean; post_title?: string | null; post_excerpt?: string | null;
}
export interface CommunityProfile {
  user_id: string; pseudonym: string; handle?: string; area_label: string | null; suspended_until: string | null;
  bio?: string | null; avatar_path?: string | null; avatar_preset?: string | null; journey_label?: string | null; visibility?: 'members' | 'minimal';
  rules_accepted_at?: string | null; created_at?: string;
  posts_count?: number; comments_count?: number; photos_count?: number; likes_count?: number; saved_count?: number;
}
/** Profil d'un membre tel que la personne a choisi de le montrer (fonction community_member). */
export interface CommunityMember {
  handle: string; pseudonym: string; avatar_path?: string | null; avatar_preset?: string | null; is_me: boolean; blocked: boolean; unavailable: boolean;
  visibility?: 'members' | 'minimal'; bio?: string | null; journey_label?: string | null; joined_month?: string | null;
  posts_count?: number; comments_count?: number; photos_count?: number;
}
export interface CommunityNotifPrefs { user_id?: string; post_comment: boolean; comment_reply: boolean; reaction: boolean; saved_reply: boolean; moderation: boolean }
export type ReportReason = 'harassment' | 'medical_misinformation' | 'spam' | 'personal_data' | 'danger' | 'inappropriate' | 'other';
export interface ReportRow { id: string; reporter_id: string; post_id: string | null; comment_id: string | null; reason: ReportReason; details: string | null; status: string; created_at: string }

export interface Subscription { user_id: string; status: 'none' | 'trial' | 'active' | 'grace' | 'cancelled' | 'expired' | 'billing_issue'; product_id: string | null; store: string | null; period_type: string | null; expires_at: string | null; will_renew: boolean | null }
export interface PrivacySettings { user_id: string; analytics_enabled: boolean; crash_reports_enabled: boolean; ai_history_enabled: boolean; community_visible: boolean; retention_months: number }
export type ConsentPurpose = 'terms' | 'health_data' | 'analytics' | 'crash_reports' | 'ai_assistant' | 'document_reading' | 'marketing';
export interface Consent { id: string; user_id: string; purpose: ConsentPurpose; granted: boolean; version: string; created_at: string }
