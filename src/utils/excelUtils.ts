import * as XLSX from 'xlsx';
import { AllowedStandard, Student } from '../types';

export interface ParsedStudentRow {
  rowNumber: number;
  name: string;
  standard: string;
  diseCode?: string;
  grNumber?: string;
  section?: string;
  dob?: string;
  address?: string;
  doa?: string;
  motherName?: string;
  fatherName?: string;
  gender?: 'Boy' | 'Girl' | 'Other';
  caste?: string;
  bloodGroup?: string;
  contactNumber?: string;
  fatherOccupation?: string;
  motherOccupation?: string;
  placeOfBirth?: string;
  photoUrl?: string;
  isValid: boolean;
  isDuplicateInFile: boolean;
  isExistingUpdate: boolean;
  existingStudentId?: string;
  errorReason?: string;
}

export interface ExcelParseResult {
  totalRows: number;
  validRows: ParsedStudentRow[];
  invalidRows: ParsedStudentRow[];
  duplicateInFileRows: ParsedStudentRow[];
  existingUpdateRows: ParsedStudentRow[];
  allRows: ParsedStudentRow[];
}

/**
 * Standard column headers for Student Master Information Excel
 */
export const STUDENT_EXCEL_COLUMNS = [
  'DISE CODE',
  'GR NO.',
  'NAME (AS IN GR)',
  'STANDARD',
  'SECTION',
  'DOB',
  'ADDRESS',
  'DOA',
  'MOTHER NAME',
  'FATHER NAME',
  'GENDER',
  'CASTE',
  'BLOOD GROUP',
  'MOBILE NUMBER',
  'FATHER OCCUPATION',
  'MOTHER OCCUPATION',
  'PLACE OF BIRTH',
  'STUDENT PHOTO',
];

/**
 * Generates and downloads the complete Student Master Excel template
 * with pre-filled school DISE Code (if provided) and realistic sample rows.
 */
