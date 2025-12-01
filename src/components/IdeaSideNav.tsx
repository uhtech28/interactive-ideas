
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
  GitBranchPlus
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useTheme } from "next-themes";
import { useClerk } from "@clerk/nextjs";
import { useChat } from "@/components/chat/ChatContext";

interface IdeaSideNavProps {
  onOpenHierarchy: () => void;
  onOpenTodos: () => void;
  onOpenCalendar: () => void;
  todoCount?: number;
  className?: string;
  ideaId?: string;
  isContributor?: boolean;
  onCreateSubIdea?: () => void;
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
}: IdeaSideNavProps) {
  const { theme, setTheme } = useTheme();
  const { } = useClerk();
  const { toggleChat, isOpen: isChatOpen } = useChat();

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <div className={`flex flex-col items-center py-4 px-2 bg-card/80 backdrop-blur-md border border-border/50 shadow-2xl rounded-2xl gap-4 ${className}`}>
      <TooltipProvider delayDuration={0}>
        
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

        <div className="w-8 h-[1px] bg-border/50 my-1" />

        {/* Idea Specific Actions */}
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

        <div className="w-8 h-[1px] bg-border/50 my-1" />

        {/* Global Actions (from RightSidebar) */}
        
        {/* Chat Toggle */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant={isChatOpen ? "default" : "ghost"}
              size="icon" 
              className={`rounded-xl w-10 h-10 transition-all duration-200 ${isChatOpen ? 'bg-primary text-primary-foreground shadow-md' : 'hover:bg-primary/10 hover:text-primary'}`}
              onClick={toggleChat}
            >
              <MessageCircle className="w-5 h-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">Chat</TooltipContent>
        </Tooltip>

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

      </TooltipProvider>
    </div>
  );
}
