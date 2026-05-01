"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import { useQuery } from "convex/react";
import { ArrowLeft, Bell, Home, Lightbulb, Plus, Search, Users, X } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Popover, PopoverClose, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SearchBar } from "@/components/search/search-bar";
import { NotificationList } from "@/components/notifications/notification-list";
import { GlobalChatSheet } from "@/components/chat/ChatInterface";
import { LogoIcon } from "@/components/logo";
import { api } from "@convex/_generated/api";
import { cn } from "@/lib/utils";
import { CurrentUserProfile, displayFontClass, getInitials, shellMax, transitionBase } from "@/components/ideaforge/shared";

export function IdeaForgeNavbar({
  currentUser,
  searchQuery,
  onSearchChange,
  onOpenComposer,
}: {
  currentUser: CurrentUserProfile | null | undefined;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onOpenComposer: () => void;
}) {
  const unreadCount = useQuery(api.notifications.getUnreadCount) || 0;
  const pathname = usePathname();

  const navMenu = [
    { name: "Feed", href: "/feed", icon: Home },
    { name: "My Ideas", href: "/my-ideas", icon: Lightbulb },
    { name: "Communities", href: "/community", icon: Users },
  ];

  const isMenuActive = (href: string) =>
    pathname === href || (href !== "/" && pathname?.startsWith(href));

  // Mobile-only: collapse the search bar into an icon, expand on tap.
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const mobileSearchRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (mobileSearchOpen) {
      const input = mobileSearchRef.current?.querySelector("input");
      input?.focus();
    }
  }, [mobileSearchOpen]);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/7 bg-[#0A0D12]/92 backdrop-blur-xl">
      {/* Mobile / tablet compact bar (single row, search collapses to icon) */}
      <div className="flex items-center gap-2 px-3 py-2 lg:hidden">
        {mobileSearchOpen ? (
          <>
            <button
              type="button"
              onClick={() => setMobileSearchOpen(false)}
              aria-label="Close search"
              className={cn(
                transitionBase,
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#D1D5DB] hover:bg-white/[0.06] hover:text-white"
              )}
            >
              <ArrowLeft className="h-5 w-5" />
            </button>

            <div ref={mobileSearchRef} className="min-w-0 flex-1">
              <SearchBar
                value={searchQuery}
                onSearch={(value) => onSearchChange(value)}
                placeholder="Search for ideas, people, tags..."
                className="[&_input]:h-9 [&_input]:rounded-full [&_input]:border-white/8 [&_input]:bg-[#111827] [&_input]:pl-9 [&_input]:pr-3 [&_input]:text-sm [&_input]:text-white [&_input]:placeholder:text-[#6B7280]"
              />
            </div>
          </>
        ) : (
          <>
            <Link href="/feed" aria-label="Home" className="shrink-0">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#6366F1]/30 bg-[#111827]">
                <LogoIcon className="h-5 w-5" idSuffix="ideaforge-m" />
              </div>
            </Link>

            <div className="flex-1" />

            <button
              type="button"
              onClick={() => setMobileSearchOpen(true)}
              aria-label="Open search"
              className={cn(
                transitionBase,
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#D1D5DB] hover:bg-white/[0.06] hover:text-white"
              )}
            >
              <Search className="h-5 w-5" />
            </button>

            <button
              type="button"
              onClick={onOpenComposer}
              aria-label="Post idea"
              className={cn(
                transitionBase,
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#D1D5DB] hover:bg-white/[0.06] hover:text-white"
              )}
            >
              <Plus className="h-5 w-5" />
            </button>

            <div className="shrink-0 [&_button]:h-9 [&_button]:w-9 [&_button]:text-[#D1D5DB] [&_button:hover]:bg-white/[0.06] [&_button:hover]:text-white">
              <GlobalChatSheet />
            </div>

            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  aria-label="Open notifications"
                  className={cn(
                    transitionBase,
                    "flex h-9 shrink-0 items-center gap-1 rounded-full px-1.5 text-[#D1D5DB] hover:bg-white/[0.06] hover:text-white"
                  )}
                >
                  <Bell className="h-5 w-5" />
                  <span className="text-xs tabular-nums text-[#9CA3AF]">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                </button>
              </PopoverTrigger>
              <PopoverContent
                data-notification
                className="relative w-[min(92vw,340px)] overflow-hidden rounded-[18px] border border-white/8 bg-background p-0 shadow-[0_24px_80px_rgba(3,7,18,0.55)]"
                align="end"
              >
                <PopoverClose
                  aria-label="Close notifications"
                  className="absolute right-2 top-2 z-30 flex h-7 w-7 items-center justify-center rounded-full bg-white/5 text-muted-foreground transition-colors hover:bg-white/15 hover:text-foreground focus:outline-none focus:ring-2 focus:ring-[#6366F1]/40"
                >
                  <X className="h-3.5 w-3.5" />
                </PopoverClose>
                <ScrollArea className="h-[min(60dvh,400px)]">
                  <NotificationList />
                </ScrollArea>
              </PopoverContent>
            </Popover>

            <Link
              href={currentUser ? `/profile/${currentUser.username}` : "/sign-in"}
              className="shrink-0 rounded-full"
              aria-label="Open profile"
            >
              <Avatar className="h-7 w-7">
                <AvatarImage src={currentUser?.avatar} alt={currentUser?.displayName} />
                <AvatarFallback className="bg-[#1B2440] text-[10px] font-semibold text-white">
                  {getInitials(currentUser?.displayName)}
                </AvatarFallback>
              </Avatar>
            </Link>
          </>
        )}
      </div>

      {/* Desktop bar (unchanged) */}
      <div className={cn(shellMax, "hidden items-center gap-3 px-4 py-3 lg:flex xl:px-6")}>
        <Link href="/feed" className="flex items-center gap-3 rounded-full px-2 py-1 text-white">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#6366F1]/30 bg-[#111827] shadow-[0_0_0_1px_rgba(255,255,255,0.03)]">
            <LogoIcon className="h-6 w-6" idSuffix="ideaforge" />
          </div>
          <div className="hidden sm:block">
            <div className={cn(displayFontClass, "text-sm font-semibold tracking-wide text-white")}>InteractiveIdeas</div>
            <div className="text-[11px] uppercase tracking-[0.18em] text-[#7C86A2]">Builder Network</div>
          </div>
        </Link>

        <div className="hidden min-w-0 flex-1 lg:block">
          <div className="mx-auto w-full max-w-[560px]">
            <SearchBar
              value={searchQuery}
              onSearch={(value) => onSearchChange(value)}
              placeholder="Search for ideas, people, tags..."
              className="[&_input]:h-12 [&_input]:rounded-full [&_input]:border-white/8 [&_input]:bg-[#111827] [&_input]:px-12 [&_input]:text-sm [&_input]:text-white [&_input]:placeholder:text-[#6B7280]"
            />
          </div>
        </div>

        {/* Desktop nav menu — Feed | My Ideas | Community */}
        <nav className="hidden lg:flex items-center gap-1 mr-1">
          {navMenu.map((item) => {
            const Icon = item.icon;
            const active = isMenuActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative flex flex-col items-center justify-center px-3 py-1.5 rounded-md text-[10px] font-medium whitespace-nowrap transition-colors duration-200",
                  active ? "text-white" : "text-[#9CA3AF] hover:text-white"
                )}
              >
                <Icon className="h-4 w-4 mb-0.5" />
                <span>{item.name}</span>
                {active && (
                  <span
                    aria-hidden
                    className="absolute left-3 right-3 -bottom-px h-px bg-gradient-to-r from-transparent via-[#8B5CF6] to-transparent shadow-[0_0_10px_rgba(139,92,246,0.7)]"
                  />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Button
            type="button"
            onClick={onOpenComposer}
            className="hidden rounded-[10px] bg-[#6366F1] px-4 text-white shadow-[0_10px_32px_rgba(99,102,241,0.18)] hover:bg-[#8B5CF6] md:inline-flex"
          >
            <Plus className="h-4 w-4" />
            Post Idea
          </Button>

          <GlobalChatSheet />

          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                aria-label="Open notifications"
                className={cn(
                  transitionBase,
                  "relative flex h-11 w-11 items-center justify-center rounded-2xl border border-white/8 bg-[#111827] text-[#D1D5DB] hover:border-[#6366F1]/40 hover:text-white"
                )}
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#EF4444] px-1 text-[10px] font-semibold text-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent
              data-notification
              className="relative w-[min(92vw,340px)] overflow-hidden rounded-[18px] border border-white/8 bg-background p-0 shadow-[0_24px_80px_rgba(3,7,18,0.55)]"
              align="end"
            >
              <PopoverClose
                aria-label="Close notifications"
                className="absolute right-2 top-2 z-30 flex h-7 w-7 items-center justify-center rounded-full bg-white/5 text-muted-foreground transition-colors hover:bg-white/15 hover:text-foreground focus:outline-none focus:ring-2 focus:ring-[#6366F1]/40"
              >
                <X className="h-3.5 w-3.5" />
              </PopoverClose>
              <ScrollArea className="h-[400px]">
                <NotificationList />
              </ScrollArea>
            </PopoverContent>
          </Popover>

          <Link href={currentUser ? `/profile/${currentUser.username}` : "/sign-in"} className="rounded-full" aria-label="Open profile">
            <Avatar className="h-11 w-11 ring-2 ring-[#6366F1]/45 ring-offset-2 ring-offset-[#0A0D12]">
              <AvatarImage src={currentUser?.avatar} alt={currentUser?.displayName} />
              <AvatarFallback className="bg-[#1B2440] text-white">{getInitials(currentUser?.displayName)}</AvatarFallback>
            </Avatar>
          </Link>
        </div>
      </div>
    </header>
  );
}