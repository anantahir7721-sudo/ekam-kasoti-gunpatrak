import React, { useState, useRef, useMemo } from 'react';
import { School, Student, AllowedStandard } from '../types';
import {
  addStudent,
  updateStudent,
  deleteStudent,
  bulkUpsertStudents,
} from '../services/firestoreService';
import {
  downloadStudentTemplate,
  parseStudentsExcelFile,
  exportStudentsExcel,
  ExcelParseResult,
  ParsedStudentRow,
} from '../utils/excelUtils';
import { printStudentIdCards } from '../utils/idCardPdf';
import { compressStudentPhoto } from '../utils/imageUtils';
import { StudentProfileModal } from './StudentProfileModal';
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
  CreditCard,
  Eye,
  Camera,
  CheckSquare,
  Square,
  FileText,
  User,
  Heart,
  Phone,
  Printer,
  Sparkles,
} from 'lucide-react';

interface StudentsManagerProps {
  school: School;
  schoolId: string;
  students: Student[];
  onRefresh: () => void;
}

export const StudentsManager: React.FC<StudentsManagerProps> = ({
  school,
  schoolId,
  students,
  onRefresh,
}) => {
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStandardFilter, setSelectedStandardFilter] = useState<string>('ALL');
  const [selectedSectionFilter, setSelectedSectionFilter] = useState<string>('ALL');
  const [selectedGenderFilter, setSelectedGenderFilter] = useState<string>('ALL');
  const [selectedBloodFilter, setSelectedBloodFilter] = useState<string>('ALL');

  // Multi-selection for ID Card generation or bulk operations
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());

  // Profile Modal State
  const [viewingProfileStudent, setViewingProfileStudent] = useState<Student | null>(null);

  // Manual Add Modal / Section State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addForm, setAddForm] = useState({
    studentName: '',
    standard: '9' as AllowedStandard,
    grNumber: '',
    section: '',
    rollNumber: '',
    dob: '',
    doa: '',
    gender: 'Boy' as 'Boy' | 'Girl' | 'Other',
    bloodGroup: '',
    caste: '',
    contactNumber: '',
    fatherName: '',
    fatherOccupation: '',
    motherName: '',
    motherOccupation: '',
    address: '',
    placeOfBirth: '',
    photoUrl: '',
    diseCode: school.diseCode || '',
  });
  const [addSubmitting, setAddSubmitting] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [addSuccess, setAddSuccess] = useState<string | null>(null);
  const addPhotoInputRef = useRef<HTMLInputElement>(null);

  // Quick Edit Modal State
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [editForm, setEditForm] = useState<Partial<Student>>({});
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
  const [previewFilterTab, setPreviewFilterTab] = useState<'all' | 'valid' | 'invalid' | 'updates'>('all');
  const [isParsingExcel, setIsParsingExcel] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importStatusMessage, setImportStatusMessage] = useState<string | null>(null);

  // ID Card Generation Modal State
  const [isIdCardModalOpen, setIsIdCardModalOpen] = useState(false);
  const [idCardStdSelection, setIdCardStdSelection] = useState<string>('ALL');

  // Derive unique sections for filtering
  const availableSections = useMemo(() => {
    const secs = new Set<string>();
    students.forEach((s) => {
      const sec = s.section || s.division;
      if (sec && sec.trim()) secs.add(sec.trim().toUpperCase());
    });
    return Array.from(secs).sort();
  }, [students]);

  // Quick stats calculation
  const counts = useMemo(() => {
    let std9 = 0;
    let std10 = 0;
    let std11 = 0;
    let std12 = 0;
    let boys = 0;
    let girls = 0;

    for (const student of students) {
      const std = String(student.standard).replace(/^class\s*/i, '').trim();
      if (std === '9') std9++;
      else if (std === '10') std10++;
      else if (std === '11') std11++;
      else if (std === '12') std12++;

      if (student.gender === 'Boy') boys++;
      else if (student.gender === 'Girl') girls++;
    }

    return {
      std9,
      std10,
      std11,
      std12,
      boys,
      girls,
      total: students.length,
    };
  }, [students]);

  // Filtered students list
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const normStd = String(s.standard).replace(/^class\s*/i, '').trim();
      const normSec = (s.section || s.division || '').trim().toUpperCase();

      const matchesStandard =
        selectedStandardFilter === 'ALL' || normStd === selectedStandardFilter;
      const matchesSection =
        selectedSectionFilter === 'ALL' || normSec === selectedSectionFilter;
      const matchesGender =
        selectedGenderFilter === 'ALL' || s.gender === selectedGenderFilter;
      const matchesBlood =
        selectedBloodFilter === 'ALL' || s.bloodGroup === selectedBloodFilter;

      if (!matchesStandard || !matchesSection || !matchesGender || !matchesBlood) {
        return false;
      }

      if (!searchQuery.trim()) return true;
      const q = searchQuery.trim().toLowerCase();

      return (
        s.studentName.toLowerCase().includes(q) ||
        (s.grNumber && s.grNumber.toLowerCase().includes(q)) ||
        (s.rollNumber && s.rollNumber.toLowerCase().includes(q)) ||
        (s.contactNumber && s.contactNumber.includes(q)) ||
        (s.diseCode && s.diseCode.includes(q))
      );
    });
  }, [
    students,
    selectedStandardFilter,
    selectedSectionFilter,
    selectedGenderFilter,
    selectedBloodFilter,
    searchQuery,
  ]);

  // Selection handlers
  const handleToggleSelectAll = () => {
    if (selectedStudentIds.size === filteredStudents.length && filteredStudents.length > 0) {
      setSelectedStudentIds(new Set());
    } else {
      setSelectedStudentIds(new Set(filteredStudents.map((s) => s.id)));
    }
  };

  const handleToggleSelectStudent = (id: string) => {
    const next = new Set(selectedStudentIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedStudentIds(next);
  };

  // Trigger Print ID Cards
  const handleGenerateIdCards = (targetStudents: Student[]) => {
    if (targetStudents.length === 0) {
      alert('કૃપા કરીને આઈડી કાર્ડ છાપવા માટે વિદ્યાર્થીઓ પસંદ કરો.');
      return;
    }
    printStudentIdCards(school, targetStudents);
  };

  // Handle Photo selection for Manual Add
  const handleAddPhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressStudentPhoto(file);
      setAddForm((prev) => ({ ...prev, photoUrl: compressed }));
    } catch (err: any) {
      alert(err.message || 'ઇમેજ પ્રોસેસ કરવામાં ભૂલ આવી.');
    }
  };

  // Submit Manual Add Student Form
  const handleSubmitAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);
    setAddSuccess(null);

    const name = addForm.studentName.trim();
    if (!name) {
      setAddError('વિદ્યાર્થીનું નામ (Name as in GR) જરૂરી છે.');
      return;
    }

    // Check duplicate GR if entered
    if (addForm.grNumber.trim()) {
      const dupGr = students.some(
        (s) => s.grNumber && s.grNumber.trim().toLowerCase() === addForm.grNumber.trim().toLowerCase()
      );
      if (dupGr) {
        setAddError(`આ G.R. નંબર (${addForm.grNumber}) પહેલેથી અન્ય વિદ્યાર્થી માટે નોંધાયેલ છે.`);
        return;
      }
    }

    // Check duplicate Name + Standard
    const dupNameStd = students.some(
      (s) =>
        s.studentName.trim().toLowerCase() === name.toLowerCase() &&
        String(s.standard).replace(/^class\s*/i, '').trim() === addForm.standard
    );
    if (dupNameStd) {
      setAddError(`ધોરણ ${addForm.standard} માં "${name}" નામનો વિદ્યાર્થી પહેલેથી નોંધાયેલ છે.`);
      return;
    }

    setAddSubmitting(true);
    try {
      await addStudent(schoolId, {
        studentName: name,
        standard: addForm.standard,
        diseCode: addForm.diseCode.trim() || school.diseCode || undefined,
        grNumber: addForm.grNumber.trim() || undefined,
        section: addForm.section.trim() || undefined,
        division: addForm.section.trim() || undefined,
        rollNumber: addForm.rollNumber.trim() || undefined,
        dob: addForm.dob.trim() || undefined,
        doa: addForm.doa.trim() || undefined,
        gender: addForm.gender,
        bloodGroup: addForm.bloodGroup.trim() || undefined,
        caste: addForm.caste.trim() || undefined,
        contactNumber: addForm.contactNumber.trim() || undefined,
        fatherName: addForm.fatherName.trim() || undefined,
        fatherOccupation: addForm.fatherOccupation.trim() || undefined,
        motherName: addForm.motherName.trim() || undefined,
        motherOccupation: addForm.motherOccupation.trim() || undefined,
        address: addForm.address.trim() || undefined,
        placeOfBirth: addForm.placeOfBirth.trim() || undefined,
        photoUrl: addForm.photoUrl || undefined,
      });

      setAddSuccess(`વિદ્યાર્થી "${name}" સફળતાપૂર્વક ઉમેરાઈ ગયો!`);
      // Reset form
      setAddForm({
        studentName: '',
        standard: '9',
        grNumber: '',
        section: '',
        rollNumber: '',
        dob: '',
        doa: '',
        gender: 'Boy',
        bloodGroup: '',
        caste: '',
        contactNumber: '',
        fatherName: '',
        fatherOccupation: '',
        motherName: '',
        motherOccupation: '',
        address: '',
        placeOfBirth: '',
        photoUrl: '',
        diseCode: school.diseCode || '',
      });
      onRefresh();
      setTimeout(() => {
        setAddSuccess(null);
        setIsAddModalOpen(false);
      }, 1500);
    } catch (err: any) {
      setAddError(err.message || 'વિદ્યાર્થી ઉમેરવામાં ભૂલ આવી.');
    } finally {
      setAddSubmitting(false);
    }
  };

  // Handle Quick Edit Save
  const handleSaveQuickEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    setEditError(null);

    const trimmedName = (editForm.studentName || '').trim();
    if (!trimmedName) {
      setEditError('વિદ્યાર્થીનું નામ જરૂરી છે.');
      return;
    }

    setEditSubmitting(true);
    try {
      await updateStudent(schoolId, editingStudent.id, {
        ...editForm,
        studentName: trimmedName,
      });
      onRefresh();
      setEditingStudent(null);
    } catch (err: any) {
      setEditError(err.message || 'સુધારો સાચવવામાં નિષ્ફળતા મળી.');
    } finally {
      setEditSubmitting(false);
    }
  };

  // Handle Confirm Delete
  const handleConfirmDelete = async () => {
    if (!deletingStudent) return;
    setDeleteSubmitting(true);
    try {
      await deleteStudent(schoolId, deletingStudent.id);
      onRefresh();
      setDeletingStudent(null);
    } catch (err: any) {
      alert(err.message || 'વિદ્યાર્થી કાઢી નાખવામાં નિષ્ફળતા મળી.');
    } finally {
      setDeleteSubmitting(false);
    }
  };

  // Handle Excel File Selected
  const handleExcelFileSelected = async (file: File) => {
    try {
      setIsParsingExcel(true);
      setExcelFile(file);
      const result = await parseStudentsExcelFile(file, students, school.diseCode);
      setParseResult(result);
      setPreviewModalOpen(true);
    } catch (err: any) {
      alert(err.message || 'Excel ફાઇલ વાંચવામાં ભૂલ આવી.');
    } finally {
      setIsParsingExcel(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Execute Excel Import via bulkUpsertStudents
  const handleExecuteImport = async () => {
    if (!parseResult || parseResult.validRows.length === 0) return;

    setIsImporting(true);
    try {
      const studentsToImport = parseResult.validRows.map((r) => ({
        studentName: r.name,
        standard: r.standard,
        diseCode: r.diseCode,
        grNumber: r.grNumber,
        section: r.section,
        division: r.section,
        dob: r.dob,
        doa: r.doa,
        address: r.address,
        motherName: r.motherName,
        fatherName: r.fatherName,
        gender: r.gender,
        caste: r.caste,
        bloodGroup: r.bloodGroup,
        contactNumber: r.contactNumber,
        mobileNumber: r.contactNumber,
        fatherOccupation: r.fatherOccupation,
        motherOccupation: r.motherOccupation,
        placeOfBirth: r.placeOfBirth,
        photoUrl: r.photoUrl,
      }));

      const res = await bulkUpsertStudents(schoolId, studentsToImport, students);

      setImportStatusMessage(
        `Excel આયાત સફળ! ${res.added} નવા વિદ્યાર્થીઓ ઉમેરાયા અને ${res.updated} જૂના વિદ્યાર્થીઓના રેકોર્ડ્સ અપડેટ થયા.`
      );
      setPreviewModalOpen(false);
      onRefresh();
      setTimeout(() => setImportStatusMessage(null), 7000);
    } catch (err: any) {
      alert(err.message || 'વિદ્યાર્થીઓ આયાત કરવામાં ભૂલ આવી.');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="glass-card border border-white/10 rounded-2xl p-5 sm:p-6 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800/80 inline-flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                વિદ્યાર્થી માસ્ટર ઇન્ફોર્મેશન સિસ્ટમ
              </span>
              <span className="text-xs text-slate-400 font-mono">
                DISE: {school.diseCode || 'N/A'}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2.5">
              <Users className="w-6 h-6 text-terracotta shrink-0" />
              <span>વિદ્યાર્થી સંચાલન (Student Master Management)</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1">
              સંપૂર્ણ મૂળભૂત વિગતો, G.R. નંબર, ફોટો, Excel આયાત/નિકાસ તથા ડિજિટલ આઈડી કાર્ડ જનરેશન
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Generate ID Cards Button */}
            <button
              onClick={() => setIsIdCardModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-gradient-to-r from-amber-600 to-terracotta hover:from-amber-500 hover:to-terracotta-hover text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-terracotta/20 transition-all min-h-[44px]"
              title="Generate Student ID Cards"
            >
              <CreditCard className="w-4 h-4" />
              <span>આઈડી કાર્ડ પ્રિન્ટ ({selectedStudentIds.size > 0 ? selectedStudentIds.size : 'બધા'})</span>
            </button>

            {/* Download Excel Template */}
            <button
              onClick={() => downloadStudentTemplate(school.diseCode, school.schoolName)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs sm:text-sm font-medium transition-colors shadow-sm min-h-[44px]"
              title="Download Student Master Excel Template"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Excel ટેમ્પ્લેટ</span>
            </button>

            {/* Export to Excel */}
            <button
              onClick={() => exportStudentsExcel(students, school.schoolName, school.diseCode)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs sm:text-sm font-medium transition-colors shadow-sm min-h-[44px]"
              title="Export all students to Excel"
            >
              <FileSpreadsheet className="w-4 h-4 text-amber-400" />
              <span>ડેટા એક્સપોર્ટ</span>
            </button>

            {/* Upload Excel */}
            <label className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs sm:text-sm font-bold transition-colors shadow-sm cursor-pointer min-h-[44px]">
              {isParsingExcel ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              <span>Excel આયાત</span>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                disabled={isParsingExcel}
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    handleExcelFileSelected(e.target.files[0]);
                  }
                }}
              />
            </label>

            {/* Add Student Button */}
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-terracotta hover:bg-terracotta-hover text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-terracotta/20 transition-all min-h-[44px]"
            >
              <UserPlus className="w-4 h-4" />
              <span>નવો વિદ્યાર્થી ઉમેરો</span>
            </button>
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

      {/* Standard Counts Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'ધોરણ 9', key: '9', count: counts.std9, color: 'border-blue-500/40 text-blue-400' },
          { label: 'ધોરણ 10', key: '10', count: counts.std10, color: 'border-emerald-500/40 text-emerald-400' },
          { label: 'ધોરણ 11', key: '11', count: counts.std11, color: 'border-purple-500/40 text-purple-400' },
          { label: 'ધોરણ 12', key: '12', count: counts.std12, color: 'border-indigo-500/40 text-indigo-400' },
          { label: 'કુમાર / કન્યા', key: 'GENDER', count: `${counts.boys} / ${counts.girls}`, color: 'border-pink-500/40 text-pink-400', noFilter: true },
          { label: 'કુલ સંખ્યા', key: 'ALL', count: counts.total, color: 'border-amber-500/40 text-amber-400' },
        ].map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => {
              if (!item.noFilter) {
                setSelectedStandardFilter(selectedStandardFilter === item.key ? 'ALL' : item.key);
              }
            }}
            className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
              selectedStandardFilter === item.key
                ? 'bg-slate-800 border-terracotta ring-2 ring-terracotta/40'
                : 'bg-slate-900/60 border-white/5 hover:border-white/15'
            }`}
          >
            <div className="text-[11px] font-semibold text-slate-400 flex justify-between items-center">
              <span>{item.label}</span>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className={`text-2xl font-bold font-mono ${item.color.split(' ')[1]}`}>
                {item.count}
              </span>
              <span className="text-[10px] text-slate-500">વિદ્યાર્થીઓ</span>
            </div>
          </button>
        ))}
      </div>

      {/* Search & Comprehensive Filters Toolbar */}
      <div className="bg-slate-900/80 rounded-2xl border border-white/10 p-4 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
          {/* Search Box */}
          <div className="sm:col-span-4 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="નામ, GR નં, રોલ નં અથવા ફોનથી શોધો..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-9 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-terracotta min-h-[44px]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-3 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Standard Filter */}
          <div className="sm:col-span-2">
            <select
              value={selectedStandardFilter}
              onChange={(e) => setSelectedStandardFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-terracotta min-h-[44px]"
            >
              <option value="ALL">બધા ધોરણ (Std)</option>
              <option value="9">ધોરણ 9</option>
              <option value="10">ધોરણ 10</option>
              <option value="11">ધોરણ 11</option>
              <option value="12">ધોરણ 12</option>
            </select>
          </div>

          {/* Section Filter */}
          <div className="sm:col-span-2">
            <select
              value={selectedSectionFilter}
              onChange={(e) => setSelectedSectionFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-terracotta min-h-[44px]"
            >
              <option value="ALL">બધા વર્ગ (Section)</option>
              {availableSections.map((sec) => (
                <option key={sec} value={sec}>
                  વર્ગ {sec}
                </option>
              ))}
            </select>
          </div>

          {/* Gender Filter */}
          <div className="sm:col-span-2">
            <select
              value={selectedGenderFilter}
              onChange={(e) => setSelectedGenderFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-terracotta min-h-[44px]"
            >
              <option value="ALL">બધી જાતિ (Gender)</option>
              <option value="Boy">કુમાર (Boys)</option>
              <option value="Girl">કન્યા (Girls)</option>
              <option value="Other">અન્ય (Other)</option>
            </select>
          </div>

          {/* Blood Group Filter */}
          <div className="sm:col-span-2">
            <select
              value={selectedBloodFilter}
              onChange={(e) => setSelectedBloodFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-terracotta min-h-[44px]"
            >
              <option value="ALL">બ્લડ ગ્રૂપ (All)</option>
              {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map((bg) => (
                <option key={bg} value={bg}>
                  {bg}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Multi-selection Context Bar */}
        {selectedStudentIds.size > 0 && (
          <div className="flex items-center justify-between p-2.5 bg-terracotta/15 border border-terracotta/30 rounded-xl text-xs text-amber-200 animate-fadeIn flex-wrap gap-2">
            <div className="flex items-center gap-2 font-semibold">
              <CheckSquare className="w-4 h-4 text-terracotta" />
              <span>{selectedStudentIds.size} વિદ્યાર્થીઓ પસંદ કર્યા છે</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const targetList = students.filter((s) => selectedStudentIds.has(s.id));
                  handleGenerateIdCards(targetList);
                }}
                className="px-3 py-1.5 rounded-lg bg-terracotta hover:bg-terracotta-hover text-white font-bold flex items-center gap-1.5 shadow-sm"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>પસંદ કરેલ આઈડી કાર્ડ પ્રિન્ટ</span>
              </button>

              <button
                onClick={() => setSelectedStudentIds(new Set())}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium"
              >
                પસંદગી રદ કરો
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Student List Table / Card View */}
      <div className="bg-slate-900/90 rounded-2xl border border-white/10 overflow-hidden shadow-xl">
        {filteredStudents.length === 0 ? (
          <div className="p-12 text-center">
            <GraduationCap className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-white">કોઈ વિદ્યાર્થી મળ્યા નથી</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              શોધ અથવા પસંદ કરેલા ફિલ્ટર્સ અનુસાર કોઈ પરિણામ નથી. ફિલ્ટર્સ રીસેટ કરો અથવા નવો વિદ્યાર્થી ઉમેરો.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedStandardFilter('ALL');
                setSelectedSectionFilter('ALL');
                setSelectedGenderFilter('ALL');
                setSelectedBloodFilter('ALL');
              }}
              className="mt-4 px-4 py-2 rounded-xl bg-slate-800 text-terracotta text-xs font-semibold hover:bg-slate-700"
            >
              બધા ફિલ્ટર્સ સાફ કરો
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm text-slate-200">
              <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-semibold border-b border-white/10 text-[11px]">
                <tr>
                  <th className="px-4 py-3.5 w-10 text-center">
                    <button
                      type="button"
                      onClick={handleToggleSelectAll}
                      className="text-slate-400 hover:text-white"
                      title="Select / Deselect all"
                    >
                      {selectedStudentIds.size === filteredStudents.length && filteredStudents.length > 0 ? (
                        <CheckSquare className="w-4 h-4 text-terracotta" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </th>
                  <th className="px-4 py-3.5 w-12 text-center">ફોટો</th>
                  <th className="px-4 py-3.5">વિદ્યાર્થીનું નામ (Name as in GR)</th>
                  <th className="px-4 py-3.5">G.R. નં</th>
                  <th className="px-4 py-3.5">ધોરણ & વર્ગ</th>
                  <th className="px-4 py-3.5">રોલ નં</th>
                  <th className="px-4 py-3.5">જન્મ તારીખ (DOB)</th>
                  <th className="px-4 py-3.5">બ્લડ ગ્રૂપ</th>
                  <th className="px-4 py-3.5">મોબાઈલ</th>
                  <th className="px-4 py-3.5 text-right">ક્રિયાઓ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredStudents.map((st, idx) => {
                  const isSelected = selectedStudentIds.has(st.id);
                  const stdClean = String(st.standard).replace(/^class\s*/i, '').trim();

                  return (
                    <tr
                      key={st.id}
                      className={`hover:bg-slate-850/60 transition-colors ${
                        isSelected ? 'bg-terracotta/10' : ''
                      }`}
                    >
                      {/* Selection Checkbox */}
                      <td className="px-4 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleSelectStudent(st.id)}
                          className="text-slate-400 hover:text-white"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-terracotta" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>

                      {/* Photo Avatar */}
                      <td className="px-4 py-3 text-center">
                        <div
                          onClick={() => setViewingProfileStudent(st)}
                          className="w-9 h-11 rounded-lg border border-slate-700 bg-slate-950 overflow-hidden flex items-center justify-center cursor-pointer shadow-sm mx-auto hover:border-terracotta transition-colors"
                          title="Click to view profile"
                        >
                          {st.photoUrl ? (
                            <img src={st.photoUrl} alt={st.studentName} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-xs font-bold text-slate-500">
                              {(st.studentName || 'S').trim().charAt(0)}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Student Name */}
                      <td className="px-4 py-3">
                        <div
                          onClick={() => setViewingProfileStudent(st)}
                          className="font-bold text-white hover:text-amber-300 cursor-pointer flex items-center gap-1.5 transition-colors"
                        >
                          <span>{st.studentName}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {st.fatherName ? `વાલી: ${st.fatherName}` : st.address ? `સરનામું: ${st.address}` : ''}
                        </div>
                      </td>

                      {/* GR Number */}
                      <td className="px-4 py-3 font-mono font-bold text-amber-300 text-xs">
                        {st.grNumber ? (
                          <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800">
                            {st.grNumber}
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>

                      {/* Standard & Section */}
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-slate-800 border border-slate-700 text-slate-200">
                          ધોરણ {stdClean} {st.section || st.division ? `(${st.section || st.division})` : ''}
                        </span>
                      </td>

                      {/* Roll Number */}
                      <td className="px-4 py-3 font-mono text-xs text-slate-300">
                        {st.rollNumber || '-'}
                      </td>

                      {/* DOB */}
                      <td className="px-4 py-3 text-xs text-slate-300 font-mono">
                        {st.dob || '-'}
                      </td>

                      {/* Blood Group */}
                      <td className="px-4 py-3">
                        {st.bloodGroup ? (
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-red-950/60 border border-red-800/60 text-red-300">
                            {st.bloodGroup}
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>

                      {/* Contact Mobile */}
                      <td className="px-4 py-3 font-mono text-xs text-emerald-400">
                        {st.contactNumber || st.mobileNumber || '-'}
                      </td>

                      {/* Action buttons */}
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View Profile */}
                          <button
                            type="button"
                            onClick={() => setViewingProfileStudent(st)}
                            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                            title="View Full Profile"
                          >
                            <Eye className="w-4 h-4 text-emerald-400" />
                          </button>

                          {/* Print Single ID Card */}
                          <button
                            type="button"
                            onClick={() => printStudentIdCards(school, [st])}
                            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                            title="Generate ID Card"
                          >
                            <CreditCard className="w-4 h-4 text-amber-400" />
                          </button>

                          {/* Quick Edit */}
                          <button
                            type="button"
                            onClick={() => {
                              setEditingStudent(st);
                              setEditForm({
                                studentName: st.studentName,
                                standard: st.standard,
                                grNumber: st.grNumber,
                                section: st.section || st.division,
                                rollNumber: st.rollNumber,
                                dob: st.dob,
                                bloodGroup: st.bloodGroup,
                                contactNumber: st.contactNumber || st.mobileNumber,
                              });
                            }}
                            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                            title="Quick Edit"
                          >
                            <Edit3 className="w-4 h-4 text-blue-400" />
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => setDeletingStudent(st)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-950/40 transition-colors"
                            title="Delete Student"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL 1: ADD STUDENT MODAL (Complete Master Information) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-white/10 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[92vh] overflow-y-auto text-white flex flex-col animate-fadeIn my-auto">
            {/* Header */}
            <div className="sticky top-0 z-10 px-6 py-4 bg-slate-900/95 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-terracotta flex items-center justify-center text-white">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">નવો વિદ્યાર્થી ઉમેરો (New Student Master Record)</h3>
                  <p className="text-xs text-slate-400">વિદ્યાર્થી માસ્ટર ઇન્ફોર્મેશન રેકોર્ડ અને આઈડી કાર્ડ ડેટા</p>
                </div>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Form */}
            <form onSubmit={handleSubmitAddStudent} className="p-6 space-y-6">
              {addError && (
                <div className="p-3 bg-red-950/70 border border-red-800 rounded-xl text-xs text-red-200 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                  <span>{addError}</span>
                </div>
              )}
              {addSuccess && (
                <div className="p-3 bg-emerald-950/70 border border-emerald-800 rounded-xl text-xs text-emerald-200 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>{addSuccess}</span>
                </div>
              )}

              {/* Photo & Basic Identity */}
              <div className="bg-slate-800/50 p-4 rounded-xl border border-white/5 flex flex-col sm:flex-row items-center gap-5">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-24 h-30 rounded-lg border-2 border-dashed border-slate-600 bg-slate-950 overflow-hidden flex items-center justify-center">
                    {addForm.photoUrl ? (
                      <img src={addForm.photoUrl} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <Camera className="w-8 h-8 text-slate-600" />
                    )}
                  </div>
                  <input
                    type="file"
                    ref={addPhotoInputRef}
                    onChange={handleAddPhotoSelect}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => addPhotoInputRef.current?.click()}
                    className="text-[11px] px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
                  >
                    {addForm.photoUrl ? 'ફોટો બદલો' : 'ફોટો પસંદ કરો'}
                  </button>
                </div>

                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      વિદ્યાર્થીનું નામ (Name as in GR) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="દા.ત. પટેલ આરવ રમેશચંદ્ર"
                      value={addForm.studentName}
                      onChange={(e) => setAddForm({ ...addForm, studentName: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-terracotta"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      G.R. નંબર (GR No.)
                    </label>
                    <input
                      type="text"
                      placeholder="દા.ત. 1042"
                      value={addForm.grNumber}
                      onChange={(e) => setAddForm({ ...addForm, grNumber: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-terracotta font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      શાળા DISE કોડ
                    </label>
                    <input
                      type="text"
                      value={addForm.diseCode}
                      onChange={(e) => setAddForm({ ...addForm, diseCode: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-terracotta font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Academic & Personal Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    ધોરણ (Standard) *
                  </label>
                  <select
                    value={addForm.standard}
                    onChange={(e) => setAddForm({ ...addForm, standard: e.target.value as AllowedStandard })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-terracotta"
                  >
                    <option value="9">ધોરણ 9</option>
                    <option value="10">ધોરણ 10</option>
                    <option value="11">ધોરણ 11</option>
                    <option value="12">ધોરણ 12</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    વર્ગ / સેક્શન (Section)
                  </label>
                  <input
                    type="text"
                    placeholder="A, B, C..."
                    value={addForm.section}
                    onChange={(e) => setAddForm({ ...addForm, section: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-terracotta"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    રોલ નંબર (Roll No.)
                  </label>
                  <input
                    type="text"
                    placeholder="દા.ત. 15"
                    value={addForm.rollNumber}
                    onChange={(e) => setAddForm({ ...addForm, rollNumber: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-terracotta font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    જન્મ તારીખ (DOB)
                  </label>
                  <input
                    type="date"
                    value={addForm.dob}
                    onChange={(e) => setAddForm({ ...addForm, dob: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-terracotta"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    જાતિ (Gender)
                  </label>
                  <select
                    value={addForm.gender}
                    onChange={(e) => setAddForm({ ...addForm, gender: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-terracotta"
                  >
                    <option value="Boy">કુમાર (Boy)</option>
                    <option value="Girl">કન્યા (Girl)</option>
                    <option value="Other">અન્ય (Other)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    બ્લડ ગ્રૂપ (Blood Group)
                  </label>
                  <select
                    value={addForm.bloodGroup}
                    onChange={(e) => setAddForm({ ...addForm, bloodGroup: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-terracotta"
                  >
                    <option value="">પસંદ કરો</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>
              </div>

              {/* Family & Contact */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    પિતાનું નામ (Father Name)
                  </label>
                  <input
                    type="text"
                    value={addForm.fatherName}
                    onChange={(e) => setAddForm({ ...addForm, fatherName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-terracotta"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    માતાનું નામ (Mother Name)
                  </label>
                  <input
                    type="text"
                    value={addForm.motherName}
                    onChange={(e) => setAddForm({ ...addForm, motherName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-terracotta"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    મોબાઈલ નંબર (Parent Contact)
                  </label>
                  <input
                    type="tel"
                    placeholder="10 અંકનો મોબાઈલ"
                    value={addForm.contactNumber}
                    onChange={(e) => setAddForm({ ...addForm, contactNumber: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-terracotta font-mono"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    રહેઠાણનું સરનામું (Address)
                  </label>
                  <input
                    type="text"
                    placeholder="ગામ, સોસાયટી, તાલુકો, જિલ્લો..."
                    value={addForm.address}
                    onChange={(e) => setAddForm({ ...addForm, address: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-terracotta"
                  />
                </div>
              </div>

              {/* Bottom Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  રદ કરો
                </button>
                <button
                  type="submit"
                  disabled={addSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-terracotta hover:bg-terracotta-hover text-white text-xs font-bold shadow-lg shadow-terracotta/20 flex items-center gap-2"
                >
                  {addSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                  <span>વિદ્યાર્થી ઉમેરો (Save Record)</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ID CARD GENERATION MODAL */}
      {isIdCardModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-white/10 rounded-2xl shadow-2xl max-w-lg w-full p-6 text-white animate-fadeIn">
            <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-terracotta flex items-center justify-center text-white">
                  <CreditCard className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold">વિદ્યાર્થી ઓળખપત્ર (Student ID Cards) જનરેટ કરો</h3>
              </div>
              <button onClick={() => setIsIdCardModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs sm:text-sm">
              <p className="text-slate-300">
                આઈડી કાર્ડ પ્રોફેશનલ લેઆઉટમાં A4 સાઈઝ પર યોગ્ય માર્જિન અને Anek Gujarati ફોન્ટ સાથે પ્રિન્ટ થશે.
              </p>

              {/* Option 1: Selected students */}
              {selectedStudentIds.size > 0 && (
                <div className="p-3.5 rounded-xl bg-terracotta/15 border border-terracotta/30 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-white">પસંદ કરેલા વિદ્યાર્થીઓ ({selectedStudentIds.size})</div>
                    <div className="text-[11px] text-slate-400">ટેબલમાંથી પસંદ કરેલા વિદ્યાર્થીઓના આઈડી કાર્ડ</div>
                  </div>
                  <button
                    onClick={() => {
                      const target = students.filter((s) => selectedStudentIds.has(s.id));
                      handleGenerateIdCards(target);
                      setIsIdCardModalOpen(false);
                    }}
                    className="px-3.5 py-2 rounded-lg bg-terracotta hover:bg-terracotta-hover text-white font-bold"
                  >
                    પ્રિન્ટ કરો
                  </button>
                </div>
              )}

              {/* Option 2: Standard-wise generation */}
              <div className="bg-slate-800/60 p-4 rounded-xl border border-white/5 space-y-3">
                <label className="block font-semibold text-slate-200">
                  ધોરણ અનુસાર આઈડી કાર્ડ જનરેટ કરો:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { std: 'ALL', label: 'બધા વિદ્યાર્થીઓ', count: students.length },
                    { std: '9', label: 'ધોરણ 9 ના બધા', count: counts.std9 },
                    { std: '10', label: 'ધોરણ 10 ના બધા', count: counts.std10 },
                    { std: '11', label: 'ધોરણ 11 ના બધા', count: counts.std11 },
                    { std: '12', label: 'ધોરણ 12 ના બધા', count: counts.std12 },
                  ].map((opt) => (
                    <button
                      key={opt.std}
                      type="button"
                      onClick={() => {
                        const target =
                          opt.std === 'ALL'
                            ? students
                            : students.filter((s) => String(s.standard).replace(/^class\s*/i, '').trim() === opt.std);
                        handleGenerateIdCards(target);
                        setIsIdCardModalOpen(false);
                      }}
                      className="p-2.5 rounded-lg bg-slate-900 border border-slate-700 hover:border-terracotta text-left flex justify-between items-center transition-colors"
                    >
                      <span className="font-bold text-white">{opt.label}</span>
                      <span className="text-[11px] font-mono text-amber-300">({opt.count})</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-white/10 flex justify-end">
              <button
                onClick={() => setIsIdCardModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
              >
                બંધ કરો
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: EXCEL IMPORT PREVIEW */}
      {previewModalOpen && parseResult && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-3 sm:p-4 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col text-white my-auto animate-fadeIn">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-700/80 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-base sm:text-lg font-bold flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                  <span>Excel આયાત પૂર્વાવલોકન (Student Master Preview)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                  ફાઇલ: {excelFile?.name} • કુલ {parseResult.totalRows} પંક્તિઓ મળી
                </p>
              </div>
              <button onClick={() => setPreviewModalOpen(false)} className="text-slate-400 hover:text-white p-2 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Summary Statistics */}
            <div className="p-4 bg-slate-850 border-b border-slate-800 grid grid-cols-4 gap-2 text-center text-xs">
              <div className="bg-emerald-950/60 border border-emerald-800/80 rounded-xl p-2.5">
                <div className="text-emerald-400 font-bold text-lg font-mono">
                  {parseResult.validRows.length - parseResult.existingUpdateRows.length}
                </div>
                <div className="text-emerald-300 text-[11px] font-medium">નવા વિદ્યાર્થીઓ</div>
              </div>

              <div className="bg-blue-950/60 border border-blue-800/80 rounded-xl p-2.5">
                <div className="text-blue-400 font-bold text-lg font-mono">
                  {parseResult.existingUpdateRows.length}
                </div>
                <div className="text-blue-300 text-[11px] font-medium">અપડેટ થશે (Preserve ID)</div>
              </div>

              <div className="bg-amber-950/60 border border-amber-800/80 rounded-xl p-2.5">
                <div className="text-amber-400 font-bold text-lg font-mono">
                  {parseResult.duplicateInFileRows.length}
                </div>
                <div className="text-amber-300 text-[11px] font-medium">ફાઈલમાં ડુપ્લિકેટ</div>
              </div>

              <div className="bg-red-950/60 border border-red-800/80 rounded-xl p-2.5">
                <div className="text-red-400 font-bold text-lg font-mono">
                  {parseResult.invalidRows.length}
                </div>
                <div className="text-red-300 text-[11px] font-medium">અમાન્ય પંક્તિઓ</div>
              </div>
            </div>

            {/* Tab selection */}
            <div className="flex border-b border-slate-800 px-4 pt-2 gap-2 text-xs">
              {[
                { id: 'all', label: `બધા (${parseResult.allRows.length})` },
                { id: 'valid', label: `માન્ય / નવા (${parseResult.validRows.length})` },
                { id: 'updates', label: `અપડેટ થનાર (${parseResult.existingUpdateRows.length})` },
                { id: 'invalid', label: `ક્ષતિવાળી (${parseResult.invalidRows.length + parseResult.duplicateInFileRows.length})` },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setPreviewFilterTab(tab.id as any)}
                  className={`px-3 py-2 border-b-2 font-medium transition-colors ${
                    previewFilterTab === tab.id
                      ? 'border-terracotta text-amber-300'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Rows Table */}
            <div className="flex-1 overflow-y-auto p-4 max-h-80">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] sticky top-0">
                  <tr>
                    <th className="p-2 w-12">રો નં</th>
                    <th className="p-2">નામ</th>
                    <th className="p-2">ધોરણ</th>
                    <th className="p-2">G.R. નં</th>
                    <th className="p-2">સ્થિતિ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {parseResult.allRows
                    .filter((r) => {
                      if (previewFilterTab === 'valid') return r.isValid;
                      if (previewFilterTab === 'updates') return r.isExistingUpdate;
                      if (previewFilterTab === 'invalid') return !r.isValid;
                      return true;
                    })
                    .map((r) => (
                      <tr key={r.rowNumber} className="hover:bg-slate-800/40">
                        <td className="p-2 font-mono text-slate-400">#{r.rowNumber}</td>
                        <td className="p-2 font-semibold text-white">{r.name || '(ખાલી)'}</td>
                        <td className="p-2">ધોરણ {r.standard}</td>
                        <td className="p-2 font-mono">{r.grNumber || '-'}</td>
                        <td className="p-2">
                          {r.isValid ? (
                            r.isExistingUpdate ? (
                              <span className="text-[11px] px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">
                                અસ્તિત્વમાં છે (અપડેટ થશે)
                              </span>
                            ) : (
                              <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                                માન્ય (નવો ઉમેરાશે)
                              </span>
                            )
                          ) : (
                            <span className="text-[11px] px-2 py-0.5 rounded bg-red-950 text-red-300 border border-red-800">
                              {r.errorReason}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            {/* Bottom Actions */}
            <div className="p-4 border-t border-slate-800 flex items-center justify-between">
              <button
                onClick={() => setPreviewModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
              >
                રદ કરો
              </button>

              <button
                disabled={isImporting || parseResult.validRows.length === 0}
                onClick={handleExecuteImport}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 disabled:opacity-50"
              >
                {isImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                <span>આયાત પૂર્ણ કરો ({parseResult.validRows.length} માન્ય રેકોર્ડ્સ)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: QUICK EDIT MODAL */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-md w-full p-5 text-white animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3 mb-4">
              <h3 className="text-base font-bold flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-blue-400" />
                <span>ઝડપી સુધારો (Quick Edit)</span>
              </h3>
              <button onClick={() => setEditingStudent(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {editError && (
              <div className="mb-3 p-2.5 bg-red-950/70 border border-red-800 rounded-lg text-xs text-red-200">
                {editError}
              </div>
            )}

            <form onSubmit={handleSaveQuickEdit} className="space-y-3 text-xs sm:text-sm">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">વિદ્યાર્થીનું નામ (Name as in GR) *</label>
                <input
                  type="text"
                  required
                  value={editForm.studentName || ''}
                  onChange={(e) => setEditForm({ ...editForm, studentName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-terracotta"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">ધોરણ (Standard) *</label>
                  <select
                    value={String(editForm.standard || '9')}
                    onChange={(e) => setEditForm({ ...editForm, standard: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-terracotta"
                  >
                    <option value="9">ધોરણ 9</option>
                    <option value="10">ધોરણ 10</option>
                    <option value="11">ધોરણ 11</option>
                    <option value="12">ધોરણ 12</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">G.R. નંબર</label>
                  <input
                    type="text"
                    value={editForm.grNumber || ''}
                    onChange={(e) => setEditForm({ ...editForm, grNumber: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-terracotta font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">વર્ગ / સેક્શન</label>
                  <input
                    type="text"
                    value={editForm.section || ''}
                    onChange={(e) => setEditForm({ ...editForm, section: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-terracotta"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">રોલ નંબર</label>
                  <input
                    type="text"
                    value={editForm.rollNumber || ''}
                    onChange={(e) => setEditForm({ ...editForm, rollNumber: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-terracotta font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">સંપર્ક / Mobile</label>
                <input
                  type="tel"
                  value={editForm.contactNumber || ''}
                  onChange={(e) => setEditForm({ ...editForm, contactNumber: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-terracotta font-mono"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  રદ કરો
                </button>
                <button
                  type="submit"
                  disabled={editSubmitting}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold"
                >
                  {editSubmitting ? 'સાચવી રહ્યું છે...' : 'સાચવો'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: DELETE CONFIRMATION MODAL */}
      {deletingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-red-900/60 rounded-2xl shadow-2xl max-w-sm w-full p-5 text-white animate-fadeIn">
            <div className="w-12 h-12 rounded-2xl bg-red-950/80 border border-red-800 text-red-400 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-center">વિદ્યાર્થીને કાઢી નાખવાની પુષ્ટિ</h3>
            <p className="text-xs text-slate-300 text-center mt-2 leading-relaxed">
              શું તમે ખરેખર ધોરણ {String(deletingStudent.standard).replace(/^class\s*/i, '')} ના વિદ્યાર્થી{' '}
              <strong className="text-white">&ldquo;{deletingStudent.studentName}&rdquo;</strong> ને શાળા રેકોર્ડમાંથી કાયમ માટે કાઢી નાખવા માંગો છો?
            </p>

            <div className="mt-5 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setDeletingStudent(null)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
              >
                રદ કરો
              </button>
              <button
                type="button"
                disabled={deleteSubmitting}
                onClick={handleConfirmDelete}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold flex items-center justify-center gap-1.5"
              >
                {deleteSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                <span>હા, કાઢી નાખો</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 6: COMPLETE STUDENT PROFILE VIEW & EDITOR MODAL */}
      {viewingProfileStudent && (
        <StudentProfileModal
          student={viewingProfileStudent}
          school={school}
          isOpen={true}
          onClose={() => setViewingProfileStudent(null)}
          onStudentUpdated={(updated) => {
            setViewingProfileStudent(updated);
            onRefresh();
          }}
          onGenerateIdCard={(st) => {
            printStudentIdCards(school, [st]);
          }}
        />
      )}
    </div>
  );
};
