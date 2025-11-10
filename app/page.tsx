"use client";

import React, { useState, useEffect } from "react";
import { base44 } from "@/lib/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Search, Sparkles, TrendingUp, Star, Calendar, Activity } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { toast } from "sonner";
import type { Exchange } from "@/types";
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
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [minTrustScore, setMinTrustScore] = useState("0");
  const [onlineFilter, setOnlineFilter] = useState("online");
  const [selectedLink, setSelectedLink] = useState(null);
  const [showExchangeDialog, setShowExchangeDialog] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [animatedNumber, setAnimatedNumber] = useState<number | string>(5);
  const queryClient = useQueryClient();

  // Animate referral numbers: 5 → 10 → 15 → 30 → "More" (then stop)
  useEffect(() => {
    const values = [5, 10, 15, 30, "More"];
    let index = 0;
    
    const interval = setInterval(() => {
      index++;
      if (index >= values.length) {
        clearInterval(interval); // Stop when reaching "More"
        return;
      }
      setAnimatedNumber(values[index]);
    }, 1000); // 1 second interval (faster)
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: allLinks = [], isLoading } = useQuery({
    queryKey: ['referralLinks'],
    queryFn: () => base44.entities.ReferralLink.filter({ status: 'active' }, '-created_at'),
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => base44.entities.User.list(),
  });

  const usersMap = React.useMemo(() => {
    const map: any = {};
    allUsers.forEach((u: any) => {
      map[u.id] = u;
      map[u.email] = u; // Keep email mapping for compatibility
    });
    return map;
  }, [allUsers]);

  const createExchangeMutation = useMutation({
    mutationFn: async ({ providerLink, requesterLink, notes }: any) => {
      if (!user) {
        throw new Error("Please sign in to request exchanges");
      }

      // Create the exchange
      const exchange: Exchange = await base44.entities.Exchange.create({
        requester_link_id: requesterLink.id,
        provider_link_id: providerLink.id,
        requester_user_id: user.id,
        provider_user_id: providerLink.user_id,
        status: 'pending',
        notes: notes || '',
      });

      // ═══════════════════════════════════════════════════════════════════
      // 📝 SWAP REQUEST MESSAGE - EDIT THIS TO CUSTOMIZE THE MESSAGE
      // ═══════════════════════════════════════════════════════════════════
      // This is the message sent when someone requests a referral link exchange.
      // You can customize the text, emojis, formatting, and structure here.
      
      const requesterName = user.full_name || user.username || user.email;
      const messageContent = `New Exchange Request\n\n${requesterName} wants to swap referral links with you!\n\nExchange Details:\n• Their link: ${requesterLink.service_name}\n• Your link: ${providerLink.service_name}${notes ? `\n• Message: "${notes}"` : ''}\n\n🔗 Links:\n• Their referral: ${requesterLink.referral_url}\n• Your referral: ${providerLink.referral_url}\n\nUse the buttons below to accept or decline this request.`;
      
      // ═══════════════════════════════════════════════════════════════════

      await base44.entities.Message.create({
        sender_id: user.id,
        receiver_id: providerLink.user_id,
        content: messageContent,
        is_read: false,
        metadata: {
          type: 'exchange_request',
          exchange_id: exchange.id,
          requester_link_id: requesterLink.id,
          provider_link_id: providerLink.id,
          requester_link_name: requesterLink.service_name,
          provider_link_name: providerLink.service_name,
          requester_link_url: requesterLink.referral_url,
          provider_link_url: providerLink.referral_url,
          exchange_status: 'pending',
          actions: [
            {
              type: 'accept',
              label: 'Accept Exchange',
              variant: 'default'
            },
            {
              type: 'decline',
              label: 'Decline',
              variant: 'destructive'
            }
          ]
        }
      });

      return exchange;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exchanges'] });
      queryClient.invalidateQueries({ queryKey: ['messages'] });
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
    if (!link.created_at) return true;
    
    const linkDate = new Date(link.created_at);
    const now = new Date();
    
    if (isNaN(linkDate.getTime())) return false;
    
    if (dateFilter === "today") {
      return (
        linkDate.getFullYear() === now.getFullYear() &&
        linkDate.getMonth() === now.getMonth() &&
        linkDate.getDate() === now.getDate()
      );
    }
    
    if (dateFilter === "week") {
      const daysDiff = (now.getTime() - linkDate.getTime()) / (1000 * 60 * 60 * 24);
      return daysDiff >= 0 && daysDiff < 7;
    }
    
    if (dateFilter === "month") {
    const daysDiff = (now.getTime() - linkDate.getTime()) / (1000 * 60 * 60 * 24);
      return daysDiff >= 0 && daysDiff < 30;
    }
    
    return true;
  };

  const getUserOnlineStatus = (userId: string) => {
    const userData = usersMap[userId];
    if (!userData?.last_active) return 'offline';
    const lastActive = new Date(userData.last_active);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - lastActive.getTime()) / (1000 * 60));
    
    if (diffMinutes <= 5) return 'online';
    if (diffMinutes <= 30) return 'recent';
    return 'offline';
  };

  const filteredLinks = allLinks.filter((link: any) => {
    const matchesSearch = link.service_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         link.description.toLowerCase().includes(searchQuery.toLowerCase());
    const notMine = !user || link.user_id !== user.id;
    const matchesDate = filterByDate(link);
    
    const ownerUser = usersMap[link.user_id];
    const reputation = ownerUser?.reputation_score || 100;
    const matchesTrust = reputation >= parseInt(minTrustScore);
    
    return matchesSearch && notMine && matchesDate && matchesTrust;
  }).sort((a: any, b: any) => {
    // Primary sort based on selected filter
    if (onlineFilter === 'online') {
    // Sort by online status first (online > recent > offline)
    const aStatus = getUserOnlineStatus(a.user_id);
    const bStatus = getUserOnlineStatus(b.user_id);
    const statusOrder = { online: 3, recent: 2, offline: 1 };
    if (statusOrder[aStatus as keyof typeof statusOrder] !== statusOrder[bStatus as keyof typeof statusOrder]) {
      return statusOrder[bStatus as keyof typeof statusOrder] - statusOrder[aStatus as keyof typeof statusOrder];
    }
    
    // Then sort by reputation
    const aReputation = usersMap[a.user_id]?.reputation_score || 100;
    const bReputation = usersMap[b.user_id]?.reputation_score || 100;
    if (aReputation !== bReputation) return bReputation - aReputation;
    
    // Finally sort by date
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    } else if (onlineFilter === 'trust') {
      // Sort by trust score first
      const aReputation = usersMap[a.user_id]?.reputation_score || 100;
      const bReputation = usersMap[b.user_id]?.reputation_score || 100;
      if (aReputation !== bReputation) return bReputation - aReputation;
      
      // Then by online status
      const aStatus = getUserOnlineStatus(a.user_id);
      const bStatus = getUserOnlineStatus(b.user_id);
      const statusOrder = { online: 3, recent: 2, offline: 1 };
      if (statusOrder[aStatus as keyof typeof statusOrder] !== statusOrder[bStatus as keyof typeof statusOrder]) {
        return statusOrder[bStatus as keyof typeof statusOrder] - statusOrder[aStatus as keyof typeof statusOrder];
      }
      
      // Finally by date
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    } else if (onlineFilter === 'recent') {
      // Sort by date first
      const dateCompare = new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (dateCompare !== 0) return dateCompare;
      
      // Then by online status
      const aStatus = getUserOnlineStatus(a.user_id);
      const bStatus = getUserOnlineStatus(b.user_id);
      const statusOrder = { online: 3, recent: 2, offline: 1 };
      if (statusOrder[aStatus as keyof typeof statusOrder] !== statusOrder[bStatus as keyof typeof statusOrder]) {
        return statusOrder[bStatus as keyof typeof statusOrder] - statusOrder[aStatus as keyof typeof statusOrder];
      }
      
      // Finally by reputation
      const aReputation = usersMap[a.user_id]?.reputation_score || 100;
      const bReputation = usersMap[b.user_id]?.reputation_score || 100;
      return bReputation - aReputation;
    }
    
    return 0;
  });

  const handleRequestExchange = (link: any) => {
    if (!user) {
      base44.auth.redirectToLogin();
      return;
    }
    setSelectedLink(link);
    setShowExchangeDialog(true);
  };

  const onlineCount = Object.values(usersMap).filter((u: any) => {
    const status = getUserOnlineStatus((u as any).id);
    return status === 'online';
  }).length;

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
              Get{" "}
              <span className="inline-block min-w-[120px] text-emerald-200 dark:text-emerald-300">
                {animatedNumber}
              </span>{" "}
              Referrals
            </h1>
            
            {/* How It Works Steps */}
            <div className="max-w-3xl mx-auto space-y-6 text-left">
              <h2 className="text-2xl font-semibold text-emerald-100 dark:text-emerald-200 mb-6 text-center">
                How It Works:
              </h2>
              
              <div className="grid gap-4 md:grid-cols-2">
                {/* Step 1 */}
                <div className="flex items-start gap-3 bg-white/10 backdrop-blur-sm rounded-lg p-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-emerald-200 dark:bg-emerald-300 rounded-full flex items-center justify-center text-emerald-900 font-bold">
                    1
                  </div>
                  <div>
                    <p className="text-white font-medium">Browse posts below</p>
                    <p className="text-emerald-100 dark:text-emerald-200 text-sm">Find an online user with a referral you want</p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex items-start gap-3 bg-white/10 backdrop-blur-sm rounded-lg p-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-emerald-200 dark:bg-emerald-300 rounded-full flex items-center justify-center text-emerald-900 font-bold">
                    2
                  </div>
                  <div>
                    <p className="text-white font-medium">Click "Request Swap"</p>
                    <p className="text-emerald-100 dark:text-emerald-200 text-sm">Send them a swap request on their post</p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex items-start gap-3 bg-white/10 backdrop-blur-sm rounded-lg p-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-emerald-200 dark:bg-emerald-300 rounded-full flex items-center justify-center text-emerald-900 font-bold">
                    3
                  </div>
                  <div>
                    <p className="text-white font-medium">Exchange referral links</p>
                    <p className="text-emerald-100 dark:text-emerald-200 text-sm">You use theirs, they use yours</p>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="flex items-start gap-3 bg-white/10 backdrop-blur-sm rounded-lg p-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-emerald-200 dark:bg-emerald-300 rounded-full flex items-center justify-center text-emerald-900 font-bold">
                    4
                  </div>
                  <div>
                    <p className="text-white font-medium">Both get rewards!</p>
                    <p className="text-emerald-100 dark:text-emerald-200 text-sm">Win-win situation for everyone</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-center gap-2 text-emerald-100 dark:text-emerald-200 pt-4">
                <TrendingUp className="w-5 h-5" />
                <span className="font-medium">{allLinks.length} active referrals waiting</span>
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
                  <SelectItem value="all" className="dark:text-white">All time</SelectItem>
                  <SelectItem value="today" className="dark:text-white">Today</SelectItem>
                  <SelectItem value="week" className="dark:text-white">This week</SelectItem>
                  <SelectItem value="month" className="dark:text-white">This month</SelectItem>
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
                  <SelectItem value="0" className="dark:text-white">Any score</SelectItem>
                  <SelectItem value="50" className="dark:text-white">50+ stars</SelectItem>
                  <SelectItem value="75" className="dark:text-white">75+ stars</SelectItem>
                  <SelectItem value="90" className="dark:text-white">90+ stars</SelectItem>
                  <SelectItem value="100" className="dark:text-white">100 stars</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              <Select value={onlineFilter} onValueChange={setOnlineFilter}>
                <SelectTrigger className="w-40 dark:bg-gray-800 dark:border-gray-700 dark:text-white">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                  <SelectItem value="online" className="dark:text-white">Online first</SelectItem>
                  <SelectItem value="trust" className="dark:text-white">Trust score</SelectItem>
                  <SelectItem value="recent" className="dark:text-white">Most recent</SelectItem>
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
            {filteredLinks.map((link: any) => {
              const owner = usersMap[link.user_id];
              return (
              <ReferralCard
                key={link.id}
                link={link}
                onRequestExchange={handleRequestExchange}
                ownerEmail={owner?.email}
                ownerName={owner?.full_name}
                ownerUsername={owner?.username}
                ownerReputation={owner?.reputation_score}
                ownerRatingsCount={owner?.total_ratings}
                lastActive={owner?.last_active}
              />
              );
            })}
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
