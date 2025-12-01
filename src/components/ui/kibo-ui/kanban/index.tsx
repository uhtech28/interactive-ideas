"use client";

import type {
  Announcements,
  DndContextProps,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
} from "@dnd-kit/core";
import {
  closestCenter,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { arrayMove, SortableContext, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Fragment,
  createContext,
  type HTMLAttributes,
  type ReactNode,
  useContext,
  useState,
} from "react";
import { createPortal } from "react-dom";
import tunnel from "tunnel-rat";
import { Card } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Edit, Grip, User, Trash2, MessageSquare, Paperclip, Plus } from "lucide-react";
import { format } from "date-fns";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { useToast } from "@/components/ui/use-toast";
import { useEffect } from "react";

type UserProfile = {
  _id: string;
  clerkId: string;
  username: string;
  displayName: string;
  avatar?: string;
};

const t = tunnel();

export type { DragEndEvent } from "@dnd-kit/core";

// Utility functions for task enhancements
function formatDeadlineDate(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const isTomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000).toDateString() === date.toDateString();
  const isYesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toDateString() === date.toDateString();

  if (isToday) return "Today";
  if (isTomorrow) return "Tomorrow";
  if (isYesterday) return "Yesterday";

  return format(date, "MMM dd");
}

function getDeadlineIndicator(deadline?: number, status?: string): { color: string; label: string } {
  if (!deadline) return { color: "secondary", label: "" };

  const now = Date.now();
  const diff = deadline - now;
  const hours = diff / (1000 * 60 * 60);

  if (status === "done") return { color: "green", label: "✓ Done" };
  if (diff < 0) return { color: "destructive", label: formatDeadlineDate(deadline) };
  if (hours < 24) return { color: "yellow", label: formatDeadlineDate(deadline) };
  return { color: "secondary", label: formatDeadlineDate(deadline) };
}

// Task Edit Dialog Component
type TaskEditDialogProps = {
  todo: KanbanItemProps;
  contributors?: UserProfile[];
  onClose: () => void;
  onSave: (updates: { assignedTo?: string; deadline?: number; completionTarget?: string }) => void;
};

