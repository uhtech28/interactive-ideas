"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Trophy, Star, Shield } from "lucide-react"

interface MonumentDisplayProps {
  slainBosses: Array<{
    bossId: number
    name: string
    slayOutcome: string
  }>
}

export function MonumentDisplay({ slainBosses }: MonumentDisplayProps) {
  if (slainBosses.length === 0) return null

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="h-5 w-5 text-amber-500" />
          <h3 className="font-semibold">Monuments</h3>
          <Badge variant="outline">{slainBosses.length} defeated</Badge>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {slainBosses.map((boss) => (
            <div
              key={boss.bossId}
              className="p-3 rounded-lg border bg-gradient-to-br from-amber-500/5 to-yellow-500/5 dark:from-amber-500/10 dark:to-yellow-500/10"
            >
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-4 w-4 text-amber-500" />
                <span className="font-medium text-sm">{boss.name}</span>
                <Star className="h-3 w-3 text-amber-500 fill-current ml-auto" />
              </div>
              <p className="text-xs text-muted-foreground">{boss.slayOutcome}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
