import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SkillsMultiSelect } from "@/components/SkillsMultiSelect";
import { IndustriesMultiSelect } from "@/components/IndustriesMultiSelect";
import { Spinner } from "@/components/ui/spinner";
import { Id } from "@convex/_generated/dataModel";

interface CreateSubIdeaDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  parentId: Id<"ideas">;
  addSubIdeaMutation: (args: {
    parentId: Id<"ideas">;
    title: string;
    description: string;
    category: string;
    industries?: string;
    visibility: string;
  }) => Promise<{ subIdeaId: Id<"ideas">; message: string }>;
}

export function CreateSubIdeaDialog({
  isOpen,
  onOpenChange,
  parentId,
  addSubIdeaMutation,
}: CreateSubIdeaDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [industries, setIndustries] = useState<string[]>([]);
  const [visibility, setVisibility] = useState("public");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || skills.length === 0 || industries.length === 0 || isSubmitting) return;

    setIsSubmitting(true);
    setError("");

    try {
      await addSubIdeaMutation({
        parentId,
        title: title.trim(),
        description: description.trim(),
        category: skills.join(', '),
        industries: industries.length > 0 ? industries.join(', ') : undefined,
        visibility,
      });

      // Reset form and close modal
      setTitle("");
      setDescription("");
      setSkills([]);
      setIndustries([]);
      setVisibility("public");
      onOpenChange(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create sub-idea");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Sub-Idea</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Frontend Architecture"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the sub-idea..."
              className="min-h-[100px]"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Required Skills</Label>
              <SkillsMultiSelect
                selectedSkills={skills}
                onChange={setSkills}
                placeholder="Select skills..."
              />
            </div>
            <div className="space-y-2">
              <Label>Relevant Industries</Label>
              <IndustriesMultiSelect
                selectedIndustries={industries}
                onChange={setIndustries}
                placeholder="Select industries..."
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="visibility">Visibility</Label>
            <Select value={visibility} onValueChange={setVisibility}>
              <SelectTrigger>
                <SelectValue placeholder="Select visibility" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">Public</SelectItem>
                <SelectItem value="contributors_only">Contributors Only</SelectItem>
                <SelectItem value="private">Private</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {error && <p className="text-destructive text-sm">{error}</p>}

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !title || !description || skills.length === 0 || industries.length === 0}>
              {isSubmitting ? <Spinner size={16} className="mr-2" /> : null}
              Create Sub-Idea
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
