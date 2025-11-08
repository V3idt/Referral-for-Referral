"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Info } from "lucide-react";
import { base44 } from "@/lib/base44Client";

interface ExchangeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  providerLink: any;
  onSubmit: (data: any) => void;
  isSubmitting: boolean;
}

export default function ExchangeDialog({ 
  open, 
  onOpenChange, 
  providerLink, 
  onSubmit, 
  isSubmitting 
}: ExchangeDialogProps) {
  const [myLinks, setMyLinks] = useState<any[]>([]);
  const [selectedLinkId, setSelectedLinkId] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open]);

  const loadData = async () => {
    try {
      const currentUser = await base44.auth.me();
      const links = await base44.entities.ReferralLink.filter({ 
        user_id: currentUser.id,
        status: 'active'
      });
      setMyLinks(links);
    } catch {
      console.error("Error loading data");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLinkId) return;

    const selectedLink = myLinks.find(l => l.id === selectedLinkId);
    onSubmit({
      providerLink,
      requesterLink: selectedLink,
      notes,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Request Exchange</DialogTitle>
          <DialogDescription>
            Choose one of your referral links to exchange with {providerLink?.service_name}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
          </div>
        ) : myLinks.length === 0 ? (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              You need to add at least one referral link before requesting an exchange.
            </AlertDescription>
          </Alert>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <Alert className="bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800">
                <Info className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <AlertDescription className="text-emerald-900 dark:text-emerald-300">
                  <strong>How it works:</strong> You&apos;ll use their {providerLink?.service_name} link, 
                  and they&apos;ll use one of your referral links. Both of you benefit!
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label htmlFor="my_link">Select Your Referral Link *</Label>
                <Select value={selectedLinkId} onValueChange={setSelectedLinkId} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a link to offer..." />
                  </SelectTrigger>
                  <SelectContent>
                    {myLinks.map((link) => (
                      <SelectItem key={link.id} value={link.id}>
                        {link.service_name} - {link.description}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Message (optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Add a message to the other person..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !selectedLinkId}
                className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Send Request
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}


