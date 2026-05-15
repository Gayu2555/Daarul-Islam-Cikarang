import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { Student, Grade, SPP } from "../types";

interface Props {
  student: Student;
  onBack: () => void;
}

export default function StudentDetail({ student, onBack }: Props) {
  const [grades, setGrades] = useState<Grade[]>([]);
  const [sppData, setSppData] = useState<SPP[]>([]);
  const [activeTab, setActiveTab] = useState<"info" | "grades" | "payments">(
    "info",
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudentData();
  }, [student.id]);

  const fetchStudentData = async () => {
    if (!supabase) return;
    setLoading(true);
    try {
      const [{ data: gradesData }, { data: sppPayments }] = await Promise.all([
        supabase
          .from("grades")
          .select("*, subjects(name)")
          .eq("student_id", student.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("spp_payments")
          .select("*")
          .eq("student_id", student.id)
          .order("due_date", { ascending: false }),
      ]);
      setGrades((gradesData as Grade[]) || []);
      setSppData((sppPayments as SPP[]) || []);
    } finally {
      setLoading(false);
    }
  };

  const initials = student.name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  const avgScore =
    grades.length > 0
      ? Math.round(
          grades.reduce((s, g) => s + g.grade_score, 0) / grades.length,
        )
      : "-";

  const unpaidCount = sppData.filter((s) => s.status !== "paid").length;

  const tabs = [
    { id: "info", label: "Info pribadi" },
    { id: "grades", label: `Nilai (${grades.length})` },
    { id: "payments", label: `SPP (${sppData.length})` },
  ] as const;

  return (
    <div>
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 mb-6 transition-colors"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
        Kembali ke daftar siswa
      </button>

      {/* Hero */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-medium text-xl flex-shrink-0">
          {initials}
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800">{student.name}</h2>
          <p className="text-sm text-slate-500">
            NIS: {student.nis} · Kelas {student.class_name}
          </p>
          <span className="inline-block mt-1 px-2.5 py-0.5 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-full">
            Aktif
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { num: grades.length, label: "Mata pelajaran" },
          { num: avgScore, label: "Rata-rata nilai" },
          { num: unpaidCount, label: "Tagihan SPP" },
        ].map((s) => (
          <div key={s.label} className="bg-slate-50 rounded-xl p-4">
            <p className="text-2xl font-bold text-slate-800">{s.num}</p>
            <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              activeTab === t.id
                ? "bg-indigo-600 text-white"
                : "bg-white border border-slate-200 text-slate-500 hover:text-slate-800"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-10 text-center text-slate-400 text-sm">
          Memuat data...
        </div>
      ) : (
        <>
          {activeTab === "info" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { label: "Nama lengkap", value: student.name },
                { label: "NIS", value: student.nis },
                { label: "Kelas", value: student.class_name },
                {
                  label: "Email orang tua",
                  value: student.parent_email || "-",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="bg-white border border-slate-100 rounded-xl p-4"
                >
                  <p className="text-xs text-slate-400 mb-1">{item.label}</p>
                  <p className="text-sm font-medium text-slate-800">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          )}

          {activeTab === "grades" && (
            <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden">
              {grades.length === 0 ? (
                <p className="text-center text-slate-400 italic py-10 text-sm">
                  Belum ada nilai
                </p>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500">
                      <th className="px-5 py-3">Mata pelajaran</th>
                      <th className="px-5 py-3">Semester</th>
                      <th className="px-5 py-3">Tahun</th>
                      <th className="px-5 py-3">Nilai</th>
                      <th className="px-5 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {grades.map((g) => (
                      <tr
                        key={g.id}
                        className="hover:bg-slate-50/50 transition-colors"
                      >
                        <td className="px-5 py-3 font-medium text-slate-800">
                          {g.subjects?.name}
                        </td>
                        <td className="px-5 py-3 text-slate-500">
                          {g.semester}
                        </td>
                        <td className="px-5 py-3 text-slate-500">
                          {g.academic_year}
                        </td>
                        <td className="px-5 py-3 font-bold text-slate-800">
                          {g.grade_score}
                        </td>
                        <td className="px-5 py-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                              g.grade_score >= 70
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-red-50 text-red-600"
                            }`}
                          >
                            {g.grade_score >= 70 ? "Lulus" : "Remedial"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {activeTab === "payments" && (
            <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden">
              {sppData.length === 0 ? (
                <p className="text-center text-slate-400 italic py-10 text-sm">
                  Belum ada data SPP
                </p>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500">
                      <th className="px-5 py-3">Jatuh tempo</th>
                      <th className="px-5 py-3">Nominal</th>
                      <th className="px-5 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {sppData.map((s) => (
                      <tr
                        key={s.id}
                        className="hover:bg-slate-50/50 transition-colors"
                      >
                        <td className="px-5 py-3 text-slate-600">
                          {new Date(s.due_date).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                        </td>
                        <td className="px-5 py-3 font-medium text-slate-800">
                          {new Intl.NumberFormat("id-ID", {
                            style: "currency",
                            currency: "IDR",
                            minimumFractionDigits: 0,
                          }).format(s.amount)}
                        </td>
                        <td className="px-5 py-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                              s.status === "paid"
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-amber-50 text-amber-700"
                            }`}
                          >
                            {s.status === "paid" ? "Lunas" : "Belum bayar"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
