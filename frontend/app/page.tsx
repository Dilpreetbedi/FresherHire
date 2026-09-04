"use client";

import Link from "next/link";
import { motion } from "framer-motion";

const features = [
  {
    title: "Prove Your Skills",
    description:
      "Take practical assessments and demonstrate what you can actually build.",
  },
  {
    title: "Get Verified",
    description:
      "Build a profile backed by skill scores, projects, and real evidence.",
  },
  {
    title: "Get Discovered",
    description:
      "Companies can find talented freshers based on what they can actually do.",
  },
];

const skills = [
  "Python",
  "AI / ML",
  "React",
  "JavaScript",
  "SQL",
  "Data Science",
  "RAG",
  "FastAPI",
];

const fadeUp = {
  hidden: {
    opacity: 0,
    y: 26,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.65,
      ease: "easeOut" as const,
    },
  },
};

const stagger = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.12,
    },
  },
};

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-slate-50 text-slate-900">
      <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <Link
            href="/"
            className="text-2xl font-bold tracking-tight text-slate-950"
          >
            Fresher
            <span className="text-blue-600">
              Hire
            </span>
          </Link>

          <div className="hidden items-center gap-8 text-sm font-medium text-slate-600 md:flex">
            <a
              href="#how-it-works"
              className="transition hover:text-slate-950"
            >
              How It Works
            </a>

            <a
              href="#skills"
              className="transition hover:text-slate-950"
            >
              Skills
            </a>

            <a
              href="#companies"
              className="transition hover:text-slate-950"
            >
              For Companies
            </a>
          </div>

          <Link
            href="/login"
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-400 hover:bg-slate-50"
          >
            Sign In
          </Link>
        </div>
      </nav>

      <section className="relative overflow-hidden px-4 py-20 sm:px-6 md:py-28">
        <div className="absolute inset-0 -z-10">
          <motion.div
            animate={{
              x: [0, 35, -20, 0],
              y: [0, 20, -10, 0],
              scale: [1, 1.1, 0.96, 1],
            }}
            transition={{
              duration: 14,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute left-[15%] top-[-6rem] h-80 w-80 rounded-full bg-blue-200/70 blur-3xl"
          />

          <motion.div
            animate={{
              x: [0, -25, 25, 0],
              y: [0, 30, 5, 0],
              scale: [1, 0.95, 1.08, 1],
            }}
            transition={{
              duration: 17,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute right-[8%] top-24 h-64 w-64 rounded-full bg-cyan-200/60 blur-3xl"
          />

          <div
            className="absolute inset-0 opacity-[0.35]"
            style={{
              backgroundImage:
                "radial-gradient(circle at 1px 1px, rgb(148 163 184 / 0.35) 1px, transparent 0)",
              backgroundSize: "28px 28px",
            }}
          />
        </div>

        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger}
          className="mx-auto max-w-5xl text-center"
        >
          <motion.div
            variants={fadeUp}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/80 px-4 py-2 text-sm font-semibold text-blue-700 shadow-sm backdrop-blur"
          >
            <motion.span
              animate={{
                scale: [1, 1.35, 1],
                opacity: [0.7, 1, 0.7],
              }}
              transition={{
                duration: 1.8,
                repeat: Infinity,
              }}
              className="h-2 w-2 rounded-full bg-blue-600"
            />

            Built for freshers • 0–2 years experience
          </motion.div>

          <motion.h1
            variants={fadeUp}
            className="text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl md:text-7xl"
          >
            Your first job shouldn&apos;t require
            <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
              {" "}
              2 years of experience.
            </span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="mx-auto mt-7 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg"
          >
            Prove your skills, build a verified profile, and get discovered by
            companies looking for entry-level talent.
          </motion.p>

          <motion.div
            variants={fadeUp}
            className="mt-9 flex flex-col justify-center gap-3 sm:flex-row"
          >
            <motion.div
              whileHover={{
                y: -3,
                scale: 1.02,
              }}
              whileTap={{
                scale: 0.98,
              }}
            >
              <Link
                href="/signup/fresher"
                className="block rounded-xl bg-blue-600 px-7 py-3.5 font-semibold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700"
              >
                I&apos;m a Fresher →
              </Link>
            </motion.div>

            <motion.div
              whileHover={{
                y: -3,
                scale: 1.02,
              }}
              whileTap={{
                scale: 0.98,
              }}
            >
              <Link
                href="/signup/company"
                className="block rounded-xl border border-slate-300 bg-white px-7 py-3.5 font-semibold text-slate-800 shadow-sm transition hover:border-slate-400 hover:bg-slate-50"
              >
                I&apos;m Hiring →
              </Link>
            </motion.div>
          </motion.div>

          <motion.p
            variants={fadeUp}
            className="mt-6 text-sm text-slate-500"
          >
            AI/ML • Software Engineering • Data • Internships • Entry-Level
          </motion.p>

          <motion.div
            variants={fadeUp}
            className="relative mx-auto mt-14 hidden max-w-4xl md:block"
          >
            <div className="rounded-3xl border border-slate-200 bg-white/85 p-5 shadow-2xl shadow-slate-200/60 backdrop-blur">
              <div className="grid gap-4 md:grid-cols-3">
                <PreviewCard
                  badge="Skill"
                  title="Python"
                  value="Verified"
                  delay={0}
                />

                <PreviewCard
                  badge="Assessment"
                  title="Python Assessment"
                  value="87%"
                  delay={0.4}
                />

                <PreviewCard
                  badge="Project"
                  title="AI Support Agent"
                  value="Live Project"
                  delay={0.8}
                />
              </div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      <section className="border-y border-slate-200 bg-white">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{
            once: true,
            amount: 0.3,
          }}
          variants={stagger}
          className="mx-auto max-w-6xl px-4 py-12 sm:px-6"
        >
          <div className="grid gap-8 text-center md:grid-cols-3">
            {[
              [
                "Skills",
                "Show what you can actually do",
              ],
              [
                "Projects",
                "Showcase your practical work",
              ],
              [
                "Opportunities",
                "Connect with companies hiring freshers",
              ],
            ].map(
              ([title, description]) => (
                <motion.div
                  key={title}
                  variants={fadeUp}
                >
                  <div className="text-3xl font-bold text-slate-950">
                    {title}
                  </div>

                  <p className="mt-2 text-sm text-slate-500">
                    {description}
                  </p>
                </motion.div>
              )
            )}
          </div>
        </motion.div>
      </section>

      <section className="px-4 py-20 sm:px-6 md:py-24">
        <div className="mx-auto max-w-6xl">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{
              once: true,
              amount: 0.3,
            }}
            variants={fadeUp}
            className="max-w-2xl"
          >
            <p className="text-sm font-semibold uppercase tracking-widest text-blue-600">
              Why FresherHire?
            </p>

            <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl md:text-5xl">
              Built for skills, not just resumes.
            </h2>

            <p className="mt-5 text-lg leading-8 text-slate-600">
              A resume tells companies what you&apos;ve studied. We help you
              show them what you can actually do.
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{
              once: true,
              amount: 0.2,
            }}
            variants={stagger}
            className="mt-12 grid gap-6 md:grid-cols-3"
          >
            {features.map(
              (feature, index) => (
                <motion.div
                  key={feature.title}
                  variants={fadeUp}
                  whileHover={{
                    y: -8,
                  }}
                  className="group rounded-2xl border border-slate-200 bg-white p-7 shadow-sm transition hover:border-blue-200 hover:shadow-xl"
                >
                  <motion.div
                    whileHover={{
                      rotate: 4,
                      scale: 1.05,
                    }}
                    className="mb-5 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-sm font-bold text-blue-700"
                  >
                    0{index + 1}
                  </motion.div>

                  <h3 className="text-xl font-semibold text-slate-950">
                    {feature.title}
                  </h3>

                  <p className="mt-3 leading-7 text-slate-600">
                    {feature.description}
                  </p>
                </motion.div>
              )
            )}
          </motion.div>
        </div>
      </section>

      <section
        id="how-it-works"
        className="border-y border-slate-200 bg-white px-4 py-20 sm:px-6 md:py-24"
      >
        <div className="mx-auto max-w-6xl">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{
              once: true,
              amount: 0.3,
            }}
            variants={fadeUp}
            className="text-center"
          >
            <p className="text-sm font-semibold uppercase tracking-widest text-blue-600">
              Simple Process
            </p>

            <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              How It Works
            </h2>

            <p className="mx-auto mt-4 max-w-xl text-slate-600">
              A simple path for candidates to prove themselves and for
              companies to hire with more confidence.
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{
              once: true,
              amount: 0.2,
            }}
            variants={stagger}
            className="mt-14 grid gap-6 md:grid-cols-2"
          >
            <motion.div
              variants={fadeUp}
              whileHover={{
                y: -5,
              }}
              className="rounded-2xl border border-slate-200 bg-slate-50 p-7 sm:p-8"
            >
              <p className="text-sm font-semibold text-blue-600">
                FOR FRESHERS
              </p>

              <div className="mt-8 space-y-6">
                <Step number="01" text="Create your profile" />
                <Step number="02" text="Prove your skills" />
                <Step number="03" text="Get verified" />
                <Step number="04" text="Apply to jobs" />
              </div>
            </motion.div>

            <motion.div
              variants={fadeUp}
              whileHover={{
                y: -5,
              }}
              className="rounded-2xl border border-slate-200 bg-slate-50 p-7 sm:p-8"
            >
              <p className="text-sm font-semibold text-blue-600">
                FOR COMPANIES
              </p>

              <div className="mt-8 space-y-6">
                <Step number="01" text="Post a job" />
                <Step number="02" text="Find verified talent" />
                <Step number="03" text="Shortlist candidates" />
                <Step number="04" text="Hire" />
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <section
        id="skills"
        className="px-4 py-20 sm:px-6 md:py-24"
      >
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{
            once: true,
            amount: 0.25,
          }}
          variants={stagger}
          className="mx-auto max-w-6xl text-center"
        >
          <motion.p
            variants={fadeUp}
            className="text-sm font-semibold uppercase tracking-widest text-blue-600"
          >
            Skill Verification
          </motion.p>

          <motion.h2
            variants={fadeUp}
            className="mt-4 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl"
          >
            Show companies what you know.
          </motion.h2>

          <motion.p
            variants={fadeUp}
            className="mx-auto mt-5 max-w-2xl text-slate-600"
          >
            Take practical assessments and build evidence around your skills.
          </motion.p>

          <motion.div
            variants={stagger}
            className="mt-10 flex flex-wrap justify-center gap-3"
          >
            {skills.map(
              (skill) => (
                <motion.div
                  key={skill}
                  variants={fadeUp}
                  whileHover={{
                    y: -4,
                    scale: 1.04,
                  }}
                  className="rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 shadow-sm"
                >
                  {skill}
                </motion.div>
              )
            )}
          </motion.div>
        </motion.div>
      </section>

      <section
        id="companies"
        className="px-4 pb-20 sm:px-6 md:pb-24"
      >
        <motion.div
          initial={{
            opacity: 0,
            y: 30,
            scale: 0.98,
          }}
          whileInView={{
            opacity: 1,
            y: 0,
            scale: 1,
          }}
          viewport={{
            once: true,
            amount: 0.25,
          }}
          transition={{
            duration: 0.7,
          }}
          className="relative mx-auto max-w-5xl overflow-hidden rounded-3xl border border-blue-300 bg-blue-600 px-6 py-14 text-center text-white shadow-xl shadow-blue-200 sm:px-8 sm:py-16"
        >
          <motion.div
            animate={{
              x: [0, 60, 0],
              y: [0, -30, 0],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute -left-12 -top-12 h-52 w-52 rounded-full bg-white/10 blur-2xl"
          />

          <motion.div
            animate={{
              x: [0, -50, 0],
              y: [0, 35, 0],
            }}
            transition={{
              duration: 12,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute -bottom-16 -right-10 h-64 w-64 rounded-full bg-cyan-300/20 blur-3xl"
          />

          <div className="relative z-10">
            <p className="text-sm font-semibold uppercase tracking-widest text-blue-100">
              Start Today
            </p>

            <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
              Ready to prove what you can do?
            </h2>

            <p className="mx-auto mt-5 max-w-xl text-blue-100">
              Whether you&apos;re looking for your first opportunity or your
              next talented fresher, start here.
            </p>

            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <motion.div
                whileHover={{
                  y: -3,
                }}
                whileTap={{
                  scale: 0.98,
                }}
              >
                <Link
                  href="/signup/fresher"
                  className="block rounded-xl bg-white px-7 py-3.5 font-semibold text-blue-700 shadow-sm transition hover:bg-blue-50"
                >
                  Create Fresher Profile
                </Link>
              </motion.div>

              <motion.div
                whileHover={{
                  y: -3,
                }}
                whileTap={{
                  scale: 0.98,
                }}
              >
                <Link
                  href="/signup/company"
                  className="block rounded-xl border border-blue-300 bg-blue-500/30 px-7 py-3.5 font-semibold text-white transition hover:bg-blue-500/50"
                >
                  Hire Fresh Talent
                </Link>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </section>

      <footer className="border-t border-slate-200 bg-white px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
            <div>
              <Link
                href="/"
                className="text-lg font-bold tracking-tight text-slate-900"
              >
                Fresher<span className="text-blue-600">Hire</span>
              </Link>

              <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                A recruitment technology platform helping freshers prove their
                skills and companies discover entry-level talent.
              </p>
            </div>

            <div className="flex flex-wrap gap-x-5 gap-y-3 text-sm font-medium text-slate-600">
              <Link
                href="/terms"
                className="transition hover:text-blue-600"
              >
                Terms & Conditions
              </Link>

              <Link
                href="/privacy"
                className="transition hover:text-blue-600"
              >
                Privacy Policy
              </Link>

              <Link
                href="/refund-policy"
                className="transition hover:text-blue-600"
              >
                Refund & Cancellation
              </Link>

              <Link
                href="/contact"
                className="transition hover:text-blue-600"
              >
                Contact Us
              </Link>
            </div>
          </div>

          <div className="mt-7 border-t border-slate-200 pt-5 text-sm text-slate-500">
            © 2026 FresherHire. All rights reserved.
          </div>
        </div>
      </footer>
    </main>
  );
}

function PreviewCard({
  badge,
  title,
  value,
  delay,
}: {
  badge: string;
  title: string;
  value: string;
  delay: number;
}) {
  return (
    <motion.div
      animate={{
        y: [0, -8, 0],
      }}
      transition={{
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut",
        delay,
      }}
      className="rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm"
    >
      <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
        {badge}
      </span>

      <p className="mt-4 font-semibold text-slate-950">
        {title}
      </p>

      <p className="mt-2 text-sm font-medium text-green-600">
        ✓ {value}
      </p>
    </motion.div>
  );
}

function Step({
  number,
  text,
}: {
  number: string;
  text: string;
}) {
  return (
    <motion.div
      whileHover={{
        x: 5,
      }}
      className="flex items-center gap-4"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-blue-200 bg-white text-xs font-bold text-blue-700">
        {number}
      </span>

      <span className="font-medium text-slate-800">
        {text}
      </span>
    </motion.div>
  );
}
