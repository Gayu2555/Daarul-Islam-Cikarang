import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type {
  Class,
  Student,
  CurriculumTemplate,
  ClassSchedule,
} from "../types";

interface Props {
  classData: Class;
  onBack: () => void;
}

interface ClassSubject {
  id: string;
  subject_id: string;
  academic_year: string;
  subjects: { name: string; code?: string };
}

interface ScheduleSlot {
  id: string; // temporary id untuk key
  subject_id: string;
  teacher_id: string;
  start_time: string;
  end_time: string;
  room: string;
}

const DAYS = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

const emptySlot = (): ScheduleSlot => ({
  id: crypto.randomUUID(),
  subject_id: "",
  teacher_id: "",
  start_time: "",
  end_time: "",
  room: "",
});

export default function ClassDetail({ classData, onBack }: Props) {
  const [students, setStudents] = useState<Student[]>([]);
  const [classSubjects, setClassSubjects] = useState<ClassSubject[]>([]);
  const [templates, setTemplates] = useState<CurriculumTemplate[]>([]);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [schedules, setSchedules] = useState<ClassSchedule[]>([]);
  const [activeTab, setActiveTab] = useState<
    "info" | "students" | "subjects" | "schedule"
  >("info");
  const [loading, setLoading] = useState(true);

  // assign template state
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [assignResult, setAssignResult] = useState<{
    subject_count: number;
    enrolled_count: number;
  } | null>(null);

  // add student state
  const [addingStudent, setAddingStudent] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [savingStudent, setSavingStudent] = useState(false);

  // schedule state — per day editing
  const [editingDay, setEditingDay] = useState<string | null>(null);
  const [daySlots, setDaySlots] = useState<ScheduleSlot[]>([emptySlot()]);
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [allTeachers, setAllTeachers] = useState<
    { id: string; name: string }[]
  >([]);

  useEffect(() => {
    fetchAll();
  }, [classData.id]);

  const fetchAll = async () => {
    if (!supabase) return;
    setLoading(true);
    try {
      const [
        { data: studentsData },
        { data: classSubjectsData },
        { data: templatesData },
        { data: allStudentsData },
        { data: schedulesData },
        { data: teachersData },
      ] = await Promise.all([
        supabase
          .from("students")
          .select("*")
          .eq("class_id", classData.id)
          .order("name"),
        supabase
          .from("class_subjects")
          .select("*, subjects(name, code)")
          .eq("class_id", classData.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("curriculum_templates")
          .select("*, curriculum_template_subjects(subject_id, subjects(name))")
          .order("name"),
        supabase
          .from("students")
          .select("*")
          .is("class_id", null)
          .order("name"),
        supabase
          .from("class_schedules")
          .select("*, subjects(name, code), teachers(name)")
          .eq("class_id", classData.id)
          .order("day_of_week")
          .order("start_time"),
        supabase.from("teachers").select("id, name").order("name"),
      ]);

      setStudents((studentsData as Student[]) || []);
      setClassSubjects((classSubjectsData as ClassSubject[]) || []);
      setTemplates((templatesData as CurriculumTemplate[]) || []);
      setAllStudents((allStudentsData as Student[]) || []);
      setSchedules((schedulesData as ClassSchedule[]) || []);
      setAllTeachers((teachersData as { id: string; name: string }[]) || []);
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // ASSIGN TEMPLATE
  // ============================================
  const handleAssignTemplate = async () => {
    if (!supabase || !selectedTemplateId) return;
    setAssigning(true);
    setAssignResult(null);
    try {
      const { data, error } = await supabase.rpc("assign_template_to_class", {
        p_template_id: selectedTemplateId,
        p_class_id: classData.id,
        p_academic_year: classData.academic_year,
      });
      if (error) throw error;
      setAssignResult(data?.[0] ?? { subject_count: 0, enrolled_count: 0 });
      setSelectedTemplateId("");
      fetchAll();
    } catch (err: any) {
      alert("Gagal assign template: " + err.message);
    } finally {
      setAssigning(false);
    }
  };

  // ============================================
  // TAMBAH SISWA
  // ============================================
  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !selectedStudentId) return;
    setSavingStudent(true);
    try {
      const { error } = await supabase
        .from("students")
        .update({ class_id: classData.id })
        .eq("id", selectedStudentId);
      if (error) throw error;

      await supabase.rpc("sync_student_to_class", {
        p_student_id: selectedStudentId,
        p_class_id: classData.id,
      });

      setAddingStudent(false);
      setSelectedStudentId("");
      fetchAll();
    } catch (err: any) {
      alert("Gagal menambah siswa: " + err.message);
    } finally {
      setSavingStudent(false);
    }
  };

  const handleRemoveStudent = async (studentId: string) => {
    if (!supabase) return;
    if (
      !confirm(
        "Keluarkan siswa dari kelas ini? Enrollment mapel akan tetap tersimpan.",
      )
    )
      return;
    try {
      const { error } = await supabase
        .from("students")
        .update({ class_id: null })
        .eq("id", studentId);
      if (error) throw error;
      fetchAll();
    } catch (err: any) {
      alert("Gagal: " + err.message);
    }
  };

  const handleRemoveSubject = async (classSubjectId: string) => {
    if (!supabase) return;
    if (!confirm("Hapus mata pelajaran dari kelas ini?")) return;
    try {
      const { error } = await supabase
        .from("class_subjects")
        .delete()
        .eq("id", classSubjectId);
      if (error) throw error;
      fetchAll();
    } catch (err: any) {
      alert("Gagal: " + err.message);
    }
  };

  // ============================================
  // SCHEDULE: open day editor
  // ============================================
  const openDayEditor = (day: string) => {
    setEditingDay(day);
    setDaySlots([emptySlot()]);
  };

  const closeDayEditor = () => {
    setEditingDay(null);
    setDaySlots([emptySlot()]);
  };

  const addSlot = () => {
    setDaySlots((prev) => [...prev, emptySlot()]);
  };

  const removeSlot = (id: string) => {
    setDaySlots((prev) => prev.filter((s) => s.id !== id));
  };

  const updateSlot = (id: string, field: keyof ScheduleSlot, value: string) => {
    setDaySlots((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: value } : s)),
    );
  };

  // ============================================
  // SCHEDULE: save day slots (bulk insert)
  // ============================================
  const handleSaveDaySchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !editingDay) return;

    const validSlots = daySlots.filter(
      (s) => s.subject_id && s.start_time && s.end_time,
    );
    if (validSlots.length === 0) {
      alert("Isi minimal satu sesi dengan mapel, jam mulai, dan jam selesai.");
      return;
    }

    setSavingSchedule(true);
    try {
      const rows = validSlots.map((s) => ({
        class_id: classData.id,
        day_of_week: editingDay,
        subject_id: s.subject_id,
        ...(s.teacher_id ? { teacher_id: s.teacher_id } : {}),
        start_time: s.start_time,
        end_time: s.end_time,
        ...(s.room ? { room: s.room } : {}),
      }));

      const { error } = await supabase.from("class_schedules").insert(rows);
      if (error) throw error;

      closeDayEditor();
      fetchAll();
    } catch (err: any) {
      alert("Gagal menyimpan jadwal: " + err.message);
    } finally {
      setSavingSchedule(false);
    }
  };

  // ============================================
  // SCHEDULE: delete single sesi
  // ============================================
  const handleDeleteSchedule = async (id: string) => {
    if (!supabase) return;
    if (!confirm("Hapus sesi ini?")) return;
    try {
      const { error } = await supabase
        .from("class_schedules")
        .delete()
        .eq("id", id);
      if (error) throw error;
      fetchAll();
    } catch (err: any) {
      alert("Gagal: " + err.message);
    }
  };

  // group schedules by day
  const scheduleByDay = DAYS.reduce(
    (acc, day) => {
      acc[day] = schedules.filter((s) => s.day_of_week === day);
      return acc;
    },
    {} as Record<string, ClassSchedule[]>,
  );

  const activeDays = DAYS.filter((d) => scheduleByDay[d].length > 0);

  const initials = classData.name.slice(0, 2).toUpperCase();

  const tabs = [
    { id: "info", label: "Info" },
    { id: "students", label: `Siswa (${students.length})` },
    { id: "subjects", label: `Mapel (${classSubjects.length})` },
    { id: "schedule", label: `Jadwal (${schedules.length})` },
  ] as const;

  return (
    <div>
      {/* Back */}
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
        Kembali ke daftar kelas
      </button>

      {/* Hero */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-16 h-16 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xl flex-shrink-0">
          {initials}
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800">{classData.name}</h2>
          <p className="text-sm text-slate-500">
            Tingkat {classData.grade_level} · {classData.academic_year}
          </p>
          {classData.teachers?.name && (
            <span className="inline-block mt-1 px-2.5 py-0.5 bg-violet-50 text-violet-700 text-xs font-medium rounded-full">
              Wali: {classData.teachers.name}
            </span>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { num: students.length, label: "Siswa" },
          { num: classSubjects.length, label: "Mata Pelajaran" },
          { num: schedules.length, label: "Sesi Jadwal" },
          { num: classData.academic_year, label: "Tahun Ajaran" },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-slate-50 rounded-xl p-4 border border-slate-100"
          >
            <p className="text-2xl font-bold text-slate-800">{s.num}</p>
            <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-5">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              activeTab === t.id
                ? "bg-indigo-600 text-white shadow-sm"
                : "bg-white border border-slate-200 text-slate-500 hover:text-slate-800"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-10 text-center text-slate-400 text-sm animate-pulse">
          Memuat data...
        </div>
      ) : (
        <>
          {/* TAB: INFO */}
          {activeTab === "info" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { label: "Nama kelas", value: classData.name },
                { label: "Tingkat", value: classData.grade_level ?? "-" },
                { label: "Tahun ajaran", value: classData.academic_year },
                { label: "Wali kelas", value: classData.teachers?.name ?? "-" },
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

          {/* TAB: STUDENTS */}
          {activeTab === "students" && (
            <div className="space-y-3">
              <div className="flex justify-end">
                <button
                  onClick={() => setAddingStudent(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors text-sm font-medium shadow-sm"
                >
                  + Tambah Siswa
                </button>
              </div>

              {addingStudent && (
                <div className="bg-white border border-indigo-200 rounded-2xl p-5">
                  <p className="text-sm font-bold text-slate-700 mb-3">
                    Tambah siswa ke kelas ini
                  </p>
                  <form
                    onSubmit={handleAddStudent}
                    className="flex flex-col sm:flex-row gap-2"
                  >
                    <select
                      required
                      value={selectedStudentId}
                      onChange={(e) => setSelectedStudentId(e.target.value)}
                      className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      aria-label="Pilih siswa"
                    >
                      <option value="">-- Pilih siswa belum berkelas --</option>
                      {allStudents.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} · {s.nis}
                        </option>
                      ))}
                    </select>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setAddingStudent(false)}
                        className="px-4 py-2 text-sm text-slate-500 hover:text-slate-800 transition-colors"
                      >
                        Batal
                      </button>
                      <button
                        type="submit"
                        disabled={savingStudent}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
                      >
                        {savingStudent ? "Menyimpan..." : "Tambah"}
                      </button>
                    </div>
                  </form>
                  {allStudents.length === 0 && (
                    <p className="text-xs text-slate-400 mt-2 italic">
                      Semua siswa sudah memiliki kelas.
                    </p>
                  )}
                </div>
              )}

              <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden">
                {students.length === 0 ? (
                  <p className="text-center text-slate-400 italic py-10 text-sm">
                    Belum ada siswa di kelas ini
                  </p>
                ) : (
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500">
                        <th className="px-5 py-3">Nama</th>
                        <th className="px-5 py-3">NIS</th>
                        <th className="px-5 py-3 hidden sm:table-cell">
                          Email Ortu
                        </th>
                        <th className="px-5 py-3 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {students.map((s) => (
                        <tr
                          key={s.id}
                          className="hover:bg-slate-50/50 transition-colors"
                        >
                          <td className="px-5 py-3 font-medium text-slate-800">
                            {s.name}
                          </td>
                          <td className="px-5 py-3 text-slate-500 font-mono text-xs">
                            {s.nis}
                          </td>
                          <td className="px-5 py-3 text-slate-500 hidden sm:table-cell">
                            {s.parent_email ?? "-"}
                          </td>
                          <td className="px-5 py-3 text-right">
                            <button
                              onClick={() => handleRemoveStudent(s.id)}
                              className="text-xs text-red-400 hover:text-red-600 transition-colors"
                            >
                              Keluarkan
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* TAB: SUBJECTS */}
          {activeTab === "subjects" && (
            <div className="space-y-4">
              <div className="bg-white border border-slate-100 rounded-2xl p-5">
                <p className="text-sm font-bold text-slate-700 mb-3">
                  Assign Template Kurikulum
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <select
                    value={selectedTemplateId}
                    onChange={(e) => setSelectedTemplateId(e.target.value)}
                    className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    aria-label="Pilih template"
                  >
                    <option value="">-- Pilih template --</option>
                    {templates.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={handleAssignTemplate}
                    disabled={!selectedTemplateId || assigning}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-40 shadow-sm"
                  >
                    {assigning ? "Memproses..." : "Assign"}
                  </button>
                </div>

                {selectedTemplateId && (
                  <div className="mt-3 p-3 bg-slate-50 rounded-xl">
                    <p className="text-xs text-slate-500 font-medium mb-1.5">
                      Mapel dalam template ini:
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {templates
                        .find((t) => t.id === selectedTemplateId)
                        ?.subjects?.map((s: any) => (
                          <span
                            key={s.subject_id ?? s.id}
                            className="px-2 py-0.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-600"
                          >
                            {s.subjects?.name ?? s.name}
                          </span>
                        ))}
                    </div>
                  </div>
                )}

                {assignResult && (
                  <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700">
                    ✓ Berhasil assign{" "}
                    <strong>{assignResult.subject_count} mata pelajaran</strong>{" "}
                    ke kelas, dan{" "}
                    <strong>{assignResult.enrolled_count} enrollment</strong>{" "}
                    siswa dibuat.
                  </div>
                )}
              </div>

              <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden">
                <div className="px-5 py-3 border-b border-slate-100">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Mata pelajaran aktif di kelas ini
                  </p>
                </div>
                {classSubjects.length === 0 ? (
                  <p className="text-center text-slate-400 italic py-10 text-sm">
                    Belum ada mata pelajaran — assign template dulu
                  </p>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {classSubjects.map((cs) => (
                      <div
                        key={cs.id}
                        className="flex items-center justify-between px-5 py-3"
                      >
                        <div>
                          <p className="text-sm font-medium text-slate-800">
                            {cs.subjects?.name}
                          </p>
                          {cs.subjects?.code && (
                            <p className="text-xs font-mono text-slate-400">
                              {cs.subjects.code}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => handleRemoveSubject(cs.id)}
                          className="text-xs text-red-400 hover:text-red-600 transition-colors"
                        >
                          Hapus
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: JADWAL */}
          {activeTab === "schedule" && (
            <div className="space-y-3">
              {/* Pilih hari untuk tambah jadwal */}
              {!editingDay && (
                <div className="bg-white border border-slate-100 rounded-2xl p-5">
                  <p className="text-sm font-bold text-slate-700 mb-3">
                    Tambah jadwal untuk hari:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {DAYS.map((day) => (
                      <button
                        key={day}
                        onClick={() => openDayEditor(day)}
                        className="px-4 py-2 rounded-xl text-sm font-medium border border-slate-200 text-slate-600 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700 transition-colors"
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Form multi-slot per hari */}
              {editingDay && (
                <div className="bg-white border border-indigo-200 rounded-2xl overflow-hidden">
                  <div className="px-5 py-4 bg-indigo-50 border-b border-indigo-100 flex items-center justify-between">
                    <p className="text-sm font-bold text-indigo-700">
                      Jadwal hari {editingDay}
                    </p>
                    <button
                      onClick={closeDayEditor}
                      className="text-indigo-400 hover:text-indigo-700 text-xs transition-colors"
                    >
                      Batal
                    </button>
                  </div>

                  <form
                    onSubmit={handleSaveDaySchedule}
                    className="p-5 space-y-3"
                  >
                    {/* Header kolom */}
                    <div className="hidden sm:grid grid-cols-[1fr_1fr_90px_90px_1fr_32px] gap-2 px-1">
                      {[
                        "Mata Pelajaran",
                        "Guru",
                        "Mulai",
                        "Selesai",
                        "Ruangan",
                        "",
                      ].map((h) => (
                        <p
                          key={h}
                          className="text-xs text-slate-400 font-medium"
                        >
                          {h}
                        </p>
                      ))}
                    </div>

                    {/* Slot rows */}
                    {daySlots.map((slot, idx) => (
                      <div
                        key={slot.id}
                        className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_90px_90px_1fr_32px] gap-2 items-start p-3 sm:p-0 bg-slate-50 sm:bg-transparent rounded-xl sm:rounded-none"
                      >
                        {/* Label mobile */}
                        <p className="sm:hidden text-xs font-bold text-slate-500 mb-1">
                          Sesi {idx + 1}
                        </p>

                        {/* Mapel */}
                        <select
                          required
                          value={slot.subject_id}
                          onChange={(e) =>
                            updateSlot(slot.id, "subject_id", e.target.value)
                          }
                          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                          aria-label="Mata pelajaran"
                        >
                          <option value="">-- Mapel --</option>
                          {classSubjects.map((cs) => (
                            <option key={cs.subject_id} value={cs.subject_id}>
                              {cs.subjects.name}
                            </option>
                          ))}
                        </select>

                        {/* Guru */}
                        <select
                          value={slot.teacher_id}
                          onChange={(e) =>
                            updateSlot(slot.id, "teacher_id", e.target.value)
                          }
                          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                          aria-label="Guru"
                        >
                          <option value="">-- Guru --</option>
                          {allTeachers.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.name}
                            </option>
                          ))}
                        </select>

                        {/* Jam mulai */}
                        <input
                          required
                          type="time"
                          value={slot.start_time}
                          onChange={(e) =>
                            updateSlot(slot.id, "start_time", e.target.value)
                          }
                          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                        />

                        {/* Jam selesai */}
                        <input
                          required
                          type="time"
                          value={slot.end_time}
                          onChange={(e) =>
                            updateSlot(slot.id, "end_time", e.target.value)
                          }
                          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                        />

                        {/* Ruangan */}
                        <input
                          type="text"
                          placeholder="Ruangan"
                          value={slot.room}
                          onChange={(e) =>
                            updateSlot(slot.id, "room", e.target.value)
                          }
                          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                        />

                        {/* Hapus slot */}
                        <button
                          type="button"
                          onClick={() => removeSlot(slot.id)}
                          disabled={daySlots.length === 1}
                          className="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-red-500 disabled:opacity-0 transition-colors rounded-lg mt-0.5"
                          aria-label="Hapus sesi"
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

                    {/* Tambah slot */}
                    <button
                      type="button"
                      onClick={addSlot}
                      className="w-full py-2 border border-dashed border-slate-300 rounded-xl text-sm text-slate-400 hover:text-indigo-600 hover:border-indigo-300 transition-colors"
                    >
                      + Tambah sesi lagi
                    </button>

                    {/* Actions */}
                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={closeDayEditor}
                        className="px-4 py-2 text-sm text-slate-500 hover:text-slate-800 transition-colors"
                      >
                        Batal
                      </button>
                      <button
                        type="submit"
                        disabled={savingSchedule}
                        className="px-5 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors text-sm font-medium disabled:opacity-50 shadow-sm"
                      >
                        {savingSchedule
                          ? "Menyimpan..."
                          : `Simpan Jadwal ${editingDay}`}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Existing schedules grouped by day */}
              {schedules.length === 0 && !editingDay ? (
                <div className="bg-white border border-slate-100 rounded-2xl p-16 text-center">
                  <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-6 h-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <p className="text-slate-500 font-medium">Belum ada jadwal</p>
                  <p className="text-slate-400 text-sm mt-1">
                    Pilih hari di atas untuk mulai menambahkan jadwal
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {activeDays.map((day) => (
                    <div
                      key={day}
                      className="bg-white border border-slate-100 rounded-2xl overflow-hidden"
                    >
                      <div className="px-5 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          {day}
                        </p>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-400 bg-white px-2 py-0.5 rounded-md border border-slate-100">
                            {scheduleByDay[day].length} sesi
                          </span>
                          <button
                            onClick={() => openDayEditor(day)}
                            className="text-xs text-indigo-500 hover:text-indigo-700 transition-colors font-medium"
                          >
                            + Tambah sesi
                          </button>
                        </div>
                      </div>

                      <div className="divide-y divide-slate-100">
                        {scheduleByDay[day].map((s) => (
                          <div
                            key={s.id}
                            className="flex items-center justify-between px-5 py-3 group hover:bg-slate-50/50 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className="text-xs font-mono bg-indigo-50 text-indigo-700 px-2.5 py-1.5 rounded-lg whitespace-nowrap font-bold">
                                {s.start_time.slice(0, 5)} –{" "}
                                {s.end_time.slice(0, 5)}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-slate-800">
                                  {s.subjects?.name}
                                </p>
                                <div className="flex items-center gap-2 mt-0.5">
                                  {s.teachers?.name && (
                                    <span className="text-xs text-slate-400 flex items-center gap-1">
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="w-3 h-3"
                                        viewBox="0 0 20 20"
                                        fill="currentColor"
                                      >
                                        <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                                      </svg>
                                      {s.teachers.name}
                                    </span>
                                  )}
                                  {s.room && (
                                    <>
                                      {s.teachers?.name && (
                                        <span className="text-slate-300 text-xs">
                                          ·
                                        </span>
                                      )}
                                      <span className="text-xs text-slate-400 flex items-center gap-1">
                                        <svg
                                          xmlns="http://www.w3.org/2000/svg"
                                          className="w-3 h-3"
                                          viewBox="0 0 20 20"
                                          fill="currentColor"
                                        >
                                          <path
                                            fillRule="evenodd"
                                            d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z"
                                            clipRule="evenodd"
                                          />
                                        </svg>
                                        {s.room}
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                            <button
                              onClick={() => handleDeleteSchedule(s.id)}
                              className="text-slate-300 hover:text-red-500 transition-colors p-1 opacity-0 group-hover:opacity-100"
                              aria-label="Hapus sesi"
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
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
