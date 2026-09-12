import React, { useState, useId, useRef, useMemo } from 'react';
import { Student } from '../types';
import {
  addStudent,
  updateStudent,
  deleteStudent,
  bulkAddStudents,
} from '../services/firestoreService';
import {
  downloadStudentTemplate,
  parseStudentsExcelFile,
  ExcelParseResult,
  ParsedStudentRow,
} from '../utils/excelUtils';
import {
  Users,
  UserPlus,
  Search,
  Trash2,
  Edit3,
  FileSpreadsheet,
  Download,
  Upload,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  X,
  Loader2,
  Filter,
  Check,
  Building2,
  GraduationCap,
} from 'lucide-react';

interface StudentsManagerProps {
  schoolId: string;
  students: Student[];
  onRefresh: () => void;
}

type AllowedStandard = '9' | '10' | '11' | '12';

export const StudentsManager: React.FC<StudentsManagerProps> = ({
  schoolId,
  students,
  onRefresh,
}) => {
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStandardFilter, setSelectedStandardFilter] = useState<string>('ALL');

  // Manual Add Form State
  const [manualName, setManualName] = useState('');
  const [manualStandard, setManualStandard] = useState<AllowedStandard>('9');
  const [manualSubmitting, setManualSubmitting] = useState(false);
  const [manualError, setManualError] = useState<string | null>(null);
  const [manualSuccess, setManualSuccess] = useState<string | null>(null);

  // Edit Modal State
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [editName, setEditName] = useState('');
  const [editStandard, setEditStandard] = useState<AllowedStandard>('9');
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Delete Modal State
  const [deletingStudent, setDeletingStudent] = useState<Student | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  // Excel Upload & Preview State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [parseResult, setParseResult] = useState<ExcelParseResult | null>(null);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewFilterTab, setPreviewFilterTab] = useState<'all' | 'valid' | 'invalid'>('all');
  const [isParsingExcel, setIsParsingExcel] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importStatusMessage, setImportStatusMessage] = useState<string | null>(null);
  const [importErrorMessage, setImportErrorMessage] = useState<string | null>(null);

  // Quick stats calculation
  const counts = useMemo(() => {
    let std9 = 0;
    let std10 = 0;
    let std11 = 0;
    let std12 = 0;

    for (const student of students) {
      const std = String(student.standard).trim();
      if (std === '9' || std === 'Class 9') std9++;
      else if (std === '10' || std === 'Class 10') std10++;
      else if (std === '11' || std === 'Class 11') std11++;
      else if (std === '12' || std === 'Class 12') std12++;
    }

    return {
      std9,
      std10,
      std11,
      std12,
      total: students.length,
    };
  }, [students]);

  // Filtered students list
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const normStd = String(s.standard).replace(/^class\s*/i, '').trim();
      const matchesStandard =
        selectedStandardFilter === 'ALL' || normStd === selectedStandardFilter;

      const matchesSearch =
        !searchQuery.trim() ||
        s.studentName.toLowerCase().includes(searchQuery.trim().toLowerCase());

      return matchesStandard && matchesSearch;
    });
  }, [students, selectedStandardFilter, searchQuery]);

  // Handle Manual Add Student
  const handleAddManualStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setManualError(null);
    setManualSuccess(null);

    const trimmedName = manualName.trim();
    if (!trimmedName) {
      setManualError('કૃપા કરીને વિદ્યાર્થીનું પૂરું નામ લખો (Please enter the student name).');
      return;
    }

    // Duplicate check: Same name and standard in current school
    const isDuplicate = students.some(
      (s) =>
        s.studentName.trim().toLowerCase() === trimmedName.toLowerCase() &&
        String(s.standard).replace(/^class\s*/i, '').trim() === manualStandard
    );

    if (isDuplicate) {
      setManualError(
        `આ શાળામાં ધોરણ ${manualStandard} માં "${trimmedName}" નામનો વિદ્યાર્થી પહેલેથી નોંધાયેલ છે (Duplicate student already exists in this standard).`
      );
      return;
    }

    setManualSubmitting(true);
    try {
      await addStudent(schoolId, {
        studentName: trimmedName,
        standard: manualStandard,
      });

      setManualSuccess(`વિદ્યાર્થી "${trimmedName}" (ધોરણ ${manualStandard}) સફળતાપૂર્વક ઉમેરાઈ ગયો!`);
      setManualName('');
      onRefresh();
      setTimeout(() => setManualSuccess(null), 4000);
    } catch (err: any) {
      setManualError(err.message || 'વિદ્યાર્થી ઉમેરવામાં ભૂલ આવી (Failed to add student).');
    } finally {
      setManualSubmitting(false);
    }
  };

  // Open Edit Modal
  const handleOpenEditModal = (student: Student) => {
    const rawStd = String(student.standard).replace(/^class\s*/i, '').trim();
    const validStd: AllowedStandard = rawStd === '10' ? '10' : rawStd === '11' ? '11' : '9';
    setEditingStudent(student);
    setEditName(student.studentName);
    setEditStandard(validStd);
    setEditError(null);
  };

  // Save Edit Student
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    setEditError(null);

    const trimmedName = editName.trim();
    if (!trimmedName) {
      setEditError('વિદ્યાર્થીનું નામ જરૂરી છે (Student name is required).');
      return;
    }

    // Check duplicate among other students
    const isDuplicate = students.some(
      (s) =>
        s.id !== editingStudent.id &&
        s.studentName.trim().toLowerCase() === trimmedName.toLowerCase() &&
        String(s.standard).replace(/^class\s*/i, '').trim() === editStandard
    );

    if (isDuplicate) {
      setEditError(
        `ધોરણ ${editStandard} માં "${trimmedName}" નામનો અન્ય વિદ્યાર્થી પહેલેથી નોંધાયેલ છે (Another student with this name and standard already exists).`
      );
      return;
    }

    setEditSubmitting(true);
    try {
      await updateStudent(schoolId, editingStudent.id, {
        studentName: trimmedName,
        standard: editStandard,
      });
      setEditingStudent(null);
      onRefresh();
    } catch (err: any) {
      setEditError(err.message || 'વિગતો સાચવવામાં ક્ષતિ આવી (Failed to update student).');
    } finally {
      setEditSubmitting(false);
    }
  };

  // Handle Delete Student
  const handleConfirmDelete = async () => {
    if (!deletingStudent) return;
    setDeleteSubmitting(true);
    try {
      await deleteStudent(schoolId, deletingStudent.id);
      setDeletingStudent(null);
      onRefresh();
    } catch (err: any) {
      alert(`કાઢી નાખવામાં ભૂલ આવી: ${err.message}`);
    } finally {
      setDeleteSubmitting(false);
    }
  };

  // Handle Excel File Selection
  const handleExcelFileSelected = async (file: File) => {
    if (!file) return;
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      alert('કૃપા કરીને માન્ય એક્સેલ ફાઈલ (.xlsx) પસંદ કરો (Please upload a valid .xlsx Excel file).');
      return;
    }

    setExcelFile(file);
    setIsParsingExcel(true);
    setImportErrorMessage(null);

    try {
      const parsed = await parseStudentsExcelFile(
        file,
        students.map((s) => ({
          studentName: s.studentName,
          standard: String(s.standard).replace(/^class\s*/i, '').trim(),
        }))
      );
      setParseResult(parsed);
      setPreviewModalOpen(true);
      setPreviewFilterTab('all');
    } catch (err: any) {
      alert(`Excel વાંચવામાં ભૂલ આવી: ${err.message}`);
    } finally {
      setIsParsingExcel(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Handle Final Excel Import
  const handleConfirmExcelImport = async () => {
    if (!parseResult || parseResult.validRows.length === 0) return;

    setIsImporting(true);
    setImportErrorMessage(null);

    try {
      const validStudentList = parseResult.validRows.map((r) => ({
        studentName: r.name,
        standard: r.standard,
      }));

      const countAdded = await bulkAddStudents(schoolId, validStudentList);
      setImportStatusMessage(
        `સફળતા! ${countAdded} વિદ્યાર્થીઓ શાળા ડેટાબેઝમાં આયાત કરવામાં આવ્યા. (Successfully imported ${countAdded} students into your school Firestore database!)`
      );
      setPreviewModalOpen(false);
      setParseResult(null);
      setExcelFile(null);
      onRefresh();

      setTimeout(() => setImportStatusMessage(null), 6000);
    } catch (err: any) {
      setImportErrorMessage(err.message || 'આયાત દરમિયાન ભૂલ આવી (Failed to import students).');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Institutional Header with School Isolation Notice */}
      <div className="bg-slate-800/90 rounded-2xl border border-slate-700/80 p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800/80 inline-flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                ફક્ત આ શાળાના વિદ્યાર્થીઓ (Isolated School Subcollection)
              </span>
              <span className="text-xs text-slate-400 font-mono">
                /schools/{schoolId}/students
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2.5">
              <Users className="w-6 h-6 text-emerald-400 shrink-0" />
              <span>વિદ્યાર્થીઓ / Students Management</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1">
              ધોરણ ૯, ૧૦ અને ૧૧ ના વિદ્યાર્થીઓની યાદી, મેન્યુઅલ નોંધણી તથા Excel ફાઈલ આયાત
            </p>
          </div>

          {/* Action buttons: Download Template & Excel Upload */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              id="btn-download-excel-template"
              type="button"
              onClick={downloadStudentTemplate}
              className="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 bg-slate-700 hover:bg-slate-600 active:bg-slate-800 text-white rounded-xl text-xs sm:text-sm font-medium transition-colors border border-slate-600 shadow-sm touch-manipulation min-h-[44px]"
              title="Download empty Excel template with Name and Standard columns"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Download Excel Template</span>
            </button>

            <label
              id="btn-upload-excel-label"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-semibold transition-colors shadow-sm cursor-pointer touch-manipulation min-h-[44px]"
            >
              {isParsingExcel ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              <span>Upload Excel (.xlsx)</span>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                disabled={isParsingExcel}
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleExcelFileSelected(e.target.files[0]);
                  }
                }}
              />
            </label>
          </div>
        </div>

        {/* Global Import Notification Banner */}
        {importStatusMessage && (
          <div className="mt-4 bg-emerald-950/80 border border-emerald-700/80 text-emerald-200 rounded-xl p-3.5 text-xs sm:text-sm flex items-center gap-2.5 animate-fadeIn">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="flex-1">{importStatusMessage}</span>
            <button
              onClick={() => setImportStatusMessage(null)}
              className="text-emerald-400 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Requirement 9: Student Counts Bar (Standard 9, 10, 11, 12, Total) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Standard 9 Card */}
        <button
          type="button"
          onClick={() =>
            setSelectedStandardFilter(selectedStandardFilter === '9' ? 'ALL' : '9')
          }
          className={`p-4 rounded-2xl border text-left transition-all touch-manipulation min-h-[88px] flex flex-col justify-between ${
            selectedStandardFilter === '9'
              ? 'bg-blue-950/60 border-blue-500 ring-2 ring-blue-500/40'
              : 'glass-card border-white/10 hover:border-white/20'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold text-blue-300">ધોરણ 9 (Std 9)</span>
            <span className="text-[10px] uppercase font-mono bg-blue-950 px-1.5 py-0.5 rounded text-blue-300 border border-blue-800/60">
              Class 9
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-bold text-white font-mono">
              {counts.std9}
            </span>
            <span className="text-xs text-slate-400">વિદ્યાર્થીઓ</span>
          </div>
        </button>

        {/* Standard 10 Card */}
        <button
          type="button"
          onClick={() =>
            setSelectedStandardFilter(selectedStandardFilter === '10' ? 'ALL' : '10')
          }
          className={`p-4 rounded-2xl border text-left transition-all touch-manipulation min-h-[88px] flex flex-col justify-between ${
            selectedStandardFilter === '10'
              ? 'bg-emerald-950/60 border-emerald-500 ring-2 ring-emerald-500/40'
              : 'glass-card border-white/10 hover:border-white/20'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold text-emerald-300">ધોરણ 10 (Std 10)</span>
            <span className="text-[10px] uppercase font-mono bg-emerald-950 px-1.5 py-0.5 rounded text-emerald-300 border border-emerald-800/60">
              Class 10
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-bold text-white font-mono">
              {counts.std10}
            </span>
            <span className="text-xs text-slate-400">વિદ્યાર્થીઓ</span>
          </div>
        </button>

        {/* Standard 11 Card */}
        <button
          type="button"
          onClick={() =>
            setSelectedStandardFilter(selectedStandardFilter === '11' ? 'ALL' : '11')
          }
          className={`p-4 rounded-2xl border text-left transition-all touch-manipulation min-h-[88px] flex flex-col justify-between ${
            selectedStandardFilter === '11'
              ? 'bg-purple-950/60 border-purple-500 ring-2 ring-purple-500/40'
              : 'glass-card border-white/10 hover:border-white/20'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold text-purple-300">ધોરણ 11 (Std 11)</span>
            <span className="text-[10px] uppercase font-mono bg-purple-950 px-1.5 py-0.5 rounded text-purple-300 border border-purple-800/60">
              Class 11
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-bold text-white font-mono">
              {counts.std11}
            </span>
            <span className="text-xs text-slate-400">વિદ્યાર્થીઓ</span>
          </div>
        </button>

        {/* Standard 12 Card */}
        <button
          type="button"
          onClick={() =>
            setSelectedStandardFilter(selectedStandardFilter === '12' ? 'ALL' : '12')
          }
          className={`p-4 rounded-2xl border text-left transition-all touch-manipulation min-h-[88px] flex flex-col justify-between ${
            selectedStandardFilter === '12'
              ? 'bg-indigo-950/60 border-indigo-500 ring-2 ring-indigo-500/40'
              : 'glass-card border-white/10 hover:border-white/20'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold text-indigo-300">ધોરણ 12 (Std 12)</span>
            <span className="text-[10px] uppercase font-mono bg-indigo-950 px-1.5 py-0.5 rounded text-indigo-300 border border-indigo-800/60">
              Class 12
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-bold text-white font-mono">
              {counts.std12}
            </span>
            <span className="text-xs text-slate-400">વિદ્યાર્થીઓ</span>
          </div>
        </button>

        {/* Total Students Card */}
        <button
          type="button"
          onClick={() => setSelectedStandardFilter('ALL')}
          className={`p-4 rounded-2xl border text-left transition-all touch-manipulation min-h-[88px] flex flex-col justify-between ${
            selectedStandardFilter === 'ALL'
              ? 'bg-amber-950/40 border-amber-500 ring-2 ring-amber-500/40'
              : 'glass-card border-white/10 hover:border-white/20'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold text-amber-300">કુલ વિદ્યાર્થીઓ</span>
            <span className="text-[10px] uppercase font-mono bg-slate-900 px-1.5 py-0.5 rounded text-slate-300 border border-slate-700">
              Total
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-bold text-white font-mono">
              {counts.total}
            </span>
            <span className="text-xs text-slate-400">કુલ સંખ્યા</span>
          </div>
        </button>
      </div>

      {/* Requirement 5: Manual Student Entry */}
      <div className="bg-slate-800/90 rounded-2xl border border-slate-700/80 p-5 sm:p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4 border-b border-slate-700/70 pb-3">
          <UserPlus className="w-5 h-5 text-emerald-400" />
          <h2 className="text-base sm:text-lg font-bold text-white">
            નવો વિદ્યાર્થી ઉમેરો / Add Student (મેન્યુઅલ નોંધણી)
          </h2>
        </div>

        {manualError && (
          <div className="mb-4 bg-red-950/70 border border-red-800/80 rounded-xl p-3 text-xs sm:text-sm text-red-200 flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{manualError}</span>
          </div>
        )}

        {manualSuccess && (
          <div className="mb-4 bg-emerald-950/70 border border-emerald-800/80 rounded-xl p-3 text-xs sm:text-sm text-emerald-200 flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{manualSuccess}</span>
          </div>
        )}

        <form onSubmit={handleAddManualStudent} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
            {/* Student Name field */}
            <div className="sm:col-span-7">
              <label
                htmlFor="input-manual-name"
                className="block text-xs sm:text-sm font-semibold text-slate-300 mb-1.5"
              >
                Student Name (વિદ્યાર્થીનું નામ) <span className="text-red-400">*</span>
              </label>
              <input
                id="input-manual-name"
                type="text"
                required
                value={manualName}
                onChange={(e) => setManualName(e.target.value)}
                placeholder="દા.ત. રાહુલ પટેલ (Rahul Patel)"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all min-h-[44px]"
              />
            </div>

            {/* Standard field: strictly 9, 10, 11 */}
            <div className="sm:col-span-3">
              <label
                htmlFor="select-manual-standard"
                className="block text-xs sm:text-sm font-semibold text-slate-300 mb-1.5"
              >
                Standard (ધોરણ) <span className="text-red-400">*</span>
              </label>
              <select
                id="select-manual-standard"
                value={manualStandard}
                onChange={(e) => setManualStandard(e.target.value as AllowedStandard)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all min-h-[44px]"
              >
                <option value="9">ધોરણ 9 (Standard 9)</option>
                <option value="10">ધોરણ 10 (Standard 10)</option>
                <option value="11">ધોરણ 11 (Standard 11)</option>
                <option value="12">ધોરણ 12 (Standard 12)</option>
              </select>
            </div>

            {/* [વિદ્યાર્થી ઉમેરો] Button */}
            <div className="sm:col-span-2 flex items-end">
              <button
                id="btn-add-student-manual"
                type="submit"
                disabled={manualSubmitting || !manualName.trim()}
                className="w-full bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl px-4 py-3 text-sm shadow-md transition-all flex items-center justify-center gap-2 min-h-[44px] touch-manipulation"
              >
                {manualSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <UserPlus className="w-4 h-4" />
                )}
                <span>વિદ્યાર્થી ઉમેરો</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Requirement 8: Search, Filter, and Student List */}
      <div className="bg-slate-800/90 rounded-2xl border border-slate-700/80 overflow-hidden shadow-sm">
        {/* Search & Filter Controls Toolbar */}
        <div className="p-4 sm:p-5 border-b border-slate-700/80 bg-slate-850">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
            {/* Search Input */}
            <div className="sm:col-span-6 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                id="input-search-student-list"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="વિદ્યાર્થીના નામથી શોધો (Search by student name)..."
                className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-9 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[44px]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-3 text-slate-400 hover:text-white p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Filter by Standard Dropdown */}
            <div className="sm:col-span-4">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-400 shrink-0 hidden sm:block" />
                <select
                  id="select-filter-by-standard"
                  value={selectedStandardFilter}
                  onChange={(e) => setSelectedStandardFilter(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[44px]"
                >
                  <option value="ALL">બધા ધોરણ (All Standards - 9, 10, 11, 12)</option>
                  <option value="9">ધોરણ 9 (Standard 9)</option>
                  <option value="10">ધોરણ 10 (Standard 10)</option>
                  <option value="11">ધોરણ 11 (Standard 11)</option>
                  <option value="12">ધોરણ 12 (Standard 12)</option>
                </select>
              </div>
            </div>

            {/* Results count */}
            <div className="sm:col-span-2 text-right text-xs text-slate-400 font-mono">
              કુલ: {filteredStudents.length} / {students.length}
            </div>
          </div>
        </div>

        {/* Empty State */}
        {students.length === 0 ? (
          <div className="p-10 sm:p-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-700/50 text-emerald-400 flex items-center justify-center mx-auto mb-4 border border-slate-600/50">
              <GraduationCap className="w-7 h-7" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white">
              આ શાળામાં હજુ કોઈ વિદ્યાર્થી નોંધાયેલ નથી
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto mt-1 mb-5 leading-relaxed">
              તમારી શાળાનો ડેટાબેઝ ક્લીન છે. ઉપર આપેલા ફોર્મ દ્વારા મેન્યુઅલ વિદ્યાર્થી ઉમેરો અથવા એકસાથે યાદી લાવવા માટે Excel (.xlsx) ફાઇલ અપલોડ કરો.
            </p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <button
                type="button"
                onClick={downloadStudentTemplate}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-xs font-semibold"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                Download Template
              </button>
            </div>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="p-10 text-center text-xs sm:text-sm text-slate-400">
            તમારી શોધ અથવા ધોરણ ફિલ્ટર અનુસાર કોઈ વિદ્યાર્થી મળ્યો નથી.
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedStandardFilter('ALL');
              }}
              className="block mx-auto mt-2 text-emerald-400 hover:underline font-semibold"
            >
              ફિલ્ટર્સ રીસેટ કરો (Reset Filters)
            </button>
          </div>
        ) : (
          <>
            {/* Desktop / Tablet Table View (hidden on very small screens) */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm text-slate-200">
                <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-700/80 text-[11px]">
                  <tr>
                    <th className="px-5 py-3.5 w-16">ક્રમ</th>
                    <th className="px-5 py-3.5">Student Name (વિદ્યાર્થીનું નામ)</th>
                    <th className="px-5 py-3.5">Standard (ધોરણ)</th>
                    <th className="px-5 py-3.5">નોંધણી તારીખ</th>
                    <th className="px-5 py-3.5 text-right">ક્રિયાઓ (Actions)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/60">
                  {filteredStudents.map((student, idx) => {
                    const stdClean = String(student.standard).replace(/^class\s*/i, '').trim();
                    return (
                      <tr
                        key={student.id}
                        className="hover:bg-slate-700/30 transition-colors"
                      >
                        <td className="px-5 py-3.5 font-mono text-slate-400">
                          {idx + 1}
                        </td>
                        <td className="px-5 py-3.5 font-semibold text-white">
                          {student.studentName}
                        </td>
                        <td className="px-5 py-3.5">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold ${
                              stdClean === '9'
                                ? 'bg-blue-950 text-blue-300 border border-blue-800/80'
                                : stdClean === '10'
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/80'
                                : stdClean === '11'
                                ? 'bg-purple-950 text-purple-300 border border-purple-800/80'
                                : 'bg-slate-800 text-slate-300'
                            }`}
                          >
                            ધોરણ {stdClean}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-slate-400 font-mono text-xs">
                          {student.createdAt
                            ? new Date(student.createdAt).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })
                            : '-'}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              id={`btn-edit-student-${student.id}`}
                              type="button"
                              onClick={() => handleOpenEditModal(student)}
                              className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 transition-colors touch-manipulation min-h-[36px] min-w-[36px] flex items-center justify-center"
                              title="Edit Student"
                            >
                              <Edit3 className="w-4 h-4 text-blue-400" />
                            </button>
                            <button
                              id={`btn-delete-student-${student.id}`}
                              type="button"
                              onClick={() => setDeletingStudent(student)}
                              className="p-2 rounded-lg text-slate-300 hover:text-red-400 hover:bg-red-950/40 transition-colors touch-manipulation min-h-[36px] min-w-[36px] flex items-center justify-center"
                              title="Delete Student"
                            >
                              <Trash2 className="w-4 h-4 text-red-400" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View (Optimized for Android phones with ≥44px touch targets) */}
            <div className="sm:hidden divide-y divide-slate-700/60">
              {filteredStudents.map((student, idx) => {
                const stdClean = String(student.standard).replace(/^class\s*/i, '').trim();
                return (
                  <div
                    key={student.id}
                    className="p-4 flex items-center justify-between gap-3 active:bg-slate-750"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono text-slate-500">
                          #{idx + 1}
                        </span>
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                            stdClean === '9'
                              ? 'bg-blue-950 text-blue-300 border border-blue-800/80'
                              : stdClean === '10'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/80'
                              : stdClean === '11'
                              ? 'bg-purple-950 text-purple-300 border border-purple-800/80'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          ધોરણ {stdClean}
                        </span>
                      </div>
                      <h4 className="text-sm font-semibold text-white truncate">
                        {student.studentName}
                      </h4>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(student)}
                        className="p-2.5 rounded-xl text-blue-400 bg-blue-950/40 border border-blue-800/50 hover:bg-blue-900/60 active:bg-blue-800 transition-colors touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center"
                        aria-label="Edit Student"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingStudent(student)}
                        className="p-2.5 rounded-xl text-red-400 bg-red-950/40 border border-red-800/50 hover:bg-red-900/60 active:bg-red-800 transition-colors touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center"
                        aria-label="Delete Student"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Requirement 12: Excel Upload Preview & Confirmation Modal */}
      {previewModalOpen && parseResult && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-3 sm:p-4 backdrop-blur-xs overflow-y-auto">
          <div className="bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col text-white my-auto animate-fadeIn">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-700/80 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-base sm:text-lg font-bold flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                  <span>Excel આયાત પૂર્વાવલોકન (Import Preview)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                  ફાઇલ: {excelFile?.name} • કુલ {parseResult.totalRows} પંક્તિઓ મળી
                </p>
              </div>
              <button
                onClick={() => setPreviewModalOpen(false)}
                className="text-slate-400 hover:text-white p-2 rounded-lg touch-manipulation"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Summary Statistics */}
            <div className="p-4 bg-slate-850 border-b border-slate-800 grid grid-cols-3 gap-2 text-center text-xs">
              <div className="bg-emerald-950/60 border border-emerald-800/80 rounded-xl p-2.5">
                <div className="text-emerald-400 font-bold text-lg font-mono">
                  {parseResult.validRows.length}
                </div>
                <div className="text-emerald-300 text-[11px] font-medium">
                  માન્ય (Valid to Import)
                </div>
              </div>

              <div className="bg-amber-950/60 border border-amber-800/80 rounded-xl p-2.5">
                <div className="text-amber-400 font-bold text-lg font-mono">
                  {parseResult.duplicateRows.length}
                </div>
                <div className="text-amber-300 text-[11px] font-medium">
                  ડુપ્લિકેટ (Duplicates)
                </div>
              </div>

              <div className="bg-red-950/60 border border-red-800/80 rounded-xl p-2.5">
                <div className="text-red-400 font-bold text-lg font-mono">
                  {parseResult.invalidRows.length}
                </div>
                <div className="text-red-300 text-[11px] font-medium">
                  અમાન્ય (Errors)
                </div>
              </div>
            </div>

            {/* Filter Tabs within preview */}
            <div className="px-4 pt-3 flex items-center gap-2 border-b border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setPreviewFilterTab('all')}
                className={`pb-2 font-medium px-2 border-b-2 transition-colors ${
                  previewFilterTab === 'all'
                    ? 'border-emerald-500 text-emerald-400'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                બધી પંક્તિઓ ({parseResult.allRows.length})
              </button>
              <button
                type="button"
                onClick={() => setPreviewFilterTab('valid')}
                className={`pb-2 font-medium px-2 border-b-2 transition-colors ${
                  previewFilterTab === 'valid'
                    ? 'border-emerald-500 text-emerald-400'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                ફક્ત માન્ય ({parseResult.validRows.length})
              </button>
              <button
                type="button"
                onClick={() => setPreviewFilterTab('invalid')}
                className={`pb-2 font-medium px-2 border-b-2 transition-colors ${
                  previewFilterTab === 'invalid'
                    ? 'border-emerald-500 text-emerald-400'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                ભૂલ / ડુપ્લિકેટ ({parseResult.invalidRows.length + parseResult.duplicateRows.length})
              </button>
            </div>

            {/* Preview Rows Table */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2 max-h-72 text-xs">
              {(previewFilterTab === 'all'
                ? parseResult.allRows
                : previewFilterTab === 'valid'
                ? parseResult.validRows
                : [...parseResult.invalidRows, ...parseResult.duplicateRows]
              ).map((row, i) => (
                <div
                  key={i}
                  className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                    row.isValid
                      ? 'bg-emerald-950/20 border-emerald-800/60 text-slate-200'
                      : row.isDuplicate
                      ? 'bg-amber-950/20 border-amber-800/60 text-amber-200'
                      : 'bg-red-950/20 border-red-800/60 text-red-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-slate-400 text-[11px] w-8">
                      #{row.rowNumber}
                    </span>
                    <div>
                      <span className="font-semibold text-white">
                        {row.name || '(ખાલી નામ / No Name)'}
                      </span>
                      <span className="ml-2 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 border border-slate-700 text-slate-300">
                        ધોરણ: {row.standard || '-'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {row.isValid ? (
                      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                        <Check className="w-3.5 h-3.5" /> આયાત માટે તૈયાર
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-red-300">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        {row.errorReason}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {importErrorMessage && (
              <div className="px-4 py-2 bg-red-950/80 border-t border-red-800 text-xs text-red-300">
                {importErrorMessage}
              </div>
            )}

            {/* Modal Footer with Confirmation Prompt */}
            <div className="p-4 sm:p-5 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950/60">
              <div className="text-xs text-slate-300">
                {parseResult.validRows.length > 0 ? (
                  <span>
                    કુલ <strong>{parseResult.validRows.length}</strong> માન્ય વિદ્યાર્થીઓ તમારા શાળા એકાઉન્ટમાં આયાત થશે.
                  </span>
                ) : (
                  <span className="text-red-400">
                    ફાઈલમાં કોઈ માન્ય વિદ્યાર્થી મળ્યા નથી.
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2.5 justify-end">
                <button
                  type="button"
                  onClick={() => setPreviewModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs sm:text-sm font-semibold touch-manipulation min-h-[44px]"
                >
                  રદ કરો (Cancel)
                </button>
                <button
                  id="btn-confirm-excel-import"
                  type="button"
                  disabled={isImporting || parseResult.validRows.length === 0}
                  onClick={handleConfirmExcelImport}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-bold shadow-md flex items-center gap-2 touch-manipulation min-h-[44px]"
                >
                  {isImporting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  <span>
                    {isImporting
                      ? 'આયાત ચાલુ છે...'
                      : `હા, ${parseResult.validRows.length} વિદ્યાર્થીઓ આયાત કરો`}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Requirement 8: Edit Student Modal */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-3 sm:p-4 backdrop-blur-xs">
          <div className="bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl max-w-md w-full p-5 sm:p-6 text-white animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3 mb-4">
              <h3 className="text-base font-bold flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-blue-400" />
                વિદ્યાર્થીની વિગતો સુધારો (Edit Student)
              </h3>
              <button
                onClick={() => setEditingStudent(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {editError && (
              <div className="mb-4 bg-red-950/70 border border-red-800 rounded-xl p-3 text-xs text-red-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{editError}</span>
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Student Name (વિદ્યાર્થીનું નામ) <span className="text-red-400">*</span>
                </label>
                <input
                  id="input-edit-student-name"
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Standard (ધોરણ) <span className="text-red-400">*</span>
                </label>
                <select
                  id="select-edit-student-standard"
                  value={editStandard}
                  onChange={(e) => setEditStandard(e.target.value as AllowedStandard)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
                >
                  <option value="9">ધોરણ 9 (Standard 9)</option>
                  <option value="10">ધોરણ 10 (Standard 10)</option>
                  <option value="11">ધોરણ 11 (Standard 11)</option>
                  <option value="12">ધોરણ 12 (Standard 12)</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold min-h-[44px]"
                >
                  રદ કરો (Cancel)
                </button>
                <button
                  id="btn-submit-edit-student"
                  type="submit"
                  disabled={editSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold flex items-center gap-2 min-h-[44px]"
                >
                  {editSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  <span>સાચવો (Save Changes)</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Requirement 8: Delete Confirmation Modal */}
      {deletingStudent && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-3 sm:p-4 backdrop-blur-xs">
          <div className="bg-slate-900 rounded-2xl border border-red-900/60 shadow-2xl max-w-sm w-full p-5 sm:p-6 text-white animate-fadeIn">
            <div className="w-12 h-12 rounded-2xl bg-red-950/80 border border-red-800/80 text-red-400 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-center text-white">
              વિદ્યાર્થીને કાઢી નાખવાની પુષ્ટિ
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 text-center mt-2 leading-relaxed">
              શું તમે ખરેખર ધોરણ {String(deletingStudent.standard).replace(/^class\s*/i, '')} ના વિદ્યાર્થી{' '}
              <strong className="text-white">&ldquo;{deletingStudent.studentName}&rdquo;</strong> ને શાળા રેકોર્ડમાંથી કાયમ માટે કાઢી નાખવા માંગો છો?
            </p>

            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setDeletingStudent(null)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs sm:text-sm font-semibold min-h-[44px]"
              >
                રદ કરો (Cancel)
              </button>
              <button
                id="btn-confirm-delete-student"
                type="button"
                disabled={deleteSubmitting}
                onClick={handleConfirmDelete}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 active:bg-red-700 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 min-h-[44px]"
              >
                {deleteSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                <span>હા, કાઢી નાખો</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
