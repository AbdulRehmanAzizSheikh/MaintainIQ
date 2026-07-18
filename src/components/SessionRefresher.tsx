"use client";

import { useEffect, useRef } from "react";

export default function SessionRefresher() {
  const lastActivity = useRef(Date.now());
  const lastRefresh = useRef(Date.now());

  useEffect(() => {
    const updateActivity = () => {
      lastActivity.current = Date.now();
    };

    const events: Array<keyof WindowEventMap> = [
      "click",
      "keydown",
      "mousemove",
      "scroll",
      "touchstart",
    ];

    events.forEach((eventName) =>
      window.addEventListener(eventName, updateActivity),
    );

    const interval = window.setInterval(async () => {
      const now = Date.now();
      if (now - lastRefresh.current < 50 * 60 * 1000) return;
      if (now - lastActivity.current > 60 * 60 * 1000) return;

      try {
        const res = await fetch("/api/auth/refresh", {
          method: "POST",
          credentials: "include",
        });
        if (res.ok) lastRefresh.current = Date.now();
      } catch {
        // Silent fail; user will be logged out naturally if idle or expired.
      }
    }, 60 * 1000);

    return () => {
      window.clearInterval(interval);
      events.forEach((eventName) =>
        window.removeEventListener(eventName, updateActivity),
      );
    };
  }, []);

  return null;
}
