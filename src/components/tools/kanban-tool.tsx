"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Loader2, Check, Plus, Trash2, ChevronLeft, ChevronRight, LayoutDashboard } from "lucide-react"

interface KanbanCard {
  id: string
  title: string
  column: "todo" | "inprogress" | "done"
}

interface KanbanToolProps {
  prompt: string
  onSubmit: (content: { cards: KanbanCard[]; columns: string[]; timestamp: number }) => void
  initialContent?: { cards: KanbanCard[]; columns: string[]; timestamp: number }
  isSubmitting?: boolean
}

export function KanbanTool({ prompt, onSubmit, initialContent, isSubmitting }: KanbanToolProps) {
  const [cards, setCards] = useState<KanbanCard[]>(initialContent?.cards || [])
  const [newCardTitle, setNewCardTitle] = useState("")
  const [activeColumn, setActiveColumn] = useState<"todo" | "inprogress" | "done">("todo")

  const columns: { id: "todo" | "inprogress" | "done"; label: string; color: string }[] = [
    { id: "todo", label: "To Do", color: "bg-slate-100 dark:bg-slate-900" },
    { id: "inprogress", label: "In Progress", color: "bg-blue-100 dark:bg-blue-950" },
    { id: "done", label: "Done", color: "bg-green-100 dark:bg-green-950" },
  ]

  const addCard = () => {
    if (!newCardTitle.trim()) return
    const newCard: KanbanCard = {
      id: `card-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: newCardTitle.trim(),
      column: activeColumn,
    }
    setCards([...cards, newCard])
    setNewCardTitle("")
  }

  const deleteCard = (cardId: string) => {
    setCards(cards.filter((c) => c.id !== cardId))
  }

  const moveCard = (cardId: string, direction: "left" | "right") => {
    setCards(
      cards.map((card) => {
        if (card.id !== cardId) return card

        const currentIndex = columns.findIndex((col) => col.id === card.column)
        const newIndex = direction === "left" ? currentIndex - 1 : currentIndex + 1

        if (newIndex < 0 || newIndex >= columns.length) return card

        return { ...card, column: columns[newIndex].id }
      })
    )
  }

  const getCardsForColumn = (columnId: "todo" | "inprogress" | "done") => {
    return cards.filter((card) => card.column === columnId)
  }

  const handleSubmit = () => {
    onSubmit({
      cards,
      columns: columns.map((c) => c.label),
      timestamp: Date.now(),
    })
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <LayoutDashboard className="h-5 w-5" />
          <CardTitle>Kanban Board</CardTitle>
        </div>
        <CardDescription>{prompt}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add Card Section */}
        <div className="space-y-2">
          <Label>Add New Card</Label>
          <div className="flex gap-2">
            <Input
              placeholder="Enter task or item..."
              value={newCardTitle}
              onChange={(e) => setNewCardTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addCard()}
            />
            <select
              value={activeColumn}
              onChange={(e) => setActiveColumn(e.target.value as "todo" | "inprogress" | "done")}
              className="px-3 py-2 border rounded-md text-sm bg-background"
            >
              {columns.map((col) => (
                <option key={col.id} value={col.id}>
                  {col.label}
                </option>
              ))}
            </select>
            <Button onClick={addCard} size="icon" disabled={!newCardTitle.trim()}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Kanban Board */}
        <div className="grid grid-cols-3 gap-3">
          {columns.map((column, columnIndex) => (
            <div key={column.id} className="space-y-2">
              <div className={`p-2 rounded-md ${column.color}`}>
                <h3 className="text-sm font-semibold text-center">{column.label}</h3>
                <p className="text-xs text-center text-muted-foreground">
                  {getCardsForColumn(column.id).length} {getCardsForColumn(column.id).length === 1 ? 'card' : 'cards'}
                </p>
              </div>
              <div className="space-y-2 min-h-[200px]">
                {getCardsForColumn(column.id).map((card) => (
                  <div
                    key={card.id}
                    className="p-2 border rounded-md bg-background shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="text-sm mb-2">{card.title}</div>
                    <div className="flex items-center justify-between gap-1">
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => moveCard(card.id, "left")}
                          disabled={columnIndex === 0}
                          title="Move left"
                        >
                          <ChevronLeft className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => moveCard(card.id, "right")}
                          disabled={columnIndex === columns.length - 1}
                          title="Move right"
                        >
                          <ChevronRight className="h-3 w-3" />
                        </Button>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-destructive"
                        onClick={() => deleteCard(card.id)}
                        title="Delete card"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground mb-3">
            Total cards: {cards.length} | Use arrows to move cards between columns
          </p>
          <Button
            onClick={handleSubmit}
            disabled={cards.length === 0 || isSubmitting}
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
                Submit Board
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
