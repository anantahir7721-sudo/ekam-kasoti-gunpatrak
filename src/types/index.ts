export type SchoolStatus = 'pending' | 'approved' | 'rejected' | 'inactive';

export interface School {
  id: string; // Firebase Auth UID
  ownerUid: string; // Must match auth.currentUser.uid
  schoolName: string;
  diseCode: string; // 11-digit Gujarat DISE Code
  district: string;
  status?: SchoolStatus; // defaults to 'approved' for legacy schools, 'pending' for new registrations
  createdAt: string;
  updatedAt?: string;
}

export interface AdminRecord {
  id: string;
  role: 'admin';
  createdAt?: string;
}

export type AllowedStandard = '9' | '10' | '11' | '12';

export interface Student {
  id: string;
  schoolId: string; // Belongs to specific School UID
  studentName: string;
  standard: AllowedStandard | string; // Allowed standards: 9, 10, 11, 12
  createdAt: string;
  updatedAt?: string;
  grNumber?: string;
  rollNumber?: string;
  division?: string;
  gender?: 'Boy' | 'Girl' | 'Other';
  academicYear?: string;
}

export interface SubjectSection {
  id: string;
  name: string; // e.g. "Section A", "વિભાગ A", "પ્રશ્ન ૧"
  label?: string; // Short code e.g. "Sec A"
  description?: string;
  maxMarks?: number | null; // Optional: if null/undefined, not specified yet (does NOT equal 0)
}

export interface StandardSubject {
  id: string;
  standard: AllowedStandard;
  subjectName: string;
  gujaratiName?: string;
  englishName?: string;
  totalMarks?: number | null;
  sections: SubjectSection[];
  isCustom?: boolean;
  schoolId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SubjectMark {
  subjectName: string;
  marksObtained: number;
  maxMarks: number;
  grade?: string;
}

export interface MarkRecord {
  id: string;
  schoolId: string; // Belongs to specific School UID
  studentId: string;
  studentName: string;
  grNumber?: string;
  rollNumber?: string;
  standard: AllowedStandard | string; // '9' | '10' | '11' | '12'
  division?: string;
  examType: string; // Fixed: 'એકમ કસોટી – 1'
  academicYear: string; // Fixed: '૨૦૨૬–૨૭'
  subjectId?: string; // e.g. 'gujarati', 'maths'
  subjectName?: string;
  questionMarks?: Record<string, number>; // section/questionId -> marks
  subjects?: SubjectMark[];
  totalObtained: number;
  totalMax: number;
  percentage?: number;
  overallGrade?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface AuthState {
  user: { uid: string; email: string | null } | null;
  school: School | null;
  loading: boolean;
  error: string | null;
}
