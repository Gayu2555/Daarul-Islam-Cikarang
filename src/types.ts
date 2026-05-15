// src/types/index.ts

export interface Class {
  id: string;
  name: string;
  grade_level?: string;
  academic_year: string;
  homeroom_teacher_id?: string;
  teachers?: { name: string };
  created_at: string;
}

export interface Teacher {
  id: string;
  name: string;
  nip: string;
  email?: string;
  subject_specialization: string;
  created_at: string;
}

export interface Student {
  id: string;
  name: string;
  nis: string;
  class_id?: string;
  classes?: { name: string };
  parent_email?: string;
  created_at: string;
}

export interface Subject {
  id: string;
  name: string;
  code?: string;
  teacher_id?: string;
  teachers?: { name: string };
  created_at: string;
}

export interface Grade {
  id: string;
  enrollment_id?: string;
  student_id: string;
  subject_id: string;
  grade_score: number;
  semester?: string;
  academic_year?: string;
  created_at: string;
  students?: { name: string };
  subjects?: { name: string };
}

export interface SPP {
  id: string;
  student_id: string;
  amount: number;
  payment_date?: string;
  due_date: string;
  status: "pending" | "paid";
  month: string;
  created_at: string;
  students: { name: string; parent_email: string };
}

export interface CurriculumTemplate {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  subjects?: Subject[];
}

export interface ClassSubject {
  id: string;
  class_id: string;
  subject_id: string;
  academic_year: string;
  subjects?: { name: string; code?: string };
}

export interface StudentEnrollment {
  id: string;
  student_id: string;
  subject_id: string;
  class_id: string;
  academic_year: string;
  students?: { name: string };
  subjects?: { name: string };
}

export interface TeacherSchedule {
  id: string;
  teacher_id: string;
  subject_id: string;
  class_name: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  subjects?: { name: string };
}

export interface ClassSchedule {
  id: string;
  class_id: string;
  subject_id: string;
  teacher_id?: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  room?: string;
  subjects?: { name: string; code?: string };
  teachers?: { name: string };
}
