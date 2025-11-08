/**
 * TypeScript types for Supabase Database
 * Generated from database schema
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          reputation_score: number;
          total_ratings: number;
          last_active: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          reputation_score?: number;
          total_ratings?: number;
          last_active?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          reputation_score?: number;
          total_ratings?: number;
          last_active?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      referral_links: {
        Row: {
          id: string;
          user_id: string;
          service_name: string;
          referral_url: string;
          description: string;
          what_i_get: string | null;
          logo_url: string | null;
          status: 'active' | 'paused' | 'fulfilled';
          total_exchanges: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          service_name: string;
          referral_url: string;
          description: string;
          what_i_get?: string | null;
          logo_url?: string | null;
          status?: 'active' | 'paused' | 'fulfilled';
          total_exchanges?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          service_name?: string;
          referral_url?: string;
          description?: string;
          what_i_get?: string | null;
          logo_url?: string | null;
          status?: 'active' | 'paused' | 'fulfilled';
          total_exchanges?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      exchanges: {
        Row: {
          id: string;
          requester_link_id: string;
          provider_link_id: string;
          requester_user_id: string;
          provider_user_id: string;
          status: 'pending' | 'accepted' | 'completed' | 'cancelled';
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          requester_link_id: string;
          provider_link_id: string;
          requester_user_id: string;
          provider_user_id: string;
          status?: 'pending' | 'accepted' | 'completed' | 'cancelled';
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          requester_link_id?: string;
          provider_link_id?: string;
          requester_user_id?: string;
          provider_user_id?: string;
          status?: 'pending' | 'accepted' | 'completed' | 'cancelled';
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      messages: {
        Row: {
          id: string;
          sender_id: string;
          receiver_id: string;
          content: string;
          proof_url: string | null;
          is_read: boolean;
          created_at: string;
          metadata: any;
        };
        Insert: {
          id?: string;
          sender_id: string;
          receiver_id: string;
          content: string;
          proof_url?: string | null;
          is_read?: boolean;
          created_at?: string;
          metadata?: any;
        };
        Update: {
          id?: string;
          sender_id?: string;
          receiver_id?: string;
          content?: string;
          proof_url?: string | null;
          is_read?: boolean;
          created_at?: string;
          metadata?: any;
        };
      };
      ratings: {
        Row: {
          id: string;
          rated_user_id: string;
          rater_user_id: string;
          completed_their_part: boolean;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          rated_user_id: string;
          rater_user_id: string;
          completed_their_part: boolean;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          rated_user_id?: string;
          rater_user_id?: string;
          completed_their_part?: boolean;
          notes?: string | null;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      link_status: 'active' | 'paused' | 'fulfilled';
      exchange_status: 'pending' | 'accepted' | 'completed' | 'cancelled';
    };
  };
}

