"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  PlayArrow as PlayArrowIcon,
  Pause as PauseIcon,
  Refresh as RefreshIcon,
  Timer as TimerIcon,
} from "@mui/icons-material";

type TrainingTimerProps = {
  isRunning: boolean;
  onStart: () => void;
  onStop: () => void;
  onReset: () => void;
};

export default function TrainingTimer({ isRunning, onStart, onStop, onReset }: TrainingTimerProps) {
  const [elapsedTime, setElapsedTime] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const accumulatedTimeRef = useRef(0);
  const animationFrameRef = useRef<number | null>(null);

  const updateTimer = useCallback(() => {
    if (startTimeRef.current !== null) {
      const now = Date.now();
      const elapsed = accumulatedTimeRef.current + (now - startTimeRef.current);
      setElapsedTime(elapsed);
      animationFrameRef.current = requestAnimationFrame(updateTimer);
    }
  }, []);

  useEffect(() => {
    if (isRunning) {
      startTimeRef.current = Date.now();
      animationFrameRef.current = requestAnimationFrame(updateTimer);
    } else {
      if (startTimeRef.current !== null) {
        accumulatedTimeRef.current += Date.now() - startTimeRef.current;
        startTimeRef.current = null;
      }
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    }
    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isRunning, updateTimer]);

  const handleReset = () => {
    setElapsedTime(0);
    accumulatedTimeRef.current = 0;
    startTimeRef.current = isRunning ? Date.now() : null;
    onReset();
  };

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-3 py-2 sm:px-4 sm:py-3 mb-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 sm:gap-3">
          <TimerIcon sx={{ fontSize: 20 }} className="text-amber-600 sm:text-[24px]" />
          <div className="flex items-center gap-2 sm:flex-col sm:items-start sm:gap-0">
            <p className="text-xs text-slate-500 hidden sm:block">インターバル</p>
            <p className="text-xl sm:text-2xl font-bold text-slate-900 tabular-nums">
              {formatTime(elapsedTime)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {isRunning ? (
            <button
              onClick={onStop}
              className="p-1.5 sm:p-2 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition-colors"
              aria-label="停止"
            >
              <PauseIcon sx={{ fontSize: 18 }} />
            </button>
          ) : (
            <button
              onClick={onStart}
              className="p-1.5 sm:p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
              aria-label="開始"
            >
              <PlayArrowIcon sx={{ fontSize: 18 }} />
            </button>
          )}
          <button
            onClick={handleReset}
            className="p-1.5 sm:p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
            aria-label="リセット"
          >
            <RefreshIcon sx={{ fontSize: 18 }} />
          </button>
        </div>
      </div>
    </div>
  );
}
