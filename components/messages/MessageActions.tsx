"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Upload, ImageIcon } from "lucide-react";
import { base44 } from "@/lib/base44Client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import type { Message } from "@/types";

interface MessageActionsProps {
  message: Message;
  currentUserId: string;
}

export function MessageActions({ message, currentUserId }: MessageActionsProps) {
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [actionTaken, setActionTaken] = useState<'accepted' | 'declined' | null>(null);

  const metadata = message.metadata;
  if (!metadata || !metadata.actions || metadata.actions.length === 0) {
    return null;
  }

  // Hide accept/decline buttons if already accepted/declined or if action was already taken in this session
  const isExchangeAccepted = metadata.exchange_status === 'accepted' || metadata.exchange_status === 'completed';
  const isExchangeDeclined = metadata.exchange_status === 'cancelled';
  const shouldHideAcceptDecline = isExchangeAccepted || isExchangeDeclined || actionTaken !== null;

  // Handle Accept Exchange
  const handleAccept = async () => {
    if (!metadata.exchange_id || actionTaken === 'accepted') return;

    try {
      setActionTaken('accepted');
      await base44.entities.Exchange.update(metadata.exchange_id, { status: 'accepted' });
      
      // ═══════════════════════════════════════════════════════════════════
      // 📝 EXCHANGE ACCEPTED MESSAGE - EDIT THIS TO CUSTOMIZE
      // ═══════════════════════════════════════════════════════════════════
      // This message is sent to the requester when their request is accepted.
      
      // Send acceptance message to requester
      await base44.entities.Message.create({
        sender_id: currentUserId,
        receiver_id: message.sender_id,
        content: `Exchange Request Accepted`,
        is_read: false,
        metadata: {
          type: 'exchange_update',
          exchange_id: metadata.exchange_id,
          exchange_status: 'accepted',
          actions: [
            {
              type: 'send_proof',
              label: 'Send Proof Screenshot',
              variant: 'default'
            }
          ]
        }
      } as any);

      queryClient.invalidateQueries({ queryKey: ['messages'] });
      queryClient.invalidateQueries({ queryKey: ['exchanges'] });
      toast.success("Exchange accepted! You can now complete it.");
    } catch {
      setActionTaken(null); // Reset on error
      toast.error("Failed to accept exchange");
    }
  };

  // Handle Decline Exchange
  const handleDecline = async () => {
    if (!metadata.exchange_id) return;

    try {
      setActionTaken('declined');
      await base44.entities.Exchange.update(metadata.exchange_id, { status: 'cancelled' });
      
      // ═══════════════════════════════════════════════════════════════════
      // 📝 EXCHANGE DECLINED MESSAGE - EDIT THIS TO CUSTOMIZE
      // ═══════════════════════════════════════════════════════════════════
      // This message is sent to the requester when their request is declined.
      
      // Send cancellation message to requester
      await base44.entities.Message.create({
        sender_id: currentUserId,
        receiver_id: message.sender_id,
        //make the text red
        content: `Exchange Request Declined`,
        is_read: false,
        metadata: {
          type: 'exchange_update',
          exchange_id: metadata.exchange_id,
          exchange_status: 'cancelled'
        }
      } as any);

      queryClient.invalidateQueries({ queryKey: ['messages'] });
      queryClient.invalidateQueries({ queryKey: ['exchanges'] });
      toast.success("Exchange declined");
    } catch {
      setActionTaken(null); // Reset on error
      toast.error("Failed to decline exchange");
    }
  };

  // Handle Send Proof Screenshot
  const handleSendProof = async () => {
    if (!imageFile) {
      toast.error("Please select an image first");
      return;
    }

    setUploading(true);
    try {
      // Upload image to Supabase Storage
      const { file_url: publicUrl } = await base44.storage.uploadProofImage(imageFile, currentUserId);

      // Send proof message to the other person
      await base44.entities.Message.create({
        sender_id: currentUserId,
        receiver_id: message.sender_id,
        content: `Proof Screenshot Sent 📸\n\nI've completed my part and attached a screenshot as proof!\n\nPlease review it and send your proof screenshot as well.`,
        is_read: false,
        proof_url: publicUrl,
        metadata: {
          type: 'proof_request',
          exchange_id: metadata.exchange_id,
          proof_sent_by_requester: message.receiver_id === currentUserId,
          proof_sent_by_provider: message.sender_id === currentUserId,
          actions: [
            {
              type: 'send_proof',
              label: 'Send My Proof Screenshot',
              variant: 'default'
            }
          ]
        }
      } as any);

      queryClient.invalidateQueries({ queryKey: ['messages'] });
      toast.success("Proof screenshot sent!");
      setImageFile(null);
    } catch (error) {
      console.error(error);
      toast.error("Failed to upload proof");
    } finally {
      setUploading(false);
    }
  };

  const getActionButton = (action: any) => {
    const variantMap: Record<string, 'default' | 'destructive' | 'outline'> = {
      default: 'default' as const,
      destructive: 'destructive' as const,
      outline: 'outline' as const,
    };
    const variant = (action.variant && variantMap[action.variant]) || 'default';

    switch (action.type) {
      case 'accept':
        // Hide accept button if already accepted
        if (shouldHideAcceptDecline) return null;
        return (
          <Button
            key={action.type}
            onClick={handleAccept}
            variant={variant}
            size="sm"
            disabled={actionTaken !== null}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CheckCircle2 className="w-4 h-4 mr-2" />
            {action.label}
          </Button>
        );

      case 'decline':
        // Hide decline button if already accepted (but allow decline after previous decline)
        if (shouldHideAcceptDecline) return null;
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        const isDisabled = actionTaken === 'accepted'; // Disable if user clicked accept
        return (
          <Button
            key={action.type}
            onClick={handleDecline}
            variant={variant}
            size="sm"
            disabled={isDisabled}
            className="flex-1 bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <XCircle className="w-4 h-4 mr-2" />
            {action.label}
          </Button>
        );

      case 'send_proof':
        return (
          <div key={action.type} className="flex flex-col gap-2 w-full">
            <label className="cursor-pointer">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => setImageFile(e.target.files?.[0] || null)}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                asChild
              >
                <span>
                  <ImageIcon className="w-4 h-4 mr-2" />
                  {imageFile ? imageFile.name : 'Choose Image'}
                </span>
              </Button>
            </label>
            {imageFile && (
              <Button
                onClick={handleSendProof}
                disabled={uploading}
                size="sm"
                className="w-full bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white"
              >
                <Upload className="w-4 h-4 mr-2" />
                {uploading ? 'Uploading...' : action.label}
              </Button>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
      {metadata.actions.map((action) => getActionButton(action))}
    </div>
  );
}
