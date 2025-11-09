"use client";

import React from "react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Gift, Handshake, Star, Shield, Link as LinkIcon } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getAvatarColor } from "@/lib/utils";

interface ReferralCardProps {
  link: any;
  onRequestExchange?: (link: any) => void;
  showActions?: boolean;
  ownerEmail?: string;
  ownerName?: string;
  ownerUsername?: string;
  ownerReputation?: number;
  ownerRatingsCount?: number;
  lastActive?: string;
}

export default function ReferralCard({ 
  link, 
  onRequestExchange, 
  showActions = true, 
  ownerEmail, 
  ownerName,
  ownerUsername,
  ownerReputation, 
  ownerRatingsCount, 
  lastActive,
}: ReferralCardProps) {
  const isNewUser = (ownerRatingsCount || 0) < 3;
  
  // Calculate online status
  const getOnlineStatus = () => {
    if (!lastActive) return { status: 'offline', color: 'bg-gray-400', label: 'Offline', description: 'Not online' };
    
    const lastActiveDate = new Date(lastActive);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - lastActiveDate.getTime()) / (1000 * 60));
    
    if (diffMinutes <= 5) {
      return { status: 'online', color: 'bg-green-500', label: 'Online', description: 'Online now' };
    } else if (diffMinutes <= 30) {
      return { status: 'recent', color: 'bg-yellow-500', label: 'Recently', description: `Active ${diffMinutes} minutes ago` };
    } else {
      return { status: 'offline', color: 'bg-gray-400', label: 'Offline', description: 'Not recently active' };
    }
  };
  
  const onlineStatus = getOnlineStatus();
  
  // Get user initials
  const getInitials = () => {
    if (ownerName) {
      const parts = ownerName.trim().split(' ');
      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      }
      return parts[0][0].toUpperCase();
    }
    if (ownerUsername) {
      return ownerUsername[0].toUpperCase();
    }
    if (ownerEmail) {
      return ownerEmail[0].toUpperCase();
    }
    return '?';
  };
  
  const displayName = ownerName || ownerUsername || ownerEmail || 'Anonymous';
  const displayUsername = ownerUsername ? `@${ownerUsername}` : (ownerEmail || '');
  const avatarColor = getAvatarColor(displayName);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="h-full border-2 hover:border-emerald-300 dark:hover:border-emerald-600 hover:shadow-xl transition-all duration-300 bg-white dark:bg-gray-800 backdrop-blur-sm overflow-hidden group">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-600" />
        
        <CardHeader className="pb-2 pt-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {/* User Avatar with Initial */}
              <div className="relative flex-shrink-0">
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${avatarColor} flex items-center justify-center text-white font-bold shadow-md`}>
                  {getInitials()}
                  </div>
                {/* Online Status Indicator */}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 ${onlineStatus.color} border-2 border-white dark:border-gray-800 rounded-full`} />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{onlineStatus.description}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              
              <div className="flex-1 min-w-0">
                {/* User Name as Primary Title */}
                <h3 className="font-bold text-base text-gray-900 dark:text-white truncate">{displayName}</h3>
                
                {/* Service Name as Subtitle */}
                <p className="text-xs text-gray-600 dark:text-gray-400 truncate">{link.service_name}</p>
                
                <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 flex-wrap mt-0.5">
                  {/* Reputation Score */}
                  {ownerReputation && (
                    <div className="flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400 font-medium">
                      <Star className="w-3 h-3 fill-current" />
                      {ownerReputation}
                    </div>
                  )}
                  
                  {/* New User Badge */}
                  {isNewUser && (
                    <>
                      {ownerReputation && <span>•</span>}
                      <Badge variant="outline" className="text-xs px-1.5 py-0 h-4 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800">
                        New
                      </Badge>
                    </>
                  )}
                  
                  {/* Online Status Badge */}
                  {(ownerReputation || isNewUser) && <span>•</span>}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge 
                          variant="outline" 
                          className={`text-xs px-1.5 py-0 h-4 cursor-help ${
                            onlineStatus.status === 'online' 
                              ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800' 
                              : onlineStatus.status === 'recent'
                              ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800'
                              : 'bg-gray-50 dark:bg-gray-900/20 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700'
                          }`}
                        >
                          {onlineStatus.label}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{onlineStatus.description}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            </div>
            <Badge variant="outline" className="text-xs shrink-0 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300">
              {format(new Date(link.created_at), "MMM d")}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-2 py-3">
          {/* What the poster gets (They Get from viewer's perspective) */}
          {link.what_i_get && (
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-2 border border-blue-200 dark:border-blue-800">
              <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-0.5 flex items-center gap-1">
                <Handshake className="w-3 h-3" /> They Get:
              </p>
              <p className="text-xs text-gray-900 dark:text-gray-100">{link.what_i_get}</p>
            </div>
          )}

          {/* What you get if you use their link */}
          <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-2 border border-emerald-200 dark:border-emerald-800">
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mb-0.5 flex items-center gap-1">
              <Gift className="w-3 h-3" /> You Get:
            </p>
            <p className="text-xs text-gray-900 dark:text-gray-100 font-semibold">{link.description}</p>
          </div>

          {/* Referral Link */}
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-2 border border-purple-200 dark:border-purple-800">
            <p className="text-xs text-purple-600 dark:text-purple-400 font-medium mb-0.5 flex items-center gap-1">
              <LinkIcon className="w-3 h-3" /> Referral Link:
            </p>
            <a 
              href={link.referral_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xs text-purple-700 dark:text-purple-300 hover:text-purple-900 dark:hover:text-purple-100 underline break-all line-clamp-2"
            >
              {link.referral_url}
            </a>
          </div>

          {link.total_exchanges > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 pt-1">
              <Handshake className="w-3 h-3" />
              <span>{link.total_exchanges} successful exchanges</span>
            </div>
          )}
        </CardContent>

        {showActions && (
          <CardFooter className="pt-0 pb-3 flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 h-8 text-xs dark:border-gray-600 dark:text-gray-300"
              onClick={() => window.open(link.referral_url, '_blank')}
            >
              <ExternalLink className="w-3 h-3 mr-1" />
              Link
            </Button>
            <Button
              size="sm"
              className="flex-1 h-8 text-xs bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-md"
              onClick={() => onRequestExchange?.(link)}
            >
              <Handshake className="w-3 h-3 mr-1" />
              Request Swap
            </Button>
          </CardFooter>
        )}
      </Card>
    </motion.div>
  );
}


