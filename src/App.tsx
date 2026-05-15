import React, { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import Dashboard from "./components/Dashboard";
import DataTable from "./components/DataTable";
import Payments from "./components/Payments";
import Modal from "./components/Modal";
import StudentDetail from "./components/StudentDetail";
import TeacherDetail from "./components/TeacherDetail";
import SubjectsPage from "./components/SubjectsPage";
import GradesPage from "./components/GradesPage";
import ClassesPage from "./components/ClassesPage"; // Import halaman kelas baru
import type {
  Student,
  Teacher,
  Subject,
  SPP,
  Class,
  CurriculumTemplate,
} from "./types";

const menuItems = [
  { id: "dashboard", label: "Dashboard" },
  { id: "classes", label: "Kelas" },
  { id: "students", label: "Siswa" },
  { id: "teachers", label: "Guru" },
  { id: "subjects", label: "Mata Pelajaran" },
  { id: "grades", label: "Nilai" },
  { id: "payments", label: "Pembayaran SPP" },
];

export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // data states
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [templates, setTemplates] = useState<CurriculumTemplate[]>([]);
  const [sppData, setSppData] = useState<SPP[]>([]);

  // ui states
  const [loading, setLoading] = useState(true);
  const [sendingEmail, setSendingEmail] = useState<string | null>(null);

  // modal states (Class sudah tidak pakai modal lagi, tapi student/teacher/subject masih)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<
    "student" | "teacher" | "subject" | "template" | null
  >(null);
  const [formData, setFormData] = useState<any>({});

  // detail view states (Class dihapus dari sini, pindah ke ClassesPage)
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (activeTab === "subjects") fetchTemplates();
    // reset detail view pas ganti tab
    setSelectedStudent(null);
    setSelectedTeacher(null);
  }, [activeTab]);

  // ============================================
  // FETCH
  // ============================================

  const fetchData = async () => {
    if (!supabase) {
      console.warn("Supabase client is not initialized.");
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [
        { data: studentsData },
        { data: teachersData },
        { data: subjectsData },
        { data: classesData },
        { data: sppPayments },
      ] = await Promise.all([
        supabase
          .from("students")
          .select("*, classes(name)")
          .order("created_at", { ascending: false }),
        supabase
          .from("teachers")
          .select("*")
          .order("created_at", { ascending: false }),
        supabase
          .from("subjects")
          .select("*, teachers(name)")
          .order("created_at", { ascending: false }),
        supabase
          .from("classes")
          .select("*, teachers(name)")
          .order("created_at", { ascending: false }),
        supabase
          .from("spp_payments")
          .select("*, students(name, parent_email)")
          .order("due_date", { ascending: true }),
      ]);

      setStudents((studentsData as Student[]) || []);
      setTeachers((teachersData as Teacher[]) || []);
      setSubjects((subjectsData as Subject[]) || []);
      setClasses((classesData as Class[]) || []);
      setSppData((sppPayments as SPP[]) || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    if (!supabase) return;
    const { data } = await supabase
      .from("curriculum_templates")
      .select(
        "*, curriculum_template_subjects(subject_id, subjects(name, code))",
      )
      .order("created_at", { ascending: false });
    setTemplates((data as CurriculumTemplate[]) || []);
  };

  // ============================================
  // DELETE
  // ============================================

  const handleDelete = async (
    id: string,
    type: "student" | "teacher" | "subject" | "template",
  ) => {
    if (!supabase) return;
    if (!confirm("Apakah Anda yakin ingin menghapus data ini?")) return;

    const tableMap: Record<string, string> = {
      student: "students",
      teacher: "teachers",
      subject: "subjects",
      template: "curriculum_templates",
    };

    try {
      const { error } = await supabase
        .from(tableMap[type])
        .delete()
        .eq("id", id);
      if (error) throw error;

      if (type === "template") fetchTemplates();
      else fetchData();

      alert("Data berhasil dihapus!");
    } catch (error: any) {
      alert("Error menghapus data: " + error.message);
    }
  };

  // ============================================
  // CREATE
  // ============================================

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;

    try {
      if (modalType === "template") {
        const { subject_ids, ...templateData } = formData;

        const { data: newTemplate, error: templateError } = await supabase
          .from("curriculum_templates")
          .insert([templateData])
          .select()
          .single();

        if (templateError) throw templateError;

        if (subject_ids?.length > 0) {
          const subjectRows = subject_ids.map((sid: string) => ({
            template_id: newTemplate.id,
            subject_id: sid,
          }));
          const { error: subjectError } = await supabase
            .from("curriculum_template_subjects")
            .insert(subjectRows);
          if (subjectError) throw subjectError;
        }

        fetchTemplates();
      } else {
        const tableMap: Record<string, string> = {
          student: "students",
          teacher: "teachers",
          subject: "subjects",
        };

        const { error } = await supabase
          .from(tableMap[modalType!])
          .insert([formData]);
        if (error) throw error;

        if (modalType === "student" && formData.class_id) {
          const { data: newStudent } = await supabase
            .from("students")
            .select("id")
            .eq("nis", formData.nis)
            .single();

          if (newStudent) {
            await supabase.rpc("sync_student_to_class", {
              p_student_id: newStudent.id,
              p_class_id: formData.class_id,
            });
          }
        }

        fetchData();
      }

      setIsModalOpen(false);
      setFormData({});
      alert("Data berhasil disimpan!");
    } catch (error: any) {
      alert("Error menyimpan data: " + error.message);
    }
  };

  // ============================================
  // SEND REMINDER
  // ============================================

  const sendReminder = async (spp: SPP) => {
    if (sendingEmail) return;
    setSendingEmail(spp.id);
    try {
      const response = await fetch("/api/send-reminder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: spp.students.parent_email,
          studentName: spp.students.name,
          amount: spp.amount,
          dueDate: spp.due_date,
        }),
      });
      const result = await response.json();
      if (result.success) {
        alert(`Berhasil mengirim pengingat ke ${spp.students.parent_email}`);
      } else {
        alert(
          "Gagal mengirim email. Pastikan server dikonfigurasi dengan benar.",
        );
      }
    } catch (error) {
      console.error("Reminder error:", error);
      alert("Terjadi kesalahan sistem saat mengirim email.");
    } finally {
      setSendingEmail(null);
    }
  };

  // ============================================
  // MODAL HELPER
  // ============================================

  const openModal = (type: "student" | "teacher" | "subject" | "template") => {
    setModalType(type);
    setIsModalOpen(true);
    setFormData({});
  };

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col md:flex-row">
      <Sidebar
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      <main className="flex-1 p-5 md:p-10 lg:p-12 overflow-y-auto w-full">
        <Header
          activeTab={activeTab}
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
          menuItems={menuItems}
        />

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-4">
            <div className="w-12 h-12 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin" />
            <p className="font-bold animate-pulse">
              Memuat data dari database...
            </p>
          </div>
        ) : (
          <div>
            {/* DASHBOARD */}
            {activeTab === "dashboard" && (
              <Dashboard
                students={students}
                teachers={teachers}
                subjects={subjects}
                sppData={sppData}
                sendingEmail={sendingEmail}
                sendReminder={sendReminder}
              />
            )}

            {/* CLASSES - Pakai Dedicated Page */}
            {activeTab === "classes" && (
              <ClassesPage
                classes={classes}
                teachers={teachers}
                onDataChange={fetchData}
              />
            )}

            {/* STUDENTS */}
            {activeTab === "students" &&
              (selectedStudent ? (
                <StudentDetail
                  student={selectedStudent}
                  onBack={() => setSelectedStudent(null)}
                />
              ) : (
                <DataTable
                  title="Daftar Siswa"
                  data={students.map((s) => ({
                    ...s,
                    class_display: s.classes?.name ?? "-",
                  }))}
                  columns={[
                    { key: "name", label: "Nama Siswa" },
                    { key: "nis", label: "NIS" },
                    { key: "class_display", label: "Kelas" },
                    { key: "parent_email", label: "Email Orang Tua" },
                  ]}
                  type="student"
                  onAdd={() => openModal("student")}
                  onDelete={(id) => handleDelete(id, "student")}
                  onRowClick={(row: any) => setSelectedStudent(row as Student)}
                />
              ))}

            {/* TEACHERS */}
            {activeTab === "teachers" &&
              (selectedTeacher ? (
                <TeacherDetail
                  teacher={selectedTeacher}
                  onBack={() => setSelectedTeacher(null)}
                />
              ) : (
                <DataTable
                  title="Daftar Guru"
                  data={teachers}
                  columns={[
                    { key: "name", label: "Nama Guru" },
                    { key: "nip", label: "NIP" },
                    { key: "subject_specialization", label: "Spesialisasi" },
                  ]}
                  type="teacher"
                  onAdd={() => openModal("teacher")}
                  onDelete={(id) => handleDelete(id, "teacher")}
                  onRowClick={(row: any) => setSelectedTeacher(row as Teacher)}
                />
              ))}

            {/* SUBJECTS */}
            {activeTab === "subjects" && (
              <SubjectsPage
                subjects={subjects}
                templates={templates}
                onAddSubject={() => openModal("subject")}
                onAddTemplate={() => openModal("template")}
                onDeleteSubject={(id) => handleDelete(id, "subject")}
                onDeleteTemplate={(id) => handleDelete(id, "template")}
              />
            )}

            {/* GRADES */}
            {activeTab === "grades" && <GradesPage classes={classes} />}

            {/* PAYMENTS */}
            {activeTab === "payments" && (
              <Payments
                sppData={sppData}
                sendingEmail={sendingEmail}
                sendReminder={sendReminder}
                fetchData={fetchData}
              />
            )}

            {!import.meta.env.VITE_SUPABASE_URL && !loading && (
              <div className="mt-8 p-6 bg-amber-50 border border-amber-200 rounded-2xl flex gap-4 items-start">
                <div className="p-2 bg-amber-100 rounded-lg text-amber-600">
                  <span className="block w-5 h-5">!</span>
                </div>
                <div>
                  <h4 className="font-bold text-amber-900 mb-1">
                    Konfigurasi Dibutuhkan
                  </h4>
                  <p className="text-sm text-amber-800 leading-relaxed">
                    Aplikasi ini memerlukan <strong>SUPABASE_URL</strong> dan{" "}
                    <strong>SUPABASE_ANON_KEY</strong> di file <code>.env</code>{" "}
                    Anda.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* PERBAIKAN: Props type dan onClose dikembalikan */}
      <Modal
        isOpen={isModalOpen}
        type={modalType} // Ditambahkan kembali
        onClose={() => setIsModalOpen(false)} // Ditambahkan kembali
        handleCreate={handleCreate}
        formData={formData}
        setFormData={setFormData}
        subjects={subjects}
        teachers={teachers}
        classes={classes}
      />
    </div>
  );
}
