"use client";

import { useEffect, useState } from "react";

interface Countdown {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

const getCountdown = (now: Date): Countdown => {
  const nextMonth = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    1,
  ).getTime();
  const remainingSeconds = Math.max(
    0,
    Math.floor((nextMonth - now.getTime()) / 1000),
  );

  return {
    days: Math.floor(remainingSeconds / 86_400),
    hours: Math.floor((remainingSeconds % 86_400) / 3_600),
    minutes: Math.floor((remainingSeconds % 3_600) / 60),
    seconds: remainingSeconds % 60,
  };
};

const format = (value: number) => value.toString().padStart(2, "0");

export const MonthlyCountdown = () => {
  const [countdown, setCountdown] = useState<Countdown>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const update = () => setCountdown(getCountdown(new Date()));
    update();
    const interval = window.setInterval(update, 1000);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <div
      className="flex items-center justify-between text-base font-mono font-bold text-primary sm:text-lg"
      role="timer"
      aria-label={`${countdown.days} dias, ${countdown.hours} horas, ${countdown.minutes} minutos e ${countdown.seconds} segundos até o sorteio mensal`}
    >
      <span className="w-full rounded border border-card-border bg-card px-1.5 py-1 sm:px-2">
        {format(countdown.days)}d
      </span>
      :
      <span className="w-full rounded border border-card-border bg-card px-1.5 py-1 sm:px-2">
        {format(countdown.hours)}h
      </span>
      :
      <span className="w-full rounded border border-card-border bg-card px-1.5 py-1 sm:px-2">
        {format(countdown.minutes)}m
      </span>
      :
      <span className="w-full rounded border border-card-border bg-card px-1.5 py-1 sm:px-2">
        {format(countdown.seconds)}s
      </span>
    </div>
  );
};
