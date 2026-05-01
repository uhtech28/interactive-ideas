/**
 * Task Submission Modal
 * 
 * Opens when user clicks on a task to work on it.
 * Provides tool-specific interface for submitting work.
 */

"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { X, CheckCircle, AlertCircle } from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { audioManager } from "@/lib/audio/audioManager";

interface TaskSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: {
    id: string;
    checkpointId: Id<"ventureCheckpoints">;
    taskLevel: "t1" | "t2" | "t3";
    title: string;
    description: string;
    toolType: string;
    points: number;
  } | null;
  onSuccess: () => void;
}

export function TaskSubmissionModal({
  isOpen,
  onClose,
  task,
  onSuccess,
}: TaskSubmissionModalProps) {
  const [content, setContent] = useState("");
  const [wordCount, setWordCount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [draftRestored, setDraftRestored] = useState(false);
  const [showQueuedMessage, setShowQueuedMessage] = useState(false);

  const submitTask = useMutation(api.worldMap.submitTaskContent);
  const draftKey = useMemo(
    () =>
      task ? `venture-task-draft:${task.checkpointId}:${task.taskLevel}` : "",
    [task],
  );

  useEffect(() => {
    if (typeof window === "undefined") return;

    const syncOnlineStatus = () => setIsOnline(window.navigator.onLine);
    syncOnlineStatus();

    window.addEventListener("online", syncOnlineStatus);
    window.addEventListener("offline", syncOnlineStatus);

    return () => {
      window.removeEventListener("online", syncOnlineStatus);
      window.removeEventListener("offline", syncOnlineStatus);
    };
  }, []);

  useEffect(() => {
    if (!isOpen || !task || typeof window === "undefined") return;

    const savedDraft = window.localStorage.getItem(draftKey);
    if (!savedDraft) {
      setContent("");
      setWordCount(0);
      setDraftRestored(false);
      setShowQueuedMessage(false);
      setError(null);
      return;
    }

    setContent(savedDraft);
    const words = savedDraft.trim().split(/\s+/).filter(Boolean).length;
    setWordCount(words);
    setDraftRestored(true);
    setShowQueuedMessage(false);
    setError(null);
  }, [draftKey, isOpen, task]);

  if (!task) return null;

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    const words = newContent.trim().split(/\s+/).filter(Boolean);
    setWordCount(words.length);
    setError(null);
    setDraftRestored(false);

    if (typeof window !== "undefined") {
      const normalized = newContent.trim();
      if (normalized.length === 0) {
        window.localStorage.removeItem(draftKey);
      } else {
        window.localStorage.setItem(draftKey, newContent);
      }
    }
  };

  const handleSubmit = async () => {
    if (!isOnline) {
      audioManager.playUI("error");
      setError("You are offline. Your draft is saved locally until you reconnect.");
      return;
    }

    if (wordCount < 50) {
      audioManager.playUI("error");
      setError("Please write at least 50 words");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await submitTask({
        checkpointId: task.checkpointId,
        taskLevel: task.taskLevel,
        content,
      });

      audioManager.playUI("confirm");
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(draftKey);
      }
      setShowQueuedMessage(true);
      onSuccess();
      window.setTimeout(() => {
        onClose();
        setContent("");
        setWordCount(0);
        setShowQueuedMessage(false);
      }, 900);
    } catch (err) {
      audioManager.playUI("error");
      setError(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isValid = wordCount >= 50;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl max-h-[90vh] z-50 overflow-hidden"
          >
            <div className="bg-[#111827] border-2 border-white/10 rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
              {/* Header */}
              <div className="p-6 border-b border-white/10 bg-gradient-to-r from-[#6366F1]/20 to-[#8B5CF6]/20">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-white mb-2">
                      {task.title}
                    </h2>
                    <p className="text-gray-300 text-sm mb-3">
                      {task.description}
                    </p>
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-indigo-400 font-semibold uppercase tracking-wider">
                        Tool: {task.toolType}
                      </span>
                      <span className="text-xs text-gray-400">
                        Minimum: 50 words
                      </span>
                      <span className="text-xs text-[#6366F1] font-bold">
                        +{task.points} points
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => { audioManager.playUI("click"); onClose(); }}
                    className="p-2 rounded-lg bg-black/20 hover:bg-black/40 transition-colors"
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>

              {/* Content Area */}
              <div className="flex-1 overflow-y-auto p-6">
                {!isOnline && (
                  <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">
                    Offline mode detected. Keep writing if you want, and this draft will stay on this device until you reconnect.
                  </div>
                )}

                {draftRestored && (
                  <div className="mb-4 rounded-xl border border-cyan-500/20 bg-cyan-500/10 p-4 text-sm text-cyan-100">
                    Restored your saved draft for this task.
                  </div>
                )}

                {showQueuedMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-100"
                  >
                    Submission saved. AI quality scoring is now running in the background and your valuation updates will follow asynchronously.
                  </motion.div>
                )}

                <textarea
                  value={content}
                  onChange={(e) => handleContentChange(e.target.value)}
                  placeholder="Write your response here... (minimum 50 words)"
                  className="w-full h-64 p-4 bg-black/20 border-2 border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-[#6366F1] focus:outline-none resize-none"
                />

                {/* Error Message */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 p-4 bg-red-500/10 border-2 border-red-500/30 rounded-xl flex items-center gap-3"
                  >
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                    <p className="text-red-400 text-sm">{error}</p>
                  </motion.div>
                )}
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-white/10 bg-black/20">
                <div className="flex items-center justify-between">
                  {/* Word Count */}
                  <div className="text-sm space-y-1">
                    <div>
                      <span
                        className={
                          isValid ? "text-green-400" : "text-gray-400"
                        }
                      >
                        {wordCount} words
                      </span>
                      {!isValid && (
                        <span className="text-gray-500 ml-2">
                          ({50 - wordCount} more needed)
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">
                      Drafts save automatically on this device. AI scoring runs after submission.
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3">
                    <Button
                      variant="ghost"
                      onClick={onClose}
                      disabled={isSubmitting}
                      className="text-gray-400 hover:text-white"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSubmit}
                      disabled={!isValid || isSubmitting}
                      className="bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] hover:from-[#5558E3] hover:to-[#7C3AED] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Submit Task
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
