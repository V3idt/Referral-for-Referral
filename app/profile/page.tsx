'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Loader2, User, CheckCircle, XCircle, Save } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { getAvatarColor } from '@/lib/utils';

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [originalUsername, setOriginalUsername] = useState('');
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  useEffect(() => {
    // Check username availability when it changes
    if (username && username !== originalUsername) {
      const timer = setTimeout(() => {
        checkUsernameAvailability();
      }, 500); // Debounce

      return () => clearTimeout(timer);
    } else if (username === originalUsername) {
      setUsernameAvailable(null); // Same as original, no need to check
    }
  }, [username, originalUsername]);

  const loadProfile = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        router.push('/auth/login');
        return;
      }

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (error) throw error;

      setUser(data);
      setFullName(data.full_name || '');
      setUsername(data.username || '');
      setOriginalUsername(data.username || '');
    } catch (error) {
      console.error('Error loading profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const checkUsernameAvailability = async () => {
    if (!username || username.length < 3) {
      setUsernameAvailable(null);
      return;
    }

    setCheckingUsername(true);
    try {
      const { data, error } = await supabase.rpc('is_username_available', {
        check_username: username,
        exclude_user_id: user.id,
      });

      if (error) throw error;
      setUsernameAvailable(data);
    } catch (error) {
      console.error('Error checking username:', error);
    } finally {
      setCheckingUsername(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    // Validate username
    if (username.length < 3) {
      toast.error('Username must be at least 3 characters');
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      toast.error('Username can only contain letters, numbers, and underscores');
      return;
    }

    if (username !== originalUsername && usernameAvailable === false) {
      toast.error('Username is already taken');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({
          full_name: fullName,
          username: username.toLowerCase(),
        })
        .eq('id', user.id);

      if (error) throw error;

      setOriginalUsername(username);
      toast.success('Profile updated successfully!');
      
      // Reload to update sidebar
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error: any) {
      console.error('Error updating profile:', error);
      if (error.message?.includes('duplicate key') || error.message?.includes('unique')) {
        toast.error('Username is already taken');
      } else {
        toast.error('Failed to update profile');
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Edit Profile</h1>
          <p className="text-gray-600 dark:text-gray-400">Update your profile information</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <Avatar className="w-20 h-20">
                <AvatarFallback className={`bg-gradient-to-br ${getAvatarColor(fullName || username || user?.email || 'User')} text-white text-2xl`}>
                  {(fullName || user?.email)?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-gray-900 dark:text-white">
                  {user?.email}
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  @{user?.username || 'username'}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-gray-900 dark:text-gray-200">
                Display Name
              </Label>
              <Input
                id="fullName"
                type="text"
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                This is how your name will be displayed across the platform
              </p>
            </div>

            {/* Username */}
            <div className="space-y-2">
              <Label htmlFor="username" className="text-gray-900 dark:text-gray-200">
                Username
              </Label>
              <div className="relative">
                <Input
                  id="username"
                  type="text"
                  placeholder="johndoe"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white pr-10"
                />
                {checkingUsername && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                  </div>
                )}
                {!checkingUsername && username !== originalUsername && usernameAvailable === true && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  </div>
                )}
                {!checkingUsername && username !== originalUsername && usernameAvailable === false && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <XCircle className="w-4 h-4 text-red-500" />
                  </div>
                )}
              </div>
              {username !== originalUsername && usernameAvailable === false && (
                <p className="text-xs text-red-500 dark:text-red-400">
                  Username is already taken
                </p>
              )}
              {username !== originalUsername && usernameAvailable === true && (
                <p className="text-xs text-green-500 dark:text-green-400">
                  Username is available!
                </p>
              )}
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Lowercase letters, numbers, and underscores only. Minimum 3 characters.
              </p>
            </div>

            {/* Stats */}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Account Stats</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Reputation Score</p>
                  <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                    {user?.reputation_score || 100}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Total Ratings</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {user?.total_ratings || 0}
                  </p>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="pt-4">
              <Button
                onClick={handleSave}
                disabled={saving || checkingUsername || (username !== originalUsername && !usernameAvailable)}
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

