"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Lead = {
  id: number;

  full_name: string;
  work_email: string;
  phone: string;
  designation: string;

  company_name: string;
  company_website: string | null;
  company_size: string;
  company_type: string;

  roles: string;
  openings: number;
  location: string;
  job_type: string;
  experience: string;

  skills: string | null;
  requirements: string | null;

  status: string;
  created_at: string;
};

const statuses = [
  "new",
  "contacted",
  "qualified",
  "approved",
  "rejected",
];

export default function AdminLeadsPage() {
  const router = useRouter();

  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedLead, setSelectedLead] =
    useState<Lead | null>(null);

  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:8000";

  async function fetchLeads() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${apiUrl}/api/recruiter-leads`,
        {
          credentials: "include",
          cache: "no-store",
        }
      );

      if (response.status === 401) {
        router.replace("/admin/login");
        return;
      }

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.detail ||
            "Unable to load recruiter leads."
        );
      }

      setLeads(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load recruiter leads."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchLeads();
  }, []);

  async function updateStatus(
    leadId: number,
    status: string
  ) {
    try {
      const response = await fetch(
        `${apiUrl}/api/recruiter-leads/${leadId}/status`,
        {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status,
          }),
        }
      );

      if (response.status === 401) {
        router.replace("/admin/login");
        return;
      }

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.detail ||
            "Unable to update status."
        );
      }

      setLeads((current) =>
        current.map((lead) =>
          lead.id === leadId
            ? {
                ...lead,
                status,
              }
            : lead
        )
      );

      setSelectedLead((current) =>
        current?.id === leadId
          ? {
              ...current,
              status,
            }
          : current
      );

      if (
        data?.temporary_password &&
        data?.recruiter_email
      ) {
        alert(
          `Recruiter account created.\n\nEmail: ${data.recruiter_email}\nTemporary password: ${data.temporary_password}\n\nShare these credentials securely with the recruiter.`
        );
      }
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : "Unable to update status."
      );
    }
  }

  const totalLeads = leads.length;

  const newLeads = leads.filter(
    (lead) => lead.status === "new"
  ).length;

  const qualified = leads.filter(
    (lead) => lead.status === "qualified"
  ).length;

  const approved = leads.filter(
    (lead) => lead.status === "approved"
  ).length;

  return (
    <main className="min-h-screen bg-[#f7f9fd] text-slate-900">
      {/* Navbar */}

      <nav className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <Link
            href="/"
            className="flex items-center gap-2 text-xl font-black"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950 text-sm text-white">
              F
            </span>

            <span>
              Fresher
              <span className="text-blue-600">
                Hire
              </span>
            </span>
          </Link>

          <div>
            <p className="text-sm font-bold text-slate-700">
              Admin Dashboard
            </p>

            <p className="text-right text-xs text-slate-400">
              Recruiter Leads
            </p>
          </div>
        </div>
      </nav>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        {/* Header */}

        <div>
          <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-600">
            Sales Pipeline
          </p>

          <h1 className="mt-3 text-4xl font-black tracking-tight">
            Recruiter Leads
          </h1>

          <p className="mt-3 text-slate-600">
            Review companies that have submitted hiring
            requirements through FresherHire.
          </p>
        </div>

        {/* Stats */}

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Leads"
            value={totalLeads}
          />

          <StatCard
            title="New"
            value={newLeads}
          />

          <StatCard
            title="Qualified"
            value={qualified}
          />

          <StatCard
            title="Approved"
            value={approved}
          />
        </div>

        {/* Lead table */}

        <div className="mt-10 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
            <div>
              <h2 className="font-black">
                Company Enquiries
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {leads.length} recruiter leads
              </p>
            </div>

            <button
              onClick={fetchLeads}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold transition hover:bg-slate-50"
            >
              Refresh
            </button>
          </div>

          {loading && (
            <div className="p-10 text-center text-slate-500">
              Loading recruiter leads...
            </div>
          )}

          {error && (
            <div className="m-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
              {error}
            </div>
          )}

          {!loading &&
            !error &&
            leads.length === 0 && (
              <div className="p-12 text-center">
                <p className="font-bold text-slate-800">
                  No recruiter leads yet
                </p>

                <p className="mt-2 text-sm text-slate-500">
                  Recruiter enquiries will appear
                  here after form submission.
                </p>
              </div>
            )}

          {!loading && leads.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px]">
                <thead className="bg-slate-50">
                  <tr className="text-left text-xs font-black uppercase tracking-wider text-slate-500">
                    <th className="px-6 py-4">
                      Company
                    </th>

                    <th className="px-6 py-4">
                      Recruiter
                    </th>

                    <th className="px-6 py-4">
                      Hiring
                    </th>

                    <th className="px-6 py-4">
                      Location
                    </th>

                    <th className="px-6 py-4">
                      Status
                    </th>

                    <th className="px-6 py-4">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {leads.map((lead) => (
                    <tr
                      key={lead.id}
                      className="border-t border-slate-100"
                    >
                      <td className="px-6 py-5">
                        <p className="font-black text-slate-900">
                          {lead.company_name}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {lead.company_size}
                        </p>
                      </td>

                      <td className="px-6 py-5">
                        <p className="font-bold">
                          {lead.full_name}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {lead.designation}
                        </p>

                        <p className="mt-1 text-xs text-blue-600">
                          {lead.work_email}
                        </p>
                      </td>

                      <td className="px-6 py-5">
                        <p className="font-semibold">
                          {lead.roles}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {lead.openings} openings
                        </p>
                      </td>

                      <td className="px-6 py-5 text-sm text-slate-600">
                        {lead.location}
                      </td>

                      <td className="px-6 py-5">
                        <select
                          value={lead.status}
                          onChange={(e) =>
                            updateStatus(
                              lead.id,
                              e.target.value
                            )
                          }
                          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold capitalize outline-none"
                        >
                          {statuses.map((status) => (
                            <option
                              key={status}
                              value={status}
                            >
                              {status}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td className="px-6 py-5">
                        <button
                          onClick={() =>
                            setSelectedLead(lead)
                          }
                          className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-bold text-white transition hover:bg-blue-600"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* Lead Details Modal */}

      {selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white p-7 shadow-2xl sm:p-9">
            <div className="flex items-start justify-between gap-5">
              <div>
                <p className="text-sm font-black uppercase tracking-wider text-blue-600">
                  Recruiter Lead
                </p>

                <h2 className="mt-2 text-3xl font-black">
                  {selectedLead.company_name}
                </h2>
              </div>

              <button
                onClick={() =>
                  setSelectedLead(null)
                }
                className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-xl"
              >
                ×
              </button>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <Detail
                label="Recruiter"
                value={selectedLead.full_name}
              />

              <Detail
                label="Designation"
                value={selectedLead.designation}
              />

              <Detail
                label="Email"
                value={selectedLead.work_email}
              />

              <Detail
                label="Phone"
                value={selectedLead.phone}
              />

              <Detail
                label="Company Size"
                value={selectedLead.company_size}
              />

              <Detail
                label="Company Type"
                value={selectedLead.company_type}
              />

              <Detail
                label="Hiring Roles"
                value={selectedLead.roles}
              />

              <Detail
                label="Openings"
                value={String(
                  selectedLead.openings
                )}
              />

              <Detail
                label="Location"
                value={selectedLead.location}
              />

              <Detail
                label="Job Type"
                value={selectedLead.job_type}
              />

              <Detail
                label="Experience"
                value={selectedLead.experience}
              />

              <Detail
                label="Skills"
                value={
                  selectedLead.skills ||
                  "Not provided"
                }
              />
            </div>

            <div className="mt-5">
              <p className="text-xs font-black uppercase tracking-wider text-slate-400">
                Hiring Requirements
              </p>

              <div className="mt-2 rounded-2xl bg-slate-50 p-5 text-sm leading-7 text-slate-700">
                {selectedLead.requirements ||
                  "No additional requirements provided."}
              </div>
            </div>

            {selectedLead.company_website && (
              <a
                href={selectedLead.company_website}
                target="_blank"
                rel="noreferrer"
                className="mt-6 inline-flex font-bold text-blue-600 hover:text-blue-700"
              >
                Visit Company Website →
              </a>
            )}

            <div className="mt-8 border-t border-slate-100 pt-6">
              <label className="text-sm font-bold">
                Lead Status
              </label>

              <select
                value={selectedLead.status}
                onChange={(e) =>
                  updateStatus(
                    selectedLead.id,
                    e.target.value
                  )
                }
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 font-bold capitalize"
              >
                {statuses.map((status) => (
                  <option
                    key={status}
                    value={status}
                  >
                    {status}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function StatCard({
  title,
  value,
}: {
  title: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-semibold text-slate-500">
        {title}
      </p>

      <p className="mt-3 text-3xl font-black text-slate-950">
        {value}
      </p>
    </div>
  );
}

function Detail({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <p className="text-xs font-black uppercase tracking-wider text-slate-400">
        {label}
      </p>

      <p className="mt-2 font-semibold text-slate-800">
        {value}
      </p>
    </div>
  );
}