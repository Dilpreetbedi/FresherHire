"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  useRouter,
} from "next/navigation";


type NotificationType =
  | "applied"
  | "shortlisted"
  | "interview"
  | "hired"
  | "rejected";


type Notification = {
  id: number;
  application_id: number;
  job_id: number;

  notification_type:
    NotificationType;

  title: string;
  message: string;

  is_read: boolean;

  created_at:
    string | null;
};


export default function CandidateNotificationsPage() {
  const router =
    useRouter();


  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:8000";


  const [
    notifications,
    setNotifications,
  ] =
    useState<Notification[]>(
      []
    );


  const [
    loading,
    setLoading,
  ] =
    useState(true);


  const [
    error,
    setError,
  ] =
    useState("");


  const [
    markingAll,
    setMarkingAll,
  ] =
    useState(false);


  useEffect(() => {
    loadNotifications();
  }, []);


  async function loadNotifications() {
    try {
      setLoading(
        true
      );

      setError("");


      const response =
        await fetch(
          `${apiUrl}/api/candidate/notifications`,
          {
            credentials:
              "include",

            cache:
              "no-store",
          }
        );


      if (
        response.status ===
        401
      ) {
        router.replace(
          "/login"
        );

        return;
      }


      const data =
        await response.json();


      if (!response.ok) {
        throw new Error(
          data.detail ||
            "Unable to load notifications."
        );
      }


      setNotifications(
        data
      );

    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load notifications."
      );

    } finally {
      setLoading(
        false
      );
    }
  }


  const unreadCount =
    useMemo(
      () =>
        notifications.filter(
          (notification) =>
            !notification.is_read
        ).length,

      [
        notifications,
      ]
    );


  async function markRead(
    notification:
      Notification
  ) {
    if (
      notification.is_read
    ) {
      return;
    }


    try {
      const response =
        await fetch(
          `${apiUrl}/api/candidate/notifications/${notification.id}/read`,
          {
            method:
              "PATCH",

            credentials:
              "include",
          }
        );


      if (
        response.status ===
        401
      ) {
        router.replace(
          "/login"
        );

        return;
      }


      const data =
        await response.json();


      if (!response.ok) {
        throw new Error(
          data.detail ||
            "Unable to update notification."
        );
      }


      setNotifications(
        (current) =>
          current.map(
            (item) =>
              item.id ===
              notification.id
                ? {
                    ...item,
                    is_read:
                      true,
                  }
                : item
          )
      );

    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update notification."
      );
    }
  }


  async function markAllRead() {
    try {
      setMarkingAll(
        true
      );

      setError("");


      const response =
        await fetch(
          `${apiUrl}/api/candidate/notifications/read-all`,
          {
            method:
              "PATCH",

            credentials:
              "include",
          }
        );


      if (
        response.status ===
        401
      ) {
        router.replace(
          "/login"
        );

        return;
      }


      const data =
        await response.json();


      if (!response.ok) {
        throw new Error(
          data.detail ||
            "Unable to update notifications."
        );
      }


      setNotifications(
        (current) =>
          current.map(
            (item) => ({
              ...item,
              is_read:
                true,
            }))
      );

    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update notifications."
      );

    } finally {
      setMarkingAll(
        false
      );
    }
  }


  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">

        <div className="text-center">

          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" />


          <p className="mt-4 text-sm text-slate-500">
            Loading notifications...
          </p>

        </div>

      </main>
    );
  }


  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">

      <nav className="border-b border-slate-200 bg-white">

        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">

          <Link
            href="/"
            className="text-2xl font-bold"
          >
            Fresher

            <span className="text-blue-600">
              Hire
            </span>
          </Link>


          <div className="flex items-center gap-3">

            <Link
              href="/candidate/applications"
              className="text-sm font-semibold text-slate-600"
            >
              Applications
            </Link>


            <Link
              href="/candidate/dashboard"
              className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white"
            >
              Dashboard
            </Link>

          </div>

        </div>

      </nav>


      <section className="mx-auto max-w-4xl px-4 py-10 sm:px-6">

        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">

          <div>

            <p className="text-sm font-semibold uppercase tracking-widest text-blue-600">
              Candidate Dashboard
            </p>


            <h1 className="mt-3 text-4xl font-bold">
              Notifications
            </h1>


            <p className="mt-3 text-slate-500">
              Hiring updates from companies
              you have applied to.
            </p>

          </div>


          {unreadCount > 0 && (
            <button
              type="button"
              onClick={
                markAllRead
              }
              disabled={
                markingAll
              }
              className="w-fit rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 disabled:opacity-50"
            >
              {markingAll
                ? "Updating..."
                : "Mark all as read"}
            </button>
          )}

        </div>


        <div className="mt-6 flex items-center gap-2">

          <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-600">
            {notifications.length} Total
          </span>


          {unreadCount > 0 && (
            <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
              {unreadCount} Unread
            </span>
          )}

        </div>


        {error && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}


        {notifications.length ===
        0 ? (

          <div className="mt-8 rounded-3xl border border-slate-200 bg-white px-6 py-16 text-center">

            <div className="text-4xl">
              🔔
            </div>


            <h2 className="mt-5 text-xl font-bold">
              No notifications yet
            </h2>


            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              When recruiters shortlist you,
              schedule an interview, hire you
              or update your application,
              you&apos;ll see it here.
            </p>


            <Link
              href="/jobs"
              className="mt-6 inline-flex rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white"
            >
              Browse Jobs
            </Link>

          </div>

        ) : (

          <div className="mt-8 space-y-4">

            {notifications.map(
              (notification) => (

                <NotificationCard
                  key={
                    notification.id
                  }

                  notification={
                    notification
                  }

                  onOpen={() =>
                    markRead(
                      notification
                    )
                  }
                />

              )
            )}

          </div>

        )}

      </section>

    </main>
  );
}


