import { useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";

export type TopicType = "user" | "folder";

export type RealtimeTopic = `${TopicType}:${string}`;

// TODO(nberlette): update with the actual payload shape once it's known
export type RealtimePayload = Record<string, unknown>;

interface RealtimeCommonEvent {
  readonly topic: RealtimeTopic;
  readonly payload: RealtimePayload;
}

export interface RealtimeInsertEvent extends RealtimeCommonEvent {
  readonly op: "INSERT";
}

export interface RealtimeUpdateEvent extends RealtimeCommonEvent {
  readonly op: "UPDATE";
}

export interface RealtimeDeleteEvent extends RealtimeCommonEvent {
  readonly op: "DELETE";
}

export type RealtimeEvent =
  | RealtimeInsertEvent
  | RealtimeUpdateEvent
  | RealtimeDeleteEvent;

export default function useFileSync(
  userId: string | null,
  onEvent: (event: RealtimeEvent) => void | PromiseLike<void>,
  folderIds: string[] = [],
): void {
  const channelsRef = useRef<any[]>([]);

  useEffect(() => {
    if (!userId) return;

    // Ensure Realtime uses current JWT (call after login or token refresh)
    supabase.realtime.setAuth();

    // Subscribe to user channel
    const topic = `user:${userId}`;
    const userChannel = supabase
      .channel(topic, { config: { private: true } })
      .on(
        "broadcast",
        { event: "INSERT" },
        (payload) => onEvent({ op: "INSERT", topic, payload }),
      )
      .on(
        "broadcast",
        { event: "UPDATE" },
        (payload) => onEvent({ op: "UPDATE", topic, payload }),
      )
      .on(
        "broadcast",
        { event: "DELETE" },
        (payload) => onEvent({ op: "DELETE", topic, payload }),
      )
      .subscribe();

    channelsRef.current.push(userChannel);

    // Subscribe to folder channels
    folderIds.forEach((folderId) => {
      const topic = `folder:${folderId}`;
      const ch = supabase
        .channel(topic, { config: { private: true } })
        .on(
          "broadcast",
          { event: "INSERT" },
          (payload) => onEvent({ op: "INSERT", topic, payload }),
        )
        .on(
          "broadcast",
          { event: "UPDATE" },
          (payload) => onEvent({ op: "UPDATE", topic, payload }),
        )
        .on(
          "broadcast",
          { event: "DELETE" },
          (payload) => onEvent({ op: "DELETE", topic, payload }),
        )
        .subscribe();
      channelsRef.current.push(ch);
    });

    return () => {
      // cleanup
      channelsRef.current.forEach((c) => supabase.removeChannel(c));
      channelsRef.current = [];
    };
  }, [userId, JSON.stringify(folderIds)]); // re-subscribe when folders change
}
