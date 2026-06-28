"use client";

/**
 * Step3MapGuide -- Sparky guides the user through their first task
 * + AI combat on /map/world. Detects DOM state via polling:
 *
 *   1. arrived       -- Sparky points at checkpoint 1 ("Click a checkpoint
 *                       to start your first task.")
 *   2. checkpoint    -- Side panel opened ("Pick a task to work on.")
 *   3. task_open     -- TaskSubmissionModal opened ("Write your answer
 *                       below -- be specific!")
 *   4. submitted     -- Modal closed after submit ("Great! AI is judging.")
 *   5. combat        -- Combat panel mounted ("Cross-questions incoming.
 *                       Defend your idea.")
 *   6. done          -- Combat ends ("You finished your first task!")
 */

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { TutorialMascot, type SparkyMood } from "../TutorialMascot";
import { useTutorial } from "../useTutorial";

type Stage =
  | "arrived"
  | "checkpoint"
  | "task_open"
  | "submitted"
  | "combat"
  | "done";

function findCheckpointPanel(): HTMLElement | null {
  // Sahit's left-side checkpoint panel container
  return document.querySelector<HTMLElement>(
    '[data-tutorial="checkpoint-panel"], [aria-label="Checkpoint"], [data-checkpoint-panel]',
  );
}

function findTaskModal(): HTMLElement | null {
  return document.querySelector<HTMLElement>(
    '[role="dialog"][data-state="open"], [data-tutorial="task-modal"]',
  );
}

function findCombatPanel(): HTMLElement | null {
  return document.querySelector<HTMLElement>(
    '[data-tutorial="combat-panel"], [aria-label="AI Combat"], [data-combat-panel]',
  );
}

export function Step3MapGuide() {
  const tutorial = useTutorial();
  const pathname = usePathname();

  const onMap = pathname?.startsWith("/map/") ?? false;
  const active =
    tutorial.active &&
    onMap &&
    (tutorial.step === 2 || tutorial.step === 3 || tutorial.step === 4);

  const [stage, setStage] = useState<Stage>("arrived");

  useEffect(() => {
    if (!active) return;
    const id = window.setInterval(() => {
      const panel = !!findCheckpointPanel();
      const modal = !!findTaskModal();
      const combat = !!findCombatPanel();

      setStage((prev) => {
        if (combat && prev !== "done") return "combat";
        if (modal) return "task_open";
        if (panel && (prev === "arrived" || prev === "checkpoint")) {
          return "checkpoint";
        }
        if (prev === "task_open" && !modal && !combat) {
          return "submitted";
        }
        if (prev === "combat" && !combat) return "done";
        return prev;
      });
    }, 500);
    return () => window.clearInterval(id);
  }, [active]);

  // When stage transitions past "submitted", advance the persisted
  // tutorial step so the progress bar moves N/7.
  useEffect(() => {
    if (!active) return;
    if (stage === "task_open" && tutorial.step === 2) {
      void tutorial.advance();
    } else if (stage === "combat" && tutorial.step === 3) {
      void tutorial.advance();
    } else if (stage === "done" && tutorial.step === 4) {
      void tutorial.advance();
    }
  }, [stage, active, tutorial]);

  const view = useMemo<{
    text: string;
    mood: SparkyMood;
    primary?: { label: string; onClick: () => void };
    skip?: { label: string; onClick: () => void };
  }>(() => {
    switch (stage) {
      case "arrived":
        return {
          text: "Welcome to your map! Click any checkpoint to start your first task.",
          mood: "pointing",
          skip: { label: "Skip tutorial", onClick: tutorial.skip },
        };
      case "checkpoint":
        return {
          text: "Pick a task from the list -- start with the easiest one to get a feel for the flow.",
          mood: "pointing",
          skip: { label: "Skip tutorial", onClick: tutorial.skip },
        };
      case "task_open":
        return {
          text: "Write your answer in the box below. Be specific! The more details you give, the better the AI feedback.",
          mood: "pointing",
          skip: { label: "Skip tutorial", onClick: tutorial.skip },
        };
      case "submitted":
        return {
          text: "Nice work! The AI is reviewing your answer. Get ready -- it might ask you a tough follow-up question.",
          mood: "celebrating",
        };
      case "combat":
        return {
          text: "This is the AI cross-question! It's a Tier-1 VC partner probing your idea. Answer honestly -- vague answers score low.",
          mood: "pointing",
        };
      case "done":
        return {
          text: "Yay! You finished your first task. Keep going -- every checkpoint earns XP and unlocks more!",
          mood: "celebrating",
          primary: {
            label: "Got it!",
            onClick: () => void tutorial.complete(),
          },
        };
    }
  }, [stage, tutorial]);

  if (!active) return null;

  return (
    <TutorialMascot
      visible
      text={view.text}
      mood={view.mood}
      primaryAction={view.primary}
      secondaryAction={view.skip}
      anchor="bottom-right"
    />
  );
}
