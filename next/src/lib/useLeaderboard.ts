"use client";

import { useEffect, useState, useRef } from "react";
import { LeaderboardEntryDTO, LeaderboardResponse } from "@/lib/types";

export function useLeaderboard(quizId: number) {
  const [entries, setEntries] = useState<LeaderboardEntryDTO[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const backoffRef = useRef(1000);
  const maxBackoff = 16000;

  useEffect(() => {
    let eventSource: EventSource | null = null;
    let isMounted = true;

    function connect() {
      if (!isMounted) return;

      eventSource = new EventSource(`/api/proxy/quizzes/${quizId}/leaderboard/stream`);

      eventSource.onopen = () => {
        setIsConnected(true);
        setError(null);
        backoffRef.current = 1000;
      };

      eventSource.onmessage = (event) => {
        try {
          const data: LeaderboardResponse = JSON.parse(event.data);
          setEntries(data.entries);
        } catch (err) {
          console.error("Failed to parse leaderboard data", err);
        }
      };

      eventSource.onerror = () => {
        setIsConnected(false);
        setError("Connection lost");
        eventSource?.close();

        // Retry logic
        if (isMounted) {
          retryTimeoutRef.current = setTimeout(() => {
            backoffRef.current = Math.min(backoffRef.current * 2, maxBackoff);
            connect();
          }, backoffRef.current);
        }
      };
    }

    connect();

    return () => {
      isMounted = false;
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
      if (eventSource) eventSource.close();
    };
  }, [quizId]);

  return { entries, isConnected, error };
}
