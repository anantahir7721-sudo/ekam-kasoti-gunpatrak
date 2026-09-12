import {
  collection,
  doc,
  addDoc,
  setDoc,
  getDocs,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  where,
  writeBatch,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { Student, MarkRecord } from '../types';

/**
 * Fetch all students belonging strictly to the specified school.
 * Storage path: /schools/{schoolId}/students
 */
export async function getStudents(schoolId: string): Promise<Student[]> {
  const studentsCol = collection(db, 'schools', schoolId, 'students');
  const snapshot = await getDocs(studentsCol);

  const list = snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...(docSnap.data() as Omit<Student, 'id'>),
  }));

  list.sort((a, b) => (a.studentName || '').localeCompare(b.studentName || ''));
  return list;
}

/**
 * Real-time subscription to school students collection.
 * Automatically synchronizes student updates across all logged-in devices.
 */
export function subscribeToStudents(
  schoolId: string,
  callback: (students: Student[]) => void
): () => void {
  const studentsCol = collection(db, 'schools', schoolId, 'students');
  return onSnapshot(
    studentsCol,
    (snapshot) => {
      const list = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<Student, 'id'>),
      }));
      list.sort((a, b) => (a.studentName || '').localeCompare(b.studentName || ''));
      callback(list);
    },
    (error) => {
      console.error('Realtime students subscription error:', error);
    }
  );
}

/**
 * Add a new student under the authenticated school's subcollection.
 * Security: Firestore rules ensure only the school with matching UID can write here.
 */
export async function addStudent(
  schoolId: string,
  data: {
    studentName: string;
    standard: string;
    grNumber?: string;
    rollNumber?: string;
    division?: string;
    gender?: 'Boy' | 'Girl' | 'Other';
    academicYear?: string;
  }
): Promise<Student> {
  const studentsCol = collection(db, 'schools', schoolId, 'students');
  const newStudent: Omit<Student, 'id'> = {
    schoolId,
    studentName: data.studentName.trim(),
    standard: data.standard.trim(),
    createdAt: new Date().toISOString(),
    ...(data.grNumber ? { grNumber: data.grNumber.trim() } : {}),
    ...(data.rollNumber ? { rollNumber: data.rollNumber.trim() } : {}),
    ...(data.division ? { division: data.division.trim() } : {}),
    ...(data.gender ? { gender: data.gender } : {}),
    ...(data.academicYear ? { academicYear: data.academicYear.trim() } : {}),
  };

  const docRef = await addDoc(studentsCol, newStudent);
  return {
    id: docRef.id,
    ...newStudent,
  };
}

/**
 * Batch add multiple students into Firestore under the school subcollection.
 * Uses Firestore writeBatch in chunks of 400 items.
 */
export async function bulkAddStudents(
  schoolId: string,
  studentsList: Array<{ studentName: string; standard: string }>
): Promise<number> {
  if (studentsList.length === 0) return 0;

  const chunkSize = 400;
  let totalAdded = 0;

  for (let i = 0; i < studentsList.length; i += chunkSize) {
    const chunk = studentsList.slice(i, i + chunkSize);
    const batch = writeBatch(db);

    for (const item of chunk) {
      const docRef = doc(collection(db, 'schools', schoolId, 'students'));
      const newStudentData = {
        schoolId,
        studentName: item.studentName.trim(),
        standard: item.standard.trim(),
        createdAt: new Date().toISOString(),
      };
      batch.set(docRef, newStudentData);
    }

    await batch.commit();
    totalAdded += chunk.length;
  }

  return totalAdded;
}

/**
 * Update an existing student record
 */
export async function updateStudent(
  schoolId: string,
  studentId: string,
  data: Partial<Omit<Student, 'id' | 'schoolId' | 'createdAt'>>
): Promise<void> {
  const studentDocRef = doc(db, 'schools', schoolId, 'students', studentId);
  await updateDoc(studentDocRef, {
    ...data,
    updatedAt: new Date().toISOString(),
  });
}

/**
 * Delete a student record
 */
export async function deleteStudent(schoolId: string, studentId: string): Promise<void> {
  const studentDocRef = doc(db, 'schools', schoolId, 'students', studentId);
  await deleteDoc(studentDocRef);
}

/**
 * Fetch all marks records belonging to the school
 * Storage path: /schools/{schoolId}/marks
 */
export async function getMarks(schoolId: string): Promise<MarkRecord[]> {
  const marksCol = collection(db, 'schools', schoolId, 'marks');
  const snapshot = await getDocs(marksCol);

  const list = snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...(docSnap.data() as Omit<MarkRecord, 'id'>),
  }));

  list.sort((a, b) => {
    const timeA = new Date(a.updatedAt || a.createdAt || 0).getTime();
    const timeB = new Date(b.updatedAt || b.createdAt || 0).getTime();
    return timeB - timeA;
  });

  return list;
}

/**
 * Real-time subscription to school marks collection.
 * Enables live simultaneous multi-teacher and multi-device updates.
 */
