"use client"

import { VentureErrorBoundary } from "@/components/venture/error-boundary"
import CheckpointPageContent from "./page-content"

export default function CheckpointPage() {
  return (
    <VentureErrorBoundary
      title="Failed to load checkpoint"
      description="This checkpoint may not exist or you don't have access."
    >
      <CheckpointPageContent />
    </VentureErrorBoundary>
  )
}
