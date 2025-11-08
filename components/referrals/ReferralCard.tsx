"use client";

import React from "react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Gift, Handshake, Star, Shield } from "lucide-react";
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
        
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 flex-1">
              {/* User Avatar with Initial */}
              <div className="relative">
                <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${avatarColor} flex items-center justify-center text-white font-bold text-lg shadow-md`}>
                  {getInitials()}
                  </div>
                {/* Online Status Indicator */}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className={`absolute -bottom-1 -right-1 w-4 h-4 ${onlineStatus.color} border-2 border-white dark:border-gray-800 rounded-full`} />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{onlineStatus.description}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              
              <div className="flex-1 min-w-0">
                {/* User Name as Primary Title */}
                <h3 className="font-bold text-lg text-gray-900 dark:text-white truncate">{displayName}</h3>
                
                {/* Service Name as Subtitle */}
                <p className="text-sm text-gray-600 dark:text-gray-400 truncate mb-1">{link.service_name}</p>
                
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 flex-wrap">
                  {/* Username */}
                  <span>{displayUsername}</span>
                  
                  {/* Reputation Score */}
                  {ownerReputation && (
                    <>
                      <span>•</span>
                      <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                        <Star className="w-3 h-3 fill-current" />
                        {ownerReputation}
                        <span className="text-xs">Trust</span>
                      </div>
                    </>
                  )}
                  
                  {/* New User Badge */}
                  {isNewUser && (
                    <>
                      <span>•</span>
                      <Badge variant="outline" className="text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800">
                        <Shield className="w-3 h-3 mr-1" />
                        New
                      </Badge>
                    </>
                  )}
                  
                  {/* Online Status Badge */}
                      <span>•</span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge 
                          variant="outline" 
                          className={`text-xs cursor-help ${
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

        <CardContent className="space-y-3">
          {/* What the poster gets (They Get from viewer's perspective) */}
          {link.what_i_get && (
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
              <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-1 flex items-center gap-1">
                <Handshake className="w-3 h-3" /> They Get:
              </p>
              <p className="text-sm text-gray-900 dark:text-gray-100">{link.what_i_get}</p>
            </div>
          )}

          {/* What you get if you use their link */}
          <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-3 border border-emerald-200 dark:border-emerald-800">
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mb-1 flex items-center gap-1">
              <Gift className="w-3 h-3" /> You Get:
            </p>
            <p className="text-sm text-gray-900 dark:text-gray-100 font-semibold">{link.description}</p>
          </div>

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
              size="sm"
              className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-md"
              onClick={() => onRequestExchange?.(link)}
            >
              <Handshake className="w-3 h-3 mr-2" />
              Request Swap
            </Button>
          </CardFooter>
        )}
      </Card>
    </motion.div>
  );
}


