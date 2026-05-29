# Redo Task Feature Implementation

## Overview
Added the ability for users to redo completed tasks if they got a low score or want to improve their submission.

## Changes Made

### 1. Backend - Convex Mutation (`convex/worldMap.ts`)
Added `redoTask` mutation that:
- Resets a completed task back to `not_started` status
- Clears the task's `evidenceId` and `completedAt` fields
- Updates the checkpoint's completion flag (t1Completed/t2Completed/t3Completed) to `false`
- Removes gold bonus flag if all 3 tasks were previously completed
- Validates ownership and authentication

### 2. Frontend - UI Component (`src/app/map/world/MapPageInner.tsx`)

#### TaskCard Component Updates
- Added `onRedo` prop to TaskCard component
- Added small "Redo" button that appears:
  - Inline with the score when evaluation exists (e.g., "HIGH - 9/12 [Redo]")
  - Below the task description when task is done but no evaluation yet
- Button styling:
  - Small size: `text-[9px]` with minimal padding
  - Purple gradient background matching the app theme
  - Hover and tap animations for better UX
  - Positioned to not interfere with task content

#### CheckpointPanel Component Updates
- Added `onTaskRedo` prop to pass redo handler to TaskCard
- Wired up the redo button click to call `onTaskRedo(taskIdx)`

#### Main Component Logic
- Added `redoTask` mutation hook
- Created `handleTaskRedo` callback that:
  - Validates the task is completed
  - Calls the `redoTask` mutation
  - Removes task from optimistic completed state
  - Reopens the TaskSubmissionModal for resubmission
  - Plays appropriate audio feedback

## User Flow

1. User completes a task and receives a score (e.g., "HIGH - 9/12")
2. User sees a small "Redo" button next to the score
3. User clicks "Redo" button
4. Task is reset to incomplete state
5. TaskSubmissionModal opens automatically
6. User can rewrite/resubmit their work
7. New submission replaces the old one

## Benefits

- **Improvement Opportunity**: Users can improve low-scoring submissions
- **Learning**: Users can apply AI feedback to create better submissions
- **Flexibility**: No penalty for wanting to redo work
- **Seamless UX**: Redo button is small and unobtrusive but easily accessible

## Technical Notes

- The redo mutation does NOT delete the old evidence - it just unlinks it from the task
- Points are not deducted when redoing a task
- Gold checkpoint status is removed if user redos any of the 3 tasks
- The feature respects ownership - users can only redo their own tasks
