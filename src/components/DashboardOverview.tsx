import React from 'react';
import { School, Student, MarkRecord } from '../types';
import {
  Users,
  Award,
  ShieldCheck,
  Building,
  KeyRound,
  Database,
  ArrowRight,
  Sparkles,
  Calendar,
  CheckCircle,
  BookOpen,
} from 'lucide-react';

interface DashboardOverviewProps {
  school: School;
  students: Student[];
  marks: MarkRecord[];
  onNavigate: (tab: 'students' | 'marks' | 'subjects' | 'security') => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  school,
  students,
  marks,
  onNavigate,
}) => {
  return (
    <div className="space-y-6">
      {/* School Welcome & Verification Header */}
      <div className="glass-panel rounded-3xl border border-white/10 p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#9d512d]/25 text-[#f59c73] border border-[#9d512d]/40">
                ACTIVE GSEB AFFILIATED
              </span>
              <span className="text-xs text-[#a99f91] font-mono">
                DISE: {school.diseCode}
              </span>
            </div>
            <h2 className="text-2xl font-black text-[#e4ded6] tracking-tight">
              {school.schoolName}
            </h2>
            <p className="text-sm text-[#a99f91] mt-1">
              {school.district} જિલ્લો, ગુજરાત • એકમ કસોટી ગુણપત્રક
            </p>
            <p className="text-xs text-[#f59c73] font-semibold mt-0.5">
              Created by NR Chad
            </p>
          </div>

          <div className="flex flex-wrap gap-2 text-xs">
            <div className="glass-card border border-white/10 px-3.5 py-2 rounded-2xl">
              <div className="text-[#a99f91] text-[10px] uppercase font-semibold">Firebase UID</div>
              <div className="font-mono text-[#f59c73] text-xs truncate max-w-[160px]" title={school.id}>
                {school.id}
              </div>
            </div>
            <div className="glass-card border border-white/10 px-3.5 py-2 rounded-2xl">
              <div className="text-[#a99f91] text-[10px] uppercase font-semibold">Registered On</div>
              <div className="text-[#e4ded6] text-xs">
                {new Date(school.createdAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {/* Real Students count */}
        <div className="glass-card rounded-3xl border border-white/10 p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#a99f91] uppercase tracking-wider">
              નોંધાયેલ વિદ્યાર્થીઓ
            </span>
            <div className="w-10 h-10 rounded-2xl bg-[#202d38] border border-white/15 flex items-center justify-center text-[#e4ded6]">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-[#e4ded6] font-mono">{students.length}</span>
            <span className="text-xs text-[#a99f91]">વિદ્યાર્થીઓ</span>
          </div>
          <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs">
            <span className="text-[#a99f91]">ધોરણ 9, 10, 11, 12</span>
            <button
              onClick={() => onNavigate('students')}
              className="text-[#f59c73] hover:text-[#f8b495] font-bold inline-flex items-center gap-1"
            >
              Manage <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Real Marks count */}
        <div className="glass-card rounded-3xl border border-white/10 p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#a99f91] uppercase tracking-wider">
              ગુણ રેકોર્ડ્સ (Marks)
            </span>
            <div className="w-10 h-10 rounded-2xl bg-[#9d512d]/20 border border-[#9d512d]/40 flex items-center justify-center text-[#f59c73]">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-[#e4ded6] font-mono">{marks.length}</span>
            <span className="text-xs text-[#a99f91]">નોંધાયેલ પરીક્ષાઓ</span>
          </div>
          <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs">
            <span className="text-[#a99f91]">ગુજરાત એકમ કસોટી</span>
            <button
              onClick={() => onNavigate('marks')}
              className="text-[#f59c73] hover:text-[#f8b495] font-bold inline-flex items-center gap-1"
            >
              Enter Marks <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Firebase Security Status */}
        <div className="glass-card rounded-3xl border border-white/10 p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#a99f91] uppercase tracking-wider">
              Firestore સુરક્ષા
            </span>
            <div className="w-10 h-10 rounded-2xl bg-[#a99f91]/15 border border-[#a99f91]/30 flex items-center justify-center text-[#e4ded6]">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-lg font-bold text-[#f59c73]">100% Isolated</span>
          </div>
          <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs">
            <span className="text-[#a99f91]">શાળા દીઠ અલગ ડેટા</span>
            <button
              onClick={() => onNavigate('security')}
              className="text-[#f59c73] hover:text-[#f8b495] font-bold inline-flex items-center gap-1"
            >
              Verify Rules <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Architecture and Spark Plan Checklist */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Compliance Card */}
        <div className="glass-card rounded-3xl border border-white/10 p-6 shadow-md">
          <h3 className="text-base font-bold text-white flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            એકમ કસોટી ગુણપત્રક — સિસ્ટમ સુવિધાઓ
          </h3>
          <ul className="space-y-2.5 text-xs text-slate-300">
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                <strong>સંપૂર્ણ ધોરણ કવરેજ:</strong> ધોરણ 9, 10, 11 અને 12 ના તમામ વિષયો અને કસ્ટમ વિષયો માટે ઉપલબ્ધ.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                <strong>ડાયનેમિક વિષય અને પ્રશ્ન સેટિંગ:</strong> શાળા પોતાની જરૂરિયાત મુજબ નવા વિષયો અને વિભાગો ઉમેરી શકે છે.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                <strong>Subcollection Partitioning:</strong> Student records reside at <code className="text-emerald-300 font-mono">/schools/{'{schoolId}'}/students</code> and marks at <code className="text-emerald-300 font-mono">/schools/{'{schoolId}'}/marks</code>.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                <strong>A4 સાઇઝ PDF ગુણપત્રક:</strong> સત્તાવાર Anek Gujarati ફોન્ટ સાથે એક-ક્લિક પ્રિન્ટ અને ડાઉનલોડ.
              </span>
            </li>
          </ul>
        </div>

        {/* Quick Actions Card */}
        <div className="glass-card rounded-3xl border border-white/10 p-6 flex flex-col justify-between shadow-md">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2 mb-3">
              <Calendar className="w-4 h-4 text-emerald-400" />
              એકમ કસોટી પત્રક અને આયોજન
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              ધોરણ 9 થી 12 ના વિદ્યાર્થીઓના પ્રશ્નવાર ગુણ સરળતાથી દાખલ કરો, કસ્ટમ વિષયો મેનેજ કરો અને સત્તાવાર A4 ગુણાંકન પત્રક પ્રિન્ટ કરો.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <button
              id="btn-quick-add-student"
              onClick={() => onNavigate('students')}
              className="py-2.5 px-3 bg-blue-600/90 hover:bg-blue-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md"
            >
              <Users className="w-3.5 h-3.5" />
              <span>વિદ્યાર્થીઓ</span>
            </button>
            <button
              id="btn-quick-add-marks"
              onClick={() => onNavigate('marks')}
              className="py-2.5 px-3 bg-emerald-600/90 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md"
            >
              <Award className="w-3.5 h-3.5" />
              <span>ગુણાંકન</span>
            </button>
            <button
              id="btn-quick-add-subjects"
              onClick={() => onNavigate('subjects')}
              className="py-2.5 px-3 bg-purple-600/90 hover:bg-purple-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>વિષયો</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