function TaskEditDialog({ todo, contributors = [], onClose, onSave }: TaskEditDialogProps) {
  const [assignedTo, setAssignedTo] = useState(todo.assignedTo?._id || "unassigned");
  const [deadline, setDeadline] = useState<Date | undefined>(todo.deadline ? new Date(todo.deadline) : undefined);
  const [completionTarget, setCompletionTarget] = useState(todo.completionTarget || "");
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await onSave({
        assignedTo: assignedTo === "unassigned" ? undefined : assignedTo,
        deadline: deadline?.getTime(),
        completionTarget: completionTarget || undefined,
      });
      onClose();
    } catch (error) {
      console.error("Failed to save task updates:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DialogContent className="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>Edit Task</DialogTitle>
      </DialogHeader>
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="assignee" className="text-right">
            Assignee
          </Label>
          <Select value={assignedTo} onValueChange={setAssignedTo}>
            <SelectTrigger className="col-span-3">
              <SelectValue placeholder="Select assignee..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unassigned">Unassigned</SelectItem>
              {contributors.map((user) => (
                <SelectItem key={user._id} value={user._id}>
                  {user.displayName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="deadline" className="text-right">
            Deadline
          </Label>
          <Input
            id="deadline"
            type="date"
            value={deadline ? format(deadline, "yyyy-MM-dd") : ""}
            onChange={(e) => setDeadline(e.target.value ? new Date(e.target.value) : undefined)}
            className="col-span-3"
            min={new Date().toISOString().slice(0, 10)}
          />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="completionTarget" className="text-right">
            Target
          </Label>
          <Textarea
            id="completionTarget"
            placeholder="What needs to be completed..."
            value={completionTarget}
            onChange={(e) => setCompletionTarget(e.target.value)}
            className="col-span-3"
          />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={isLoading}>
          {isLoading ? "Saving..." : "Save"}
        </Button>
      </div>
    </DialogContent>
  );
}

type KanbanItemProps = {
  id: string;
  name: string;
  column: string;
  status?: "todo" | "in_progress" | "done";
  assignedTo?: { _id: string; name: string; username: string; avatar?: string };
  deadline?: number;
  completionTarget?: string;
  canDelete?: boolean;
  contributors?: UserProfile[];
} & Record<string, unknown>;

type KanbanColumnProps = {
  id: string;
  name: string;
} & Record<string, unknown>;

type KanbanContextProps<
  T extends KanbanItemProps = KanbanItemProps,
  C extends KanbanColumnProps = KanbanColumnProps,
> = {
  columns: C[];
  data: T[];
  activeCardId: string | null;
};

const KanbanContext = createContext<KanbanContextProps>({
  columns: [],
  data: [],
  activeCardId: null,
});

export type KanbanBoardProps = {
  id: string;
  children: ReactNode;
  className?: string;
};

export const KanbanBoard = ({ id, children, className }: KanbanBoardProps) => {
  const { isOver, setNodeRef } = useDroppable({
    id,
  });

  return (
    <div
      className={cn(
        "flex size-full flex-col overflow-hidden rounded-xl border bg-secondary/10 text-xs shadow-sm ring-1 ring-border/50 transition-all", // Lighter bg
        "min-h-[150px] h-fit",
        isOver ? "ring-2 ring-primary bg-primary/5" : "",
        className
      )}
      ref={setNodeRef}
    >
      {children}
    </div>
  );
};

export type KanbanCardProps<T extends KanbanItemProps = KanbanItemProps> = T & {
  children?: ReactNode;
  className?: string;
};

export const KanbanCard = <T extends KanbanItemProps = KanbanItemProps>({
  id,
  name,
  assignedTo,
  deadline,
  completionTarget,
  status,
  canDelete,
  canEdit = true, // Default to true for backward compatibility
  children,
  className,
  contributors,
  ...props
}: KanbanCardProps<T> & { canEdit?: boolean }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transition,
    transform,
    isDragging,
  } = useSortable({
    id,
    disabled: !canEdit,
  });
  const { activeCardId } = useContext(KanbanContext) as KanbanContextProps;
  const { toast } = useToast();

  const deadlineIndicator = getDeadlineIndicator(deadline, status);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const updateTodo = useMutation(api.todos.updateTodo);
  const deleteTodo = useMutation(api.todos.deleteTodo);

  const handleEditSave = async (updates: { assignedTo?: string; deadline?: number; completionTarget?: string }) => {
    try {
      await updateTodo({
        todoId: id as Id<"todos">,
        assignedTo: updates.assignedTo as Id<"users"> | undefined,
        deadline: updates.deadline,
        completionTarget: updates.completionTarget,
      });
      toast({
        title: "Task updated",
        description: "Task details have been successfully updated.",
      });
    } catch (error) {
      console.error("Failed to update task:", error);
      toast({
        title: "Update failed",
        description: "Failed to update task. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this todo?")) return;
    try {
      await deleteTodo({ todoId: id as Id<"todos"> });
      toast({
        title: "Task deleted",
        description: "Task has been successfully deleted.",
      });
    } catch (error) {
      console.error("Failed to delete task:", error);
      toast({
        title: "Delete failed",
        description: "Failed to delete task. Please try again.",
        variant: "destructive",
      });
    }
  };

  const style = {
    transition,
    transform: CSS.Transform.toString(transform),
  };

  const cardContent = (
    <Card
      className={cn(
        "cursor-default rounded-xl p-4 shadow-sm transition-all hover:shadow-md border-border/50 bg-card group relative",
        isDragging && "pointer-events-none cursor-grabbing opacity-50 scale-105 shadow-xl rotate-2",
        status === "done" && "opacity-70",
        className
      )}
    >
       {/* Drag Handle */}
       {canEdit && (
         <div {...listeners} className="absolute top-2 right-2 cursor-grab hover:bg-muted/50 rounded p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
           <Grip className="h-4 w-4 text-muted-foreground" />
         </div>
       )}

      <div className="space-y-3">
        {/* Header: Date Badge */}
        <div className="flex items-center justify-between">
           <div className={cn(
             "flex items-center gap-1.5 text-[10px] font-medium px-2 py-1 rounded-full w-fit",
             deadlineIndicator.color === "destructive" ? "bg-red-50 text-red-600" :
             deadlineIndicator.color === "yellow" ? "bg-yellow-50 text-yellow-600" :
             deadlineIndicator.color === "green" ? "bg-green-50 text-green-600" :
             "bg-muted text-muted-foreground"
           )}>
             <div className={cn("w-1.5 h-1.5 rounded-full", 
                deadlineIndicator.color === "destructive" ? "bg-red-500" :
                deadlineIndicator.color === "yellow" ? "bg-yellow-500" :
                deadlineIndicator.color === "green" ? "bg-green-500" :
                "bg-muted-foreground"
             )} />
             {deadline ? format(new Date(deadline), "MMM dd, yyyy") : "No deadline"}
           </div>
           
           {/* Actions */}
           <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
             <Button
               variant="ghost"
               size="icon"
               className="h-6 w-6"
               onClick={(e) => {
                 e.stopPropagation();
                 setIsEditDialogOpen(true);
               }}
             >
               <Edit className="h-3 w-3 text-muted-foreground" />
             </Button>
             {canDelete && (
               <Button
                 variant="ghost"
                 size="icon"
                 className="h-6 w-6 text-destructive hover:text-destructive/80 hover:bg-destructive/10"
                 onClick={(e) => {
                   e.stopPropagation();
                   handleDelete();
                 }}
               >
                 <Trash2 className="h-3 w-3" />
               </Button>
             )}
           </div>
        </div>

        {/* Title */}
        <div>
          <p className="font-semibold text-sm text-foreground leading-snug">{name}</p>
          {completionTarget && (
             <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{completionTarget}</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2">
          {/* Icons (Mocked for now, can be wired up) */}
          <div className="flex items-center gap-3 text-muted-foreground">
             <div className="flex items-center gap-1 text-xs">
               <MessageSquare className="w-3.5 h-3.5" />
               <span>0</span>
             </div>
             <div className="flex items-center gap-1 text-xs">
               <Paperclip className="w-3.5 h-3.5" />
               <span>0</span>
             </div>
          </div>

          {/* Assignee */}
          <div className="flex items-center gap-2">
            {assignedTo ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground font-medium hidden sm:inline-block">
                  {assignedTo.name?.split(' ')[0]}
                </span>
                <Avatar className="h-6 w-6 shrink-0 ring-1 ring-border">
                  <AvatarImage src={assignedTo.avatar} alt={assignedTo.name} />
                  <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                    {assignedTo.name
                      ? assignedTo.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
                      : assignedTo.username.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-muted-foreground/70">
                <User className="h-3.5 w-3.5" />
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );

  return (
    <>
      <div style={style} {...attributes} ref={setNodeRef} className="group">
        {cardContent}
      </div>
      {activeCardId === id && (
        <t.In>
          <Card
            className={cn(
              "cursor-grab gap-2 rounded-md p-1 shadow-sm ring-2 ring-primary",
              isDragging && "cursor-grabbing",
              className
            )}
          >
            {children ?? <p className="m-0 font-medium text-sm">{name}</p>}
          </Card>
        </t.In>
      )}

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <TaskEditDialog
          todo={{
            id,
            name,
            column: "todo",
            assignedTo,
            deadline,
            completionTarget,
            status,
            contributors,
          }}
          contributors={contributors}
          onClose={() => setIsEditDialogOpen(false)}
          onSave={handleEditSave}
        />
      </Dialog>
    </>
  );
};

export type KanbanCardsProps<T extends KanbanItemProps = KanbanItemProps> =
  Omit<HTMLAttributes<HTMLDivElement>, "children" | "id"> & {
    children: (item: T) => ReactNode;
    id: string;
    onAdd?: () => void;
  };

export const KanbanCards = <T extends KanbanItemProps = KanbanItemProps>({
  children,
  className,
  onAdd,
  ...props
}: KanbanCardsProps<T>) => {
  const { data } = useContext(KanbanContext) as KanbanContextProps<T>;
  const filteredData = data.filter((item) => item.column === props.id);
  const items = filteredData.map((item) => item.id);

  return (
    <ScrollArea className="flex-1 w-full h-full min-h-[100px]">
      <SortableContext items={items}>
        <div
          className={cn(
            "flex flex-col gap-3 p-3", // Increased gap and padding
            filteredData.length === 0 ? "min-h-[100px] h-full" : "",
            className
          )}
          {...props}
        >
          {filteredData.map((item) => <Fragment key={item.id}>{children(item)}</Fragment>)}
          
          {/* Add Task Button */}
          <Button 
            variant="ghost" 
            className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-muted/50 h-9 px-2 text-sm font-normal"
            onClick={onAdd}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add task
          </Button>
        </div>
      </SortableContext>
      <ScrollBar orientation="vertical" />
    </ScrollArea>
  );
};

export type KanbanHeaderProps = HTMLAttributes<HTMLDivElement> & {
  color?: "blue" | "orange" | "green" | "default";
  count?: number;
};

export const KanbanHeader = ({ className, color = "default", count, children, ...props }: KanbanHeaderProps) => {
  const colorStyles = {
    blue: "bg-blue-50 text-blue-700 border-blue-100",
    orange: "bg-orange-50 text-orange-700 border-orange-100",
    green: "bg-green-50 text-green-700 border-green-100",
    default: "bg-muted/30 text-muted-foreground/80 border-border/50",
  };

  return (
    <div className={cn("flex items-center justify-between m-0 p-3 font-semibold text-sm rounded-t-xl border-b", colorStyles[color], className)} {...props}>
      <span>{children}</span>
      {count !== undefined && (
        <span className="text-xs opacity-70 bg-white/40 px-2 py-0.5 rounded-full font-normal">{count}</span>
      )}
    </div>
  );
};

export type KanbanProviderProps<
  T extends KanbanItemProps = KanbanItemProps,
  C extends KanbanColumnProps = KanbanColumnProps,
> = Omit<DndContextProps, "children"> & {
  children: (column: C) => ReactNode;
  className?: string;
  columns: C[];
  data: T[];
  onDataChange?: (data: T[]) => void;
  onDragStart?: (event: DragStartEvent) => void;
  onDragEnd?: (event: DragEndEvent) => void;
  onDragOver?: (event: DragOverEvent) => void;
};

export const KanbanProvider = <
  T extends KanbanItemProps = KanbanItemProps,
  C extends KanbanColumnProps = KanbanColumnProps,
>({
  children,
  onDragStart,
  onDragEnd,
  onDragOver,
  className,
  columns,
  data,
  onDataChange,
  ...props
}: KanbanProviderProps<T, C>) => {
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const updateTodoStatus = useMutation(api.todos.updateTodoStatus);
  const checkDeadlinesAndNotify = useMutation(api.todos.checkDeadlinesAndNotify);
  const { toast } = useToast();

  // Check for deadline notifications when Kanban loads
  useEffect(() => {
    checkDeadlinesAndNotify();
  }, [checkDeadlinesAndNotify]);

  const sensors = useSensors(
    useSensor(MouseSensor),
    useSensor(TouchSensor),
    useSensor(KeyboardSensor)
  );

  const handleDragStart = (event: DragStartEvent) => {
    const card = data.find((item) => item.id === event.active.id);
    if (card) {
      setActiveCardId(event.active.id as string);
    }
    onDragStart?.(event);
  };

  const handleDragOver = async (event: DragOverEvent) => {
    const { active, over } = event;

    if (!over) {
      return;
    }

    const activeItem = data.find((item) => item.id === active.id);
    const overItem = data.find((item) => item.id === over.id);

    if (!activeItem) {
      return;
    }

    const activeColumn = activeItem.column;
    const overColumn =
      overItem?.column ||
      columns.find((col) => col.id === over.id)?.id ||
      columns[0]?.id;

    if (activeColumn !== overColumn) {
      try {
        // Update the backend first
        await updateTodoStatus({
          todoId: active.id as Id<"todos">,
          status: overColumn as "todo" | "in_progress" | "done",
        });

        // Then update local state
        let newData = [...data];
        const activeIndex = newData.findIndex((item) => item.id === active.id);
        const overIndex = newData.findIndex((item) => item.id === over.id);

        newData[activeIndex].column = overColumn;
        newData[activeIndex].status = overColumn as "todo" | "in_progress" | "done";
        newData = arrayMove(newData, activeIndex, overIndex);

        onDataChange?.(newData);

        toast({
          title: "Task status updated",
          description: `Task moved to ${overColumn.replace('_', ' ')}`,
        });
      } catch (error) {
        console.error("Failed to update task status:", error);
        toast({
          title: "Update failed",
          description: "Failed to update task status. Please try again.",
          variant: "destructive",
        });
      }
    }

    onDragOver?.(event);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveCardId(null);

    onDragEnd?.(event);

    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    let newData = [...data];

    const oldIndex = newData.findIndex((item) => item.id === active.id);
    const newIndex = newData.findIndex((item) => item.id === over.id);

    newData = arrayMove(newData, oldIndex, newIndex);

    onDataChange?.(newData);
  };

  const announcements: Announcements = {
    onDragStart({ active }) {
      const { name, column } = data.find((item) => item.id === active.id) ?? {};

      return `Picked up the card "${name}" from the "${column}" column`;
    },
    onDragOver({ active, over }) {
      const { name } = data.find((item) => item.id === active.id) ?? {};
      const newColumn = columns.find((column) => column.id === over?.id)?.name;

      return `Dragged the card "${name}" over the "${newColumn}" column`;
    },
    onDragEnd({ active, over }) {
      const { name } = data.find((item) => item.id === active.id) ?? {};
      const newColumn = columns.find((column) => column.id === over?.id)?.name;

      return `Dropped the card "${name}" into the "${newColumn}" column`;
    },
    onDragCancel({ active }) {
      const { name } = data.find((item) => item.id === active.id) ?? {};

      return `Cancelled dragging the card "${name}"`;
    },
  };

  return (
    <KanbanContext.Provider value={{ columns, data, activeCardId }}>
      <DndContext
        accessibility={{ announcements }}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
        onDragStart={handleDragStart}
        sensors={sensors}
        {...props}
      >
        <div
          className={cn(
               "grid size-full gap-4", // Increased gap
               "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
               className
             )}
        >
          {columns.map((column) => <Fragment key={column.id}>{children(column)}</Fragment>)}
        </div>
        {typeof window !== "undefined" &&
          createPortal(
            <DragOverlay>
              <t.Out />
            </DragOverlay>,
            document.body
          )}
      </DndContext>
    </KanbanContext.Provider>
  );
};
