import React from 'react';
import { School } from '../types';
import { School as SchoolIcon, LogOut, ShieldCheck, Award, BookOpen } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';

interface NavbarProps {
  school: School | null;
  onLogout: () => void;
  activeTab: 'overview' | 'students' | 'marks' | 'subjects' | 'security';
  setActiveTab: (tab: 'overview' | 'students' | 'marks' | 'subjects' | 'security') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  school,
  onLogout,
  activeTab,
  setActiveTab,
}) => {
  return (
    <header className="app-header bg-[#121921]/90 backdrop-blur-md border-b border-white/10 text-[#e4ded6] sticky top-0 z-30 shadow-xl transition-colors duration-200">
      {/* Top institutional strip */}
      <div className="top-strip bg-[#090c10]/95 px-4 py-1.5 border-b border-white/10 text-xs flex flex-wrap justify-between items-center text-[#a99f91] transition-colors duration-200">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-[#9d512d] animate-pulse"></span>
          <span className="font-semibold text-[#e4ded6]">એકમ કસોટી ગુણપત્રક</span>
          <span className="text-[#a99f91]/50">|</span>
          <span className="text-[#f59c73] font-medium">Created by NR Chad</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="bg-[#202d38] text-[#e4ded6] border border-white/15 px-2.5 py-0.5 rounded-full text-[11px] font-mono">
            ગુજરાત શાળા ગુણાંકન પ્રણાલી
          </span>
          <span className="text-[#a99f91] hidden md:inline">Cloud Firestore Database</span>
          <ThemeToggle compact className="ml-1" />
        </div>
      </div>

      {/* Main navigation header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#9d512d]/20 border border-[#9d512d]/40 flex items-center justify-center text-[#f59c73] shadow-md shrink-0">
            <SchoolIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-black tracking-tight text-[#e4ded6]">
                એકમ કસોટી ગુણપત્રક
              </h1>
              {school && (
                <span className="bg-[#202d38] text-[#e4ded6] border border-white/15 text-xs px-2.5 py-0.5 rounded-full font-mono font-medium">
                  {school.schoolName} (DISE: {school.diseCode})
                </span>
              )}
            </div>
            <p className="text-xs text-[#f59c73] font-semibold tracking-wide">
              Created by NR Chad
            </p>
          </div>
        </div>

        {school ? (
          <div className="w-full lg:w-auto flex items-center justify-between sm:justify-end gap-2 overflow-x-auto pb-1 sm:pb-0">
            <nav className="flex items-center glass-card p-1 rounded-2xl border border-white/10 text-xs shrink-0">
              <button
                id="nav-tab-students"
                onClick={() => setActiveTab('students')}
                className={`px-3 py-2 rounded-xl font-bold transition-all touch-manipulation min-h-[40px] flex items-center gap-1.5 ${
                  activeTab === 'students'
                    ? 'bg-[#9d512d] text-white shadow-md'
                    : 'text-[#a99f91] hover:text-[#e4ded6] hover:bg-white/5'
                }`}
              >
                <span>વિદ્યાર્થીઓ (Students)</span>
              </button>
              <button
                id="nav-tab-marks"
                onClick={() => setActiveTab('marks')}
                className={`px-3 py-2 rounded-xl font-bold transition-all touch-manipulation min-h-[40px] flex items-center gap-1.5 ${
                  activeTab === 'marks'
                    ? 'bg-[#9d512d] text-white shadow-md'
                    : 'text-[#a99f91] hover:text-[#e4ded6] hover:bg-white/5'
                }`}
              >
                <Award className="w-3.5 h-3.5" />
                <span>ગુણાંકન (Marks)</span>
              </button>
              <button
                id="nav-tab-subjects"
                onClick={() => setActiveTab('subjects')}
                className={`px-3 py-2 rounded-xl font-bold transition-all touch-manipulation min-h-[40px] flex items-center gap-1.5 ${
                  activeTab === 'subjects'
                    ? 'bg-[#9d512d] text-white shadow-md'
                    : 'text-[#a99f91] hover:text-[#e4ded6] hover:bg-white/5'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>વિષયો (Subjects)</span>
              </button>
              <button
                id="nav-tab-overview"
                onClick={() => setActiveTab('overview')}
                className={`px-3 py-2 rounded-xl font-medium transition-all touch-manipulation min-h-[40px] ${
                  activeTab === 'overview'
                    ? 'bg-[#9d512d] text-white shadow-md'
                    : 'text-[#a99f91] hover:text-[#e4ded6] hover:bg-white/5'
                }`}
              >
                Overview
              </button>
              <button
                id="nav-tab-security"
                onClick={() => setActiveTab('security')}
                className={`px-3 py-2 rounded-xl font-medium transition-all flex items-center gap-1.5 touch-manipulation min-h-[40px] ${
                  activeTab === 'security'
                    ? 'bg-[#9d512d] text-white shadow-md'
                    : 'text-[#a99f91] hover:text-[#e4ded6] hover:bg-white/5'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Security</span>
                <span className="sm:hidden">Rules</span>
              </button>
            </nav>

            <ThemeToggle className="hidden sm:inline-flex shrink-0" />

            <button
              id="btn-sign-out"
              onClick={onLogout}
              className="flex items-center gap-1.5 glass-card hover:bg-rose-950/60 text-[#a99f91] hover:text-rose-300 border border-white/10 hover:border-rose-800/60 px-3.5 py-2 rounded-2xl text-xs font-semibold transition-all shrink-0 touch-manipulation min-h-[40px]"
              title="Sign out of school account"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <ThemeToggle />
          </div>
        )}
      </div>
    </header>
  );
};
