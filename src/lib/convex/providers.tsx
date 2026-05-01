"use client"

import { ConvexProviderWithClerk } from "convex/react-clerk"
import { useAuth } from "@clerk/nextjs"
import convex from "./client"

interface ConvexProviderProps {
  children: React.ReactNode
}

export function ConvexClientProvider({ children }: ConvexProviderProps) {
  return (
    <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
      {children}
    </ConvexProviderWithClerk>
  )
}
