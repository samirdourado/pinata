"use client";

import { useEffect, useState } from "react";
import { formatRelativeTime } from "@/utils/formatRelativeTime";

interface RelativeTimeProps {
  value: string | number | Date;
  fallback: string;
  className?: string;
}

export const RelativeTime = ({
  value,
  fallback,
  className,
}: RelativeTimeProps) => {
  const [label, setLabel] = useState(fallback);

  useEffect(() => {
    const update = () => setLabel(formatRelativeTime(value));
    const initialUpdate = window.setTimeout(update, 0);
    const interval = window.setInterval(update, 60_000);

    return () => {
      window.clearTimeout(initialUpdate);
      window.clearInterval(interval);
    };
  }, [value]);

  return <time className={className}>{label}</time>;
};
