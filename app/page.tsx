"use client";

import React, { useState, useEffect } from "react";
import { base44 } from "@/lib/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Search, Sparkles, TrendingUp, Star, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { createPageUrl } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import ReferralCard from "@/components/referrals/ReferralCard";
import ExchangeDialog from "@/components/referrals/ExchangeDialog";

export default function Home() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [minTrustScore, setMinTrustScore] = useState("0");
  const [selectedLink, setSelectedLink] = useState(null);
  const [showExchangeDialog, setShowExchangeDialog] = useState(false);
  const [user, setUser] = useState<any>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: allLinks = [], isLoading } = useQuery({
    queryKey: ['referralLinks'],
    queryFn: () => base44.entities.ReferralLink.filter({ status: 'active' }, '-created_date'),
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => base44.entities.User.list(),
  });

  const usersMap = React.useMemo(() => {
    const map: any = {};
    allUsers.forEach((u: any) => {
      map[u.email] = u;
    });
    return map;
  }, [allUsers]);

  const createExchangeMutation = useMutation({
    mutationFn: async ({ providerLink, requesterLink, notes }: any) => {
      if (!user) {
        throw new Error("Please sign in to request exchanges");
      }

      return await base44.entities.Exchange.create({
        requester_link_id: requesterLink.id,
        provider_link_id: providerLink.id,
        requester_email: user.email,
        provider_email: providerLink.created_by,
        status: 'pending',
        notes: notes || '',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exchanges'] });
      toast.success("Exchange request sent! Check your messages.");
      setShowExchangeDialog(false);
      setSelectedLink(null);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to send exchange request");
    },
  });

  const filterByDate = (link: any) => {
    if (dateFilter === "all") return true;
    const linkDate = new Date(link.created_date);
    const now = new Date();
    const daysDiff = (now.getTime() - linkDate.getTime()) / (1000 * 60 * 60 * 24);
    
    if (dateFilter === "today") return daysDiff < 1;
    if (dateFilter === "week") return daysDiff < 7;
    if (dateFilter === "month") return daysDiff < 30;
    return true;
  };

  const isUserOnline = (userEmail: string) => {
    const userData = usersMap[userEmail];
    if (!userData?.last_active) return false;
    const lastActive = new Date(userData.last_active);
    const now = new Date();
    return (now.getTime() - lastActive.getTime()) < 5 * 60 * 1000;
  };

  const filteredLinks = allLinks.filter((link: any) => {
    const matchesSearch = link.service_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         link.description.toLowerCase().includes(searchQuery.toLowerCase());
    const notMine = !user || link.created_by !== user.email;
    const matchesDate = filterByDate(link);
    
    const ownerUser = usersMap[link.created_by];
    const reputation = ownerUser?.reputation_score || 100;
    const matchesTrust = reputation >= parseInt(minTrustScore);
    
    return matchesSearch && notMine && matchesDate && matchesTrust;
  }).sort((a: any, b: any) => {
    const aOnline = isUserOnline(a.created_by);
    const bOnline = isUserOnline(b.created_by);
    if (aOnline && !bOnline) return -1;
    if (!aOnline && bOnline) return 1;
    
    const aReputation = usersMap[a.created_by]?.reputation_score || 100;
    const bReputation = usersMap[b.created_by]?.reputation_score || 100;
    if (aReputation !== bReputation) return bReputation - aReputation;
    
    return new Date(b.created_date).getTime() - new Date(a.created_date).getTime();
  });

  const handleRequestExchange = (link: any) => {
    if (!user) {
      base44.auth.redirectToLogin();
      return;
    }
    setSelectedLink(link);
    setShowExchangeDialog(true);
  };

  const handleStartChat = async (link: any) => {
    if (!user) {
      base44.auth.redirectToLogin();
      return;
    }
    router.push(createPageUrl("Messages") + `?with=${link.created_by}`);
  };

  const onlineCount = Object.values(usersMap).filter((u: any) => isUserOnline(u.email)).length;

  return (
    <div className="min-h-screen">
      {/* Hero Section with Grid */}
      <div className="relative overflow-hidden bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 dark:from-emerald-800 dark:via-teal-800 dark:to-cyan-900 text-white">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:4rem_4rem]" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <Badge className="bg-white/20 text-white border-white/30 mb-4 backdrop-blur-sm">
              <Sparkles className="w-3 h-3 mr-1" />
              {onlineCount} Users Online Now
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Referral-for-Referral
              <br />
              <span className="text-emerald-200 dark:text-emerald-300">Fair & Trusted Exchange</span>
            </h1>
            <p className="text-xl md:text-2xl text-emerald-100 dark:text-emerald-200 mb-8 max-w-2xl mx-auto">
              Exchange referral links with verified users. Chat, share proof, build trust.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <div className="flex items-center gap-2 text-emerald-100 dark:text-emerald-200">
                <TrendingUp className="w-5 h-5" />
                <span className="font-medium">{allLinks.length} active referrals</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filter */}
        <div className="mb-8 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Search services..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 bg-white dark:bg-gray-800 border-2 focus:border-emerald-400 dark:border-gray-700 dark:text-white"
            />
          </div>

          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-40 dark:bg-gray-800 dark:border-gray-700 dark:text-white">
                  <SelectValue placeholder="Date posted" />
                </SelectTrigger>
                <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                  <SelectItem value="all">All time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This week</SelectItem>
                  <SelectItem value="month">This month</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-gray-500 dark:text-gray-400 fill-current" />
              <Select value={minTrustScore} onValueChange={setMinTrustScore}>
                <SelectTrigger className="w-40 dark:bg-gray-800 dark:border-gray-700 dark:text-white">
                  <SelectValue placeholder="Trust score" />
                </SelectTrigger>
                <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                  <SelectItem value="0">Any score</SelectItem>
                  <SelectItem value="50">50+ stars</SelectItem>
                  <SelectItem value="75">75+ stars</SelectItem>
                  <SelectItem value="90">90+ stars</SelectItem>
                  <SelectItem value="100">100 stars</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Links Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-xl" />
            ))}
          </div>
        ) : filteredLinks.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No links found</h3>
            <p className="text-gray-500 dark:text-gray-400">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredLinks.map((link: any) => (
              <ReferralCard
                key={link.id}
                link={link}
                onRequestExchange={handleRequestExchange}
                onStartChat={handleStartChat}
                ownerEmail={link.created_by}
                ownerReputation={usersMap[link.created_by]?.reputation_score}
                ownerRatingsCount={usersMap[link.created_by]?.total_ratings}
                isOnline={isUserOnline(link.created_by)}
              />
            ))}
          </div>
        )}
      </div>

      <ExchangeDialog
        open={showExchangeDialog}
        onOpenChange={setShowExchangeDialog}
        providerLink={selectedLink}
        onSubmit={(data) => createExchangeMutation.mutate(data)}
        isSubmitting={createExchangeMutation.isPending}
      />
    </div>
  );
}