function NotificationCard({
  notification,
  onOpen,
}: {
  notification:
    Notification;

  onOpen:
    () => void;
}) {
  const appearance =
    getNotificationAppearance(
      notification.notification_type
    );


  return (
    <article
      className={`rounded-2xl border p-5 transition ${
        notification.is_read
          ? "border-slate-200 bg-white"
          : "border-blue-200 bg-blue-50/50 shadow-sm"
      }`}
    >

      <div className="flex gap-4">

        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-xl ${appearance.iconClass}`}
        >
          {appearance.icon}
        </div>


        <div className="min-w-0 flex-1">

          <div className="flex flex-wrap items-start justify-between gap-3">

            <div>

              <div className="flex items-center gap-2">

                <h2 className="font-bold text-slate-950">
                  {notification.title}
                </h2>


                {!notification.is_read && (
                  <span className="h-2.5 w-2.5 rounded-full bg-blue-600" />
                )}

              </div>


              <p className="mt-2 text-sm leading-6 text-slate-600">
                {notification.message}
              </p>

            </div>


            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${appearance.badgeClass}`}
            >
              {appearance.label}
            </span>

          </div>


          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">

            <p className="text-xs text-slate-400">
              {formatDateTime(
                notification.created_at
              )}
            </p>


            <div className="flex items-center gap-3">

              {!notification.is_read && (
                <button
                  type="button"
                  onClick={
                    onOpen
                  }
                  className="text-sm font-semibold text-slate-500"
                >
                  Mark as read
                </button>
              )}


              <Link
                href="/candidate/applications"
                onClick={
                  onOpen
                }
                className="text-sm font-semibold text-blue-600"
              >
                View Application →
              </Link>

            </div>

          </div>

        </div>

      </div>

    </article>
  );
}


function getNotificationAppearance(
  type:
    NotificationType
) {
  switch (type) {
    case "shortlisted":
      return {
        icon:
          "⭐",

        label:
          "Shortlisted",

        iconClass:
          "bg-blue-100",

        badgeClass:
          "bg-blue-100 text-blue-700",
      };


    case "interview":
      return {
        icon:
          "📅",

        label:
          "Interview",

        iconClass:
          "bg-purple-100",

        badgeClass:
          "bg-purple-100 text-purple-700",
      };


    case "hired":
      return {
        icon:
          "🎉",

        label:
          "Hired",

        iconClass:
          "bg-green-100",

        badgeClass:
          "bg-green-100 text-green-700",
      };


    case "rejected":
      return {
        icon:
          "📄",

        label:
          "Update",

        iconClass:
          "bg-red-100",

        badgeClass:
          "bg-red-100 text-red-700",
      };


    default:
      return {
        icon:
          "🔔",

        label:
          "Update",

        iconClass:
          "bg-amber-100",

        badgeClass:
          "bg-amber-100 text-amber-700",
      };
  }
}


function formatDateTime(
  value:
    string | null
) {
  if (!value) {
    return "Recently";
  }


  const date =
    new Date(
      value
    );


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "Recently";
  }


  return date.toLocaleString(
    "en-IN",
    {
      day:
        "numeric",

      month:
        "short",

      year:
        "numeric",

      hour:
        "numeric",

      minute:
        "2-digit",
    }
  );
}