import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { Class } from "../types";

interface Enrollment {
  id: string;
  student_id: string;
  subject_id: string;
  students: { name: string };
  subjects: { name: string; code?: string };
}

interface GradeInput {
  enrollment_id: string;
  student_id: string;
  subject_id: string;
  grade_score: string;
  existing_grade_id?: string;
}

interface Props {
  classes: Class[];
}

export default function GradesPage({ classes }: Props) {
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [gradeInputs, setGradeInputs] = useState<Record<string, GradeInput>>(
    {},
  );
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // derived: unique students + subjects dari enrollments
  const students = React.useMemo(() => {
    const map = new Map<string, { id: string; name: string }>();
    enrollments.forEach((e) => {
      if (!map.has(e.student_id)) {
        map.set(e.student_id, { id: e.student_id, name: e.students.name });
      }
    });
    return Array.from(map.values()).sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  }, [enrollments]);

  const subjects = React.useMemo(() => {
    const map = new Map<string, { id: string; name: string; code?: string }>();
    enrollments.forEach((e) => {
      if (!map.has(e.subject_id)) {
        map.set(e.subject_id, {
          id: e.subject_id,
          name: e.subjects.name,
          code: e.subjects.code,
        });
      }
    });
    return Array.from(map.values()).sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  }, [enrollments]);

  // fetch enrollments + existing grades kalau filter lengkap
  useEffect(() => {
    if (selectedClassId && selectedSemester && selectedYear) {
      fetchEnrollmentsAndGrades();
    } else {
      setEnrollments([]);
      setGradeInputs({});
    }
  }, [selectedClassId, selectedSemester, selectedYear]);

  const fetchEnrollmentsAndGrades = async () => {
    if (!supabase) return;
    setLoading(true);
    setSaved(false);
    try {
      const [{ data: enrollData }, { data: gradesData }] = await Promise.all([
        supabase
          .from("student_enrollments")
          .select("*, students(name), subjects(name, code)")
          .eq("class_id", selectedClassId)
          .eq("academic_year", selectedYear),

        supabase
          .from("grades")
          .select("id, student_id, subject_id, grade_score")
          .eq("academic_year", selectedYear)
          .eq("semester", selectedSemester)
          .in(
            "student_id",
            (
              await supabase
                .from("student_enrollments")
                .select("student_id")
                .eq("class_id", selectedClassId)
                .eq("academic_year", selectedYear)
            ).data?.map((e: any) => e.student_id) ?? [],
          ),
      ]);

      const enroll = (enrollData as Enrollment[]) || [];
      setEnrollments(enroll);

      // build gradeInputs map: key = `${student_id}_${subject_id}`
      const inputs: Record<string, GradeInput> = {};
      enroll.forEach((e) => {
        const key = `${e.student_id}_${e.subject_id}`;
        const existing = (gradesData as any[])?.find(
          (g) => g.student_id === e.student_id && g.subject_id === e.subject_id,
        );
        inputs[key] = {
          enrollment_id: e.id,
          student_id: e.student_id,
          subject_id: e.subject_id,
          grade_score: existing?.grade_score?.toString() ?? "",
          existing_grade_id: existing?.id,
        };
      });
      setGradeInputs(inputs);
    } finally {
      setLoading(false);
    }
  };

  const handleGradeChange = (
    studentId: string,
    subjectId: string,
    value: string,
  ) => {
    const key = `${studentId}_${subjectId}`;
    setGradeInputs((prev) => ({
      ...prev,
      [key]: { ...prev[key], grade_score: value },
    }));
    setSaved(false);
  };

  const handleSaveAll = async () => {
    if (!supabase) return;
    setSaving(true);
    try {
      const toUpsert = Object.values(gradeInputs).filter(
        (g) => g.grade_score !== "",
      );

      if (toUpsert.length === 0) {
        alert("Belum ada nilai yang diinput.");
        return;
      }

      const toInsert = toUpsert
        .filter((g) => !g.existing_grade_id)
        .map((g) => ({
          enrollment_id: g.enrollment_id,
          student_id: g.student_id,
          subject_id: g.subject_id,
          grade_score: Number(g.grade_score),
          semester: selectedSemester,
          academic_year: selectedYear,
        }));

      const toUpdate = toUpsert.filter((g) => !!g.existing_grade_id);

      // insert batch sekaligus
      if (toInsert.length > 0) {
        const { error } = await supabase.from("grades").insert(toInsert);
        if (error) throw error;
      }

      // update satu-satu pakai for...of biar await bisa dipake
      for (const g of toUpdate) {
        const { error } = await supabase
          .from("grades")
          .update({ grade_score: Number(g.grade_score) })
          .eq("id", g.existing_grade_id!);
        if (error) throw error;
      }

      setSaved(true);
      fetchEnrollmentsAndGrades();
    } catch (err: any) {
      alert("Gagal menyimpan nilai: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const getScoreColor = (score: string) => {
    if (!score) return "";
    const n = Number(score);
    if (n >= 85) return "text-emerald-600 font-bold";
    if (n >= 70) return "text-blue-600 font-medium";
    if (n >= 60) return "text-amber-600 font-medium";
    return "text-red-600 font-bold";
  };

  const filledCount = Object.values(gradeInputs).filter(
    (g) => g.grade_score !== "",
  ).length;
  const totalCount = Object.values(gradeInputs).length;

  const selectedClass = classes.find((c) => c.id === selectedClassId);

  return (
    <div className="space-y-5">
      {/* ============================================
          FILTER BAR
      ============================================ */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">
          Filter Nilai
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">
              Kelas
            </label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              aria-label="Pilih kelas"
            >
              <option value="">-- Pilih Kelas --</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} · {c.academic_year}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">
              Semester
            </label>
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              aria-label="Pilih semester"
            >
              <option value="">-- Pilih Semester --</option>
              <option value="Ganjil">Ganjil</option>
              <option value="Genap">Genap</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">
              Tahun Ajaran
            </label>
            <input
              type="text"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              placeholder="2024/2025"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
        </div>
      </div>

      {/* ============================================
          EMPTY STATE
      ============================================ */}
      {!selectedClassId || !selectedSemester || !selectedYear ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-16 text-center">
          <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-7 h-7 text-indigo-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
          </div>
          <p className="text-slate-500 font-medium">
            Pilih kelas, semester, dan tahun ajaran
          </p>
          <p className="text-slate-400 text-sm mt-1">untuk mulai input nilai</p>
        </div>
      ) : loading ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-16 text-center">
          <div className="w-10 h-10 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-400 text-sm animate-pulse">
            Memuat data enrollment...
          </p>
        </div>
      ) : enrollments.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-16 text-center">
          <p className="text-slate-500 font-medium">
            Belum ada enrollment di kelas ini
          </p>
          <p className="text-slate-400 text-sm mt-1">
            Assign template kurikulum ke kelas terlebih dahulu di tab{" "}
            <span className="text-indigo-500 font-medium">Kelas</span>
          </p>
        </div>
      ) : (
        <>
          {/* ============================================
              HEADER + STATS
          ============================================ */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-800">
                {selectedClass?.name} · Semester {selectedSemester} ·{" "}
                {selectedYear}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {students.length} siswa · {subjects.length} mata pelajaran ·{" "}
                <span
                  className={
                    filledCount === totalCount
                      ? "text-emerald-600 font-medium"
                      : "text-amber-600 font-medium"
                  }
                >
                  {filledCount}/{totalCount} nilai terisi
                </span>
              </p>
            </div>
            <div className="flex items-center gap-2">
              {saved && (
                <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
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
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Tersimpan
                </span>
              )}
              <button
                onClick={handleSaveAll}
                disabled={saving || filledCount === 0}
                className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-40"
              >
                {saving ? "Menyimpan..." : "Simpan Semua"}
              </button>
            </div>
          </div>

          {/* ============================================
              GRADE TABLE
          ============================================ */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500">
                    <th className="px-5 py-3 sticky left-0 bg-slate-50 z-10 min-w-[180px]">
                      Nama Siswa
                    </th>
                    {subjects.map((s) => (
                      <th
                        key={s.id}
                        className="px-3 py-3 text-center min-w-[110px]"
                      >
                        <div>{s.name}</div>
                        {s.code && (
                          <div className="font-mono font-normal normal-case text-slate-400">
                            {s.code}
                          </div>
                        )}
                      </th>
                    ))}
                    <th className="px-5 py-3 text-center min-w-[80px]">
                      Rata-rata
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {students.map((student) => {
                    const studentScores = subjects.map((subject) => {
                      const key = `${student.id}_${subject.id}`;
                      return gradeInputs[key]?.grade_score ?? "";
                    });
                    const filledScores = studentScores
                      .filter((s) => s !== "")
                      .map(Number);
                    const avg =
                      filledScores.length > 0
                        ? Math.round(
                            filledScores.reduce((a, b) => a + b, 0) /
                              filledScores.length,
                          )
                        : null;

                    return (
                      <tr
                        key={student.id}
                        className="hover:bg-slate-50/50 transition-colors"
                      >
                        <td className="px-5 py-3 font-medium text-slate-800 sticky left-0 bg-white hover:bg-slate-50/50">
                          {student.name}
                        </td>
                        {subjects.map((subject) => {
                          const key = `${student.id}_${subject.id}`;
                          const input = gradeInputs[key];
                          if (!input) {
                            return (
                              <td
                                key={subject.id}
                                className="px-3 py-3 text-center"
                              >
                                <span className="text-slate-200">—</span>
                              </td>
                            );
                          }
                          return (
                            <td
                              key={subject.id}
                              className="px-3 py-2 text-center"
                            >
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={input.grade_score}
                                onChange={(e) =>
                                  handleGradeChange(
                                    student.id,
                                    subject.id,
                                    e.target.value,
                                  )
                                }
                                className={`w-16 text-center px-2 py-1.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-colors ${
                                  input.grade_score === ""
                                    ? "border-slate-200 text-slate-400"
                                    : Number(input.grade_score) >= 70
                                      ? "border-emerald-200 bg-emerald-50/50"
                                      : "border-red-200 bg-red-50/50"
                                } ${getScoreColor(input.grade_score)}`}
                                placeholder="—"
                              />
                            </td>
                          );
                        })}
                        <td className="px-5 py-3 text-center">
                          {avg !== null ? (
                            <span
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                                avg >= 70
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "bg-red-50 text-red-600"
                              }`}
                            >
                              {avg}
                            </span>
                          ) : (
                            <span className="text-slate-300 text-xs">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 text-xs text-slate-400 px-1">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-emerald-100 inline-block" />≥
              70 Lulus
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-red-100 inline-block" />
              &lt; 70 Remedial
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-slate-100 inline-block" />
              Belum diisi
            </span>
          </div>
        </>
      )}
    </div>
  );
}
