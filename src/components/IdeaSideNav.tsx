import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  GitBranch,
  ListTodo,
  Calendar,
  Plus,
  GitBranchPlus,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

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
  isContributor = false,
  onCreateSubIdea,
}: IdeaSideNavProps) {
  return (
    <div
      className={cn(
        // Always vertical column. Background/positioning provided by the parent
        // wrapper via the className prop (so the desktop and mobile-floating
        // versions can each style differently without fighting this component).
        "flex flex-col items-center gap-2 py-2 px-1.5 rounded-2xl",
        className
      )}
    >
      <TooltipProvider delayDuration={0}>

        {/* 1. Create Sub-Idea / Create Idea */}
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

        {/* 2. Hierarchy */}
        {onOpenHierarchy && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onOpenHierarchy}
                className="rounded-xl w-10 h-10 hover:bg-primary/10 hover:text-primary transition-all duration-200"
              >
                <GitBranch className="w-5 h-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">Hierarchy</TooltipContent>
          </Tooltip>
        )}

        {/* 3. Todos / Kanban */}
        {onOpenTodos && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onOpenTodos}
                className="rounded-xl w-10 h-10 hover:bg-primary/10 hover:text-primary relative transition-all duration-200"
              >
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
        )}

        {/* 4. Calendar */}
        {onOpenCalendar && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onOpenCalendar}
                className="rounded-xl w-10 h-10 hover:bg-primary/10 hover:text-primary transition-all duration-200"
              >
                <Calendar className="w-5 h-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">Calendar</TooltipContent>
          </Tooltip>
        )}
      </TooltipProvider>
    </div>
  );
}