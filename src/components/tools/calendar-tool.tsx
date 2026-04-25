"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Loader2,
  Check,
  Calendar as CalendarIcon,
  Clock,
  Milestone as MilestoneIcon,
  Trash2,
  Plus,
} from "lucide-react";
import {
  format,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
} from "date-fns";

interface CalendarEvent {
  id: string;
  type: "event" | "milestone";
  date: Date;
  time?: string;
  title: string;
  description: string;
}

interface CalendarToolProps {
  prompt: string;
  onSubmit: (content: {
    events: CalendarEvent[];
    view: string;
    timestamp: number;
  }) => void;
  initialContent?: { events: CalendarEvent[]; view: string; timestamp: number };
  isSubmitting?: boolean;
}

export function CalendarTool({
  prompt,
  onSubmit,
  initialContent,
  isSubmitting,
}: CalendarToolProps) {
  const [view, setView] = useState<"week" | "month">("month");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>(
    initialContent?.events?.map((e) => ({ ...e, date: new Date(e.date) })) ||
      [],
  );

  // Form state
  const [showEventForm, setShowEventForm] = useState(false);
  const [showMilestoneForm, setShowMilestoneForm] = useState(false);
  const [eventFormData, setEventFormData] = useState({
    date: new Date(),
    time: "",
    title: "",
    description: "",
  });
  const [milestoneFormData, setMilestoneFormData] = useState({
    date: new Date(),
    title: "",
    description: "",
  });

  const addEvent = () => {
    if (!eventFormData.title.trim()) return;

    const newEvent: CalendarEvent = {
      id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: "event",
      date: eventFormData.date,
      time: eventFormData.time,
      title: eventFormData.title.trim(),
      description: eventFormData.description.trim(),
    };

    setEvents([...events, newEvent]);
    setEventFormData({
      date: new Date(),
      time: "",
      title: "",
      description: "",
    });
    setShowEventForm(false);
  };

  const addMilestone = () => {
    if (!milestoneFormData.title.trim()) return;

    const newMilestone: CalendarEvent = {
      id: `milestone-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: "milestone",
      date: milestoneFormData.date,
      title: milestoneFormData.title.trim(),
      description: milestoneFormData.description.trim(),
    };

    setEvents([...events, newMilestone]);
    setMilestoneFormData({ date: new Date(), title: "", description: "" });
    setShowMilestoneForm(false);
  };

  const deleteEvent = (id: string) => {
    setEvents(events.filter((e) => e.id !== id));
  };

  const getEventsForDate = (date: Date) => {
    return events.filter((e) => isSameDay(e.date, date));
  };

  const getWeekDays = () => {
    const start = startOfWeek(selectedDate, { weekStartsOn: 0 });
    const end = endOfWeek(selectedDate, { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  };

  const handleSubmit = () => {
    if (events.length === 0) return;
    onSubmit({
      events,
      view,
      timestamp: Date.now(),
    });
  };

  const sortedEvents = [...events].sort(
    (a, b) => a.date.getTime() - b.date.getTime(),
  );
  const hasEvents = events.some((e) => e.type === "event");
  const hasMilestones = events.some((e) => e.type === "milestone");

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5" />
          <CardTitle>Calendar Planning</CardTitle>
        </div>
        <CardDescription>{prompt}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* View Toggle */}
        <div className="flex items-center justify-between">
          <Tabs
            value={view}
            onValueChange={(v) => setView(v as "week" | "month")}
          >
            <TabsList>
              <TabsTrigger value="week">Week View</TabsTrigger>
              <TabsTrigger value="month">Month View</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="text-sm text-muted-foreground">
            {events.length} {events.length === 1 ? "item" : "items"}
          </div>
        </div>

        {/* Calendar Display */}
        <div className="border rounded-lg p-4 bg-muted/30">
          {view === "month" ? (
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date: Date | undefined) =>
                date && setSelectedDate(date)
              }
              className="mx-auto"
              modifiers={{
                hasEvent: (date: Date) => getEventsForDate(date).length > 0,
              }}
              modifiersClassNames={{
                hasEvent:
                  "font-bold underline decoration-2 decoration-blue-500",
              }}
            />
          ) : (
            <div className="space-y-2">
              <div className="text-center font-semibold mb-4">
                Week of{" "}
                {format(
                  startOfWeek(selectedDate, { weekStartsOn: 0 }),
                  "MMM d, yyyy",
                )}
              </div>
              <div className="grid grid-cols-7 gap-2">
                {getWeekDays().map((day) => {
                  const dayEvents = getEventsForDate(day);
                  const isToday = isSameDay(day, new Date());
                  const isSelected = isSameDay(day, selectedDate);

                  return (
                    <div
                      key={day.toISOString()}
                      className={`p-2 border rounded-md cursor-pointer transition-colors ${
                        isSelected
                          ? "bg-primary text-primary-foreground border-primary"
                          : isToday
                            ? "bg-accent border-primary/20 font-bold"
                            : "hover:bg-muted"
                      }`}
                      onClick={() => setSelectedDate(day)}
                    >
                      <div className="text-xs font-semibold mb-1">
                        {format(day, "EEE")}
                      </div>
                      <div className={`text-lg ${isToday ? "font-bold" : ""}`}>
                        {format(day, "d")}
                      </div>
                      {dayEvents.length > 0 && (
                        <div className="mt-1 flex gap-1">
                          {dayEvents.map((evt) => (
                            <div
                              key={evt.id}
                              className={`w-2 h-2 rounded-full ${
                                evt.type === "event"
                                  ? "bg-blue-500"
                                  : "bg-amber-500"
                              }`}
                              title={evt.title}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Quick Add Buttons */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setShowEventForm(!showEventForm);
              setShowMilestoneForm(false);
            }}
            className="flex-1"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Event
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setShowMilestoneForm(!showMilestoneForm);
              setShowEventForm(false);
            }}
            className="flex-1"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Milestone
          </Button>
        </div>

        {/* Event Form */}
        {showEventForm && (
          <Card className="border-blue-200 dark:border-blue-900">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2 text-blue-600 dark:text-blue-400">
                <Clock className="h-4 w-4" />
                New Event
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label>Date *</Label>
                <Calendar
                  mode="single"
                  selected={eventFormData.date}
                  onSelect={(date: Date | undefined) =>
                    date && setEventFormData({ ...eventFormData, date })
                  }
                  className="border rounded-md p-2"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="event-time">Time (optional)</Label>
                <Input
                  id="event-time"
                  type="time"
                  value={eventFormData.time}
                  onChange={(e) =>
                    setEventFormData({ ...eventFormData, time: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="event-title">Title *</Label>
                <Input
                  id="event-title"
                  placeholder="e.g., Team Meeting, Product Launch"
                  value={eventFormData.title}
                  onChange={(e) =>
                    setEventFormData({
                      ...eventFormData,
                      title: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="event-description">Description</Label>
                <Textarea
                  id="event-description"
                  placeholder="Event details..."
                  value={eventFormData.description}
                  onChange={(e) =>
                    setEventFormData({
                      ...eventFormData,
                      description: e.target.value,
                    })
                  }
                  rows={3}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={addEvent}
                  disabled={!eventFormData.title.trim()}
                  className="flex-1"
                >
                  <Check className="h-4 w-4 mr-1" />
                  Add Event
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowEventForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Milestone Form */}
        {showMilestoneForm && (
          <Card className="border-amber-200 dark:border-amber-900">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2 text-amber-600 dark:text-amber-400">
                <MilestoneIcon className="h-4 w-4" />
                New Milestone
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label>Date *</Label>
                <Calendar
                  mode="single"
                  selected={milestoneFormData.date}
                  onSelect={(date: Date | undefined) =>
                    date && setMilestoneFormData({ ...milestoneFormData, date })
                  }
                  className="border rounded-md p-2"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="milestone-title">Title *</Label>
                <Input
                  id="milestone-title"
                  placeholder="e.g., Project Completion, Deadline"
                  value={milestoneFormData.title}
                  onChange={(e) =>
                    setMilestoneFormData({
                      ...milestoneFormData,
                      title: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="milestone-description">Description</Label>
                <Textarea
                  id="milestone-description"
                  placeholder="Milestone details..."
                  value={milestoneFormData.description}
                  onChange={(e) =>
                    setMilestoneFormData({
                      ...milestoneFormData,
                      description: e.target.value,
                    })
                  }
                  rows={3}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={addMilestone}
                  disabled={!milestoneFormData.title.trim()}
                  className="flex-1"
                >
                  <Check className="h-4 w-4 mr-1" />
                  Add Milestone
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowMilestoneForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Events and Milestones List */}
        {sortedEvents.length > 0 && (
          <div className="space-y-2">
            <Label className="text-base">Scheduled Items</Label>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {sortedEvents.map((item) => (
                <div
                  key={item.id}
                  className={`p-3 border rounded-lg ${
                    item.type === "event"
                      ? "border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/30"
                      : "border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        {item.type === "event" ? (
                          <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        ) : (
                          <MilestoneIcon className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                        )}
                        <span className="font-semibold">{item.title}</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {format(item.date, "EEEE, MMMM d, yyyy")}
                        {item.time && ` at ${item.time}`}
                      </div>
                      {item.description && (
                        <p className="text-sm mt-1">{item.description}</p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => deleteEvent(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Summary */}
        <div className="flex items-center justify-between text-sm border-t pt-3">
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span className="text-muted-foreground">
                {hasEvents
                  ? events.filter((e) => e.type === "event").length
                  : 0}{" "}
                Events
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-amber-500" />
              <span className="text-muted-foreground">
                {hasMilestones
                  ? events.filter((e) => e.type === "milestone").length
                  : 0}{" "}
                Milestones
              </span>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <Button
          onClick={handleSubmit}
          disabled={events.length === 0 || isSubmitting}
          className="w-full"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <Check className="mr-2 h-4 w-4" />
              Submit Calendar ({events.length}{" "}
              {events.length === 1 ? "item" : "items"})
            </>
          )}
        </Button>

        {events.length === 0 && (
          <p className="text-xs text-center text-muted-foreground">
            Add at least one event or milestone to submit
          </p>
        )}
      </CardContent>
    </Card>
  );
}