export function downloadStudentTemplate(schoolDiseCode?: string, schoolName?: string) {
  const defaultDise = schoolDiseCode?.trim() || '24010100101';

  const templateData = [
    {
      'DISE CODE': defaultDise,
      'GR NO.': '1001',
      'NAME (AS IN GR)': 'Patel Aarav Rameshchandra',
      'STANDARD': 9,
      'SECTION': 'A',
      'DOB': '2011-04-15',
      'ADDRESS': 'Plot No 14, Shanti Nagar, Rajkot',
      'DOA': '2024-06-12',
      'MOTHER NAME': 'Gitaben',
      'FATHER NAME': 'Rameshchandra',
      'GENDER': 'Boy',
      'CASTE': 'General',
      'BLOOD GROUP': 'B+',
      'MOBILE NUMBER': '9876543210',
      'FATHER OCCUPATION': 'Business',
      'MOTHER OCCUPATION': 'Housewife',
      'PLACE OF BIRTH': 'Rajkot',
      'STUDENT PHOTO': '',
    },
    {
      'DISE CODE': defaultDise,
      'GR NO.': '1002',
      'NAME (AS IN GR)': 'દવે જાનવી ભરતભાઈ',
      'STANDARD': 10,
      'SECTION': 'B',
      'DOB': '2010-09-22',
      'ADDRESS': 'મુ. પો. સરદાર ચોક, જામનગર',
      'DOA': '2023-06-15',
      'MOTHER NAME': 'ભાવનાબેન',
      'FATHER NAME': 'ભરતભાઈ',
      'GENDER': 'Girl',
      'CASTE': 'SEBC',
      'BLOOD GROUP': 'O+',
      'MOBILE NUMBER': '9825123456',
      'FATHER OCCUPATION': 'ખેતી (Farmer)',
      'MOTHER OCCUPATION': 'શિક્ષિકા (Teacher)',
      'PLACE OF BIRTH': 'જામનગર',
      'STUDENT PHOTO': '',
    },
    {
      'DISE CODE': defaultDise,
      'GR NO.': '1003',
      'NAME (AS IN GR)': 'Shah Manan Nileshbhai',
      'STANDARD': 11,
      'SECTION': 'A',
      'DOB': '2009-12-05',
      'ADDRESS': 'B-201, Krishna Heights, Ahmedabad',
      'DOA': '2024-06-10',
      'MOTHER NAME': 'Neelamben',
      'FATHER NAME': 'Nileshbhai',
      'GENDER': 'Boy',
      'CASTE': 'General',
      'BLOOD GROUP': 'A+',
      'MOBILE NUMBER': '9909988776',
      'FATHER OCCUPATION': 'Engineer',
      'MOTHER OCCUPATION': 'Service',
      'PLACE OF BIRTH': 'Ahmedabad',
      'STUDENT PHOTO': '',
    },
    {
      'DISE CODE': defaultDise,
      'GR NO.': '1004',
      'NAME (AS IN GR)': 'પરમાર પ્રિયા જગદીશભાઈ',
      'STANDARD': 12,
      'SECTION': 'A',
      'DOB': '2008-03-18',
      'ADDRESS': 'સ્વામિનારાયણ મંદિર પાસે, જૂનાગઢ',
      'DOA': '2023-06-14',
      'MOTHER NAME': 'મીનાક્ષીબેન',
      'FATHER NAME': 'જગદીશભાઈ',
      'GENDER': 'Girl',
      'CASTE': 'SC',
      'BLOOD GROUP': 'AB+',
      'MOBILE NUMBER': '9428011223',
      'FATHER OCCUPATION': 'સરકારી સેવા',
      'MOTHER OCCUPATION': 'ગૃહિણી',
      'PLACE OF BIRTH': 'જૂનાગઢ',
      'STUDENT PHOTO': '',
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(templateData, {
    header: STUDENT_EXCEL_COLUMNS,
  });

  // Set generous column widths
  worksheet['!cols'] = [
    { wch: 15 }, // DISE CODE
    { wch: 12 }, // GR NO.
    { wch: 32 }, // NAME (AS IN GR)
    { wch: 12 }, // STANDARD
    { wch: 10 }, // SECTION
    { wch: 14 }, // DOB
    { wch: 35 }, // ADDRESS
    { wch: 14 }, // DOA
    { wch: 22 }, // MOTHER NAME
    { wch: 22 }, // FATHER NAME
    { wch: 12 }, // GENDER
    { wch: 14 }, // CASTE
    { wch: 13 }, // BLOOD GROUP
    { wch: 16 }, // MOBILE NUMBER
    { wch: 20 }, // FATHER OCCUPATION
    { wch: 20 }, // MOTHER OCCUPATION
    { wch: 18 }, // PLACE OF BIRTH
    { wch: 20 }, // STUDENT PHOTO
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Students_Master_Template');

  const filename = schoolName
    ? `${schoolName.replace(/[^a-zA-Z0-9_\-\s]/g, '').trim()}_Student_Master_Template.xlsx`
    : 'Students_Master_Enrollment_Template.xlsx';

  XLSX.writeFile(workbook, filename);
}

/**
 * Normalizes standard into strictly '9', '10', '11', or '12'
 */
export function normalizeStandard(val: any): AllowedStandard | null {
  if (val === undefined || val === null) return null;
  const str = String(val).trim();

  if (
    str === '9' ||
    str === '09' ||
    /^std\s*9$/i.test(str) ||
    /^class\s*9$/i.test(str) ||
    /^ધોરણ\s*૯$/i.test(str) ||
    /^ધોરણ\s*9$/i.test(str) ||
    str === '૯'
  ) {
    return '9';
  }
  if (
    str === '10' ||
    /^std\s*10$/i.test(str) ||
    /^class\s*10$/i.test(str) ||
    /^ધોરણ\s*૧૦$/i.test(str) ||
    /^ધોરણ\s*10$/i.test(str) ||
    str === '૧૦'
  ) {
    return '10';
  }
  if (
    str === '11' ||
    /^std\s*11$/i.test(str) ||
    /^class\s*11$/i.test(str) ||
    /^ધોરણ\s*૧૧$/i.test(str) ||
    /^ધોરણ\s*11$/i.test(str) ||
    str === '૧૧'
  ) {
    return '11';
  }
  if (
    str === '12' ||
    /^std\s*12$/i.test(str) ||
    /^class\s*12$/i.test(str) ||
    /^ધોરણ\s*૧૨$/i.test(str) ||
    /^ધોરણ\s*12$/i.test(str) ||
    str === '૧૨'
  ) {
    return '12';
  }

  return null;
}

/**
 * Normalizes dates from Excel (serial numbers, DD/MM/YYYY, YYYY-MM-DD) into standard YYYY-MM-DD
 */
export function normalizeDate(val: any): string | undefined {
  if (val === undefined || val === null || String(val).trim() === '') return undefined;

  // If number, it could be an Excel serial date
  if (typeof val === 'number') {
    const parsed = XLSX.SSF.parse_date_code(val);
    if (parsed) {
      const y = String(parsed.y).padStart(4, '0');
      const m = String(parsed.m).padStart(2, '0');
      const d = String(parsed.d).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
  }

  const str = String(val).trim();

  // Already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str;
  }

  // DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (dmyMatch) {
    const d = dmyMatch[1].padStart(2, '0');
    const m = dmyMatch[2].padStart(2, '0');
    const y = dmyMatch[3];
    return `${y}-${m}-${d}`;
  }

  // Return raw string if valid length
  return str;
}

/**
 * Normalizes gender value
 */
export function normalizeGender(val: any): 'Boy' | 'Girl' | 'Other' | undefined {
  if (!val) return undefined;
  const str = String(val).trim().toLowerCase();

  if (
    str === 'boy' ||
    str === 'male' ||
    str === 'm' ||
    str === 'કુમાર' ||
    str === 'પુરુષ' ||
    str === 'છોકરો'
  ) {
    return 'Boy';
  }
  if (
    str === 'girl' ||
    str === 'female' ||
    str === 'f' ||
    str === 'કન્યા' ||
    str === 'સ્ત્રી' ||
    str === 'છોકરી'
  ) {
    return 'Girl';
  }
  if (str === 'other' || str === 'અન્ય') {
    return 'Other';
  }

  return undefined;
}

/**
 * Parses and validates an uploaded Excel (.xlsx/.xls) file containing student records.
 * Supports the full Student Master Information template.
 * Validates required fields, checks for duplicate rows in file, and checks for existing students to update.
 */
export async function parseStudentsExcelFile(
  file: File,
  existingSchoolStudents: Student[],
  schoolDiseCode?: string
): Promise<ExcelParseResult> {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: 'array' });

  if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
    throw new Error('Excel ફાઈલમાં કોઈ શીટ મળી નથી (No sheets found in Excel file).');
  }

  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

  if (rawRows.length === 0) {
    throw new Error('Excel ફાઈલ ખાલી છે (The uploaded Excel file contains no data rows).');
  }

  // Build lookup index for existing school students (by GR number & by Name+Standard)
  const existingByGr = new Map<string, Student>();
  const existingByNameStd = new Map<string, Student>();

  for (const s of existingSchoolStudents) {
    if (s.grNumber && s.grNumber.trim()) {
      existingByGr.set(s.grNumber.trim().toLowerCase(), s);
    }
    const key = `${s.studentName.trim().toLowerCase()}_${String(s.standard).trim()}`;
    existingByNameStd.set(key, s);
  }

  const seenInFileGr = new Set<string>();
  const seenInFileNameStd = new Set<string>();

  const validRows: ParsedStudentRow[] = [];
  const invalidRows: ParsedStudentRow[] = [];
  const duplicateInFileRows: ParsedStudentRow[] = [];
  const existingUpdateRows: ParsedStudentRow[] = [];
  const allRows: ParsedStudentRow[] = [];

  rawRows.forEach((row, index) => {
    const rowNumber = index + 2; // Row 1 is header in Excel

    // Find columns using case-insensitive mapping
    let rawDise: any = undefined;
    let rawGr: any = undefined;
    let rawName: any = undefined;
    let rawStd: any = undefined;
    let rawSec: any = undefined;
    let rawDob: any = undefined;
    let rawAddr: any = undefined;
    let rawDoa: any = undefined;
    let rawMother: any = undefined;
    let rawFather: any = undefined;
    let rawGender: any = undefined;
    let rawCaste: any = undefined;
    let rawBlood: any = undefined;
    let rawMobile: any = undefined;
    let rawFatherOcc: any = undefined;
    let rawMotherOcc: any = undefined;
    let rawPlaceOfBirth: any = undefined;
    let rawPhoto: any = undefined;

    for (const key of Object.keys(row)) {
      const cleanKey = key.trim().toLowerCase().replace(/[\._\-]/g, ' ').replace(/\s+/g, ' ');

      // DISE Code
      if (
        cleanKey === 'dise code' ||
        cleanKey === 'disecode' ||
        cleanKey === 'dise' ||
        cleanKey.includes('ડાયસ')
      ) {
        rawDise = row[key];
      }
      // GR No.
      else if (
        cleanKey === 'gr no' ||
        cleanKey === 'gr number' ||
        cleanKey === 'gr' ||
        cleanKey === 'g r' ||
        cleanKey.includes('જનરલ રજિસ્ટર') ||
        cleanKey.includes('જી આર')
      ) {
        rawGr = row[key];
      }
      // Name (As in GR)
      else if (
        cleanKey === 'name as in gr' ||
        cleanKey === 'name' ||
        cleanKey === 'student name' ||
        cleanKey === 'studentname' ||
        cleanKey === 'વિદ્યાર્થી' ||
        cleanKey === 'વિદ્યાર્થીનું નામ' ||
        cleanKey === 'નામ'
      ) {
        rawName = row[key];
      }
      // Standard
      else if (
        cleanKey === 'standard' ||
        cleanKey === 'std' ||
        cleanKey === 'class' ||
        cleanKey === 'ધોરણ'
      ) {
        rawStd = row[key];
      }
      // Section
      else if (
        cleanKey === 'section' ||
        cleanKey === 'division' ||
        cleanKey === 'div' ||
        cleanKey === 'sec' ||
        cleanKey === 'વર્ગ' ||
        cleanKey === 'વિભાગ'
      ) {
        rawSec = row[key];
      }
      // DOB
      else if (
        cleanKey === 'dob' ||
        cleanKey === 'date of birth' ||
        cleanKey === 'birth date' ||
        cleanKey.includes('જન્મ તારીખ') ||
        cleanKey.includes('જન્મતારીખ')
      ) {
        rawDob = row[key];
      }
      // Address
      else if (
        cleanKey === 'address' ||
        cleanKey === 'residential address' ||
        cleanKey === 'સરનામું' ||
        cleanKey === 'સરનામુ'
      ) {
        rawAddr = row[key];
      }
      // DOA
      else if (
        cleanKey === 'doa' ||
        cleanKey === 'date of admission' ||
        cleanKey === 'admission date' ||
        cleanKey.includes('પ્રવેશ તારીખ')
      ) {
        rawDoa = row[key];
      }
      // Mother Name
      else if (
        cleanKey === 'mother name' ||
        cleanKey === 'mother' ||
        cleanKey.includes('માતાનું નામ') ||
        cleanKey.includes('માતા')
      ) {
        rawMother = row[key];
      }
      // Father Name
      else if (
        cleanKey === 'father name' ||
        cleanKey === 'father' ||
        cleanKey.includes('પિતાનું નામ') ||
        cleanKey.includes('પિતા')
      ) {
        rawFather = row[key];
      }
      // Gender
      else if (
        cleanKey === 'gender' ||
        cleanKey === 'sex' ||
        cleanKey === 'જાતિ' ||
        cleanKey === 'લિંગ'
      ) {
        rawGender = row[key];
      }
      // Caste
      else if (
        cleanKey === 'caste' ||
        cleanKey === 'category' ||
        cleanKey === 'જ્ઞાતિ' ||
        cleanKey === 'કેટેગરી'
      ) {
        rawCaste = row[key];
      }
      // Blood Group
      else if (
        cleanKey === 'blood group' ||
        cleanKey === 'bloodgroup' ||
        cleanKey === 'blood' ||
        cleanKey.includes('બ્લડ')
      ) {
        rawBlood = row[key];
      }
      // Mobile / Contact
      else if (
        cleanKey === 'mobile number' ||
        cleanKey === 'mobile' ||
        cleanKey === 'contact number' ||
        cleanKey === 'phone' ||
        cleanKey.includes('મોબાઈલ') ||
        cleanKey.includes('સંપર્ક')
      ) {
        rawMobile = row[key];
      }
      // Father Occupation
      else if (
        cleanKey.includes('father') && cleanKey.includes('occupation') ||
        cleanKey.includes('પિતાનો વ્યવસાય')
      ) {
        rawFatherOcc = row[key];
      }
      // Mother Occupation
      else if (
        cleanKey.includes('mother') && cleanKey.includes('occupation') ||
        cleanKey.includes('માતાનો વ્યવસાય')
      ) {
        rawMotherOcc = row[key];
      }
      // Place of Birth
      else if (
        cleanKey === 'place of birth' ||
        cleanKey === 'birth place' ||
        cleanKey.includes('જન્મ સ્થળ') ||
        cleanKey.includes('જન્મસ્થળ')
      ) {
        rawPlaceOfBirth = row[key];
      }
      // Student Photo
      else if (
        cleanKey === 'student photo' ||
        cleanKey === 'photo' ||
        cleanKey === 'photo url' ||
        cleanKey.includes('ફોટો')
      ) {
        rawPhoto = row[key];
      }
    }

    const trimmedName = rawName !== undefined ? String(rawName).trim() : '';
    const normalizedStd = normalizeStandard(rawStd);
    const grNumber = rawGr !== undefined && String(rawGr).trim() !== '' ? String(rawGr).trim() : undefined;
    const diseCode = rawDise !== undefined && String(rawDise).trim() !== '' ? String(rawDise).trim() : schoolDiseCode?.trim();
    const section = rawSec !== undefined && String(rawSec).trim() !== '' ? String(rawSec).trim() : undefined;
    const dob = normalizeDate(rawDob);
    const doa = normalizeDate(rawDoa);
    const address = rawAddr !== undefined && String(rawAddr).trim() !== '' ? String(rawAddr).trim() : undefined;
    const motherName = rawMother !== undefined && String(rawMother).trim() !== '' ? String(rawMother).trim() : undefined;
    const fatherName = rawFather !== undefined && String(rawFather).trim() !== '' ? String(rawFather).trim() : undefined;
    const gender = normalizeGender(rawGender);
    const caste = rawCaste !== undefined && String(rawCaste).trim() !== '' ? String(rawCaste).trim() : undefined;
    const bloodGroup = rawBlood !== undefined && String(rawBlood).trim() !== '' ? String(rawBlood).trim() : undefined;
    const contactNumber = rawMobile !== undefined && String(rawMobile).trim() !== '' ? String(rawMobile).trim() : undefined;
    const fatherOccupation = rawFatherOcc !== undefined && String(rawFatherOcc).trim() !== '' ? String(rawFatherOcc).trim() : undefined;
    const motherOccupation = rawMotherOcc !== undefined && String(rawMotherOcc).trim() !== '' ? String(rawMotherOcc).trim() : undefined;
    const placeOfBirth = rawPlaceOfBirth !== undefined && String(rawPlaceOfBirth).trim() !== '' ? String(rawPlaceOfBirth).trim() : undefined;
    const photoUrl = rawPhoto !== undefined && String(rawPhoto).trim() !== '' ? String(rawPhoto).trim() : undefined;

    let isValid = true;
    let isDuplicateInFile = false;
    let isExistingUpdate = false;
    let existingStudentId: string | undefined = undefined;
    let errorReason = '';

    // Validation 1: Required Name
    if (!trimmedName) {
      isValid = false;
      errorReason = 'વિદ્યાર્થીનું નામ (Name as in GR) જરૂરી છે (Name column is missing or empty)';
    }
    // Validation 2: Required Standard (9, 10, 11, 12)
    else if (!normalizedStd) {
      isValid = false;
      errorReason = `અમાન્ય ધોરણ "${rawStd ?? ''}" (માત્ર 9, 10, 11, 12 માન્ય છે / Only Standards 9, 10, 11, 12 allowed)`;
    } else {
      // Check duplicate within the uploaded file
      const fileKey = grNumber ? `gr_${grNumber.toLowerCase()}` : `name_${trimmedName.toLowerCase()}_${normalizedStd}`;

      if (grNumber && seenInFileGr.has(grNumber.toLowerCase())) {
        isDuplicateInFile = true;
        isValid = false;
        errorReason = `એક્સેલ ફાઈલમાં આ જ G.R. નંબર (${grNumber}) પુનરાવર્તિત થાય છે (Duplicate GR No. in this file)`;
      } else if (seenInFileNameStd.has(`${trimmedName.toLowerCase()}_${normalizedStd}`)) {
        isDuplicateInFile = true;
        isValid = false;
        errorReason = 'એક્સેલ ફાઈલમાં આ જ વિદ્યાર્થીનું નામ અને ધોરણ પુનરાવર્તિત થાય છે (Duplicate row in this file)';
      } else {
        if (grNumber) seenInFileGr.add(grNumber.toLowerCase());
        seenInFileNameStd.add(`${trimmedName.toLowerCase()}_${normalizedStd}`);

        // Check if student already exists in school database
        let existingMatch: Student | undefined;
        if (grNumber && existingByGr.has(grNumber.toLowerCase())) {
          existingMatch = existingByGr.get(grNumber.toLowerCase());
        } else {
          const key = `${trimmedName.toLowerCase()}_${normalizedStd}`;
          if (existingByNameStd.has(key)) {
            existingMatch = existingByNameStd.get(key);
          }
        }

        if (existingMatch) {
          isExistingUpdate = true;
          existingStudentId = existingMatch.id;
        }
      }
    }

    const parsedRow: ParsedStudentRow = {
      rowNumber,
      name: trimmedName,
      standard: normalizedStd || String(rawStd || ''),
      diseCode,
      grNumber,
      section,
      dob,
      address,
      doa,
      motherName,
      fatherName,
      gender,
      caste,
      bloodGroup,
      contactNumber,
      fatherOccupation,
      motherOccupation,
      placeOfBirth,
      photoUrl,
      isValid,
      isDuplicateInFile,
      isExistingUpdate,
      existingStudentId,
      errorReason: errorReason || undefined,
    };

    allRows.push(parsedRow);
    if (!isValid) {
      if (isDuplicateInFile) {
        duplicateInFileRows.push(parsedRow);
      } else {
        invalidRows.push(parsedRow);
      }
    } else {
      validRows.push(parsedRow);
      if (isExistingUpdate) {
        existingUpdateRows.push(parsedRow);
      }
    }
  });

  return {
    totalRows: allRows.length,
    validRows,
    invalidRows,
    duplicateInFileRows,
    existingUpdateRows,
    allRows,
  };
}

