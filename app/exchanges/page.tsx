"use client";

import React, { useState, useEffect } from "react";
import { base44 } from "@/lib/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  CheckCircle2, 
  Clock, 
  XCircle, 
  ExternalLink, 
  Loader2,
  ArrowRight,
  Handshake
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

const statusConfig: any = {
  pending: { color: "bg-yellow-100 text-yellow-700 border-yellow-200", icon: Clock, label: "Pending" },
  accepted: { color: "bg-blue-100 text-blue-700 border-blue-200", icon: Handshake, label: "In Progress" },
  completed: { color: "bg-green-100 text-green-700 border-green-200", icon: CheckCircle2, label: "Completed" },
  cancelled: { color: "bg-red-100 text-red-700 border-red-200", icon: XCircle, label: "Cancelled" },
};

function ExchangeCard({ exchange, myEmail, onUpdateStatus, isUpdating }: any) {
  const [requesterLink, setRequesterLink] = useState<any>(null);
  const [providerLink, setProviderLink] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const isRequester = exchange.requester_email === myEmail;
  const StatusIcon = statusConfig[exchange.status].icon;

  useEffect(() => {
    const loadLinks = async () => {
      try {
        const [reqLink, provLink] = await Promise.all([
          base44.entities.ReferralLink.filter({ id: exchange.requester_link_id }),
          base44.entities.ReferralLink.filter({ id: exchange.provider_link_id }),
        ]);
        setRequesterLink(reqLink[0]);
        setProviderLink(provLink[0]);
      } catch (error) {
        console.error("Error loading links:", error);
      } finally {
        setLoading(false);
      }
    };
    loadLinks();
  }, [exchange]);

  if (loading) {
    return (
      <Card className="border-2">
        <CardContent className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="border-2 hover:border-emerald-300 transition-all">
        <CardHeader>
          <div className="flex justify-between items-start gap-3">
            <CardTitle className="text-lg">
              {isRequester ? providerLink?.service_name : requesterLink?.service_name}
            </CardTitle>
            <Badge variant="outline" className={`${statusConfig[exchange.status].color} border shrink-0`}>
              <StatusIcon className="w-3 h-3 mr-1" />
              {statusConfig[exchange.status].label}
            </Badge>
          </div>
          <p className="text-sm text-gray-500">
            {isRequester ? `With ${exchange.provider_email}` : `From ${exchange.requester_email}`}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <p className="text-xs text-gray-500 mb-1">You use:</p>
                <p className="font-medium text-sm">
                  {isRequester ? providerLink?.service_name : requesterLink?.service_name}
                </p>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 shrink-0" />
              <div className="flex-1">
                <p className="text-xs text-gray-500 mb-1">They use:</p>
                <p className="font-medium text-sm">
                  {isRequester ? requesterLink?.service_name : providerLink?.service_name}
                </p>
              </div>
            </div>
          </div>

          {exchange.notes && (
            <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
              <p className="text-xs text-blue-600 font-medium mb-1">Message:</p>
              <p className="text-sm text-gray-900">{exchange.notes}</p>
            </div>
          )}

          <div className="flex gap-2">
            {exchange.status === 'pending' && !isRequester && (
              <Button
                size="sm"
                onClick={() => onUpdateStatus(exchange.id, 'accepted')}
                disabled={isUpdating}
                className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
              >
                <CheckCircle2 className="w-3 h-3 mr-2" />
                Accept
              </Button>
            )}
            {exchange.status === 'accepted' && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const linkToUse = isRequester ? providerLink : requesterLink;
                  window.open(linkToUse?.referral_url, '_blank');
                }}
                className="flex-1"
              >
                <ExternalLink className="w-3 h-3 mr-2" />
                Use Their Link
              </Button>
            )}
            {(exchange.status === 'accepted' || exchange.status === 'pending') && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onUpdateStatus(exchange.id, 'cancelled')}
                disabled={isUpdating}
              >
                <XCircle className="w-3 h-3 mr-2" />
                Cancel
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function Exchanges() {
  const [user, setUser] = useState<any>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch {
        base44.auth.redirectToLogin();
      }
    };
    loadUser();
  }, []);

  const { data: exchanges = [], isLoading } = useQuery({
    queryKey: ['exchanges', user?.email],
    queryFn: async () => {
      if (!user) return [];
      const [asRequester, asProvider] = await Promise.all([
        base44.entities.Exchange.filter({ requester_email: user.email }, '-created_date'),
        base44.entities.Exchange.filter({ provider_email: user.email }, '-created_date'),
      ]);
      return [...asRequester, ...asProvider];
    },
    enabled: !!user,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: any) => base44.entities.Exchange.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exchanges'] });
      toast.success("Exchange updated successfully");
    },
    onError: () => {
      toast.error("Failed to update exchange");
    },
  });

  const pendingExchanges = exchanges.filter((e: any) => e.status === 'pending');
  const activeExchanges = exchanges.filter((e: any) => e.status === 'accepted');
  const completedExchanges = exchanges.filter((e: any) => e.status === 'completed');

  if (!user || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">My Exchanges</h1>
          <p className="text-gray-600">Track your referral link exchanges</p>
        </motion.div>

        <Tabs defaultValue="active" className="space-y-6">
          <TabsList className="bg-white border-2">
            <TabsTrigger value="pending" className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white">
              Pending ({pendingExchanges.length})
            </TabsTrigger>
            <TabsTrigger value="active" className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white">
              Active ({activeExchanges.length})
            </TabsTrigger>
            <TabsTrigger value="completed" className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white">
              Completed ({completedExchanges.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4">
            {pendingExchanges.length === 0 ? (
              <Card className="border-2 border-dashed">
                <CardContent className="text-center py-12">
                  <Clock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">No pending exchanges</p>
                </CardContent>
              </Card>
            ) : (
              pendingExchanges.map((exchange: any) => (
                <ExchangeCard
                  key={exchange.id}
                  exchange={exchange}
                  myEmail={user.email}
                  onUpdateStatus={(id: string, status: string) => updateStatusMutation.mutate({ id, status })}
                  isUpdating={updateStatusMutation.isPending}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="active" className="space-y-4">
            {activeExchanges.length === 0 ? (
              <Card className="border-2 border-dashed">
                <CardContent className="text-center py-12">
                  <Handshake className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">No active exchanges</p>
                </CardContent>
              </Card>
            ) : (
              activeExchanges.map((exchange: any) => (
                <ExchangeCard
                  key={exchange.id}
                  exchange={exchange}
                  myEmail={user.email}
                  onUpdateStatus={(id: string, status: string) => updateStatusMutation.mutate({ id, status })}
                  isUpdating={updateStatusMutation.isPending}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            {completedExchanges.length === 0 ? (
              <Card className="border-2 border-dashed">
                <CardContent className="text-center py-12">
                  <CheckCircle2 className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">No completed exchanges yet</p>
                </CardContent>
              </Card>
            ) : (
              completedExchanges.map((exchange: any) => (
                <ExchangeCard
                  key={exchange.id}
                  exchange={exchange}
                  myEmail={user.email}
                  onUpdateStatus={(id: string, status: string) => updateStatusMutation.mutate({ id, status })}
                  isUpdating={updateStatusMutation.isPending}
                />
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
