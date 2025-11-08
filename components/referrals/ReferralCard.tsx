"use client";

import React from "react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Gift, Handshake, MessageSquare, Star, Shield } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";

interface ReferralCardProps {
  link: any;
  onRequestExchange?: (link: any) => void;
  onStartChat?: (link: any) => void;
  showActions?: boolean;
  ownerEmail?: string;
  ownerReputation?: number;
  ownerRatingsCount?: number;
  isOnline?: boolean;
}

export default function ReferralCard({ 
  link, 
  onRequestExchange, 
  onStartChat, 
  showActions = true, 
  ownerEmail, 
  ownerReputation, 
  ownerRatingsCount, 
  isOnline 
}: ReferralCardProps) {
  const isNewUser = (ownerRatingsCount || 0) < 3;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="h-full border-2 hover:border-emerald-300 dark:hover:border-emerald-600 hover:shadow-xl transition-all duration-300 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm overflow-hidden group">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-600" />
        
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 flex-1">
              <div className="relative">
                {link.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={link.logo_url} alt={link.service_name} className="w-12 h-12 rounded-lg object-cover" />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
                    <Gift className="w-6 h-6 text-white" />
                  </div>
                )}
                {isOnline && (
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-lg text-gray-900 dark:text-white truncate">{link.service_name}</h3>
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 flex-wrap">
                  <span>{ownerEmail || 'Anonymous'}</span>
                  {ownerReputation && (
                    <>
                      <span>•</span>
                      <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                        <Star className="w-3 h-3 fill-current" />
                        {ownerReputation}
                      </div>
                    </>
                  )}
                  {isNewUser && (
                    <>
                      <span>•</span>
                      <Badge variant="outline" className="text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800">
                        <Shield className="w-3 h-3 mr-1" />
                        New
                      </Badge>
                    </>
                  )}
                  {isOnline && (
                    <>
                      <span>•</span>
                      <span className="text-green-600 dark:text-green-400 font-medium">Online</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <Badge variant="outline" className="text-xs shrink-0 dark:border-gray-600 dark:text-gray-300">
              {format(new Date(link.created_date), "MMM d")}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-3 border border-emerald-200 dark:border-emerald-800">
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mb-1 flex items-center gap-1">
              <Gift className="w-3 h-3" /> You Get:
            </p>
            <p className="text-sm text-gray-900 dark:text-gray-100 font-semibold">{link.description}</p>
          </div>

          {link.what_i_get && (
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
              <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-1 flex items-center gap-1">
                <Handshake className="w-3 h-3" /> They Get:
              </p>
              <p className="text-sm text-gray-900 dark:text-gray-100">{link.what_i_get}</p>
            </div>
          )}

          {link.total_exchanges > 0 && (
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <Handshake className="w-3 h-3" />
              <span>{link.total_exchanges} successful exchanges</span>
            </div>
          )}
        </CardContent>

        {showActions && (
          <CardFooter className="pt-0 flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 dark:border-gray-600 dark:text-gray-300"
              onClick={() => window.open(link.referral_url, '_blank')}
            >
              <ExternalLink className="w-3 h-3 mr-2" />
              Link
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 dark:border-gray-600 dark:text-gray-300"
              onClick={() => onStartChat?.(link)}
            >
              <MessageSquare className="w-3 h-3 mr-2" />
              Chat
            </Button>
            <Button
              size="sm"
              className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-md"
              onClick={() => onRequestExchange?.(link)}
            >
              <Handshake className="w-3 h-3 mr-2" />
              Swap
            </Button>
          </CardFooter>
        )}
      </Card>
    </motion.div>
  );
}


