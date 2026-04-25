"use client";

import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Circle, 
  Square, 
  Triangle, 
  X, 
  ChevronUp, 
  ChevronDown, 
  ChevronLeft, 
  ChevronRight,
  Target
} from "lucide-react";

interface GamepadButtonProps {
  icon: React.ReactNode;
  label: string;
  color: string;
  onClick?: () => void;
  position: string;
}

const GamepadButton: React.FC<GamepadButtonProps> = ({ icon, label, color, onClick, position }) => {
  const [isPressed, setIsPressed] = useState(false);

  const handlePress = useCallback(() => {
    setIsPressed(true);
    onClick?.();
    setTimeout(() => setIsPressed(false), 150);
  }, [onClick]);

  return (
    <div className={`absolute ${position}`}>
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={handlePress}
        className={`relative w-12 h-12 flex items-center justify-center rounded-full bg-zinc-900/80 backdrop-blur-md border border-white/10 shadow-lg group overflow-hidden`}
      >
        {/* Haptic Glow Ring */}
        <AnimatePresence>
          {isPressed && (
            <motion.div
              initial={{ scale: 1, opacity: 0.5 }}
              animate={{ scale: 2, opacity: 0 }}
              exit={{ opacity: 0 }}
              className={`absolute inset-0 rounded-full border-2 ${color}`}
            />
          )}
        </AnimatePresence>

        <div className={`text-white/70 group-hover:text-white transition-colors`}>
          {icon}
        </div>
      </motion.button>
      <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-white/40 uppercase tracking-tighter pointer-events-none">
        {label}
      </span>
    </div>
  );
};

export const VirtualGamepad = () => {
  const emitEvent = (type: string, detail: any = {}) => {
    window.dispatchEvent(new CustomEvent("phaser-input", { detail: { type, ...detail } }));
  };

  return (
    <div className="fixed bottom-8 left-8 right-8 z-[60] pointer-events-none flex justify-between items-end">
      {/* Left: Directional Pad */}
      <div className="relative w-32 h-32 pointer-events-auto">
        <GamepadButton 
          icon={<ChevronUp />} 
          label="Up" 
          color="border-indigo-500" 
          position="top-0 left-1/2 -translate-x-1/2" 
          onClick={() => emitEvent("DIR_UP")}
        />
        <GamepadButton 
          icon={<ChevronDown />} 
          label="Down" 
          color="border-indigo-500" 
          position="bottom-0 left-1/2 -translate-x-1/2" 
          onClick={() => emitEvent("DIR_DOWN")}
        />
        <GamepadButton 
          icon={<ChevronLeft />} 
          label="Left" 
          color="border-indigo-500" 
          position="left-0 top-1/2 -translate-y-1/2" 
          onClick={() => emitEvent("DIR_LEFT")}
        />
        <GamepadButton 
          icon={<ChevronRight />} 
          label="Right" 
          color="border-indigo-500" 
          position="right-0 top-1/2 -translate-y-1/2" 
          onClick={() => emitEvent("DIR_RIGHT")}
        />
        
        {/* Center Pad */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-indigo-500/10 border border-indigo-500/20 backdrop-blur-sm flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
        </div>
      </div>

      {/* Right: Action Buttons */}
      <div className="relative w-32 h-32 pointer-events-auto">
        <GamepadButton 
          icon={<Triangle className="w-5 h-5 fill-emerald-500/20 text-emerald-400" />} 
          label="Interact" 
          color="border-emerald-500" 
          position="top-0 left-1/2 -translate-x-1/2" 
          onClick={() => emitEvent("ACTION_Y")}
        />
        <GamepadButton 
          icon={<X className="w-5 h-5 text-red-400" />} 
          label="Cancel" 
          color="border-red-500" 
          position="bottom-0 left-1/2 -translate-x-1/2" 
          onClick={() => emitEvent("ACTION_B")}
        />
        <GamepadButton 
          icon={<Square className="w-5 h-5 fill-pink-500/20 text-pink-400" />} 
          label="Menu" 
          color="border-pink-500" 
          position="left-0 top-1/2 -translate-y-1/2" 
          onClick={() => emitEvent("ACTION_X")}
        />
        <GamepadButton 
          icon={<Circle className="w-5 h-5 fill-blue-500/20 text-blue-400" />} 
          label="Select" 
          color="border-blue-500" 
          position="right-0 top-1/2 -translate-y-1/2" 
          onClick={() => emitEvent("ACTION_A")}
        />

        {/* Center Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/5 border border-white/10 blur-[2px]" />
      </div>

      {/* Center Label (Optional) */}
      <div className="flex flex-col items-center mb-4">
        <motion.div 
          animate={{ opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 4, repeat: Infinity }}
          className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/10 backdrop-blur-md"
        >
          <Target className="w-3 h-3 text-white/50" />
          <span className="text-[10px] text-white/50 uppercase tracking-[0.2em] font-medium">Remote Controller</span>
        </motion.div>
      </div>
    </div>
  );
};
