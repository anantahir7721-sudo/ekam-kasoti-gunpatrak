import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { AuthScreen } from './components/AuthScreen';
import { AdminDashboard } from './components/AdminDashboard';
import { SchoolStatusScreen } from './components/SchoolStatusScreen';
import { DashboardOverview } from './components/DashboardOverview';
import { StudentsManager } from './components/StudentsManager';
import { MarksManager } from './components/MarksManager';
import { SubjectManager } from './components/SubjectManager';
import { SecurityAuditor } from './components/SecurityAuditor';
import { School, Student, MarkRecord, SchoolStatus } from './types';
import { checkIsAdmin } from './services/adminService';
import {
  subscribeToAuth,
  logoutSchool,
  subscribeToSchoolProfile,
  getSchoolByUid,
  AuthRoleStatus,
} from './services/authService';
import {
  subscribeToStudents,
  subscribeToMarks,
  getStudents,
  getMarks,
} from './services/firestoreService';
import { Loader2 } from 'lucide-react';

export default function App() {
  const [authStatus, setAuthStatus] = useState<AuthRoleStatus>('loading');
  const [user, setUser] = useState<{ uid: string; email: string | null } | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [school, setSchool] = useState<School | null>(null);
  const [statusRefreshing, setStatusRefreshing] = useState(false);

  // Active School Data
  const [students, setStudents] = useState<Student[]>([]);
  const [marks, setMarks] = useState<MarkRecord[]>([]);
  const [dataLoading, setDataLoading] = useState(false);

  // Active Navigation Tab (Defaults directly to 'students' for fast school workflow)
  const [activeTab, setActiveTab] = useState<'overview' | 'students' | 'marks' | 'subjects' | 'security'>('students');

  // Listen for Firebase Auth state changes and determine Admin vs School role
  useEffect(() => {
    const unsubscribe = subscribeToAuth(({ status, user: fbUser, isAdmin: userIsAdmin, school: schoolProfile }) => {
      setAuthStatus(status);
      if (fbUser) {
        setUser({ uid: fbUser.uid, email: fbUser.email });
        setIsAdmin(userIsAdmin);
        setSchool(schoolProfile);
      } else {
        setUser(null);
        setIsAdmin(false);
        setSchool(null);
        setStudents([]);
        setMarks([]);
      }
    });

    return () => unsubscribe();
  }, []);

  // Real-time listener for current school's document
  // Enables instant access unlock as soon as an Admin approves the school
  useEffect(() => {
    if (!school?.id || isAdmin) return;

    const unsubProfile = subscribeToSchoolProfile(school.id, (updatedProfile) => {
      if (updatedProfile) {
        setSchool(updatedProfile);
      }
    });

    return () => unsubProfile();
  }, [school?.id, isAdmin]);

  // Real-time synchronization of school records (Students and Marks)
  // Subscribing to Firestore onSnapshot guarantees:
  // 1. Entered marks are never lost when logging out and logging back in.
  // 2. Multiple teachers can log in simultaneously from multiple computers or phones.
  // 3. One teacher entering Class 9 Maths and another entering Class 9 Gujarati/Science update live in real-time.
  // ONLY run for approved schools
  const isSchoolApproved = school && (school.status === 'approved' || !school.status);

  useEffect(() => {
    if (!isSchoolApproved || !school) {
      setStudents([]);
      setMarks([]);
      setDataLoading(false);
      return;
    }

    setDataLoading(true);
    let studentsLoaded = false;
    let marksLoaded = false;

    const unsubStudents = subscribeToStudents(school.id, (fetchedStudents) => {
      setStudents(fetchedStudents);
      studentsLoaded = true;
      if (marksLoaded) {
        setDataLoading(false);
      }
    });

    const unsubMarks = subscribeToMarks(school.id, (fetchedMarks) => {
      setMarks(fetchedMarks);
      marksLoaded = true;
      if (studentsLoaded) {
        setDataLoading(false);
      }
    });

    return () => {
      unsubStudents();
      unsubMarks();
    };
  }, [school?.id, isSchoolApproved]);

  // Manual fallback refresh for school data
  const loadSchoolData = useCallback(async () => {
    if (!school) return;
    setDataLoading(true);
    try {
      const [fetchedStudents, fetchedMarks] = await Promise.all([
        getStudents(school.id),
        getMarks(school.id),
      ]);
      setStudents(fetchedStudents);
      setMarks(fetchedMarks);
    } catch (err) {
      console.error('Error manually refreshing school data:', err);
    } finally {
      setDataLoading(false);
    }
  }, [school]);

  // Manual refresh button on pending screen
  const handleRefreshStatus = async () => {
    if (!user?.uid) return;
    setStatusRefreshing(true);
    try {
      const freshSchool = await getSchoolByUid(user.uid);
      if (freshSchool) {
        setSchool(freshSchool);
      }
    } catch (err) {
      console.error('Error refreshing school approval status:', err);
    } finally {
      setStatusRefreshing(false);
    }
  };

  const handleLogout = async () => {
    try {
      setAuthStatus('loading');
      await logoutSchool();
      setUser(null);
      setIsAdmin(false);
      setSchool(null);
      setAuthStatus('unauthenticated');
    } catch (err) {
      console.error('Logout error:', err);
      setAuthStatus('unauthenticated');
    }
  };

  const handleSchoolAuthSuccess = (newSchool: School) => {
    setSchool(newSchool);
    setIsAdmin(false);
    setAuthStatus('school');
  };

  const handleAdminAuthSuccess = () => {
    setIsAdmin(true);
    setSchool(null);
    setAuthStatus('admin');
  };

  // 1. Initial Auth Loading Screen & Role Verification
  if (authStatus === 'loading') {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white p-4">
        <Loader2 className="w-10 h-10 text-emerald-500 animate-spin mb-4" />
        <p className="text-sm font-medium text-slate-300">
          Connecting to Gujarat School Marks Management Portal...
        </p>
        <p className="text-xs text-slate-500 mt-1">
          Verifying Firebase Authentication & Role Authorization
        </p>
      </div>
    );
  }

  // 2. Unauthenticated: Show AuthScreen (School Login / Register or Admin Login)
  if (authStatus === 'unauthenticated' || !user) {
    return (
      <div className="min-h-screen bg-[#080b0f] text-[#e4ded6] flex flex-col">
        <Navbar
          school={null}
          onLogout={() => {}}
          activeTab="overview"
          setActiveTab={() => {}}
        />
        <main className="flex-1 flex flex-col justify-center">
          <AuthScreen
            onSchoolAuthSuccess={handleSchoolAuthSuccess}
            onAdminAuthSuccess={handleAdminAuthSuccess}
          />
        </main>
        <footer className="bg-[#0e141b]/90 border-t border-white/10 py-4 text-center text-xs text-slate-400 space-y-1">
          <div className="font-bold text-white tracking-wide">
            એકમ કસોટી ગુણપત્રક
          </div>
          <div className="text-emerald-400 font-medium">
            Created by NR Chad
          </div>
          <div className="text-[11px] text-slate-500">
            Gujarat School Marks Management System • Powered by Google Firebase
          </div>
        </footer>
      </div>
    );
  }

  // 3. Authenticated as System Administrator: Show Admin Dashboard
  // Strictly verified from /admins/{currentUser.uid} FIRST
  if (authStatus === 'admin' || isAdmin) {
    return (
      <AdminDashboard
        adminEmail={user.email}
        onLogout={handleLogout}
      />
    );
  }

  // 4. Authenticated as a School
  if (school) {
    const status: SchoolStatus = school.status || 'approved'; // Legacy compatibility

    // Pending, Rejected, or Inactive status notice screens
    if (status !== 'approved') {
      return (
        <div className="min-h-screen bg-slate-900 text-white flex flex-col">
          <Navbar
            school={school}
            onLogout={handleLogout}
            activeTab="overview"
            setActiveTab={() => {}}
          />
          <main className="flex-1 flex flex-col justify-center">
            <SchoolStatusScreen
              school={school}
              status={status}
              onLogout={handleLogout}
              onRefresh={handleRefreshStatus}
              refreshing={statusRefreshing}
            />
          </main>
          <footer className="bg-slate-950/90 border-t border-white/10 py-4 text-center text-xs text-slate-400 space-y-1">
            <div className="font-bold text-white tracking-wide">
              એકમ કસોટી ગુણપત્રક
            </div>
            <div className="text-emerald-400 font-medium">
              Created by NR Chad
            </div>
          </footer>
        </div>
      );
    }

    // Status is 'approved': Render the full functional marks-entry application!
    return (
      <div className="min-h-screen bg-[#080b0f] text-[#e4ded6] flex flex-col">
        <Navbar
          school={school}
          onLogout={handleLogout}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />

        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {dataLoading && (
            <div className="mb-4 glass-card border border-white/10 px-4 py-2 rounded-2xl text-xs text-emerald-400 flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Syncing records with Cloud Firestore...</span>
            </div>
          )}

          {activeTab === 'overview' && (
            <DashboardOverview
              school={school}
              students={students}
              marks={marks}
              onNavigate={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === 'students' && (
            <StudentsManager
              schoolId={school.id}
              students={students}
              onRefresh={loadSchoolData}
            />
          )}

          {activeTab === 'marks' && (
            <MarksManager
              school={school}
              students={students}
              marks={marks}
              onRefresh={loadSchoolData}
            />
          )}

          {activeTab === 'subjects' && (
            <SubjectManager
              school={school}
            />
          )}

          {activeTab === 'security' && (
            <SecurityAuditor school={school} />
          )}
        </main>

        <footer className="bg-[#0e141b]/90 border-t border-white/10 py-5 text-center text-xs text-slate-400 space-y-1">
          <div className="font-bold text-white tracking-wide">
            એકમ કસોટી ગુણપત્રક
          </div>
          <div className="text-emerald-400 font-medium">
            Created by NR Chad
          </div>
          <div className="text-[11px] text-slate-500">
            Gujarat Education Department Reference Standard • Cloud Firestore Isolated Database
          </div>
        </footer>
      </div>
    );
  }

  // 5. Authenticated user without Admin or School profile (Unrecognized user)
  return (
    <div className="min-h-screen bg-[#080b0f] text-[#e4ded6] flex flex-col">
      <Navbar
        school={null}
        onLogout={handleLogout}
        activeTab="overview"
        setActiveTab={() => {}}
      />
      <main className="flex-1 flex flex-col justify-center">
        <SchoolStatusScreen
          school={null}
          status="unrecognized"
          userUid={user?.uid}
          userEmail={user?.email}
          onLogout={handleLogout}
          onRefresh={async () => {
            if (!user?.uid) return;
            const isAdm = await checkIsAdmin(user.uid);
            if (isAdm) {
              setIsAdmin(true);
              setAuthStatus('admin');
            }
          }}
        />
      </main>
      <footer className="bg-slate-950/90 border-t border-white/10 py-4 text-center text-xs text-slate-400 space-y-1">
        <div className="font-bold text-white tracking-wide">
          એકમ કસોટી ગુણપત્રક
        </div>
        <div className="text-emerald-400 font-medium">
          Created by NR Chad
        </div>
      </footer>
    </div>
  );
}
