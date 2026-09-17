import React, { useState } from 'react';
import { School, Student, Staff, AllowedStandard } from '../types';
import {
  CreditCard,
  Printer,
  Users,
  UserCheck,
  ArrowLeft,
  Filter,
  CheckSquare,
  Square,
  QrCode,
} from 'lucide-react';

interface IdCardsManagerProps {
  school: School;
  students: Student[];
  staffList: Staff[];
  onBack: () => void;
}

export const IdCardsManager: React.FC<IdCardsManagerProps> = ({
  school,
  students,
  staffList,
  onBack,
}) => {
  const [cardType, setCardType] = useState<'students' | 'staff'>('students');
  const [selectedStandard, setSelectedStandard] = useState<string>('ALL');
  const [selectedDivision, setSelectedDivision] = useState<string>('ALL');
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());
  const [selectedStaffIds, setSelectedStaffIds] = useState<Set<string>>(new Set());

  // Filter students
  const filteredStudents = students.filter((st) => {
    const matchStd = selectedStandard === 'ALL' || String(st.standard) === String(selectedStandard);
    const matchDiv = selectedDivision === 'ALL' || (st.division && st.division === selectedDivision);
    return matchStd && matchDiv;
  });

  // Select all / Deselect all
  const toggleSelectAllStudents = () => {
    if (selectedStudentIds.size === filteredStudents.length) {
      setSelectedStudentIds(new Set());
    } else {
      setSelectedStudentIds(new Set(filteredStudents.map((s) => s.id)));
    }
  };

  const toggleStudent = (id: string) => {
    const next = new Set(selectedStudentIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedStudentIds(next);
  };

  const toggleSelectAllStaff = () => {
    if (selectedStaffIds.size === staffList.length) {
      setSelectedStaffIds(new Set());
    } else {
      setSelectedStaffIds(new Set(staffList.map((s) => s.id)));
    }
  };

  const toggleStaff = (id: string) => {
    const next = new Set(selectedStaffIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedStaffIds(next);
  };

  // Cards to print
  const studentsToPrint = filteredStudents.filter(
    (s) => selectedStudentIds.size === 0 || selectedStudentIds.has(s.id)
  );

  const staffToPrint = staffList.filter(
    (s) => selectedStaffIds.size === 0 || selectedStaffIds.has(s.id)
  );

  // Dynamic font sizing helpers to ensure long names never cut or wrap
  const getNamePrintStyle = (name: string, basePt: number = 10.5) => {
    const len = (name || '').trim().length;
    if (len <= 16) return `font-size: ${basePt}pt; font-weight: 900;`;
    if (len <= 21) return `font-size: ${(basePt * 0.90).toFixed(2)}pt; font-weight: 900; letter-spacing: -0.1px;`;
    if (len <= 26) return `font-size: ${(basePt * 0.82).toFixed(2)}pt; font-weight: 800; letter-spacing: -0.15px;`;
    if (len <= 32) return `font-size: ${(basePt * 0.74).toFixed(2)}pt; font-weight: 800; letter-spacing: -0.2px;`;
    if (len <= 38) return `font-size: ${(basePt * 0.67).toFixed(2)}pt; font-weight: 800; letter-spacing: -0.25px;`;
    return `font-size: ${(basePt * 0.60).toFixed(2)}pt; font-weight: 800; letter-spacing: -0.35px;`;
  };

  const getSchoolTitlePrintStyle = (name: string) => {
    const len = (name || '').trim().length;
    if (len <= 20) return 'font-size: 11pt; font-weight: 800; letter-spacing: 0.2px;';
    if (len <= 28) return 'font-size: 9.8pt; font-weight: 800; letter-spacing: 0.1px;';
    if (len <= 36) return 'font-size: 8.8pt; font-weight: 800; letter-spacing: 0px;';
    if (len <= 46) return 'font-size: 8.0pt; font-weight: 800; letter-spacing: -0.15px;';
    if (len <= 56) return 'font-size: 7.2pt; font-weight: 700; letter-spacing: -0.25px;';
    return 'font-size: 6.5pt; font-weight: 700; letter-spacing: -0.35px;';
  };

  const getPreviewNameFontSize = (name: string) => {
    const len = (name || '').trim().length;
    if (len <= 16) return 'text-sm font-black text-amber-200';
    if (len <= 22) return 'text-[13px] font-extrabold text-amber-200';
    if (len <= 28) return 'text-xs font-bold text-amber-200';
    if (len <= 34) return 'text-[11px] font-bold text-amber-200';
    return 'text-[10px] font-bold text-amber-200';
  };

  // Trigger Print with A4 Card Layout
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to print ID cards.');
      return;
    }

    const cardsHtml =
      cardType === 'students'
        ? studentsToPrint
            .map(
              (st) => `
          <div class="id-card">
            <div class="card-header">
              <div class="school-title" style="${getSchoolTitlePrintStyle(school.schoolName)}">${school.schoolName}</div>
              <div class="school-sub">${school.district} • DISE: ${school.diseCode}</div>
              <div class="badge-tag">વિદ્યાર્થી ઓળખપત્ર (STUDENT ID)</div>
            </div>
            <div class="card-body">
              <div class="photo-box">
                ${
                  st.photoUrl
                    ? `<img src="${st.photoUrl}" style="width:100%;height:100%;object-fit:cover;display:block;" />`
                    : `<div class="avatar-initial">${st.studentName.charAt(0) || 'S'}</div>
                       <div class="photo-caption">PHOTO</div>`
                }
              </div>
              <div class="details-box">
                <div class="name-field" style="${getNamePrintStyle(st.studentName, 10.5)}" title="${st.studentName}">${st.studentName}</div>
                <div class="field-row">
                  <span class="lbl">ધોરણ:</span>
                  <span class="val font-bold">${st.standard} ${st.section || st.division ? `(${st.section || st.division})` : ''}</span>
                  <span class="lbl" style="margin-left: 6px;">રોલ:</span>
                  <span class="val">${st.rollNumber || '-'}</span>
                </div>
                <div class="field-row">
                  <span class="lbl">G.R. નં:</span>
                  <span class="val font-bold">${st.grNumber || '-'}</span>
                  <span class="lbl" style="margin-left: 6px;">બ્લડ:</span>
                  <span class="val font-bold text-red">${st.bloodGroup || '-'}</span>
                </div>
                <div class="field-row">
                  <span class="lbl">જન્મ:</span>
                  <span class="val" style="font-size:6.3pt;">${st.dob || '-'}</span>
                  <span class="lbl" style="margin-left: 4px;">પ્રવેશ:</span>
                  <span class="val val-doa" style="color:#0284c7;font-weight:700;font-size:6.2pt;letter-spacing:-0.2px;white-space:nowrap;">${st.doa || '-'}</span>
                </div>
                <div class="field-row">
                  <span class="lbl">સંપર્ક:</span>
                  <span class="val">${st.contactNumber || '-'}</span>
                </div>
              </div>
            </div>
            <div class="card-footer">
              <div class="validity">શૈક્ષણિક વર્ષ ૨૦૨૬–૨૭</div>
              <div class="sig-box">
                <div class="sig-line">આચાર્યશ્રી સહી</div>
              </div>
            </div>
          </div>
        `
            )
            .join('')
        : staffToPrint
            .map(
              (stf) => `
          <div class="id-card staff-card">
            <div class="card-header staff-header">
              <div class="school-title" style="${getSchoolTitlePrintStyle(school.schoolName)}">${school.schoolName}</div>
              <div class="school-sub">${school.district} • DISE: ${school.diseCode}</div>
              <div class="badge-tag staff-tag">સ્ટાફ ઓળખપત્ર (STAFF ID)</div>
            </div>
            <div class="card-body">
              <div class="photo-box">
                <div class="avatar-initial staff-initial">${stf.fullName.charAt(0) || 'T'}</div>
                <div class="photo-caption">PHOTO</div>
              </div>
              <div class="details-box">
                <div class="name-field" style="${getNamePrintStyle(stf.fullName, 10.5)}" title="${stf.fullName}">${stf.fullName}</div>
                <div class="field-row">
                  <span class="lbl">હોદ્દો:</span>
                  <span class="val font-bold">${stf.designation}</span>
                </div>
                <div class="field-row">
                  <span class="lbl">વિષય:</span>
                  <span class="val">${stf.subject || '-'}</span>
                </div>
                <div class="field-row">
                  <span class="lbl">લાયકાત:</span>
                  <span class="val">${stf.qualification || '-'}</span>
                </div>
                <div class="field-row">
                  <span class="lbl">મોબાઈલ:</span>
                  <span class="val">${stf.mobile || '-'}</span>
                  <span class="lbl" style="margin-left: 6px;">બ્લડ:</span>
                  <span class="val">${stf.bloodGroup || '-'}</span>
                </div>
              </div>
            </div>
            <div class="card-footer">
              <div class="validity">શાળા સ્ટાફ રેકોર્ડ</div>
              <div class="sig-box">
                <div class="sig-line">આચાર્યશ્રી સહી</div>
              </div>
            </div>
          </div>
        `
            )
            .join('');

    const html = `
      <!DOCTYPE html>
      <html lang="gu">
      <head>
        <meta charset="UTF-8">
        <title>${school.schoolName} - ID Cards Print</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Anek+Gujarati:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@400;600;700&display=swap" rel="stylesheet">
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Anek+Gujarati:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@400;600;700&display=swap');
          
          @page {
            size: A4 portrait;
            margin: 10mm;
          }
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          body {
            font-family: 'Anek Gujarati', 'Plus Jakarta Sans', system-ui, sans-serif;
            background: #fff;
            color: #0f172a;
            margin: 0;
            padding: 10px;
          }
          .grid-container {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 12mm 8mm;
            page-break-inside: auto;
          }
          .id-card {
            border: 1.5px solid #0f172a;
            border-radius: 10px;
            overflow: hidden;
            width: 86mm;
            height: 54mm;
            margin: 0 auto;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            page-break-inside: avoid;
            background: #ffffff;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          }
          .card-header {
            background: #1e3a8a;
            color: white;
            padding: 4px 6px;
            text-align: center;
          }
          .school-title {
            font-size: 9pt;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.2px;
            line-height: 1.2;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: clip;
          }
          .school-sub {
            font-size: 6.5pt;
            opacity: 0.9;
            margin-top: 1px;
          }
          .badge-tag {
            display: inline-block;
            background: #fbbf24;
            color: #0f172a;
            font-size: 6pt;
            font-weight: 800;
            padding: 1px 6px;
            border-radius: 10px;
            margin-top: 2px;
          }
          .staff-header {
            background: #78350f !important;
          }
          .staff-tag {
            background: #fde68a !important;
          }
          .card-body {
            padding: 5px 8px;
            display: flex;
            gap: 7px;
            flex: 1;
            align-items: center;
          }
          .photo-box {
            width: 22mm;
            height: 27mm;
            border: 1px dashed #64748b;
            border-radius: 6px;
            background: #f8fafc;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
          }
          .avatar-initial {
            font-size: 14pt;
            font-weight: 800;
            color: #1e3a8a;
          }
          .staff-initial {
            color: #78350f !important;
          }
          .photo-caption {
            font-size: 5.5pt;
            color: #94a3b8;
            margin-top: 2px;
          }
          .details-box {
            flex: 1;
            overflow: hidden;
          }
          .name-field {
            font-size: 10.5pt;
            font-weight: 900;
            color: #0f172a;
            background: #f8fafc;
            border-left: 3px solid #e27d4e;
            border-bottom: 1px solid #cbd5e1;
            padding: 1.5px 4px;
            margin-bottom: 3.5px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: clip;
            line-height: 1.2;
            border-radius: 0 3px 3px 0;
          }
          .field-row {
            font-size: 6.8pt;
            line-height: 1.45;
            display: flex;
            align-items: center;
            color: #334155;
            white-space: nowrap;
          }
          .field-row .lbl {
            color: #64748b;
            margin-right: 3px;
            font-weight: 600;
            white-space: nowrap;
            flex-shrink: 0;
          }
          .field-row .val {
            color: #0f172a;
            white-space: nowrap;
            flex-shrink: 0;
          }
          .field-row .val.val-doa {
            white-space: nowrap;
            letter-spacing: -0.2px;
          }
          .font-bold {
            font-weight: 700;
          }
          .text-red {
            color: #dc2626 !important;
          }
          .card-footer {
            background: #f1f5f9;
            border-top: 1px solid #cbd5e1;
            padding: 3px 8px;
            display: flex;
            align-items: flex-end;
            justify-content: space-between;
          }
          .validity {
            font-size: 5.8pt;
            color: #475569;
            font-weight: 600;
          }
          .sig-box {
            text-align: center;
          }
          .sig-line {
            border-top: 1px solid #475569;
            font-size: 5.8pt;
            font-weight: 700;
            color: #1e293b;
            padding-top: 1px;
            width: 25mm;
          }
          @media print {
            .no-print {
              display: none !important;
            }
          }
        </style>
      </head>
      <body>
        <div class="no-print" style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px; margin-bottom: 15px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <strong style="color: #0f172a;">A4 ID Card Grid Print</strong>
            <span style="color: #64748b; font-size: 12px; margin-left: 10px;">(8 cards per A4 page • Standard Badge Dimensions)</span>
          </div>
          <div>
            <button onclick="window.print()" style="background: #059669; color: white; border: none; padding: 8px 18px; border-radius: 6px; font-weight: bold; cursor: pointer; margin-right: 8px;">
              🖨️ Print ID Cards
            </button>
            <button onclick="window.close()" style="background: #64748b; color: white; border: none; padding: 8px 14px; border-radius: 6px; cursor: pointer;">
              Close
            </button>
          </div>
        </div>

        <div class="grid-container">
          ${cardsHtml}
        </div>

        <script>
          function fitNames() {
            var nameEls = document.querySelectorAll('.name-field');
            nameEls.forEach(function(el) {
              var parent = el.parentElement;
              if (!parent) return;
              var maxW = parent.getBoundingClientRect ? parent.getBoundingClientRect().width : parent.clientWidth;
              if (maxW <= 0) return;
              var curSize = parseFloat(window.getComputedStyle(el).fontSize) || 11;
              while (el.scrollWidth > maxW && curSize > 5.5) {
                curSize -= 0.2;
                el.style.fontSize = curSize + 'px';
                el.style.letterSpacing = '-0.25px';
              }
            });

            var schoolEls = document.querySelectorAll('.school-title');
            schoolEls.forEach(function(el) {
              var parent = el.parentElement;
              if (!parent) return;
              var maxW = parent.getBoundingClientRect ? parent.getBoundingClientRect().width : parent.clientWidth;
              if (maxW <= 0) return;
              var curSize = parseFloat(window.getComputedStyle(el).fontSize) || 12;
              while (el.scrollWidth > maxW && curSize > 6.5) {
                curSize -= 0.2;
                el.style.fontSize = curSize + 'px';
              }
            });
          }

          window.onload = function() {
            fitNames();
            setTimeout(function() {
              fitNames();
              window.print();
            }, 450);
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl glass-card text-xs font-bold text-[#e4ded6] hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-[#f59c73]" />
          <span>ડેશબોર્ડ પર પાછા જાઓ (Back to Dashboard)</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#9d512d] hover:bg-[#b55e34] text-white text-xs font-bold shadow-lg transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>
              A4 ગ્રીડ પ્રિન્ટ (Print{' '}
              {cardType === 'students' ? studentsToPrint.length : staffToPrint.length} Cards)
            </span>
          </button>
        </div>
      </div>

      {/* Mode Switcher: Students ID vs Staff ID */}
      <div className="glass-panel rounded-3xl border border-white/10 p-5 shadow-lg">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={() => setCardType('students')}
              className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                cardType === 'students'
                  ? 'bg-[#9d512d] text-white shadow-lg'
                  : 'glass-card text-[#a99f91] hover:text-white'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>વિદ્યાર્થી ઓળખપત્ર (Students ID)</span>
            </button>

            <button
              onClick={() => setCardType('staff')}
              className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                cardType === 'staff'
                  ? 'bg-[#9d512d] text-white shadow-lg'
                  : 'glass-card text-[#a99f91] hover:text-white'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>સ્ટાફ ઓળખપત્ર (Staff ID)</span>
            </button>
          </div>

          {/* Student Filter Controls */}
          {cardType === 'students' && (
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              <div className="flex items-center gap-2">
                <label className="text-xs text-[#a99f91] font-semibold">ધોરણ:</label>
                <select
                  value={selectedStandard}
                  onChange={(e) => setSelectedStandard(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-black/20 border border-white/10 text-white text-xs focus:outline-none focus:border-[#f59c73]"
                >
                  <option value="ALL">તમામ ધોરણ (All)</option>
                  <option value="9">ધોરણ 9</option>
                  <option value="10">ધોરણ 10</option>
                  <option value="11">ધોરણ 11</option>
                  <option value="12">ધોરણ 12</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-xs text-[#a99f91] font-semibold">વર્ગ/વિભાગ:</label>
                <select
                  value={selectedDivision}
                  onChange={(e) => setSelectedDivision(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-black/20 border border-white/10 text-white text-xs focus:outline-none focus:border-[#f59c73]"
                >
                  <option value="ALL">તમામ વર્ગ</option>
                  <option value="A">વર્ગ A</option>
                  <option value="B">વર્ગ B</option>
                  <option value="C">વર્ગ C</option>
                  <option value="D">વર્ગ D</option>
                </select>
              </div>

              <button
                onClick={toggleSelectAllStudents}
                className="inline-flex items-center gap-1.5 text-xs text-[#f59c73] hover:underline font-bold ml-2 cursor-pointer"
              >
                {selectedStudentIds.size === filteredStudents.length ? (
                  <CheckSquare className="w-3.5 h-3.5" />
                ) : (
                  <Square className="w-3.5 h-3.5" />
                )}
                <span>તમામ પસંદ કરો</span>
              </button>
            </div>
          )}

          {cardType === 'staff' && (
            <button
              onClick={toggleSelectAllStaff}
              className="inline-flex items-center gap-1.5 text-xs text-[#f59c73] hover:underline font-bold cursor-pointer"
            >
              {selectedStaffIds.size === staffList.length ? (
                <CheckSquare className="w-3.5 h-3.5" />
              ) : (
                <Square className="w-3.5 h-3.5" />
              )}
              <span>તમામ સ્ટાફ પસંદ કરો ({staffList.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* Cards Preview Grid */}
      <div className="glass-panel rounded-3xl border border-white/10 p-6 shadow-xl">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-bold text-[#e4ded6] flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-[#f59c73]" />
            <span>
              {cardType === 'students' ? 'વિદ્યાર્થી ID કાર્ડ પ્રિવ્યૂ' : 'સ્ટાફ ID કાર્ડ પ્રિવ્યૂ'} (
              {cardType === 'students' ? studentsToPrint.length : staffToPrint.length} કાર્ડ્સ)
            </span>
          </h3>
          <span className="text-xs text-[#a99f91]">
            A4 પેજ પર 8 કાર્ડ એકસાથે પ્રિન્ટ માટે યોગ્ય
          </span>
        </div>

        {cardType === 'students' ? (
          filteredStudents.length === 0 ? (
            <div className="text-center py-12 text-xs text-[#a99f91]">
              પસંદ કરેલ ફિલ્ટરમાં કોઈ વિદ્યાર્થી મળ્યા નથી.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredStudents.map((st) => {
                const isSelected =
                  selectedStudentIds.size === 0 || selectedStudentIds.has(st.id);
                return (
                  <div
                    key={st.id}
                    onClick={() => toggleStudent(st.id)}
                    className={`cursor-pointer rounded-2xl border transition-all overflow-hidden bg-[#101720] shadow-xl ${
                      isSelected
                        ? 'border-[#f59c73] ring-1 ring-[#f59c73]/50'
                        : 'border-white/10 opacity-60 hover:opacity-100'
                    }`}
                  >
                    {/* Card Header */}
                    <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-2.5 text-center border-b border-white/10">
                      <div
                        className="font-extrabold text-white tracking-wide uppercase whitespace-nowrap overflow-hidden leading-tight"
                        style={{
                          fontSize: school.schoolName.length > 45 ? '10px' : school.schoolName.length > 30 ? '11.5px' : '13px',
                          letterSpacing: school.schoolName.length > 40 ? '-0.2px' : '0.2px'
                        }}
                        title={school.schoolName}
                      >
                        {school.schoolName}
                      </div>
                      <div className="text-[9.5px] text-slate-300 mt-0.5 truncate">
                        DISE: {school.diseCode} • {school.district}
                      </div>
                      <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-[#f59c73] text-[#0f172a]">
                        વિદ્યાર્થી ઓળખપત્ર
                      </span>
                    </div>

                    {/* Card Body */}
                    <div className="p-3.5 flex gap-3.5 items-center">
                      <div className="w-16 h-20 rounded-xl bg-slate-800 border border-slate-700 flex flex-col items-center justify-center shrink-0 overflow-hidden">
                        {st.photoUrl ? (
                          <img src={st.photoUrl} alt={st.studentName} className="w-full h-full object-cover" />
                        ) : (
                          <>
                            <span className="text-xl font-bold text-[#f59c73]">
                              {st.studentName.charAt(0) || 'S'}
                            </span>
                            <span className="text-[8px] text-slate-400 mt-1">PHOTO</span>
                          </>
                        )}
                      </div>

                      <div className="flex-1 min-w-0 space-y-1 text-xs">
                        <div
                          className={`whitespace-nowrap overflow-hidden leading-tight ${getPreviewNameFontSize(st.studentName)} bg-white/5 px-2 py-1 rounded-md border-l-2 border-[#f59c73]`}
                          title={st.studentName}
                        >
                          {st.studentName}
                        </div>
                        <div className="text-[11px] text-[#a99f91] flex items-center justify-between">
                          <span>
                            ધોરણ:{' '}
                            <strong className="text-white">
                              {st.standard} {st.section || st.division ? `(${st.section || st.division})` : ''}
                            </strong>
                          </span>
                          <span>
                            રોલ: <span className="text-white font-mono">{st.rollNumber || '-'}</span>
                          </span>
                        </div>
                        <div className="text-[11px] text-[#a99f91] flex items-center justify-between">
                          <span>
                            G.R. નં: <span className="text-white font-mono">{st.grNumber || '-'}</span>
                          </span>
                          {st.bloodGroup && (
                            <span className="text-rose-400 font-bold text-[10px]">
                              {st.bloodGroup}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-[#a99f91] flex items-center justify-between gap-1">
                          <span className="whitespace-nowrap">
                            જન્મ: <strong className="text-slate-200 font-normal">{st.dob || '-'}</strong>
                          </span>
                          {st.doa && (
                            <span className="whitespace-nowrap bg-sky-950/50 text-sky-300 border border-sky-700/50 px-1.5 py-0.2 rounded text-[10px] font-semibold shrink-0">
                              પ્રવેશ: {st.doa}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Card Footer */}
                    <div className="px-4 py-2 bg-black/30 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-400">
                      <span>શૈક્ષણિક વર્ષ ૨૦૨૬–૨૭</span>
                      <span className="font-bold text-white">આચાર્યશ્રી સહી</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : staffList.length === 0 ? (
          <div className="text-center py-12 text-xs text-[#a99f91]">
            કોઈ સ્ટાફ સભ્ય ઉપલબ્ધ નથી. કૃપા કરીને પ્રથમ સ્ટાફ મેનેજરમાં જઈને સ્ટાફ ઉમેરો.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {staffList.map((stf) => {
              const isSelected = selectedStaffIds.size === 0 || selectedStaffIds.has(stf.id);
              return (
                <div
                  key={stf.id}
                  onClick={() => toggleStaff(stf.id)}
                  className={`cursor-pointer rounded-2xl border transition-all overflow-hidden bg-[#101720] shadow-xl ${
                    isSelected
                      ? 'border-amber-400 ring-1 ring-amber-400/50'
                      : 'border-white/10 opacity-60 hover:opacity-100'
                  }`}
                >
                  <div className="bg-[#78350f] p-3 text-center border-b border-amber-500/30">
                    <div className="text-[11px] font-bold text-white tracking-wide uppercase truncate">
                      {school.schoolName}
                    </div>
                    <div className="text-[9px] text-amber-200">
                      DISE: {school.diseCode} • {school.district}
                    </div>
                    <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-200 text-[#78350f]">
                      સ્ટાફ ઓળખપત્ર (STAFF ID)
                    </span>
                  </div>

                  <div className="p-4 flex gap-3.5 items-center">
                    <div className="w-16 h-20 rounded-xl bg-amber-950/40 border border-amber-700/40 flex flex-col items-center justify-center shrink-0">
                      <span className="text-xl font-bold text-amber-400">
                        {stf.fullName.charAt(0) || 'T'}
                      </span>
                      <span className="text-[8px] text-amber-300/60 mt-1">PHOTO</span>
                    </div>

                    <div className="flex-1 min-w-0 space-y-1 text-xs">
                      <div
                        className={`font-bold text-[#e4ded6] whitespace-nowrap overflow-hidden leading-tight ${getPreviewNameFontSize(stf.fullName)}`}
                        title={stf.fullName}
                      >
                        {stf.fullName}
                      </div>
                      <div className="text-[11px] text-amber-400 font-bold">
                        {stf.designation}
                      </div>
                      <div className="text-[11px] text-[#a99f91]">
                        વિષય: <span className="text-white">{stf.subject || '-'}</span>
                      </div>
                      <div className="text-[11px] text-[#a99f91]">
                        મોબાઈલ: <span className="text-white font-mono">{stf.mobile || '-'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="px-4 py-2 bg-black/30 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-400">
                    <span>શાળા સ્ટાફ રેકોર્ડ</span>
                    <span className="font-bold text-white">આચાર્યશ્રી સહી</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
