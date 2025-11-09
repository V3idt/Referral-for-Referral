'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Ban, Trash2, UserX, CheckCircle, Search, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

export default function AdminPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const [referralLinks, setReferralLinks] = useState<any[]>([]);
  const [adminActions, setAdminActions] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [selectedLink, setSelectedLink] = useState<any>(null);
  const [banReason, setBanReason] = useState('');
  const [deleteReason, setDeleteReason] = useState('');
  const [showBanDialog, setShowBanDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please sign in');
        return;
      }

      const res = await supabase
        .from('users')
        .select('is_admin')
        .eq('id', user.id)
        .single();
      const data = res.data as { is_admin: boolean } | null;
      const error = res.error;

      if (error) throw error;

      if (data && data.is_admin) {
        setIsAdmin(true);
        loadAdminData();
      } else {
        toast.error('Access denied: Admin privileges required');
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
      toast.error('Failed to verify admin status');
    } finally {
      setLoading(false);
    }
  };

  const loadAdminData = async () => {
    try {
      // Load all users
      const { data: usersData } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      // Load all referral links (including deleted)
      const { data: linksData } = await supabase
        .from('referral_links')
        .select('*, users!referral_links_user_id_fkey(email, full_name)')
        .order('created_at', { ascending: false });

      // Load admin actions
      const { data: actionsData } = await supabase
        .from('admin_actions')
        .select('*, admin:users!admin_actions_admin_id_fkey(email, full_name)')
        .order('created_at', { ascending: false })
        .limit(50);

      setUsers(usersData || []);
      setReferralLinks(linksData || []);
      setAdminActions(actionsData || []);
    } catch (error) {
      console.error('Error loading admin data:', error);
      toast.error('Failed to load admin data');
    }
  };

  const handleBanUser = async () => {
    if (!selectedUser) return;

    try {
      const { error } = await supabase.rpc('ban_user', {
        target_user_id: selectedUser.id,
        reason: banReason || null,
      } as any);

      if (error) throw error;

      toast.success(`User ${selectedUser.email} has been banned`);
      setShowBanDialog(false);
      setBanReason('');
      setSelectedUser(null);
      loadAdminData();
    } catch (error: any) {
      console.error('Error banning user:', error);
      toast.error(error.message || 'Failed to ban user');
    }
  };

  const handleUnbanUser = async (user: any) => {
    try {
      const { error } = await supabase.rpc('unban_user', {
        target_user_id: user.id,
      } as any);

      if (error) throw error;

      toast.success(`User ${user.email} has been unbanned`);
      loadAdminData();
    } catch (error: any) {
      console.error('Error unbanning user:', error);
      toast.error(error.message || 'Failed to unban user');
    }
  };

  const handleDeleteLink = async () => {
    if (!selectedLink) return;

    try {
      const { error } = await supabase.rpc('admin_delete_referral_link', {
        link_id: selectedLink.id,
        reason: deleteReason || null,
      } as any);

      if (error) throw error;

      toast.success('Referral link has been deleted');
      setShowDeleteDialog(false);
      setDeleteReason('');
      setSelectedLink(null);
      loadAdminData();
    } catch (error: any) {
      console.error('Error deleting link:', error);
      toast.error(error.message || 'Failed to delete link');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Shield className="w-12 h-12 animate-pulse text-emerald-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <CardTitle className="text-center">Access Denied</CardTitle>
            <CardDescription className="text-center">
              You don&apos;t have permission to access the admin panel
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const filteredUsers = users.filter(user =>
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredLinks = referralLinks.filter(link =>
    link.service_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    link.users?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-8 h-8 text-emerald-500" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Panel</h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">Manage users, content, and platform activity</p>
        </div>

        <Tabs defaultValue="users" className="space-y-6">
          <TabsList>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="links">Referral Links</TabsTrigger>
            <TabsTrigger value="activity">Activity Log</TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search users by email or name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="grid gap-4">
              {filteredUsers.map((user) => (
                <Card key={user.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {user.full_name || 'Unnamed User'}
                          </h3>
                          {user.is_admin && (
                            <Badge className="bg-purple-500">Admin</Badge>
                          )}
                          {user.is_banned && (
                            <Badge variant="destructive">Banned</Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{user.email}</p>
                        <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                          <span>Reputation: {user.reputation_score || 100}</span>
                          <span>Ratings: {user.total_ratings || 0}</span>
                          <span>Joined: {new Date(user.created_at).toLocaleDateString()}</span>
                        </div>
                        {user.is_banned && user.ban_reason && (
                          <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                            Reason: {user.ban_reason}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {user.is_banned ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUnbanUser(user)}
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Unban
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              setSelectedUser(user);
                              setShowBanDialog(true);
                            }}
                          >
                            <Ban className="w-4 h-4 mr-2" />
                            Ban
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Referral Links Tab */}
          <TabsContent value="links" className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search referral links..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="grid gap-4">
              {filteredLinks.map((link) => (
                <Card key={link.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {link.service_name}
                          </h3>
                          <Badge variant={link.deleted_at ? 'destructive' : 'default'}>
                            {link.deleted_at ? 'Deleted' : link.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          by {link.users?.email || 'Unknown'}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">{link.description}</p>
                        {link.deleted_at && link.delete_reason && (
                          <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                            Deleted: {link.delete_reason}
                          </p>
                        )}
                      </div>
                      {!link.deleted_at && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            setSelectedLink(link);
                            setShowDeleteDialog(true);
                          }}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Activity Log Tab */}
          <TabsContent value="activity" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Admin Actions</CardTitle>
                <CardDescription>Last 50 administrative actions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {adminActions.map((action) => (
                    <div
                      key={action.id}
                      className="flex items-start justify-between border-b pb-4 last:border-0"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge>{action.action_type}</Badge>
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            by {action.admin?.email || 'Unknown'}
                          </span>
                        </div>
                        {action.reason && (
                          <p className="text-sm text-gray-500 mt-1">Reason: {action.reason}</p>
                        )}
                      </div>
                      <span className="text-xs text-gray-400">
                        {new Date(action.created_at).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Ban User Dialog */}
        <Dialog open={showBanDialog} onOpenChange={setShowBanDialog}>
          <DialogContent className="sm:max-w-[500px] bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <DialogHeader>
              <DialogTitle className="text-gray-900 dark:text-white">Ban User</DialogTitle>
              <DialogDescription className="text-gray-600 dark:text-gray-400">
                Ban {selectedUser?.email} from the platform
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="banReason" className="text-gray-900 dark:text-gray-200">Reason (optional)</Label>
                <Textarea
                  id="banReason"
                  placeholder="Violation of terms of service..."
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  rows={3}
                  className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowBanDialog(false)} className="border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700">
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleBanUser}>
                <UserX className="w-4 h-4 mr-2" />
                Ban User
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Link Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent className="sm:max-w-[500px] bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <DialogHeader>
              <DialogTitle className="text-gray-900 dark:text-white">Delete Referral Link</DialogTitle>
              <DialogDescription className="text-gray-600 dark:text-gray-400">
                Delete &quot;{selectedLink?.service_name}&quot;
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="deleteReason" className="text-gray-900 dark:text-gray-200">Reason (optional)</Label>
                <Textarea
                  id="deleteReason"
                  placeholder="Spam, inappropriate content, etc..."
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  rows={3}
                  className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDeleteDialog(false)} className="border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700">
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDeleteLink}>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Link
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}


