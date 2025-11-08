"use client";

import React, { useState, useEffect, Suspense } from "react";
import { base44 } from "@/lib/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
// Card components not needed - removed unused import
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Send, 
  Loader2, 
  ImageIcon,
  Star,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  AlertCircle
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { format } from "date-fns";
import { supabase } from "@/lib/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useSearchParams } from "next/navigation";
import type { User, Message as MessageType, Rating } from "@/types";
import { getAvatarColor } from "@/lib/utils";

function MessagesContent() {
  const searchParams = useSearchParams();
  const [user, setUser] = useState<User | null>(null);
  const [selectedUserEmail, setSelectedUserEmail] = useState<string | null>(null);
  const [messageText, setMessageText] = useState("");
  const [uploadingProof, setUploadingProof] = useState(false);
  const [showRatingDialog, setShowRatingDialog] = useState(false);
  const [ratingData, setRatingData] = useState<{ completed: boolean | null; notes: string }>({ completed: null, notes: "" });
  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        
        const withParam = searchParams.get('with');
        if (withParam) {
          setSelectedUserEmail(withParam);
        }
      } catch {
        base44.auth.redirectToLogin();
      }
    };
    loadUser();
  }, [searchParams]);

  const { data: allMessages = [], isLoading } = useQuery<MessageType[]>({
    queryKey: ['messages', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const [sent, received] = await Promise.all([
        base44.entities.Message.filter({ sender_id: user.id }),
        base44.entities.Message.filter({ receiver_id: user.id }),
      ]);
      return [...sent, ...received].sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    },
    enabled: !!user?.id,
    refetchOnWindowFocus: false, // Disabled - using realtime instead
  });

  // Fetch all users for notification sender names (must be before useEffect that uses it)
  const { data: allUsers = [] } = useQuery<User[]>({
    queryKey: ['allUsers'],
    queryFn: () => base44.entities.User.list(),
  });

  // Request notification permission on mount
  useEffect(() => {
    const { requestNotificationPermission } = require('@/lib/notifications');
    requestNotificationPermission();
  }, []);

  // Set up Supabase Realtime subscription for instant message updates
  useEffect(() => {
    if (!user?.id) return;

    // Subscribe to messages where user is either sender OR receiver
    // Note: Database uses sender_id/receiver_id (UUIDs), not email
    const senderChannel = supabase
      .channel('messages-sent')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `sender_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('📨 Sent message update:', payload);
          queryClient.invalidateQueries({ queryKey: ['messages'] });
        }
      )
      .subscribe();

    const receiverChannel = supabase
      .channel('messages-received')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('📨 Received message update:', payload);
          
          // Only show notifications for NEW messages (INSERT events)
          if (payload.eventType === 'INSERT' && payload.new) {
            const newMessage = payload.new as MessageType;
            
            // Find the sender
            const sender = allUsers.find((u) => u.id === newMessage.sender_id);
            const senderName = sender?.full_name || sender?.username || sender?.email || 'Someone';
            const messagePreview = newMessage.content.substring(0, 50) + (newMessage.content.length > 50 ? '...' : '');
            
            // Play notification sound
            const { playNotificationSound } = require('@/lib/notifications');
            playNotificationSound();
            
            // Show in-app toast notification
            toast.success(`💬 ${senderName}`, {
              description: messagePreview,
              duration: 5000,
            });
            
            // Show browser notification if tab is not focused
            if (document.hidden) {
              const { showBrowserNotification } = require('@/lib/notifications');
              const notification = showBrowserNotification(`New message from ${senderName}`, {
                body: newMessage.content.substring(0, 100),
                tag: 'message-notification',
              });
              
              if (notification) {
                // Click notification to focus the window
                notification.onclick = () => {
                  window.focus();
                  notification.close();
                };
              }
            }
          }
          
          queryClient.invalidateQueries({ queryKey: ['messages'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(senderChannel);
      supabase.removeChannel(receiverChannel);
    };
  }, [user?.id, queryClient, allUsers]);

  const { data: myRatings = [] } = useQuery<Rating[]>({
    queryKey: ['myRatings', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      return await base44.entities.Rating.filter({ rater_user_id: user.id });
    },
    enabled: !!user?.id,
  });

  // Mark messages as read when viewing them
  useEffect(() => {
    if (!user?.id || !allMessages.length || !selectedUserEmail) return;
    
    // Find the other user by email
    const otherUser = allUsers.find((u) => u.email === selectedUserEmail);
    if (!otherUser) return;
    
    const unreadMessages = allMessages.filter(
      (m) => m.receiver_id === user.id && 
            m.sender_id === otherUser.id && 
            !m.is_read
    );
    
    // Only update if there are unread messages to avoid unnecessary updates
    if (unreadMessages.length > 0) {
      unreadMessages.forEach((msg) => {
        base44.entities.Message.update(msg.id, { is_read: true });
      });
    }
  }, [selectedUserEmail, user, allUsers, allMessages]); // Run when conversation or messages change

  const sendMessageMutation = useMutation({
    mutationFn: async ({ content, proof_url }: { content: string; proof_url?: string }) => {
      // Find receiver by email
      const receiver = allUsers.find((u) => u.email === selectedUserEmail);
      if (!receiver) throw new Error("Receiver not found");
      
      return await base44.entities.Message.create({
        sender_id: user!.id,
        receiver_id: receiver.id,
        content,
        proof_url: proof_url || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      setMessageText("");
    },
    onError: () => {
      toast.error("Failed to send message");
    },
  });

  const submitRatingMutation = useMutation({
    mutationFn: async ({ completed, notes }: { completed: boolean; notes: string }) => {
      // Find the user being rated by email
      const ratedUser = allUsers.find((u) => u.email === selectedUserEmail);
      if (!ratedUser) throw new Error("User not found");
      
      const rating = await base44.entities.Rating.create({
        rated_user_id: ratedUser.id,
        rater_user_id: user!.id,
        completed_their_part: completed,
        notes: notes || '',
      });

      // Update the rated user's reputation
      if (ratedUser) {
        const currentScore = ratedUser.reputation_score || 100;
        const totalRatings = ratedUser.total_ratings || 0;
        const scoreChange = completed ? 5 : -10;
        const newScore = Math.max(0, Math.min(100, currentScore + scoreChange));
        
        await base44.entities.User.update(ratedUser.id, {
          reputation_score: newScore,
          total_ratings: totalRatings + 1,
        });
      }

      return rating;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allUsers'] });
      queryClient.invalidateQueries({ queryKey: ['myRatings'] });
      toast.success("Rating submitted!");
      setShowRatingDialog(false);
      setRatingData({ completed: null, notes: "" });
    },
    onError: () => {
      toast.error("Failed to submit rating");
    },
  });

  // Group messages by conversation (other user's email)
  const conversations: Record<string, MessageType[]> = {};
  allMessages.forEach((msg) => {
    // Find the other user's ID
    const otherUserId = msg.sender_id === user?.id ? msg.receiver_id : msg.sender_id;
    // Look up their email
    const otherUser = allUsers.find((u) => u.id === otherUserId);
    if (!otherUser) return;
    
    const otherEmail = otherUser.email;
    if (!conversations[otherEmail]) {
      conversations[otherEmail] = [];
    }
    conversations[otherEmail].push(msg);
  });

  const conversationList = Object.keys(conversations).sort((a, b) => {
    const lastMsgA = conversations[a][0].created_at;
    const lastMsgB = conversations[b][0].created_at;
    return new Date(lastMsgB).getTime() - new Date(lastMsgA).getTime();
  });

  const currentConversation = selectedUserEmail ? (conversations[selectedUserEmail] || []).sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  ) : [];

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedUserEmail) return;
    sendMessageMutation.mutate({ content: messageText });
  };

  const handleUploadProof = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingProof(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await sendMessageMutation.mutateAsync({ 
        content: "📸 Shared proof of referral signup", 
        proof_url: file_url 
      });
      toast.success("Proof uploaded!");
    } catch {
      toast.error("Failed to upload proof");
    } finally {
      setUploadingProof(false);
    }
  };

  const handleRateUser = () => {
    setShowRatingDialog(true);
  };

  // Check if user has already rated the selected user
  const selectedUserObj = allUsers.find((u) => u.email === selectedUserEmail);
  const hasRatedUser = selectedUserObj ? myRatings.some((r) => r.rated_user_id === selectedUserObj.id) : false;
  const selectedUser = allUsers.find((u) => u.email === selectedUserEmail);

  if (!user || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-gray-50 dark:bg-gray-900">
      {/* Conversations List */}
      <div className="w-80 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-y-auto">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Messages
          </h2>
        </div>

        {conversationList.length === 0 ? (
          <div className="p-8 text-center">
            <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400 text-sm">No messages yet</p>
            <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
              Start chatting with someone from the browse page
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {conversationList.map((email: string) => {
              const conv = conversations[email];
              const lastMsg = conv[0];
              const otherUser = allUsers.find((u) => u.email === email);
              const unreadCount = conv.filter((m) => m.receiver_id === user.id && !m.is_read).length;

              return (
                <button
                  key={email}
                  onClick={() => setSelectedUserEmail(email)}
                  className={`w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                    selectedUserEmail === email ? 'bg-emerald-50 dark:bg-emerald-900/20' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="w-10 h-10 shrink-0">
                      <AvatarFallback className={`bg-gradient-to-br ${getAvatarColor(otherUser?.full_name || otherUser?.username || email)} text-white`}>
                        {email.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <p className="font-medium text-gray-900 dark:text-white text-sm truncate">
                          {otherUser?.full_name || email}
                        </p>
                        {unreadCount > 0 && (
                          <span className="bg-emerald-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                            {unreadCount}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {lastMsg.content.substring(0, 40)}...
                        </p>
                        {otherUser?.reputation_score && (
                          <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-xs shrink-0">
                            <Star className="w-3 h-3 fill-current" />
                            {otherUser.reputation_score}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedUserEmail ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarFallback className={`bg-gradient-to-br ${getAvatarColor(selectedUser?.full_name || selectedUser?.username || selectedUserEmail)} text-white`}>
                      {selectedUserEmail.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {selectedUser?.full_name || selectedUserEmail}
                    </p>
                    {selectedUser?.reputation_score && (
                      <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-sm">
                        <Star className="w-3 h-3 fill-current" />
                        {selectedUser.reputation_score} Trust Score
                        {(selectedUser.total_ratings || 0) < 3 && (
                          <span className="text-blue-600 dark:text-blue-400 ml-2">(New User)</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                {!hasRatedUser && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRateUser}
                    className="dark:border-gray-600"
                  >
                    Rate User
                  </Button>
                )}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900">
              {currentConversation.map((msg, idx: number) => {
                const isMe = msg.sender_id === user.id;
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-md ${isMe ? 'bg-emerald-500 text-white' : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white'} rounded-2xl px-4 py-3 shadow-sm`}>
                      <p className="text-sm">{msg.content}</p>
                      {msg.proof_url && (
                        <a 
                          href={msg.proof_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="mt-2 block"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img 
                            src={msg.proof_url} 
                            alt="Proof" 
                            className="rounded-lg max-w-full h-auto border-2 border-white/20"
                          />
                        </a>
                      )}
                      <p className={`text-xs mt-1 ${isMe ? 'text-emerald-100' : 'text-gray-500 dark:text-gray-400'}`}>
                        {format(new Date(msg.created_at), 'h:mm a')}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Message Input */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <div className="flex gap-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleUploadProof}
                  className="hidden"
                  id="proof-upload"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => document.getElementById('proof-upload')?.click()}
                  disabled={uploadingProof}
                  className="dark:border-gray-600"
                >
                  {uploadingProof ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ImageIcon className="w-4 h-4" />
                  )}
                </Button>
                <Input
                  placeholder="Type a message..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  className="flex-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
                <Button
                  type="submit"
                  disabled={!messageText.trim() || sendMessageMutation.isPending}
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
            <div className="text-center">
              <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Select a conversation
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Choose a conversation from the list to start chatting
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Rating Dialog */}
      <Dialog open={showRatingDialog} onOpenChange={setShowRatingDialog}>
        <DialogContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-white">Rate User</DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-400">
              Did {selectedUser?.full_name || selectedUserEmail} use your referral link?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex gap-4">
              <Button
                variant={ratingData.completed === true ? "default" : "outline"}
                className={`flex-1 ${ratingData.completed === true ? 'bg-green-600 hover:bg-green-700' : 'dark:border-gray-600 dark:text-white'}`}
                onClick={() => setRatingData({ ...ratingData, completed: true })}
              >
                <ThumbsUp className="w-4 h-4 mr-2" />
                Yes, they did
              </Button>
              <Button
                variant={ratingData.completed === false ? "default" : "outline"}
                className={`flex-1 ${ratingData.completed === false ? 'bg-red-600 hover:bg-red-700' : 'dark:border-gray-600 dark:text-white'}`}
                onClick={() => setRatingData({ ...ratingData, completed: false })}
              >
                <ThumbsDown className="w-4 h-4 mr-2" />
                No, they didn&apos;t
              </Button>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes" className="text-gray-900 dark:text-gray-200">Additional Notes (optional)</Label>
              <Textarea
                id="notes"
                placeholder="Share your experience..."
                value={ratingData.notes}
                onChange={(e) => setRatingData({ ...ratingData, notes: e.target.value })}
                className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
                rows={3}
              />
            </div>
            {ratingData.completed === false && (
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 flex gap-2">
                <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <p className="text-sm text-amber-800 dark:text-amber-300">
                  This will decrease their trust score. Only mark this if you&apos;re certain they didn&apos;t fulfill their part.
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRatingDialog(false)}
              className="border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Cancel
            </Button>
            <Button
              onClick={() => submitRatingMutation.mutate({ completed: ratingData.completed!, notes: ratingData.notes })}
              disabled={ratingData.completed === null || submitRatingMutation.isPending}
              className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
            >
              {submitRatingMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Submit Rating
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function Messages() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="text-gray-500">Loading...</div></div>}>
      <MessagesContent />
    </Suspense>
  );
}
