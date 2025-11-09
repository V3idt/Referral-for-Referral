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
          username: string | null;
          reputation_score: number;
          total_ratings: number;
          last_active: string | null;
          is_admin: boolean;
          is_banned: boolean;
          banned_at: string | null;
          banned_by: string | null;
          ban_reason: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          username?: string | null;
          reputation_score?: number;
          total_ratings?: number;
          last_active?: string | null;
          is_admin?: boolean;
          is_banned?: boolean;
          banned_at?: string | null;
          banned_by?: string | null;
          ban_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          username?: string | null;
          reputation_score?: number;
          total_ratings?: number;
          last_active?: string | null;
          is_admin?: boolean;
          is_banned?: boolean;
          banned_at?: string | null;
          banned_by?: string | null;
          ban_reason?: string | null;
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
          deleted_at: string | null;
          deleted_by: string | null;
          delete_reason: string | null;
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
          deleted_at?: string | null;
          deleted_by?: string | null;
          delete_reason?: string | null;
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
          deleted_at?: string | null;
          deleted_by?: string | null;
          delete_reason?: string | null;
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
      admin_actions: {
        Row: {
          id: string;
          admin_id: string | null;
          action_type: string;
          target_user_id: string | null;
          target_link_id: string | null;
          reason: string | null;
          metadata: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          admin_id?: string | null;
          action_type: string;
          target_user_id?: string | null;
          target_link_id?: string | null;
          reason?: string | null;
          metadata?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          admin_id?: string | null;
          action_type?: string;
          target_user_id?: string | null;
          target_link_id?: string | null;
          reason?: string | null;
          metadata?: Json | null;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      is_user_admin: {
        Args: { user_id: string };
        Returns: boolean;
      };
      ban_user: {
        Args: { target_user_id: string; reason?: string | null };
        Returns: void;
      };
      unban_user: {
        Args: { target_user_id: string };
        Returns: void;
      };
      admin_delete_referral_link: {
        Args: { link_id: string; reason?: string | null };
        Returns: void;
      };
      is_username_available: {
        Args: { check_username: string; exclude_user_id?: string | null };
        Returns: boolean;
      };
    };
    Enums: {
      link_status: 'active' | 'paused' | 'fulfilled';
      exchange_status: 'pending' | 'accepted' | 'completed' | 'cancelled';
    };
  };
}

