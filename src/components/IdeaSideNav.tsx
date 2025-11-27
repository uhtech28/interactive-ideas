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
  LogOut
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
}

export function IdeaSideNav({
  onOpenHierarchy,
  onOpenTodos,
  onOpenCalendar,
  todoCount = 0,
}: IdeaSideNavProps) {
  const { theme, setTheme } = useTheme();
  const { signOut } = useClerk();
  const { toggleChat, isOpen: isChatOpen } = useChat();

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <div className="fixed right-6 top-1/2 -translate-y-1/2 flex flex-col items-center py-4 px-2 z-50 bg-card/80 backdrop-blur-md border border-border/50 shadow-2xl rounded-2xl gap-4">
      <TooltipProvider delayDuration={0}>
        
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

        {/* Create Idea */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button asChild variant="default" size="icon" className="rounded-xl w-10 h-10 bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg hover:scale-105 transition-all duration-200">
              <Link href="/create-idea">
                <Plus className="w-5 h-5" />
              </Link>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">Create Idea</TooltipContent>
        </Tooltip>

        <div className="w-8 h-[1px] bg-border/50 my-1" />

        {/* Sign Out */}
        <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="rounded-xl w-10 h-10 hover:bg-red-500/10 hover:text-red-500 transition-all duration-200"
                onClick={() => signOut()}
              >
                <LogOut className="w-5 h-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">Sign Out</TooltipContent>
          </Tooltip>

      </TooltipProvider>
    </div>
  );
}
