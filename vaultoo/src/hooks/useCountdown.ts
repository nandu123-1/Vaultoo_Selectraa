"use client";

import { useState, useEffect, useCallback } from "react";

export function useCountdown(targetDate: string | Date | null) {
  const [timeLeft, setTimeLeft] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
    total: number;
    expired: boolean;
  }>({
    hours: 0,
    minutes: 0,
    seconds: 0,
    total: 0,
    expired: false,
  });

  const calculate = useCallback(() => {
    if (!targetDate)
      return { hours: 0, minutes: 0, seconds: 0, total: 0, expired: true };

    const target = new Date(targetDate).getTime();
    const now = Date.now();
    const diff = target - now;

    if (diff <= 0) {
      return { hours: 0, minutes: 0, seconds: 0, total: 0, expired: true };
    }

    return {
      hours: Math.floor(diff / (1000 * 60 * 60)),
      minutes: Math.floor((diff / (1000 * 60)) % 60),
      seconds: Math.floor((diff / 1000) % 60),
      total: diff,
      expired: false,
    };
  }, [targetDate]);

  useEffect(() => {
    setTimeLeft(calculate());
    const interval = setInterval(() => {
      setTimeLeft(calculate());
    }, 1000);
    return () => clearInterval(interval);
  }, [calculate]);

  const formatted = `${String(timeLeft.hours).padStart(2, "0")}:${String(
    timeLeft.minutes,
  ).padStart(2, "0")}:${String(timeLeft.seconds).padStart(2, "0")}`;

  return { ...timeLeft, formatted };
}
