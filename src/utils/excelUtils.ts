import * as XLSX from 'xlsx';
import { AllowedStandard } from '../types';

export interface ParsedStudentRow {
  rowNumber: number;
  name: string;
  standard: string;
  isValid: boolean;
  isDuplicate: boolean;
  errorReason?: string;
}

export interface ExcelParseResult {
  totalRows: number;
  validRows: ParsedStudentRow[];
  invalidRows: ParsedStudentRow[];
  duplicateRows: ParsedStudentRow[];
  allRows: ParsedStudentRow[];
}

/**
 * Generates and downloads the Excel template for student enrollment
 * Required columns: Name | Standard
 * Allowed standards: 9, 10, 11, 12
 */
export function downloadStudentTemplate() {
  const templateData = [
    { Name: 'Rahul Patel', Standard: 9 },
    { Name: 'Riya Patel', Standard: 9 },
    { Name: 'Amit Patel', Standard: 10 },
    { Name: 'Pooja Joshi', Standard: 11 },
    { Name: 'Kavita Dave', Standard: 12 },
  ];

  const worksheet = XLSX.utils.json_to_sheet(templateData, {
    header: ['Name', 'Standard'],
  });

  // Set column widths for nice appearance
  worksheet['!cols'] = [
    { wch: 25 }, // Name
    { wch: 12 }, // Standard
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Students_Template');

  XLSX.writeFile(workbook, 'Students_Enrollment_Template.xlsx');
}

/**
 * Normalizes a standard entry into '9', '10', '11', or '12'
 */
export function normalizeStandard(val: any): AllowedStandard | null {
  if (val === undefined || val === null) return null;
  const str = String(val).trim();

  // Match 9, 10, 11, 12
  if (str === '9' || str === '09' || /^std\s*9$/i.test(str) || /^class\s*9$/i.test(str) || /^ધોરણ\s*૯$/i.test(str) || /^ધોરણ\s*9$/i.test(str)) {
    return '9';
  }
  if (str === '10' || /^std\s*10$/i.test(str) || /^class\s*10$/i.test(str) || /^ધોરણ\s*૧૦$/i.test(str) || /^ધોરણ\s*10$/i.test(str)) {
    return '10';
  }
  if (str === '11' || /^std\s*11$/i.test(str) || /^class\s*11$/i.test(str) || /^ધોરણ\s*૧૧$/i.test(str) || /^ધોરણ\s*11$/i.test(str)) {
    return '11';
  }
  if (str === '12' || /^std\s*12$/i.test(str) || /^class\s*12$/i.test(str) || /^ધોરણ\s*૧૨$/i.test(str) || /^ધોરણ\s*12$/i.test(str)) {
    return '12';
  }

  return null;
}

/**
 * Parses and validates an uploaded .xlsx file
 * Validates Name and Standard (strictly 9, 10, 11)
 * Detects duplicates against current school records & duplicate rows within the file
 */
export async function parseStudentsExcelFile(
  file: File,
  existingSchoolStudents: Array<{ studentName: string; standard: string }>
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

  // Pre-index existing school students for fast O(1) duplicate check
  const existingKeySet = new Set<string>();
  for (const s of existingSchoolStudents) {
    const key = `${s.studentName.trim().toLowerCase()}_${String(s.standard).trim()}`;
    existingKeySet.add(key);
  }

  const seenInFileKeySet = new Set<string>();

  const validRows: ParsedStudentRow[] = [];
  const invalidRows: ParsedStudentRow[] = [];
  const duplicateRows: ParsedStudentRow[] = [];
  const allRows: ParsedStudentRow[] = [];

  rawRows.forEach((row, index) => {
    const rowNumber = index + 2; // Row 1 is header in Excel

    // Find Name column (case-insensitive check)
    let rawName: any = undefined;
    let rawStd: any = undefined;

    for (const key of Object.keys(row)) {
      const cleanKey = key.trim().toLowerCase();
      if (
        cleanKey === 'name' ||
        cleanKey === 'student name' ||
        cleanKey === 'studentname' ||
        cleanKey === 'વિદ્યાર્થી' ||
        cleanKey === 'વિદ્યાર્થીનું નામ' ||
        cleanKey === 'નામ'
      ) {
        rawName = row[key];
      }
      if (
        cleanKey === 'standard' ||
        cleanKey === 'std' ||
        cleanKey === 'class' ||
        cleanKey === 'ધોરણ'
      ) {
        rawStd = row[key];
      }
    }

    const trimmedName = rawName !== undefined ? String(rawName).trim() : '';
    const normalizedStd = normalizeStandard(rawStd);

    // Validation checks
    let isValid = true;
    let isDuplicate = false;
    let errorReason = '';

    if (!trimmedName) {
      isValid = false;
      errorReason = 'વિદ્યાર્થીનું નામ ખાલી છે (Name column is missing or empty)';
    } else if (!normalizedStd) {
      isValid = false;
      errorReason = `અમાન્ય ધોરણ "${rawStd ?? ''}" (માત્ર 9, 10, 11, 12 માન્ય છે / Only Standards 9, 10, 11, 12 allowed)`;
    } else {
      const uniqueKey = `${trimmedName.toLowerCase()}_${normalizedStd}`;

      if (existingKeySet.has(uniqueKey)) {
        isDuplicate = true;
        isValid = false;
        errorReason = 'આ શાળામાં આ નામ અને ધોરણવાળો વિદ્યાર્થી પહેલેથી નોંધાયેલ છે (Already registered in this school)';
      } else if (seenInFileKeySet.has(uniqueKey)) {
        isDuplicate = true;
        isValid = false;
        errorReason = 'એક્સેલ ફાઈલમાં આ જ વિદ્યાર્થીનું નામ અને ધોરણ પુનરાવર્તિત થાય છે (Duplicate row in this file)';
      } else {
        seenInFileKeySet.add(uniqueKey);
      }
    }

    const parsedRow: ParsedStudentRow = {
      rowNumber,
      name: trimmedName,
      standard: normalizedStd || String(rawStd || ''),
      isValid,
      isDuplicate,
      errorReason: errorReason || undefined,
    };

    allRows.push(parsedRow);
    if (isDuplicate) {
      duplicateRows.push(parsedRow);
    } else if (isValid) {
      validRows.push(parsedRow);
    } else {
      invalidRows.push(parsedRow);
    }
  });

  return {
    totalRows: allRows.length,
    validRows,
    invalidRows,
    duplicateRows,
    allRows,
  };
}
