"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import { requireFresher } from "../lib/auth";
import { useRouter } from "next/navigation";

type AssessmentQuestion = {
  attempt_id: string;
  question_position: number;
  question_id: number;
  question_text: string;
  options: string[];
  difficulty: "easy" | "medium" | "hard";
  expires_at: string;
};

type AssessmentResult = {
  result_score: number;
  result_total: number;
  result_percentage: number;
  result_verified: boolean;
  result_level: string;
  result_attempt_count: number;
  result_best_percentage: number;
};

const ASSESSMENT_MINUTES = 20;

export default function AssessmentsPage() {
  const router = useRouter();

  const [questions, setQuestions] = useState<AssessmentQuestion[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [attemptId, setAttemptId] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(ASSESSMENT_MINUTES * 60);
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [starting, setStarting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    protectPage();
  }, []);

  useEffect(() => {
    if (!expiresAt || result) {
      return;
    }

    function updateTimer() {
      const remaining = Math.max(
        0,
        Math.floor(
          (new Date(expiresAt).getTime() - Date.now()) / 1000
        )
      );

      setSecondsLeft(remaining);

      if (remaining === 0) {
        setError(
          "This assessment has expired. Start a new attempt."
        );
      }
    }

    updateTimer();

    const timer = window.setInterval(updateTimer, 1000);

    return () => window.clearInterval(timer);
  }, [expiresAt, result]);

  async function protectPage() {
    try {
      const auth = await requireFresher();

      if (!auth.allowed) {
        router.replace(auth.redirectTo!);
        return;
      }

      if (!auth.user) {
        router.replace("/login");
        return;
      }

      setCheckingAuth(false);
    } catch (err) {
      console.error("Assessment auth error:", err);
      router.replace("/login");
    }
  }

  async function startAssessment() {
    if (starting) {
      return;
    }

    setStarting(true);
    setError("");
    setResult(null);

    try {
      const auth = await requireFresher();

      if (!auth.allowed) {
        router.replace(auth.redirectTo!);
        return;
      }

      if (!auth.user) {
        router.replace("/login");
        return;
      }

      const {
        data,
        error: startError,
      } = await supabase.rpc("start_python_assessment");

      if (startError) {
        console.error("Assessment start RPC error:", startError);
        setError(startError.message || "Could not start assessment.");
        return;
      }

      const rows = (data || []) as Array<{
        attempt_id: string;
        question_position: number;
        question_id: number;
        question_text: string;
        options: unknown;
        difficulty: "easy" | "medium" | "hard";
        expires_at: string;
      }>;

      if (rows.length !== 15) {
        console.error("Invalid assessment payload:", data);
        setError("Could not load a complete assessment.");
        return;
      }

      const normalizedQuestions: AssessmentQuestion[] = rows.map((row) => {
        const options = Array.isArray(row.options)
          ? row.options.map(String)
          : [];

        if (options.length !== 4) {
          throw new Error("Invalid assessment options.");
        }

        return {
          attempt_id: row.attempt_id,
          question_position: row.question_position,
          question_id: row.question_id,
          question_text: row.question_text,
          options,
          difficulty: row.difficulty,
          expires_at: row.expires_at,
        };
      });

      setQuestions(normalizedQuestions);
      setAttemptId(normalizedQuestions[0].attempt_id);
      setExpiresAt(normalizedQuestions[0].expires_at);
      setAnswers(Array(normalizedQuestions.length).fill(null));
      setCurrentQuestion(0);
    } catch (err) {
      console.error("Unexpected assessment start error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Could not start assessment."
      );
    } finally {
      setStarting(false);
    }
  }

  function selectAnswer(index: number) {
    if (saving || secondsLeft <= 0) {
      return;
    }

    setAnswers((currentAnswers) => {
      const updated = [...currentAnswers];
      updated[currentQuestion] = index;
      return updated;
    });
  }

  function goNext() {
    if (answers[currentQuestion] === null) {
      alert("Please select an answer.");
      return;
    }

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  }

  function goPrevious() {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  }

  async function submitAssessment() {
    if (saving || secondsLeft <= 0) {
      return;
    }

    if (answers.some((answer) => answer === null)) {
      alert("Please answer all questions before submitting.");
      return;
    }

    if (!attemptId) {
      setError("Assessment attempt is missing. Please start again.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const auth = await requireFresher();

      if (!auth.allowed) {
        router.replace(auth.redirectTo!);
        return;
      }

      if (!auth.user) {
        router.replace("/login");
        return;
      }

      const {
        data,
        error: submitError,
      } = await supabase.rpc(
        "submit_python_assessment",
        {
          p_attempt_id: attemptId,
          p_answers: answers as number[],
        }
      );

      if (submitError) {
        console.error("Assessment submit RPC error:", submitError);
        setError(
          submitError.message || "Could not submit assessment."
        );
        return;
      }

      const response = Array.isArray(data) ? data[0] : data;

      if (
        !response ||
        typeof response.result_score !== "number" ||
        typeof response.result_attempt_count !== "number" ||
        typeof response.result_best_percentage !== "number"
      ) {
        console.error("Invalid assessment result:", data);
        setError("Could not calculate your assessment result.");
        return;
      }

      setResult(response as AssessmentResult);
    } catch (err) {
      console.error(
        "Unexpected assessment submission error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Could not submit assessment."
      );
    } finally {
      setSaving(false);
    }
  }

  function resetAssessment() {
    setQuestions([]);
    setAnswers([]);
    setAttemptId("");
    setExpiresAt("");
    setCurrentQuestion(0);
    setSecondsLeft(ASSESSMENT_MINUTES * 60);
    setResult(null);
    setError("");
  }

  const formattedTime = useMemo(() => {
    const minutes = Math.floor(secondsLeft / 60);
    const seconds = secondsLeft % 60;

    return `${String(minutes).padStart(2, "0")}:${String(
      seconds
    ).padStart(2, "0")}`;
  }, [secondsLeft]);

  if (checkingAuth) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-900">
        <div className="text-center">
          <p className="font-semibold">Loading assessment...</p>
          <p className="mt-2 text-sm text-slate-500">
            Checking your account
          </p>
        </div>
      </main>
    );
  }

  if (result) {
    return (
      <main className="min-h-screen bg-slate-50 text-slate-900">
        <nav className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
            <Link
              href="/"
              className="text-2xl font-bold tracking-tight text-slate-950"
            >
              Fresher<span className="text-blue-600">Hire</span>
            </Link>

            <Link
              href="/dashboard"
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
            >
              ← Dashboard
            </Link>
          </div>
        </nav>

        <section className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-16">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-10">
            <p className="text-sm font-semibold uppercase tracking-widest text-blue-600">
              Assessment Complete
            </p>

            <h1 className="mt-5 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              Python Assessment
            </h1>

            <div className="mx-auto mt-10 flex h-40 w-40 items-center justify-center rounded-full border-8 border-blue-600 bg-blue-50">
              <div>
                <div className="text-4xl font-bold text-slate-950">
                  {result.result_percentage}%
                </div>

                <div className="mt-1 text-sm font-medium text-slate-500">
                  {result.result_level}
                </div>
              </div>
            </div>

            <p className="mt-8 text-lg text-slate-600">
              You answered{" "}
              <span className="font-bold text-slate-950">
                {result.result_score}
              </span>{" "}
              out of{" "}
              <span className="font-bold text-slate-950">
                {result.result_total}
              </span>{" "}
              questions correctly.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Current Score
                </p>
                <p className="mt-2 text-2xl font-bold text-slate-950">
                  {result.result_percentage}%
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Best Score
                </p>
                <p className="mt-2 text-2xl font-bold text-slate-950">
                  {result.result_best_percentage}%
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Attempt
                </p>
                <p className="mt-2 text-2xl font-bold text-slate-950">
                  #{result.result_attempt_count}
                </p>
              </div>
            </div>

            {result.result_verified ? (
              <div className="mt-8 rounded-xl border border-green-200 bg-green-50 p-5">
                <p className="font-semibold text-green-800">
                  ✓ Python Verified
                </p>

                <p className="mt-2 text-sm text-slate-600">
                  This attempt passed the 75% verification threshold.
                  Recruiters can use your assessment history as an
                  additional skill signal.
                </p>
              </div>
            ) : (
              <div className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-5">
                <p className="font-semibold text-amber-800">
                  Verification not earned on this attempt
                </p>

                <p className="mt-2 text-sm text-slate-600">
                  You need at least 75% on an assessment attempt to
                  earn verification. Your best score remains saved.
                </p>
              </div>
            )}

            {result.result_best_percentage >= 75 &&
              !result.result_verified && (
                <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-4">
                  <p className="text-sm font-semibold text-blue-800">
                    Your Python skill is still verified from a previous
                    qualifying attempt.
                  </p>
                </div>
              )}

            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <button
                onClick={resetAssessment}
                className="rounded-xl border border-slate-300 bg-white px-6 py-3 font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
              >
                Try Another Random Test
              </button>

              <Link
                href="/dashboard"
                className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white shadow-sm hover:bg-blue-700"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        </section>
      </main>
    );
  }

  if (questions.length === 0) {
    return (
      <main className="min-h-screen bg-slate-50 text-slate-900">
        <nav className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
            <Link
              href="/"
              className="text-2xl font-bold tracking-tight text-slate-950"
            >
              Fresher<span className="text-blue-600">Hire</span>
            </Link>

            <Link
              href="/dashboard"
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
            >
              ← Dashboard
            </Link>
          </div>
        </nav>

        <section className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-16">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
            <p className="text-sm font-semibold uppercase tracking-widest text-blue-600">
              Skill Assessment
            </p>

            <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              Python Verification
            </h1>

            <p className="mt-4 leading-7 text-slate-600">
              Complete a randomized 15-question assessment covering
              practical Python knowledge, code reasoning, debugging
              concepts, and edge cases.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-2xl font-bold text-slate-950">15</p>
                <p className="mt-1 text-sm text-slate-500">
                  Random questions
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-2xl font-bold text-slate-950">
                  20 min
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Time limit
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-2xl font-bold text-slate-950">75%</p>
                <p className="mt-1 text-sm text-slate-500">
                  Verification score
                </p>
              </div>
            </div>

            <div className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="font-semibold text-amber-800">
                Assessment integrity
              </p>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                Questions are selected server-side for each attempt.
                The answer key is never sent to the browser.
              </p>
            </div>

            {error && (
              <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              onClick={startAssessment}
              disabled={starting}
              className="mt-8 w-full rounded-xl bg-blue-600 px-5 py-4 font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {starting
                ? "Preparing Assessment..."
                : "Start Randomized Assessment →"}
            </button>
          </div>
        </section>
      </main>
    );
  }

  const question = questions[currentQuestion];
  const selectedAnswer = answers[currentQuestion];

  const progress =
    ((currentQuestion + 1) / questions.length) * 100;

  const answeredCount = answers.filter(
    (answer) => answer !== null
  ).length;

  const expired = secondsLeft <= 0;

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <nav className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <Link
            href="/"
            className="text-2xl font-bold tracking-tight text-slate-950"
          >
            Fresher<span className="text-blue-600">Hire</span>
          </Link>

          <div className="flex items-center gap-3">
            <div
              className={`rounded-xl border px-3 py-2 text-sm font-bold ${
                secondsLeft <= 300
                  ? "border-red-200 bg-red-50 text-red-700"
                  : "border-slate-200 bg-slate-50 text-slate-700"
              }`}
            >
              {formattedTime}
            </div>

            <Link
              href="/dashboard"
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
            >
              Exit
            </Link>
          </div>
        </div>
      </nav>

      <section className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-blue-600">
            Python Assessment
          </p>

          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                Question {currentQuestion + 1}
              </h1>

              <p className="mt-2 text-sm text-slate-500">
                {answeredCount} of {questions.length} answered
              </p>
            </div>

            <span className="w-fit rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold capitalize text-slate-600">
              {question.difficulty}
            </span>
          </div>
        </div>

        <div className="mt-7 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex justify-between text-sm">
            <span className="font-medium text-slate-600">
              Question {currentQuestion + 1} of {questions.length}
            </span>

            <span className="font-semibold text-blue-600">
              {Math.round(progress)}%
            </span>
          </div>

          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-blue-600 transition-all"
              style={{
                width: `${progress}%`,
              }}
            />
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 md:p-10">
          <p className="whitespace-pre-line text-xl font-semibold leading-8 text-slate-950">
            {question.question_text}
          </p>

          <div className="mt-8 space-y-3">
            {question.options.map((option, index) => {
              const selected = selectedAnswer === index;

              return (
                <button
                  key={`${question.question_id}-${index}`}
                  onClick={() => selectAnswer(index)}
                  disabled={saving || expired}
                  className={`w-full rounded-xl border p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-60 ${
                    selected
                      ? "border-blue-500 bg-blue-50 text-blue-800 ring-2 ring-blue-100"
                      : "border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-blue-50/40"
                  }`}
                >
                  <span
                    className={`mr-4 inline-flex h-7 w-7 items-center justify-center rounded-full border text-xs font-semibold ${
                      selected
                        ? "border-blue-300 bg-blue-100 text-blue-700"
                        : "border-slate-300 bg-slate-50 text-slate-600"
                    }`}
                  >
                    {String.fromCharCode(65 + index)}
                  </span>

                  {option}
                </button>
              );
            })}
          </div>

          {error && (
            <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button
              onClick={goPrevious}
              disabled={currentQuestion === 0 || saving}
              className="rounded-xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              ← Previous
            </button>

            {currentQuestion === questions.length - 1 ? (
              <button
                onClick={submitAssessment}
                disabled={
                  saving ||
                  expired ||
                  answers.some((answer) => answer === null)
                }
                className="flex-1 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? "Submitting..." : "Submit Assessment"}
              </button>
            ) : (
              <button
                onClick={goNext}
                disabled={
                  selectedAnswer === null || saving || expired
                }
                className="flex-1 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next Question →
              </button>
            )}
          </div>
        </div>

        <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50 p-4">
          <p className="text-sm font-medium text-blue-800">
            Verification threshold: 75%
          </p>

          <p className="mt-1 text-xs leading-5 text-slate-600">
            This attempt contains 5 easy, 6 medium, and 4 hard
            questions selected randomly by the server.
          </p>
        </div>
      </section>
    </main>
  );
}
