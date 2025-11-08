// Type definitions for the application

export interface User {
  id: string;
  email: string;
  full_name?: string | null;
  reputation_score?: number;
  total_ratings?: number;
  last_active?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface ReferralLink {
  id: string;
  user_id: string;
  service_name: string;
  referral_url: string;
  description: string;
  what_i_get?: string | null;
  logo_url?: string | null;
  status: 'active' | 'paused' | 'fulfilled';
  total_exchanges?: number;
  created_at: string;
  updated_at: string;
}

export interface Exchange {
  id: string;
  requester_link_id: string;
  provider_link_id: string;
  requester_user_id: string;
  provider_user_id: string;
  status: 'pending' | 'accepted' | 'completed' | 'cancelled';
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  proof_url?: string | null;
  is_read: boolean;
  created_at: string;
}

export interface Rating {
  id: string;
  rated_user_id: string;
  rater_user_id: string;
  completed_their_part: boolean;
  notes?: string | null;
  created_at: string;
}

export interface CreateLinkData {
  service_name: string;
  referral_url: string;
  description: string;
  what_i_get?: string;
  logo_url?: string;
  status?: 'active' | 'paused' | 'fulfilled';
}

export interface ExchangeRequestData {
  providerLink: ReferralLink;
  requesterLink: ReferralLink;
  notes?: string;
}

export interface RatingData {
  completed: boolean | null;
  notes: string;
}

