"use client";

import { useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";

const HEARTBEAT_SECONDS = 60;
const ACTIVE_WINDOW_MS = 2 * 60 * 1000;

export default function FresherActivityTracker() {
  const userIdRef = useRef<string | null>(null);
  const isFresherRef = useRef(false);
  const lastInteractionRef = useRef(Date.now());
  const heartbeatTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let mounted = true;

    function markInteraction() {
      lastInteractionRef.current = Date.now();
    }

    async function configureForUser(userId: string | null) {
      userIdRef.current = userId;
      isFresherRef.current = false;

      if (!userId) {
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("user_type")
        .eq("id", userId)
        .maybeSingle();

      if (!mounted) {
        return;
      }

      if (profileError) {
        console.error("Activity tracker profile check error:", profileError);
        return;
      }

      if (profile?.user_type !== "fresher") {
        return;
      }

      isFresherRef.current = true;
      lastInteractionRef.current = Date.now();

      const loginKey = `fresherhire-login-marked:${userId}`;

      if (!sessionStorage.getItem(loginKey)) {
        const { error: loginError } = await supabase.rpc(
          "mark_fresher_login"
        );

        if (loginError) {
          console.error("Mark fresher login error:", loginError);
        } else {
          sessionStorage.setItem(loginKey, "1");
        }
      }

      await sendHeartbeat();
    }

    async function sendHeartbeat() {
      if (!mounted) {
        return;
      }

      if (!userIdRef.current || !isFresherRef.current) {
        return;
      }

      if (document.visibilityState !== "visible") {
        return;
      }

      const idleFor = Date.now() - lastInteractionRef.current;

      if (idleFor > ACTIVE_WINDOW_MS) {
        return;
      }

      const { error: heartbeatError } = await supabase.rpc(
        "heartbeat_fresher_activity",
        {
          p_active_seconds: HEARTBEAT_SECONDS,
        }
      );

      if (heartbeatError) {
        console.error(
          "Fresher activity heartbeat error:",
          heartbeatError
        );
      }
    }

    async function initialize() {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (!mounted) {
        return;
      }

      if (sessionError) {
        console.error("Activity tracker session error:", sessionError);
        return;
      }

      await configureForUser(session?.user?.id || null);
    }

    const interactionEvents = [
      "mousemove",
      "mousedown",
      "keydown",
      "touchstart",
      "scroll",
    ] as const;

    interactionEvents.forEach((eventName) => {
      window.addEventListener(eventName, markInteraction, {
        passive: true,
      });
    });

    const visibilityHandler = () => {
      if (document.visibilityState === "visible") {
        markInteraction();
        void sendHeartbeat();
      }
    };

    document.addEventListener("visibilitychange", visibilityHandler);

    heartbeatTimerRef.current = setInterval(() => {
      void sendHeartbeat();
    }, HEARTBEAT_SECONDS * 1000);

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) {
        return;
      }

      if (event === "SIGNED_OUT") {
        userIdRef.current = null;
        isFresherRef.current = false;
        return;
      }

      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        void configureForUser(session?.user?.id || null);
      }
    });

    void initialize();

    return () => {
      mounted = false;

      interactionEvents.forEach((eventName) => {
        window.removeEventListener(eventName, markInteraction);
      });

      document.removeEventListener("visibilitychange", visibilityHandler);

      if (heartbeatTimerRef.current) {
        clearInterval(heartbeatTimerRef.current);
      }

      subscription.unsubscribe();
    };
  }, []);

  return null;
}
