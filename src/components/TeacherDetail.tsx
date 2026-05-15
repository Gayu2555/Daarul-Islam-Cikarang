import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { Teacher, TeacherSchedule } from "../types";

interface Subject {
  id: string;
  name: string;
  code: string;
}

interface Props {
  teacher: Teacher;
  onBack: () => void;
}

const DAYS = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

export default function TeacherDetail({ teacher, onBack }: Props) {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [schedules, setSchedules] = useState<TeacherSchedule[]>([]);
  const [activeTab, setActiveTab] = useState<"info" | "schedule">("info");
  const [loading, setLoading] = useState(true);

  // add schedule modal state
  const [isAdding, setIsAdding] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({
    subject_id: "",
    class_name: "",
    day_of_week: "Senin",
    start_time: "",
    end_time: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, [teacher.id]);

  const fetchData = async () => {
    if (!supabase) return;
    setLoading(true);
    try {
      const [{ data: subjectsData }, { data: schedulesData }] =
        await Promise.all([
          supabase
            .from("subjects")
            .select("id, name, code")
            .eq("teacher_id", teacher.id),
          supabase
            .from("teacher_schedules")
            .select("*, subjects(name)")
            .eq("teacher_id", teacher.id)
            .order("day_of_week"),
        ]);
      setSubjects((subjectsData as Subject[]) || []);
      setSchedules((schedulesData as TeacherSchedule[]) || []);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("teacher_schedules")
        .insert([{ ...scheduleForm, teacher_id: teacher.id }]);
      if (error) throw error;
      setIsAdding(false);
      setScheduleForm({
        subject_id: "",
        class_name: "",
        day_of_week: "Senin",
        start_time: "",
        end_time: "",
      });
      fetchData();
    } catch (err: any) {
      alert("Gagal menyimpan jadwal: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSchedule = async (id: string) => {
    if (!supabase) return;
    if (!confirm("Hapus jadwal ini?")) return;
    await supabase.from("teacher_schedules").delete().eq("id", id);
    fetchData();
  };

  const initials = teacher.name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  // group schedules by day
  const scheduleByDay = DAYS.reduce(
    (acc, day) => {
      acc[day] = schedules.filter((s) => s.day_of_week === day);
      return acc;
    },
    {} as Record<string, TeacherSchedule[]>,
  );

  const tabs = [
    { id: "info", label: "Info & Mapel" },
    { id: "schedule", label: `Jadwal (${schedules.length})` },
  ] as const;

  return (
    <div>
      {/* Back button */}
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
        Kembali ke daftar guru
      </button>

      {/* Hero */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-16 h-16 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 font-medium text-xl flex-shrink-0">
          {initials}
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800">{teacher.name}</h2>
          <p className="text-sm text-slate-500">NIP: {teacher.nip}</p>
          <span className="inline-block mt-1 px-2.5 py-0.5 bg-violet-50 text-violet-700 text-xs font-medium rounded-full">
            {teacher.subject_specialization}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-slate-50 rounded-xl p-4">
          <p className="text-2xl font-bold text-slate-800">{subjects.length}</p>
          <p className="text-xs text-slate-500 mt-0.5">Mata pelajaran diampu</p>
        </div>
        <div className="bg-slate-50 rounded-xl p-4">
          <p className="text-2xl font-bold text-slate-800">
            {schedules.length}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">Sesi jadwal mengajar</p>
        </div>
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
          {/* TAB: Info & Mapel */}
          {activeTab === "info" && (
            <div className="space-y-3">
              {/* Info cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { label: "Nama lengkap", value: teacher.name },
                  { label: "NIP", value: teacher.nip || "-" },
                  {
                    label: "Email",
                    value: teacher.email || "-",
                  },
                  {
                    label: "Spesialisasi",
                    value: teacher.subject_specialization || "-",
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="bg-white border border-slate-100 rounded-xl p-4"
                  >
                    <p className="text-xs text-slate-400 mb-1">{item.label}</p>
                    <p className="text-sm font-medium text-slate-800 break-all">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>

              {/* Mata pelajaran yang diampu */}
              <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden">
                <div className="px-5 py-3 border-b border-slate-100">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Mata pelajaran diampu
                  </p>
                </div>
                {subjects.length === 0 ? (
                  <p className="text-center text-slate-400 italic py-8 text-sm">
                    Belum ada mata pelajaran
                  </p>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {subjects.map((s) => (
                      <div
                        key={s.id}
                        className="flex items-center justify-between px-5 py-3"
                      >
                        <p className="text-sm font-medium text-slate-800">
                          {s.name}
                        </p>
                        <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full font-mono">
                          {s.code}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: Jadwal */}
          {activeTab === "schedule" && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <button
                  onClick={() => setIsAdding(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors text-sm font-medium"
                >
                  + Tambah jadwal
                </button>
              </div>

              {/* Add schedule form */}
              {isAdding && (
                <div className="bg-white border border-indigo-200 rounded-2xl p-5">
                  <p className="text-sm font-bold text-slate-700 mb-4">
                    Tambah jadwal baru
                  </p>
                  <form onSubmit={handleAddSchedule} className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-slate-500 mb-1 block">
                          Mata pelajaran
                        </label>
                        <select
                          required
                          value={scheduleForm.subject_id}
                          onChange={(e) =>
                            setScheduleForm((f) => ({
                              ...f,
                              subject_id: e.target.value,
                            }))
                          }
                          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="">Pilih mapel...</option>
                          {subjects.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-slate-500 mb-1 block">
                          Kelas
                        </label>
                        <input
                          required
                          type="text"
                          placeholder="misal: XII-IPA-1"
                          value={scheduleForm.class_name}
                          onChange={(e) =>
                            setScheduleForm((f) => ({
                              ...f,
                              class_name: e.target.value,
                            }))
                          }
                          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-500 mb-1 block">
                          Hari
                        </label>
                        <select
                          value={scheduleForm.day_of_week}
                          onChange={(e) =>
                            setScheduleForm((f) => ({
                              ...f,
                              day_of_week: e.target.value,
                            }))
                          }
                          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          {DAYS.map((d) => (
                            <option key={d} value={d}>
                              {d}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs text-slate-500 mb-1 block">
                            Mulai
                          </label>
                          <input
                            required
                            type="time"
                            value={scheduleForm.start_time}
                            onChange={(e) =>
                              setScheduleForm((f) => ({
                                ...f,
                                start_time: e.target.value,
                              }))
                            }
                            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-slate-500 mb-1 block">
                            Selesai
                          </label>
                          <input
                            required
                            type="time"
                            value={scheduleForm.end_time}
                            onChange={(e) =>
                              setScheduleForm((f) => ({
                                ...f,
                                end_time: e.target.value,
                              }))
                            }
                            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 justify-end pt-1">
                      <button
                        type="button"
                        onClick={() => setIsAdding(false)}
                        className="px-4 py-2 text-sm text-slate-500 hover:text-slate-800 transition-colors"
                      >
                        Batal
                      </button>
                      <button
                        type="submit"
                        disabled={saving}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors text-sm font-medium disabled:opacity-50"
                      >
                        {saving ? "Menyimpan..." : "Simpan"}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Schedule grouped by day */}
              {schedules.length === 0 && !isAdding ? (
                <p className="text-center text-slate-400 italic py-10 text-sm">
                  Belum ada jadwal mengajar
                </p>
              ) : (
                <div className="space-y-3">
                  {DAYS.filter((day) => scheduleByDay[day].length > 0).map(
                    (day) => (
                      <div
                        key={day}
                        className="bg-white border border-slate-100 rounded-2xl overflow-hidden"
                      >
                        <div className="px-5 py-3 bg-slate-50 border-b border-slate-100">
                          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            {day}
                          </p>
                        </div>
                        <div className="divide-y divide-slate-100">
                          {scheduleByDay[day].map((s) => (
                            <div
                              key={s.id}
                              className="flex items-center justify-between px-5 py-3"
                            >
                              <div className="flex items-center gap-3">
                                <div className="text-xs font-mono bg-indigo-50 text-indigo-700 px-2 py-1 rounded-lg whitespace-nowrap">
                                  {s.start_time.slice(0, 5)} –{" "}
                                  {s.end_time.slice(0, 5)}
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-slate-800">
                                    {s.subjects?.name}
                                  </p>
                                  <p className="text-xs text-slate-400">
                                    Kelas {s.class_name}
                                  </p>
                                </div>
                              </div>
                              <button
                                onClick={() => handleDeleteSchedule(s.id)}
                                className="text-slate-300 hover:text-red-500 transition-colors p-1"
                                aria-label="Hapus jadwal"
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 24 24"
                                  className="w-4 h-4"
                                  fill="currentColor"
                                >
                                  <path d="M6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6v12zm3.5-9h1v7h-1V10zm5 0h1v7h-1V10z" />
                                  <path d="M15.5 4l-1-1h-5l-1 1H5v2h14V4h-3.5z" />
                                </svg>
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ),
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
