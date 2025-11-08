"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";

interface AddLinkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => void;
  isSubmitting: boolean;
  initialData?: any;
  isEditing?: boolean;
}

export default function AddLinkDialog({ 
  open, 
  onOpenChange, 
  onSubmit, 
  isSubmitting, 
  initialData, 
  isEditing 
}: AddLinkDialogProps) {
  const [formData, setFormData] = useState(() => initialData || {
    service_name: "",
    referral_url: "",
    description: "",
    what_i_get: "",
    logo_url: "",
  });

  // Effect to update form data when initialData changes
  React.useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      // Reset form if initialData is null/undefined and not in editing mode
      if (!isEditing) {
        setFormData({
          service_name: "",
          referral_url: "",
          description: "",
          what_i_get: "",
          logo_url: "",
        });
      }
    }
  }, [initialData, isEditing]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto dark:bg-gray-800 dark:border-gray-700">
        <DialogHeader>
          <DialogTitle className="dark:text-white">
            {isEditing ? "Edit Referral Link" : "Add Referral Link"}
          </DialogTitle>
          <DialogDescription className="dark:text-gray-400">
            {isEditing ? "Update your referral link details." : "Share a referral link and start exchanging with the community"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="service_name" className="dark:text-gray-200">Service Name *</Label>
              <Input
                id="service_name"
                placeholder="e.g., Dropbox, Airbnb"
                value={formData.service_name}
                onChange={(e) => handleChange("service_name", e.target.value)}
                required
                className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="referral_url" className="dark:text-gray-200">Referral Link *</Label>
              <Input
                id="referral_url"
                type="url"
                placeholder="https://..."
                value={formData.referral_url}
                onChange={(e) => handleChange("referral_url", e.target.value)}
                required
                className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="dark:text-gray-200">What Others Get *</Label>
              <Textarea
                id="description"
                placeholder="e.g., $10 off first order, 30 days free trial"
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
                required
                rows={2}
                className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="what_i_get" className="dark:text-gray-200">What You Get</Label>
              <Textarea
                id="what_i_get"
                placeholder="e.g., $10 credit when someone signs up"
                value={formData.what_i_get}
                onChange={(e) => handleChange("what_i_get", e.target.value)}
                rows={2}
                className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="logo_url" className="dark:text-gray-200">Logo URL (optional)</Label>
              <Input
                id="logo_url"
                type="url"
                placeholder="https://..."
                value={formData.logo_url}
                onChange={(e) => handleChange("logo_url", e.target.value)}
                className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="dark:border-gray-600 dark:text-gray-300"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isEditing ? "Save Changes" : "Add Link"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}


