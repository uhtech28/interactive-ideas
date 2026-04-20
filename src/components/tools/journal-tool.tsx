"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Loader2, Check, BookOpen } from "lucide-react"

interface JournalToolProps {
  prompt: string
  onSubmit: (content: { title: string; entry: string; wordCount: number; timestamp: number }) => void
  initialContent?: { title: string; entry: string; wordCount: number; timestamp: number }
  isSubmitting?: boolean
}

export function JournalTool({ prompt, onSubmit, initialContent, isSubmitting }: JournalToolProps) {
  const [title, setTitle] = useState(initialContent?.title || "")
  const [entry, setEntry] = useState(initialContent?.entry || "")
  const wordCount = entry.trim() ? entry.trim().split(/\s+/).length : 0

  const handleSubmit = () => {
    if (!entry.trim()) return
    onSubmit({
      title: title.trim() || "Untitled Entry",
      entry,
      wordCount,
      timestamp: Date.now(),
    })
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          <CardTitle>Journal Entry</CardTitle>
        </div>
        <CardDescription>{prompt}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="journal-title">Entry Title (optional)</Label>
          <Input
            id="journal-title"
            placeholder="Give your entry a title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="journal-entry">Your Journal Entry</Label>
          <Textarea
            id="journal-entry"
            placeholder="What's on your mind? Reflect on your progress, challenges, insights, or learnings..."
            value={entry}
            onChange={(e) => setEntry(e.target.value)}
            className="min-h-[300px] resize-y"
          />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{wordCount} words</span>
            <span>💡 Tip: Use markdown formatting (# headers, **bold**, *italic*)</span>
          </div>
        </div>
        <Button
          onClick={handleSubmit}
          disabled={!entry.trim() || isSubmitting}
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
              Submit Entry
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
