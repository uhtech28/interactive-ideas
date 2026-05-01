"use client"

import { useState, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Loader2, Check, Plus, Trash2, Move } from "lucide-react"

interface CanvasNode {
  id: string
  x: number
  y: number
  label: string
  color: string
}

interface CanvasEdge {
  from: string
  to: string
}

interface MapToolProps {
  prompt: string
  onSubmit: (content: { nodes: CanvasNode[]; edges: CanvasEdge[] }) => void
  initialContent?: { nodes: CanvasNode[]; edges: CanvasEdge[] }
  isSubmitting?: boolean
}

const NODE_COLORS = [
  "#3B82F6", "#10B981", "#F59E0B", "#EF4444",
  "#8B5CF6", "#EC4899", "#06B6D4", "#F97316",
]

export function MapTool({ prompt, onSubmit, initialContent, isSubmitting }: MapToolProps) {
  const [nodes, setNodes] = useState<CanvasNode[]>(
    initialContent?.nodes || [
      { id: "1", x: 100, y: 100, label: "Start", color: NODE_COLORS[0] },
    ]
  )
  const [edges, setEdges] = useState<CanvasEdge[]>(initialContent?.edges || [])
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null)
  const [dragging, setDragging] = useState<string | null>(null)
  const canvasRef = useRef<HTMLDivElement>(null)

  const addNode = () => {
    const newNode: CanvasNode = {
      id: Date.now().toString(),
      x: 150 + Math.random() * 200,
      y: 100 + Math.random() * 200,
      label: `Node ${nodes.length + 1}`,
      color: NODE_COLORS[nodes.length % NODE_COLORS.length],
    }
    setNodes([...nodes, newNode])
  }

  const removeNode = (id: string) => {
    setNodes(nodes.filter((n) => n.id !== id))
    setEdges(edges.filter((e) => e.from !== id && e.to !== id))
  }

  const updateNodeLabel = (id: string, label: string) => {
    setNodes(nodes.map((n) => (n.id === id ? { ...n, label } : n)))
  }

  const startConnection = (id: string) => {
    setConnectingFrom(id)
  }

  const endConnection = (id: string) => {
    if (connectingFrom && connectingFrom !== id) {
      const exists = edges.some(
        (e) => e.from === connectingFrom && e.to === id
      )
      if (!exists) {
        setEdges([...edges, { from: connectingFrom, to: id }])
      }
    }
    setConnectingFrom(null)
  }

  const handleMouseDown = (id: string, e: React.MouseEvent) => {
    e.preventDefault()
    setDragging(id)
  }

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!dragging || !canvasRef.current) return
      const rect = canvasRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      setNodes(
        nodes.map((n) => (n.id === dragging ? { ...n, x, y } : n))
      )
    },
    [dragging, nodes]
  )

  const handleMouseUp = () => {
    setDragging(null)
  }

  const handleSubmit = () => {
    const allLabeled = nodes.every((n) => n.label.trim())
    if (!allLabeled || nodes.length < 2) return
    onSubmit({ nodes, edges })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Map Your Canvas</CardTitle>
        <CardDescription>{prompt}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Canvas */}
        <div
          ref={canvasRef}
          className="relative w-full h-[300px] border rounded-lg bg-muted/30 overflow-hidden"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Edges */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            {edges.map((edge, i) => {
              const fromNode = nodes.find((n) => n.id === edge.from)
              const toNode = nodes.find((n) => n.id === edge.to)
              if (!fromNode || !toNode) return null
              return (
                <line
                  key={i}
                  x1={fromNode.x + 40}
                  y1={fromNode.y + 20}
                  x2={toNode.x + 40}
                  y2={toNode.y + 20}
                  stroke="hsl(var(--muted-foreground))"
                  strokeWidth="2"
                  strokeDasharray="4"
                />
              )
            })}
          </svg>

          {/* Nodes */}
          {nodes.map((node) => (
            <div
              key={node.id}
              className={`absolute cursor-move select-none ${
                connectingFrom === node.id ? "ring-2 ring-primary" : ""
              }`}
              style={{ left: node.x, top: node.y }}
              onMouseDown={(e) => handleMouseDown(node.id, e)}
              onClick={() => {
                if (connectingFrom) {
                  endConnection(node.id)
                }
              }}
            >
              <div
                className="flex items-center gap-1 p-2 rounded-lg border shadow-sm min-w-[80px]"
                style={{ borderColor: node.color }}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 shrink-0 cursor-grab"
                  onClick={(e) => {
                    e.stopPropagation()
                    startConnection(node.id)
                  }}
                >
                  <Move className="h-3 w-3" />
                </Button>
                <Input
                  value={node.label}
                  onChange={(e) => updateNodeLabel(node.id, e.target.value)}
                  className="h-6 text-xs border-0 bg-transparent focus-visible:ring-0 p-0 min-w-[60px]"
                  onClick={(e) => e.stopPropagation()}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation()
                    removeNode(node.id)
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}

          {connectingFrom && (
            <div className="absolute bottom-2 left-2 text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded">
              Click another node to connect
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={addNode} size="sm">
            <Plus className="mr-1 h-4 w-4" />
            Add Node
          </Button>
          <span className="text-xs text-muted-foreground">
            {nodes.length} nodes, {edges.length} connections
          </span>
        </div>

        <Button
          onClick={handleSubmit}
          disabled={nodes.length < 2 || isSubmitting || !nodes.every((n) => n.label.trim())}
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
              Submit Canvas
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
