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
      <DialogContent className="sm:max-w-[500px] bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-gray-900 dark:text-white">Request Exchange</DialogTitle>
          <DialogDescription className="text-gray-600 dark:text-gray-400">
            Choose one of your referral links to exchange with {providerLink?.service_name}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
          </div>
        ) : myLinks.length === 0 ? (
          <Alert className="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
            <Info className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <AlertDescription className="text-amber-900 dark:text-amber-300">
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
                <Label htmlFor="my_link" className="text-gray-900 dark:text-gray-200">Select Your Referral Link *</Label>
                <Select value={selectedLinkId} onValueChange={setSelectedLinkId} required>
                  <SelectTrigger className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white">
                    <SelectValue placeholder="Choose a link to offer..." />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                    {myLinks.map((link) => (
                      <SelectItem key={link.id} value={link.id} className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700">
                        {link.service_name} - {link.description}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes" className="text-gray-900 dark:text-gray-200">Message (optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Add a message to the other person..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
                className="border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !selectedLinkId}
                className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
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