export function subscribeToMarks(
  schoolId: string,
  callback: (marks: MarkRecord[]) => void
): () => void {
  const marksCol = collection(db, 'schools', schoolId, 'marks');
  return onSnapshot(
    marksCol,
    (snapshot) => {
      const list = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<MarkRecord, 'id'>),
      }));
      list.sort((a, b) => {
        const timeA = new Date(a.updatedAt || a.createdAt || 0).getTime();
        const timeB = new Date(b.updatedAt || b.createdAt || 0).getTime();
        return timeB - timeA;
      });
      callback(list);
    },
    (error) => {
      console.error('Realtime marks subscription error:', error);
    }
  );
}

/**
 * Add a new mark evaluation record for a student
 */
export async function addMarkRecord(
  schoolId: string,
  data: Omit<MarkRecord, 'id' | 'schoolId' | 'createdAt'>
): Promise<MarkRecord> {
  const marksCol = collection(db, 'schools', schoolId, 'marks');
  const now = new Date().toISOString();
  const newMark: Omit<MarkRecord, 'id'> = {
    ...data,
    schoolId,
    createdAt: now,
    updatedAt: now,
  };

  const docRef = await addDoc(marksCol, newMark);
  return {
    id: docRef.id,
    ...newMark,
  };
}

/**
 * Helper to strip undefined values so Firestore never throws
 * "Unsupported field value: undefined"
 */
function stripUndefinedValues<T extends Record<string, any>>(obj: T): Record<string, any> {
  const cleaned: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      cleaned[key] = value;
    }
  }
  return cleaned;
}

/**
 * Save or update Ekam Kasoti - 1 marks for multiple students in a batch
 * Stored under /schools/{schoolId}/marks/{studentId_subjectId}
 */
export async function saveBatchEkamKasotiMarks(
  schoolId: string,
  records: Array<{
    studentId: string;
    studentName: string;
    grNumber?: string;
    rollNumber?: string;
    standard: string;
    division?: string;
    examType: string;
    academicYear: string;
    subjectId: string;
    subjectName: string;
    questionMarks: Record<string, number>;
    totalObtained: number;
    totalMax: number;
    percentage?: number;
    overallGrade?: string;
  }>
): Promise<void> {
  const batch = writeBatch(db);
  const now = new Date().toISOString();

  for (const record of records) {
    const docId = `${record.studentId}_${record.subjectId}`;
    const docRef = doc(db, 'schools', schoolId, 'marks', docId);
    
    // Clean all undefined values so Firestore writeBatch.set never throws
    const cleanDocData = stripUndefinedValues({
      ...record,
      schoolId,
      createdAt: now,
      updatedAt: now,
    });

    batch.set(docRef, cleanDocData, { merge: true });
  }

  await batch.commit();
}

/**
 * Save or update Ekam Kasoti marks for a single student automatically as typed.
 * Stored under /schools/{schoolId}/marks/{studentId_subjectId}
 */
export async function saveSingleStudentMark(
  schoolId: string,
  record: {
    studentId: string;
    studentName: string;
    grNumber?: string;
    rollNumber?: string;
    standard: string;
    division?: string;
    examType: string;
    academicYear: string;
    subjectId: string;
    subjectName: string;
    questionMarks: Record<string, number>;
    totalObtained: number;
    totalMax: number;
    percentage?: number;
    overallGrade?: string;
  }
): Promise<void> {
  const docId = `${record.studentId}_${record.subjectId}`;
  const docRef = doc(db, 'schools', schoolId, 'marks', docId);
  const now = new Date().toISOString();

  const cleanDocData = stripUndefinedValues({
    ...record,
    schoolId,
    createdAt: now,
    updatedAt: now,
  });

  await setDoc(docRef, cleanDocData, { merge: true });
}

/**
 * Delete a mark record
 */
export async function deleteMarkRecord(schoolId: string, markId: string): Promise<void> {
  const markDocRef = doc(db, 'schools', schoolId, 'marks', markId);
  await deleteDoc(markDocRef);
}

/**
 * Test & verify cross-school security isolation against Firestore Rules.
 * Attempts to read another school's student collection.
 * This proves to administrators that Firestore Security Rules actively block unauthorized access.
 */
export async function testCrossSchoolAccessPrevention(currentSchoolId: string, targetForeignId: string): Promise<{
  blockedSuccessfully: boolean;
  message: string;
  errorName?: string;
}> {
  try {
    const foreignCol = collection(db, 'schools', targetForeignId, 'students');
    await getDocs(foreignCol);
    return {
      blockedSuccessfully: false,
      message: 'SECURITY WARNING: Query succeeded when it should have been blocked!',
    };
  } catch (err: any) {
    const isPermissionDenied =
      err?.code === 'permission-denied' ||
      err?.message?.includes('insufficient permissions') ||
      err?.message?.includes('Missing or insufficient permissions');

    return {
      blockedSuccessfully: isPermissionDenied,
      message: isPermissionDenied
        ? 'Security Verified: Firestore Security Rules blocked the unauthorized cross-school request with permission-denied.'
        : `Request failed as expected: ${err.message}`,
      errorName: err.code || err.name,
    };
  }
}
