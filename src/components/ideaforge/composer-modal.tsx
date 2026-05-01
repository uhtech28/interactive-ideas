"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import {
  codeFontClass,
  composerCategories,
  ComposerDraft,
  displayFontClass,
  stageOptions,
  transitionBase,
} from "@/components/ideaforge/shared";

export function ComposerModal({
  open,
  onOpenChange,
  initialDraft,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialDraft?: Partial<ComposerDraft>;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [tagInput, setTagInput] = useState("");
  const [draft, setDraft] = useState<ComposerDraft>({
    title: initialDraft?.title || "",
    description: initialDraft?.description || "",
    tags: initialDraft?.tags || [],
    category: initialDraft?.category || composerCategories[0],
    stage: initialDraft?.stage || stageOptions[0],
  });

  useEffect(() => {
    if (open) {
      setDraft({
        title: initialDraft?.title || "",
        description: initialDraft?.description || "",
        tags: initialDraft?.tags || [],
        category: initialDraft?.category || composerCategories[0],
        stage: initialDraft?.stage || stageOptions[0],
      });
      setTagInput("");
    }
  }, [initialDraft, open]);

  const commitDraft = (storageKey: string, message: string) => {
    const payload = JSON.stringify(draft);
    window.sessionStorage.setItem(storageKey, payload);
    if (storageKey === "ideaforge-composer-draft") {
      window.localStorage.setItem(storageKey, payload);
    }
    toast({
      title: message,
      description:
        storageKey === "ideaforge-composer-publish"
          ? "We moved your draft into the full editor so you can finish publishing without losing work."
          : "Your draft is saved locally in this browser.",
    });
  };

  const addTag = () => {
    const normalized = tagInput.trim();
    if (!normalized || draft.tags.includes(normalized)) return;
    setDraft((current) => ({ ...current, tags: [...current.tags, normalized] }));
    setTagInput("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="top-2 left-2 right-2 bottom-2 translate-x-0 translate-y-0 flex h-[calc(100dvh-1rem)] w-[calc(100%-1rem)] max-w-none flex-col gap-0 overflow-hidden rounded-[20px] border border-white/10 bg-[#0F1726] p-0 text-[#F9FAFB] shadow-[0_24px_80px_rgba(3,7,18,0.65)] lg:top-1/2 lg:left-1/2 lg:right-auto lg:bottom-auto lg:translate-x-[-50%] lg:translate-y-[-50%] lg:h-auto lg:max-h-[90vh] lg:w-[min(100%-1.5rem,760px)] lg:max-w-[760px] lg:rounded-[24px]">
        <DialogHeader className="shrink-0 border-b border-white/8 px-4 py-3 pr-12 text-left lg:px-6 lg:py-5">
          <DialogTitle className={cn(displayFontClass, "text-base font-semibold lg:text-[1.4rem]")}>
            Post an Idea
          </DialogTitle>
          <DialogDescription className="hidden text-sm text-[#9CA3AF] lg:block">
            Start with a crisp concept here, then hand off to the full InteractiveIdeas
            publishing flow when you are ready.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3 lg:space-y-5 lg:px-6 lg:py-6">
          <div className="space-y-1 lg:space-y-2">
            <label className="text-xs font-medium text-[#F9FAFB] lg:text-sm">Title</label>
            <Input
              value={draft.title}
              onChange={(event) =>
                setDraft((current) => ({ ...current, title: event.target.value }))
              }
              placeholder="What are you building?"
              className={cn(
                displayFontClass,
                "h-10 rounded-[12px] border-white/10 bg-white/[0.03] text-sm text-white placeholder:text-[#6B7280] focus-visible:ring-2 focus-visible:ring-[#6366F1] lg:h-12 lg:rounded-[14px] lg:text-lg"
              )}
            />
          </div>

          <div className="space-y-1 lg:space-y-2">
            <label className="text-xs font-medium text-[#F9FAFB] lg:text-sm">Description</label>
            <Textarea
              value={draft.description}
              onChange={(event) =>
                setDraft((current) => ({ ...current, description: event.target.value }))
              }
              placeholder="Describe the problem, the spark, and why now."
              className="min-h-[80px] rounded-[12px] border-white/10 bg-white/[0.03] text-sm text-white placeholder:text-[#6B7280] focus-visible:ring-2 focus-visible:ring-[#6366F1] lg:min-h-[140px] lg:rounded-[16px] lg:text-base"
            />
          </div>

          <div className="grid gap-3 md:grid-cols-2 lg:gap-5">
            <div className="space-y-1 lg:space-y-2">
              <label className="text-xs font-medium text-[#F9FAFB] lg:text-sm">Tag Selector</label>
              <div className="rounded-[12px] border border-white/10 bg-white/[0.03] p-2 lg:rounded-[16px] lg:p-3">
                {draft.tags.length > 0 && (
                  <div className="mb-2 flex flex-wrap gap-1.5 lg:mb-3 lg:gap-2">
                    {draft.tags.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() =>
                          setDraft((current) => ({
                            ...current,
                            tags: current.tags.filter((entry) => entry !== tag),
                          }))
                        }
                        className={cn(
                          codeFontClass,
                          transitionBase,
                          "rounded-full border border-[#6366F1]/30 bg-[#6366F1]/12 px-3 py-1 text-[11px] text-[#C7D2FE] hover:border-[#8B5CF6]/60 hover:bg-[#8B5CF6]/16"
                        )}
                      >
                        {tag} x
                      </button>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <Input
                    value={tagInput}
                    onChange={(event) => setTagInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        addTag();
                      }
                    }}
                    placeholder="Type a tag and press Enter"
                    className="h-9 rounded-[10px] border-white/10 bg-[#0A0D12] text-sm text-white placeholder:text-[#6B7280] lg:h-10 lg:rounded-[12px]"
                  />
                  <Button
                    type="button"
                    onClick={addTag}
                    className="h-9 rounded-[10px] bg-[#6366F1] px-3 text-sm text-white hover:bg-[#8B5CF6] lg:h-10 lg:rounded-[12px] lg:px-4"
                  >
                    Add
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid gap-3 lg:gap-5">
              <div className="space-y-1 lg:space-y-2">
                <label className="text-xs font-medium text-[#F9FAFB] lg:text-sm">Category</label>
                <select
                  value={draft.category}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, category: event.target.value }))
                  }
                  className="h-9 w-full rounded-[12px] border border-white/10 bg-white/[0.03] px-3 text-sm text-white outline-none ring-0 transition-all duration-200 focus:border-[#6366F1] lg:h-11 lg:rounded-[14px] lg:px-4"
                >
                  {composerCategories.map((category) => (
                    <option key={category} value={category} className="bg-[#111827] text-white">
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1 lg:space-y-2">
                <label className="text-xs font-medium text-[#F9FAFB] lg:text-sm">Stage</label>
                <select
                  value={draft.stage}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, stage: event.target.value }))
                  }
                  className="h-9 w-full rounded-[12px] border border-white/10 bg-white/[0.03] px-3 text-sm text-white outline-none ring-0 transition-all duration-200 focus:border-[#6366F1] lg:h-11 lg:rounded-[14px] lg:px-4"
                >
                  {stageOptions.map((stage) => (
                    <option key={stage} value={stage} className="bg-[#111827] text-white">
                      {stage}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              commitDraft("ideaforge-composer-publish", "Draft moved to publisher");
              onOpenChange(false);
              router.push("/create-idea");
            }}
            className={cn(
              transitionBase,
              "group flex w-full items-center justify-between rounded-[14px] border border-dashed border-white/12 bg-white/[0.02] px-3 py-3 text-left hover:border-[#6366F1]/50 hover:bg-[#6366F1]/6 lg:rounded-[18px] lg:px-5 lg:py-5"
            )}
          >
            <div className="min-w-0 flex-1">
              <div className={cn(displayFontClass, "text-sm font-semibold text-white lg:text-base")}>
                Add an image
              </div>
              <p className="mt-0.5 text-xs leading-snug text-[#9CA3AF] lg:mt-1 lg:text-sm">
                Continue in the full publisher to upload a banner or screenshot.
              </p>
            </div>
            <div className="ml-3 shrink-0 rounded-xl border border-white/10 bg-[#111827] p-2 text-[#C7D2FE] group-hover:border-[#6366F1]/50 lg:rounded-2xl lg:p-3">
              <ImagePlus className="h-4 w-4 lg:h-5 lg:w-5" />
            </div>
          </button>
        </div>

        <DialogFooter className="shrink-0 flex-row flex-wrap justify-end gap-2 border-t border-white/8 px-3 py-2 lg:px-6 lg:py-5">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="h-8 rounded-[10px] px-3 text-xs text-[#9CA3AF] hover:bg-white/[0.04] hover:text-white lg:h-9 lg:px-4 lg:text-sm"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => commitDraft("ideaforge-composer-draft", "Draft saved")}
            className="h-8 rounded-[10px] border-white/10 bg-white/[0.03] px-3 text-xs text-white hover:border-[#6366F1]/40 hover:bg-[#6366F1]/10 lg:h-9 lg:px-4 lg:text-sm"
          >
            Save Draft
          </Button>
          <Button
            type="button"
            onClick={() => {
              commitDraft("ideaforge-composer-publish", "Draft moved to publisher");
              onOpenChange(false);
              router.push("/create-idea");
            }}
            className="h-8 rounded-[10px] bg-[#6366F1] px-3 text-xs text-white hover:bg-[#8B5CF6] focus-visible:ring-2 focus-visible:ring-[#6366F1] lg:h-9 lg:px-5 lg:text-sm"
          >
            Publish Idea -&gt;
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}