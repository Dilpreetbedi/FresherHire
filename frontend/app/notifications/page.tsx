"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";
import {
  getCurrentUserRole,
} from "../lib/auth";

type Notification = {
  id: number;
  type: string;
  title: string;
  message: string;
  link: string | null;
  is_read: boolean;
  application_id: number | null;
  created_at: string;
};

export default function NotificationsPage() {
  const router = useRouter();

  const [notifications, setNotifications] =
    useState<Notification[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [role, setRole] =
    useState<"fresher" | "company" | null>(
      null
    );

  const [markingAll, setMarkingAll] =
    useState(false);

  useEffect(() => {
    loadNotifications();
  }, []);

  async function loadNotifications() {
    setLoading(true);
    setError("");

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      const currentRole =
        await getCurrentUserRole();

      if (!currentRole) {
        router.replace("/login");
        return;
      }

      setRole(currentRole);

      const {
        data,
        error: notificationsError,
      } = await supabase
        .from("notifications")
        .select(`
          id,
          type,
          title,
          message,
          link,
          is_read,
          application_id,
          created_at
        `)
        .eq("user_id", user.id)
        .order("created_at", {
          ascending: false,
        });

      if (notificationsError) {
        console.error(
          "Notifications load error:",
          notificationsError
        );

        setError(
          notificationsError.message
        );

        setLoading(false);
        return;
      }

      setNotifications(data || []);
      setLoading(false);
    } catch (err) {
      console.error(
        "Unexpected notifications error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Could not load notifications."
      );

      setLoading(false);
    }
  }

  async function openNotification(
    notification: Notification
  ) {
    if (!notification.is_read) {
      const { error: updateError } =
        await supabase
          .from("notifications")
          .update({
            is_read: true,
          })
          .eq("id", notification.id);

      if (updateError) {
        console.error(
          "Mark notification read error:",
          updateError
        );
      } else {
        setNotifications((current) =>
          current.map((item) =>
            item.id === notification.id
              ? {
                  ...item,
                  is_read: true,
                }
              : item
          )
        );
      }
    }

    if (notification.link) {
      router.push(notification.link);
    }
  }

  async function markAllAsRead() {
    if (markingAll) {
      return;
    }

    setMarkingAll(true);
    setError("");

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      const { error: updateError } =
        await supabase
          .from("notifications")
          .update({
            is_read: true,
          })
          .eq("user_id", user.id)
          .eq("is_read", false);

      if (updateError) {
        console.error(
          "Mark all read error:",
          updateError
        );

        setError(
          updateError.message
        );

        setMarkingAll(false);
        return;
      }

      setNotifications((current) =>
        current.map((notification) => ({
          ...notification,
          is_read: true,
        }))
      );
    } catch (err) {
      console.error(
        "Unexpected mark all error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Could not mark notifications as read."
      );
    } finally {
      setMarkingAll(false);
    }
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleString(
      "en-IN",
      {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }
    );
  }

  function getIcon(type: string) {
    switch (type) {
      case "new_application":
        return "👤";
      case "application_shortlisted":
        return "⭐";
      case "application_hired":
        return "🎉";
      case "application_rejected":
        return "📋";
      default:
        return "🔔";
    }
  }

  function getIconStyle(type: string) {
    switch (type) {
      case "application_hired":
        return "bg-green-50 text-green-700";
      case "application_shortlisted":
        return "bg-amber-50 text-amber-700";
      case "application_rejected":
        return "bg-red-50 text-red-700";
      default:
        return "bg-blue-50 text-blue-700";
    }
  }

  const unreadCount =
    notifications.filter(
      (notification) =>
        !notification.is_read
    ).length;

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-900">
        <div className="text-center">
          <p className="font-semibold">
            Loading notifications...
          </p>
          <p className="mt-2 text-sm text-slate-500">
            Checking your latest activity
          </p>
        </div>
      </main>
    );
  }

  const dashboardHref =
    role === "company"
      ? "/company/dashboard"
      : "/dashboard";

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">

      <nav className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">

          <Link
            href={dashboardHref}
            className="text-2xl font-bold tracking-tight text-slate-950"
          >
            Fresher
            <span className="text-blue-600">
              Hire
            </span>
          </Link>

          <Link
            href={dashboardHref}
            className="text-sm font-medium text-slate-600 hover:text-slate-950"
          >
            ← Dashboard
          </Link>

        </div>
      </nav>

      <section className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">

        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">

          <div>

            <p className="text-sm font-semibold uppercase tracking-widest text-blue-600">
              Activity
            </p>

            <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              Notifications
            </h1>

            <p className="mt-3 text-slate-600">
              {unreadCount > 0
                ? `${unreadCount} unread notification${unreadCount !== 1 ? "s" : ""}.`
                : "You're all caught up."}
            </p>

          </div>

          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              disabled={markingAll}
              className="w-fit rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {markingAll
                ? "Updating..."
                : "Mark all as read"}
            </button>
          )}

        </div>

        {error && (
          <div className="mt-8 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <span>
                {error}
              </span>

              <button
                onClick={loadNotifications}
                className="w-fit rounded-lg border border-red-200 bg-white px-4 py-2 text-xs font-semibold text-red-700 hover:bg-red-50"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {!error &&
        notifications.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm">

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-3xl">
              🔔
            </div>

            <h2 className="mt-5 text-xl font-semibold text-slate-950">
              No notifications yet
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Important hiring activity will appear here.
            </p>

          </div>
        ) : (
          <div className="mt-8 space-y-3">

            {notifications.map(
              (notification) => (

                <button
                  key={notification.id}
                  onClick={() =>
                    openNotification(
                      notification
                    )
                  }
                  className={`w-full rounded-2xl border p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md ${
                    notification.is_read
                      ? "border-slate-200 bg-white"
                      : "border-blue-200 bg-blue-50/60"
                  }`}
                >

                  <div className="flex items-start gap-4">

                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl ${getIconStyle(
                        notification.type
                      )}`}
                    >
                      {getIcon(
                        notification.type
                      )}
                    </div>

                    <div className="min-w-0 flex-1">

                      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">

                        <div className="min-w-0">

                          <div className="flex items-center gap-2">

                            <h2 className="break-words font-semibold text-slate-950">
                              {notification.title}
                            </h2>

                            {!notification.is_read && (
                              <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-blue-600" />
                            )}

                          </div>

                          <p className="mt-2 break-words text-sm leading-6 text-slate-600">
                            {notification.message}
                          </p>

                        </div>

                        <span className="shrink-0 text-xs text-slate-400">
                          {formatDate(
                            notification.created_at
                          )}
                        </span>

                      </div>

                      {notification.link && (
                        <p className="mt-3 text-xs font-semibold text-blue-600">
                          Open →
                        </p>
                      )}

                    </div>

                  </div>

                </button>

              )
            )}

          </div>
        )}

      </section>

    </main>
  );
}
