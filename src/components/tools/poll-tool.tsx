"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Loader2, Check, Plus, Trash2 } from "lucide-react"

interface PollToolProps {
  prompt: string
  onSubmit: (content: { question: string; options: string[] }) => void
  initialContent?: { question: string; options: string[] }
  isSubmitting?: boolean
}

export function PollTool({ prompt, onSubmit, initialContent, isSubmitting }: PollToolProps) {
  const [question, setQuestion] = useState(initialContent?.question || "")
  const [options, setOptions] = useState<string[]>(
    initialContent?.options || ["", ""]
  )

  const addOption = () => setOptions([...options, ""])
  const removeOption = (index: number) => {
    if (options.length <= 2) return
    setOptions(options.filter((_, i) => i !== index))
  }
  const updateOption = (index: number, value: string) => {
    setOptions(options.map((o, i) => (i === index ? value : o)))
  }

  const handleSubmit = () => {
    if (!question.trim() || options.some((o) => !o.trim())) return
    onSubmit({ question, options })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create a Poll</CardTitle>
        <CardDescription>{prompt}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="poll-question">Question</Label>
          <Input
            id="poll-question"
            placeholder="What would you like to ask?"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Options</Label>
          {options.map((option, index) => (
            <div key={index} className="flex items-center gap-2">
              <Input
                placeholder={`Option ${index + 1}`}
                value={option}
                onChange={(e) => updateOption(index, e.target.value)}
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeOption(index)}
                disabled={options.length <= 2}
                className="h-9 w-9 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button variant="outline" onClick={addOption} size="sm">
            <Plus className="mr-1 h-4 w-4" />
            Add Option
          </Button>
        </div>
        <Button
          onClick={handleSubmit}
          disabled={!question.trim() || options.some((o) => !o.trim()) || isSubmitting}
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
              Submit Poll
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
