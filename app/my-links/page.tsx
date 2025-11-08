"use client";

import React, { useState, useEffect } from "react";
import { base44 } from "@/lib/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

import ReferralCard from "@/components/referrals/ReferralCard";
import AddLinkDialog from "@/components/referrals/AddLinkDialog";

export default function MyLinks() {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [user, setUser] = useState<any>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch {
        base44.auth.redirectToLogin();
      }
    };
    loadUser();
  }, []);

  const { data: myLinks = [], isLoading } = useQuery({
    queryKey: ['myReferralLinks', user?.email],
    queryFn: () => user ? base44.entities.ReferralLink.filter({ created_by: user.email }, '-created_date') : [],
    enabled: !!user,
  });

  const createLinkMutation = useMutation({
    mutationFn: (linkData: any) => base44.entities.ReferralLink.create(linkData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myReferralLinks'] });
      queryClient.invalidateQueries({ queryKey: ['referralLinks'] });
      toast.success("Referral link added successfully!");
      setShowAddDialog(false);
    },
    onError: () => {
      toast.error("Failed to add referral link");
    },
  });

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">My Referral Links</h1>
              <p className="text-gray-600 dark:text-gray-400">Manage your referral links and track exchanges</p>
            </div>
            <Button
              onClick={() => setShowAddDialog(true)}
              className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add New Link
            </Button>
          </div>

          {myLinks.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border-2 border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Links</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{myLinks.length}</p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border-2 border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Active Links</p>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {myLinks.filter((l: any) => l.status === 'active').length}
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border-2 border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Exchanges</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {myLinks.reduce((sum: number, link: any) => sum + (link.total_exchanges || 0), 0)}
                </p>
              </div>
            </div>
          )}
        </motion.div>

        {/* Links Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-64 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-xl" />
            ))}
          </div>
        ) : myLinks.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-700"
          >
            <div className="w-20 h-20 bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No referral links yet</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
              Add your first referral link to start exchanging with the community
            </p>
            <Button
              onClick={() => setShowAddDialog(true)}
              className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Link
            </Button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myLinks.map((link: any) => (
              <ReferralCard
                key={link.id}
                link={link}
                showActions={false}
                ownerEmail="You"
              />
            ))}
          </div>
        )}
      </div>

      <AddLinkDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onSubmit={(data) => createLinkMutation.mutate(data)}
        isSubmitting={createLinkMutation.isPending}
      />
    </div>
  );
}