/**
 * Exports complete Student Master information to Excel matching the exact template columns.
 */
export function exportStudentsExcel(
  students: Student[],
  schoolName: string,
  schoolDiseCode?: string
) {
  if (students.length === 0) {
    throw new Error('કોઈ વિદ્યાર્થી ડેટા ઉપલબ્ધ નથી (No student data available to export).');
  }

  const exportRows = students.map((s) => ({
    'DISE CODE': s.diseCode || schoolDiseCode || '-',
    'GR NO.': s.grNumber || '-',
    'NAME (AS IN GR)': s.studentName,
    'STANDARD': s.standard,
    'SECTION': s.section || s.division || '-',
    'DOB': s.dob || '-',
    'ADDRESS': s.address || '-',
    'DOA': s.doa || '-',
    'MOTHER NAME': s.motherName || '-',
    'FATHER NAME': s.fatherName || '-',
    'GENDER': s.gender || '-',
    'CASTE': s.caste || '-',
    'BLOOD GROUP': s.bloodGroup || '-',
    'MOBILE NUMBER': s.contactNumber || s.mobileNumber || '-',
    'FATHER OCCUPATION': s.fatherOccupation || '-',
    'MOTHER OCCUPATION': s.motherOccupation || '-',
    'PLACE OF BIRTH': s.placeOfBirth || '-',
    'STUDENT PHOTO': s.photoUrl ? 'Available' : '-',
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportRows, {
    header: STUDENT_EXCEL_COLUMNS,
  });

  worksheet['!cols'] = [
    { wch: 15 },
    { wch: 12 },
    { wch: 32 },
    { wch: 12 },
    { wch: 10 },
    { wch: 14 },
    { wch: 35 },
    { wch: 14 },
    { wch: 22 },
    { wch: 22 },
    { wch: 12 },
    { wch: 14 },
    { wch: 13 },
    { wch: 16 },
    { wch: 20 },
    { wch: 20 },
    { wch: 18 },
    { wch: 16 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Students_Master');

  const cleanSchool = schoolName.replace(/[^a-zA-Z0-9_\-\s]/g, '').trim();
  XLSX.writeFile(workbook, `${cleanSchool}_Students_Master.xlsx`);
}
