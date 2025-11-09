"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Link2, MessageSquare, Plus, Menu, Moon, Sun } from "lucide-react";
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
import { useQuery } from "@tanstack/react-query";

const navigationItems = [
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
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [user, setUser] = React.useState<any>(null);
  const [darkMode, setDarkMode] = React.useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('darkMode') === 'true';
    }
    return false;
  });

  React.useEffect(() => {
    const loadAndUpdateUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        await base44.auth.updateMe({ last_active: new Date().toISOString() });
      } catch {}
    };
    loadAndUpdateUser();
    const interval = setInterval(loadAndUpdateUser, 60000);
    return () => clearInterval(interval);
  }, []);

  React.useEffect(() => {
    localStorage.setItem('darkMode', darkMode.toString());
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['unreadMessages', user?.email],
    queryFn: async () => {
      if (!user) return 0;
      const messages = await base44.entities.Message.filter({ 
        receiver_id: user.id,
        is_read: false 
      });
      return messages.length;
    },
    enabled: !!user,
    refetchInterval: 10000,
  });

  return (
    <SidebarProvider>
      <style jsx global>{`
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
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Link2 className="w-5 h-5 text-white" />
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
                  {navigationItems.map((item) => (
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
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">
                    {user.full_name?.charAt(0) || user.email?.charAt(0)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 dark:text-white text-sm truncate">{user.full_name || 'User'}</p>
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                    <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                      {user.reputation_score || 100}★
                    </span>
                  </div>
                </div>
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

