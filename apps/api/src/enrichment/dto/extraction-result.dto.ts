export interface PersonEntity {
  id: string;
  canonical_name: string;
  name_variants?: string[];
  inferred_profession?: string;
  inferred_gender?: string;
  inferred_age_range?: string;
  contact_info?: any[];
  linked_events?: string[];
  linked_locations?: string[];
  confidence_score: number;
  provenance: string[];
  created_at?: string;
}

export interface EventEntity {
  id: string;
  title: string;
  event_type?: string;
  start_datetime?: string;
  end_datetime?: string;
  recurrence?: string;
  venue_id?: string;
  organizer_id?: string;
  description?: string;
  expected_attendees?: string;
  ticket_info?: string;
  confidence_score: number;
  provenance: string[];
  ambiguities?: any[];
}

export interface LocationEntity {
  id: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  geocoordinates?: { lat: number; lon: number };
  venue_website?: string;
  phone?: string;
  capacity?: number;
  aliases?: string[];
  confidence_score: number;
  provenance: string[];
  ambiguities?: any[];
  clarifying_questions?: string[];
  search_suggestions?: string[];
}

export interface OrganizationEntity {
  id: string;
  name: string;
  type?: string;
  contact_info?: any[];
  website?: string;
  linked_events?: string[];
  confidence_score: number;
  provenance: string[];
}

export interface RelationshipEntity {
  source_entity_id: string;
  source_entity_type: string;
  relationship_type: string;
  target_entity_id: string;
  target_entity_type: string;
  confidence: number;
  provenance: string;
}

export interface SummaryEntity {
  type: string;
  text: string;
}

export interface FollowUpAction {
  priority: 'high' | 'medium' | 'low';
  action: string;
  reason: string;
}

export interface ExtractionResult {
  persons: PersonEntity[];
  events: EventEntity[];
  locations: LocationEntity[];
  organizations: OrganizationEntity[];
  summaries: SummaryEntity[];
  follow_up_actions: FollowUpAction[];
  relationships: RelationshipEntity[];
  words?: string[];
}
