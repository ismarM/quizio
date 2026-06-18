"use client";

import { useEffect, useRef, useState } from "react";

import type { LeaderboardEntryDTO, LeaderboardResponse } from "@/lib/types";

export function useLeaderboard(quizId: number) {
  const [entries, setEntries] = useState<LeaderboardEntryDTO[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasReceivedInitialPayload, setHasReceivedInitialPayload] = useState(false);

  // Reset state during render if quizId changes to avoid useEffect state cascades
  const [prevQuizId, setPrevQuizId] = useState(quizId);
  if (quizId !== prevQuizId) {
    setPrevQuizId(quizId);
    setEntries([]);
    setIsConnected(false);
    setError(null);
    setHasReceivedInitialPayload(false);
  }

  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const backoffRef = useRef(1000);
  const maxBackoff = 16000;

  useEffect(() => {
    let eventSource: EventSource | null = null;
    let isMounted = true;

    function connect() {
      if (!isMounted) {
        return;
      }

      eventSource = new EventSource(
        `/api/proxy/quizzes/${quizId}/leaderboard/stream`
      );

      eventSource.onopen = () => {
        setIsConnected(true);
        setError(null);
        backoffRef.current = 1000;
      };

      eventSource.onmessage = (event) => {
        try {
          const data: LeaderboardResponse = JSON.parse(event.data);
          setEntries(data.entries);
          setHasReceivedInitialPayload(true);
        } catch (err) {
          console.error("Failed to parse leaderboard data", err);
        }
      };

      eventSource.onerror = () => {
        setIsConnected(false);
        setError("Connection lost");
        eventSource?.close();

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
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [quizId]);

  return { entries, isConnected, error, hasReceivedInitialPayload };
}
