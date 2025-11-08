"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Link2, MessageSquare, Plus, Menu, Moon, Sun, Shield, User as UserIcon, LogOut } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { base44 } from "@/lib/base44Client";
import { Button } from "@/components/ui/button";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { toast } from "sonner";

const getNavigationItems = (isAdmin: boolean) => {
  const items = [
  {
    title: "Browse Links",
      url: "/",
    icon: Home,
  },
  {
    title: "My Links",
      url: "/my-links",
    icon: Link2,
  },
  {
    title: "Messages",
      url: "/messages",
    icon: MessageSquare,
  },
    {
      title: "Profile",
      url: "/profile",
      icon: UserIcon,
    },
  ];

  if (isAdmin) {
    items.push({
      title: "Admin Panel",
      url: "/admin",
      icon: Shield,
    });
  }

  return items;
};

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [user, setUser] = React.useState<any>(null);
  const [isAdmin, setIsAdmin] = React.useState(false);
  const [darkMode, setDarkMode] = React.useState(true); // Default to dark mode
  const [mounted, setMounted] = React.useState(false);

  // Load dark mode preference from localStorage after mounting
  React.useEffect(() => {
    setMounted(true);
    const savedDarkMode = localStorage.getItem('darkMode');
    // If user has a preference saved, use it; otherwise keep default (true)
    if (savedDarkMode !== null) {
      setDarkMode(savedDarkMode === 'true');
    }
  }, []);

  React.useEffect(() => {
    const loadAndUpdateUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        setIsAdmin(currentUser?.is_admin || false);
        await base44.auth.updateMe({ last_active: new Date().toISOString() });
      } catch {}
    };
    loadAndUpdateUser();
    const interval = setInterval(loadAndUpdateUser, 60000);
    return () => clearInterval(interval);
  }, []);

  React.useEffect(() => {
    if (!mounted) return;
    localStorage.setItem('darkMode', darkMode.toString());
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode, mounted]);

  const queryClient = useQueryClient();

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['unreadMessages', user?.email],
    queryFn: async () => {
      if (!user) return 0;
      const messages = await base44.entities.Message.filter({ 
        receiver_email: user.email,
        is_read: false 
      });
      return messages.length;
    },
    enabled: !!user,
    refetchOnWindowFocus: false, // Disabled - using realtime instead
  });

  // Fetch all users for notification sender names
  const { data: allUsers = [] } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => base44.entities.User.list(),
    enabled: !!user,
  });

  // Request notification permission on mount
  React.useEffect(() => {
    const { requestNotificationPermission } = require('@/lib/notifications');
    requestNotificationPermission();
  }, []);

  // Real-time updates for unread message count with notifications
  React.useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('unread-messages')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${user.id}`, // Using UUID, not email
        },
        async (payload) => {
          // Update unread count when any message for this user changes
          queryClient.invalidateQueries({ queryKey: ['unreadMessages'] });
          
          // Show notification for NEW messages (only when not on messages page)
          if (payload.eventType === 'INSERT' && payload.new && !window.location.pathname.includes('/messages')) {
            const newMessage = payload.new as any;
            
            // Fetch sender info
            const sender = allUsers.find((u: any) => u.id === newMessage.sender_id);
            const senderName = sender?.full_name || sender?.username || sender?.email || 'Someone';
            const messagePreview = newMessage.content.substring(0, 50) + (newMessage.content.length > 50 ? '...' : '');
            
            // Play notification sound
            const { playNotificationSound, showBrowserNotification } = require('@/lib/notifications');
            playNotificationSound();
            
            // Show in-app toast notification
            toast.success(`💬 ${senderName}`, {
              description: messagePreview,
              duration: 5000,
              action: {
                label: 'View',
                onClick: () => window.location.href = '/messages',
              },
            });
            
            // Show browser notification
            const notification = showBrowserNotification(`New message from ${senderName}`, {
              body: newMessage.content.substring(0, 100),
              tag: 'message-notification',
            });
            
            if (notification) {
              // Click notification to go to messages
              notification.onclick = () => {
                window.location.href = '/messages';
                notification.close();
              };
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient, allUsers]);

  return (
    <SidebarProvider>
      <style>{`
        :root {
          --primary: 160 75% 45%;
          --primary-foreground: 0 0% 100%;
        }
        .dark {
          --background: 222 47% 11%;
          --foreground: 210 40% 98%;
          --card: 222 47% 15%;
          --card-foreground: 210 40% 98%;
          --popover: 222 47% 15%;
          --popover-foreground: 210 40% 98%;
          --primary: 160 75% 45%;
          --primary-foreground: 0 0% 100%;
          --secondary: 217 33% 17%;
          --secondary-foreground: 210 40% 98%;
          --muted: 217 33% 17%;
          --muted-foreground: 215 20% 65%;
          --accent: 217 33% 17%;
          --accent-foreground: 210 40% 98%;
          --destructive: 0 63% 31%;
          --destructive-foreground: 210 40% 98%;
          --border: 217 33% 17%;
          --input: 217 33% 17%;
          --ring: 160 75% 45%;
        }
      `}</style>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-emerald-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <Sidebar className="border-r border-gray-200/50 dark:border-gray-700 backdrop-blur-xl bg-white/80 dark:bg-gray-900/80">
          <SidebarHeader className="border-b border-gray-200/50 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl shadow-lg">
                  <svg width="40" height="40" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect width="32" height="32" rx="8" fill="url(#gradient)"/>
                    <path d="M14 10C14 9.44772 13.5523 9 13 9C12.4477 9 12 9.44772 12 10V11C12 11.5523 11.5523 12 11 12H10C9.44772 12 9 12.4477 9 13C9 13.5523 9.44772 14 10 14H11C11.5523 14 12 14.4477 12 15V22C12 22.5523 12.4477 23 13 23C13.5523 23 14 22.5523 14 22V15C14 14.4477 14.4477 14 15 14H17C17.5523 14 18 14.4477 18 15V22C18 22.5523 18.4477 23 19 23C19.5523 23 20 22.5523 20 22V15C20 14.4477 20.4477 14 21 14H22C22.5523 14 23 13.5523 23 13C23 12.4477 22.5523 12 22 12H21C20.4477 12 20 11.5523 20 11V10C20 9.44772 19.5523 9 19 9C18.4477 9 18 9.44772 18 10V11C18 11.5523 17.5523 12 17 12H15C14.4477 12 14 11.5523 14 11V10Z" fill="white"/>
                    <defs>
                      <linearGradient id="gradient" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#10B981"/>
                        <stop offset="1" stopColor="#0D9488"/>
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
                <div>
                  <h2 className="font-bold text-gray-900 dark:text-white text-lg">Referral-for-Referral</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Trusted Exchange</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setDarkMode(!darkMode)}
                className="rounded-lg"
              >
                {darkMode ? (
                  <Sun className="w-4 h-4 text-gray-400" />
                ) : (
                  <Moon className="w-4 h-4 text-gray-600" />
                )}
              </Button>
            </div>
          </SidebarHeader>
          
          <SidebarContent className="p-3">
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {getNavigationItems(isAdmin).map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton 
                        asChild 
                        className={`rounded-xl mb-1 transition-all ${
                          pathname === item.url 
                            ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg hover:shadow-xl' 
                            : 'hover:bg-emerald-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        <Link href={item.url} className="flex items-center gap-3 px-4 py-3">
                          <div className="relative">
                            <item.icon className="w-4 h-4" />
                            {item.title === "Messages" && unreadCount > 0 && (
                              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                                {unreadCount}
                              </span>
                            )}
                          </div>
                          <span className="font-medium">{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <div className="mt-6 px-3">
              <Link href="/my-links">
                <Button className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg hover:shadow-xl transition-all">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Referral Link
                </Button>
              </Link>
            </div>
          </SidebarContent>

          <SidebarFooter className="border-t border-gray-200/50 dark:border-gray-700 p-4">
            {user ? (
              <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">
                    {user.full_name?.charAt(0) || user.email?.charAt(0)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 dark:text-white text-sm truncate">{user.full_name || 'User'}</p>
                  <div className="flex items-center gap-2">
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">@{user.username || user.email?.split('@')[0]}</p>
                    <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                      {user.reputation_score || 100}★
                    </span>
                  </div>
                </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full dark:border-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 hover:border-red-300 dark:hover:border-red-800"
                  onClick={async () => {
                    await base44.auth.signOut();
                    window.location.href = '/';
                  }}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                className="w-full dark:border-gray-700 dark:text-gray-300"
                onClick={() => base44.auth.redirectToLogin()}
              >
                Sign In
              </Button>
            )}
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 flex flex-col">
          <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700 px-6 py-4 md:hidden sticky top-0 z-10">
            <div className="flex items-center gap-4">
              <SidebarTrigger>
                <Menu className="w-5 h-5 dark:text-gray-300" />
              </SidebarTrigger>
              <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                Referral-for-Referral
              </h1>
            </div>
          </header>

          <div className="flex-1 overflow-auto">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}

