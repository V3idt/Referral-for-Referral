/**
 * Supabase API Helper Functions
 * Wraps Supabase operations for easy use throughout the app
 */

import { supabase } from './client';
import type { Database } from './database.types';

type Tables = Database['public']['Tables'];
type ReferralLink = Tables['referral_links']['Row'];
type Exchange = Tables['exchanges']['Row'];
type Message = Tables['messages']['Row'];
type Rating = Tables['ratings']['Row'];
type User = Tables['users']['Row'];

// ============================================
// AUTH OPERATIONS
// ============================================

export const auth = {
  /**
   * Get current user
   */
  async me() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) throw new Error('Not authenticated');

    // Get user profile
    const { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    return profile || {
      id: user.id,
      email: user.email!,
      full_name: null,
      reputation_score: 100,
      total_ratings: 0,
      last_active: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  },

  /**
   * Update current user profile
   */
  async updateMe(data: Partial<User>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: updated, error } = await supabase
      .from('users')
      .update(data)
      .eq('id', user.id)
      .select()
      .single();

    if (error) throw error;
    return updated;
  },

  /**
   * Sign in with email/password
   */
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  },

  /**
   * Sign up with email/password
   */
  async signUp(email: string, password: string, fullName?: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });
    if (error) throw error;

    // Create user profile
    if (data.user) {
      await supabase.from('users').insert({
        id: data.user.id,
        email: data.user.email!,
        full_name: fullName || null,
      });
    }

    return data;
  },

  /**
   * Sign out
   */
  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  /**
   * Redirect to login (for compatibility)
   */
  redirectToLogin() {
    if (typeof window !== 'undefined') {
      window.location.href = '/auth/login';
    }
  },
};

// ============================================
// REFERRAL LINKS
// ============================================

export const referralLinks = {
  /**
   * Get all active referral links
   */
  async list() {
    const { data, error } = await supabase
      .from('referral_links')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Filter referral links
   */
  async filter(filter: Partial<ReferralLink>, orderBy?: string) {
    let query = supabase.from('referral_links').select('*');

    // Apply filters
    Object.entries(filter).forEach(([key, value]) => {
      query = query.eq(key as any, value);
    });

    // Apply ordering
    if (orderBy) {
      const descending = orderBy.startsWith('-');
      const column = descending ? orderBy.slice(1) : orderBy;
      query = query.order(column, { ascending: !descending });
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  /**
   * Create a new referral link
   */
  async create(linkData: Omit<Tables['referral_links']['Insert'], 'id' | 'user_id'>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('referral_links')
      .insert({
        ...linkData,
        user_id: user.id,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Update a referral link
   */
  async update(id: string, updates: Partial<ReferralLink>) {
    const { data, error } = await supabase
      .from('referral_links')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Delete a referral link
   */
  async delete(id: string) {
    const { error } = await supabase
      .from('referral_links')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};

// ============================================
// EXCHANGES
// ============================================

export const exchanges = {
  async list() {
    const { data, error } = await supabase
      .from('exchanges')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async filter(filter: Partial<Exchange>, orderBy?: string) {
    let query = supabase.from('exchanges').select('*');

    Object.entries(filter).forEach(([key, value]) => {
      query = query.eq(key as any, value);
    });

    if (orderBy) {
      const descending = orderBy.startsWith('-');
      const column = descending ? orderBy.slice(1) : orderBy;
      query = query.order(column, { ascending: !descending });
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async create(exchangeData: Omit<Tables['exchanges']['Insert'], 'id'>) {
    const { data, error } = await supabase
      .from('exchanges')
      .insert(exchangeData)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Partial<Exchange>) {
    const { data, error } = await supabase
      .from('exchanges')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('exchanges')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};

// ============================================
// MESSAGES
// ============================================

export const messages = {
  async list() {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async filter(filter: Partial<Message>, orderBy?: string) {
    let query = supabase.from('messages').select('*');

    Object.entries(filter).forEach(([key, value]) => {
      query = query.eq(key as any, value);
    });

    if (orderBy) {
      const descending = orderBy.startsWith('-');
      const column = descending ? orderBy.slice(1) : orderBy;
      query = query.order(column, { ascending: !descending });
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async create(messageData: Omit<Tables['messages']['Insert'], 'id'>) {
    const { data, error } = await supabase
      .from('messages')
      .insert(messageData)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Partial<Message>) {
    const { data, error } = await supabase
      .from('messages')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  /**
   * Subscribe to new messages for real-time updates
   */
  subscribe(userId: string, callback: (message: Message) => void) {
    return supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${userId}`,
        },
        (payload) => {
          callback(payload.new as Message);
        }
      )
      .subscribe();
  },
};

// ============================================
// RATINGS
// ============================================

export const ratings = {
  async list() {
    const { data, error } = await supabase
      .from('ratings')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async filter(filter: Partial<Rating>) {
    let query = supabase.from('ratings').select('*');

    Object.entries(filter).forEach(([key, value]) => {
      query = query.eq(key as any, value);
    });

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async create(ratingData: Omit<Tables['ratings']['Insert'], 'id'>) {
    const { data, error } = await supabase
      .from('ratings')
      .insert(ratingData)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Partial<Rating>) {
    const { data, error } = await supabase
      .from('ratings')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('ratings')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};

// ============================================
// USERS
// ============================================

export const users = {
  async list() {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async filter(filter: Partial<User>) {
    let query = supabase.from('users').select('*');

    Object.entries(filter).forEach(([key, value]) => {
      query = query.eq(key as any, value);
    });

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async update(id: string, updates: Partial<User>) {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};

// ============================================
// FILE STORAGE
// ============================================

export const storage = {
  /**
   * Upload a proof image
   */
  async uploadProofImage(file: File, userId: string) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from('proof-images')
      .upload(fileName, file);

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('proof-images')
      .getPublicUrl(fileName);

    return { file_url: publicUrl };
  },

  /**
   * Delete a proof image
   */
  async deleteProofImage(url: string) {
    const fileName = url.split('/').slice(-2).join('/');

    const { error } = await supabase.storage
      .from('proof-images')
      .remove([fileName]);

    if (error) throw error;
  },
};

// Export combined API object for compatibility
export const api = {
  auth,
  storage,
  entities: {
    ReferralLink: referralLinks,
    Exchange: exchanges,
    Message: messages,
    Rating: ratings,
    User: users,
  },
  integrations: {
    Core: {
      UploadFile: async ({ file }: { file: File }) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');
        return storage.uploadProofImage(file, user.id);
      },
    },
  },
};

