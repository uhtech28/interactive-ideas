"use client"

import { VentureErrorBoundary } from "@/components/venture/error-boundary"
import VenturePageContent from "./page-content"

export default function VenturePage() {
  return (
    <VentureErrorBoundary
      title="Failed to load venture"
      description="We couldn't load this venture. It may have been deleted or you may not have access."
    >
      <VenturePageContent />
    </VentureErrorBoundary>
  )
}
