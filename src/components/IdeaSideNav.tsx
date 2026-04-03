
import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  GitBranch,
  ListTodo,
  Calendar,
  MessageCircle,
  Sun,
  Moon,
  Plus,
  GitBranchPlus,
  Search,
  X,
  Rocket,
} from "lucide-react";
import { useState } from "react";
import { LogoIcon } from "@/components/logo";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useTheme } from "next-themes";
import { useClerk } from "@clerk/nextjs";
import { useChat } from "@/components/chat/ChatContext";
import { Id } from "@convex/_generated/dataModel";
import { NotificationBell } from "@/components/notifications/notification-bell";

interface IdeaSideNavProps {
  onOpenHierarchy?: () => void;
  onOpenTodos?: () => void;
  onOpenCalendar?: () => void;
  todoCount?: number;
  className?: string;
  ideaId?: string;
  isContributor?: boolean;
  onCreateSubIdea?: () => void;
  onSearch?: (query: string) => void;
  searchQuery?: string;
}

export function IdeaSideNav({
  onOpenHierarchy,
  onOpenTodos,
  onOpenCalendar,
  todoCount = 0,
  className,
  ideaId,
  isContributor = false,
  onCreateSubIdea,
  onSearch,
  searchQuery = "",
}: IdeaSideNavProps) {
  const { theme, setTheme } = useTheme();
  const { } = useClerk();
  const { toggleChat, isOpen: isChatOpen, openGroupChat } = useChat();
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const handleChatClick = () => {
    if (ideaId) {
      // If we are on an idea page, the chat button opens that idea's community chat
      // We assume ideaId passed here is a valid ID string for the idea
      openGroupChat(ideaId as Id<"ideas">);
    } else {
      toggleChat();
    }
  };

  return (
    <div className={`flex flex-row lg:flex-col items-center justify-between lg:justify-start py-2 px-3 lg:py-4 lg:px-2 bg-card/95 backdrop-blur-xl border-t lg:border-t-0 border-r-0 lg:border border-border/50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] lg:shadow-2xl rounded-t-2xl lg:rounded-2xl lg:rounded-l-2xl gap-1 lg:gap-4 w-full lg:w-auto h-16 lg:h-auto z-50 ${className}`}>
      <TooltipProvider delayDuration={0}>

        {/* Mobile Search Expanded */}
        {isMobileSearchOpen && (
          <div className="flex lg:hidden items-center w-full gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
            <Input
              placeholder="Search ideas..."
              value={searchQuery}
              onChange={(e) => onSearch?.(e.target.value)}
              className="flex-1 h-10"
              autoFocus
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileSearchOpen(false)}
              className="shrink-0"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        )}

        {/* Mobile Left Section: Logo & Search Trigger (Hidden when search expanded) */}
        {!isMobileSearchOpen && (
          <div className="flex items-center gap-2 lg:hidden">
            <Link href="/" className="flex items-center text-primary shrink-0">
              <LogoIcon className="h-8 w-8" />
            </Link>
            {onSearch && (
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-xl hover:bg-primary/10 hover:text-primary"
                onClick={() => setIsMobileSearchOpen(true)}
              >
                <Search className="h-5 w-5" />
              </Button>
            )}
          </div>
        )}

        <div className={`items-center gap-1 lg:flex-col lg:gap-4 lg:w-full ${isMobileSearchOpen ? 'hidden lg:flex' : 'flex'}`}>


          {/* Create Idea / Sub-Idea */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                asChild={!isContributor}
                variant="ghost"
                size="icon"
                onClick={isContributor ? onCreateSubIdea : undefined}
                className="rounded-xl w-10 h-10 hover:bg-primary/10 hover:text-primary transition-all duration-200"
              >
                {isContributor ? (
                  <GitBranchPlus className="w-5 h-5" />
                ) : (
                  <Link href="/create-idea">
                    <Plus className="w-5 h-5" />
                  </Link>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              {isContributor ? "Create Sub-Idea" : "Create Idea"}
            </TooltipContent>
          </Tooltip>

          <div className="hidden lg:block w-8 h-[1px] bg-border/50 my-1" />

          {/* Idea Specific Actions - Only show if handlers are provided or we have idea context */}
          {(onOpenHierarchy || onOpenTodos || onOpenCalendar) && (
            <>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={onOpenHierarchy} className="rounded-xl w-10 h-10 hover:bg-primary/10 hover:text-primary transition-all duration-200">
                    <GitBranch className="w-5 h-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left">Hierarchy</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={onOpenTodos} className="rounded-xl w-10 h-10 hover:bg-primary/10 hover:text-primary relative transition-all duration-200">
                    <ListTodo className="w-5 h-5" />
                    {todoCount > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground font-bold border border-background">
                        {todoCount}
                      </span>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left">Todos / Kanban</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={onOpenCalendar} className="rounded-xl w-10 h-10 hover:bg-primary/10 hover:text-primary transition-all duration-200">
                    <Calendar className="w-5 h-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left">Calendar</TooltipContent>
              </Tooltip>

              <div className="hidden lg:block w-8 h-[1px] bg-border/50 my-1" />
            </>
          )}

          {/* Convert to Venture — only show for idea authors on idea pages */}
          {ideaId && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href={`/venture/create?ideaId=${ideaId}`}>
                  <Button variant="ghost" size="icon" className="rounded-xl w-10 h-10 hover:bg-amber-500/10 hover:text-amber-500 transition-all duration-200">
                    <Rocket className="w-5 h-5" />
                  </Button>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="left">Convert to Venture</TooltipContent>
            </Tooltip>
          )}

          {/* Global Actions (from RightSidebar) */}

          {/* Chat Toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={isChatOpen ? "default" : "ghost"}
                size="icon"
                className={`rounded-xl w-10 h-10 transition-all duration-200 ${isChatOpen ? 'bg-primary text-primary-foreground shadow-md' : 'hover:bg-primary/10 hover:text-primary'}`}
                onClick={handleChatClick}
              >
                <MessageCircle className="w-5 h-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">{ideaId ? "Community Chat" : "Chat"}</TooltipContent>
          </Tooltip>

          {/* Notification Bell */}
          <div className="flex items-center justify-center">
            <NotificationBell />
          </div>

          {/* Theme Toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-xl w-10 h-10 hover:bg-primary/10 hover:text-primary transition-all duration-200"
                onClick={toggleTheme}
              >
                {theme === "dark" ? (
                  <Moon className="w-5 h-5" />
                ) : (
                  <Sun className="w-5 h-5" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">Toggle Theme</TooltipContent>
          </Tooltip>

        </div>
      </TooltipProvider>
    </div>
  );
}
