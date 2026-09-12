import React, { useState } from 'react';
import { loginSchool, registerSchool } from '../services/authService';
import { loginAdmin } from '../services/adminService';
import { School } from '../types';
import {
  School as SchoolIcon,
  Shield,
  Lock,
  Hash,
  BookOpen,
  AlertCircle,
  CheckCircle2,
  Building2,
  Mail,
  Smartphone,
  UserCheck,
  ChevronRight,
  Clock,
} from 'lucide-react';

const GUJARAT_DISTRICTS = [
  'Ahmedabad', 'Amreli', 'Anand', 'Aravalli', 'Banaskantha', 'Bharuch',
  'Bhavnagar', 'Botad', 'Chhota Udaipur', 'Dahod', 'Dang', 'Devbhoomi Dwarka',
  'Gandhinagar', 'Gir Somnath', 'Jamnagar', 'Junagadh', 'Kheda', 'Kutch',
  'Mahisagar', 'Mehsana', 'Morbi', 'Narmada', 'Navsari', 'Panchmahal',
  'Patan', 'Porbandar', 'Rajkot', 'Sabarkantha', 'Surat', 'Surendranagar',
  'Tapi', 'Vadodara', 'Valsad'
];

interface AuthScreenProps {
  onSchoolAuthSuccess?: (school: School) => void;
  onAdminAuthSuccess?: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  onSchoolAuthSuccess,
  onAdminAuthSuccess,
}) => {
  // Top-level portal switch: School Login vs Admin Login
  const [portalType, setPortalType] = useState<'school' | 'admin'>('school');

  // School sub-mode: Login vs Register
  const [schoolMode, setSchoolMode] = useState<'login' | 'register'>('login');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // School Form states
  const [diseCode, setDiseCode] = useState('');
  const [schoolPassword, setSchoolPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [district, setDistrict] = useState('Ahmedabad');

  // Admin Form states (No hardcoded credentials!)
  const [adminIdentifier, setAdminIdentifier] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  // Handle School Login
  const handleSchoolLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    const cleanDise = diseCode.trim();
    if (!cleanDise) {
      setError('Please enter your School DISE Code.');
      return;
    }
    if (!schoolPassword) {
      setError('Please enter your password.');
      return;
    }

    setLoading(true);
    try {
      const { school } = await loginSchool(cleanDise, schoolPassword);
      if (onSchoolAuthSuccess) {
        onSchoolAuthSuccess(school);
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Handle School Registration (Sets status to 'pending')
  const handleSchoolRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    const cleanDise = diseCode.trim();
    const cleanName = schoolName.trim();

    if (!cleanName) {
      setError('Please provide the official School Name.');
      return;
    }
    if (!cleanDise) {
      setError('Please provide your 11-digit School DISE Code.');
      return;
    }
    if (schoolPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (schoolPassword !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    setLoading(true);
    try {
      const { school } = await registerSchool({
        schoolName: cleanName,
        diseCode: cleanDise,
        district,
        password: schoolPassword,
      });

      setSuccessMessage(
        'School registration submitted successfully! Your account status is now Pending Admin approval.'
      );
      if (onSchoolAuthSuccess) {
        setTimeout(() => {
          onSchoolAuthSuccess(school);
        }, 800);
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please check details and try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Admin Login (Firebase Auth with Admin Mobile / ID + /admins/{uid} check)
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    const cleanId = adminIdentifier.trim();
    if (!cleanId) {
      setError('Please enter your Admin Mobile / ID.');
      return;
    }
    if (!adminPassword) {
      setError('Please enter your Admin Password.');
      return;
    }

    setLoading(true);
    try {
      await loginAdmin(cleanId, adminPassword);
      setSuccessMessage('Administrator verified! Redirecting to Admin Dashboard...');
      if (onAdminAuthSuccess) {
        onAdminAuthSuccess();
      }
    } catch (err: any) {
      console.error('Admin Login failed:', err);
      let msg = err.message || 'Admin Login failed. Please verify your credentials.';
      if (
        err.code === 'auth/invalid-credential' ||
        err.code === 'auth/user-not-found' ||
        err.code === 'auth/wrong-password'
      ) {
        msg = 'Invalid Admin Mobile / ID or Password. Please check your credentials in Firebase.';
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-60px)] bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Emblem & Title */}
        <div className="flex justify-center">
          <div
            className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg transition-all ${
              portalType === 'admin'
                ? 'bg-red-500/20 border border-red-500/30 text-red-400 shadow-red-950/50'
                : 'bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 shadow-emerald-950/50'
            }`}
          >
            {portalType === 'admin' ? (
              <Shield className="w-9 h-9" />
            ) : (
              <SchoolIcon className="w-9 h-9" />
            )}
          </div>
        </div>

        <h2 className="mt-4 text-center text-2xl font-extrabold tracking-tight text-white">
          એકમ કસોટી ગુણપત્રક
        </h2>
        <p className="mt-1 text-center text-xs text-emerald-400 font-semibold tracking-wide">
          Created by NR Chad
        </p>
        <p className="mt-1 text-center text-xs text-slate-400 font-medium">
          {portalType === 'admin'
            ? 'રાજ્ય એડમિનિસ્ટ્રેટર લૉગિન • Role-Based System Security'
            : 'ગુજરાત રાજ્ય શાળા ગુણાંકન પોર્ટલ • Multi-School System'}
        </p>

        {/* Security badges */}
        <div className="mt-4 flex items-center justify-center gap-2 text-[11px] text-slate-400">
          <span className="flex items-center gap-1 bg-slate-800/80 px-2.5 py-1 rounded-full border border-slate-700">
            <Shield className="w-3 h-3 text-emerald-400" /> Firebase Auth Secured
          </span>
          <span className="flex items-center gap-1 bg-slate-800/80 px-2.5 py-1 rounded-full border border-slate-700">
            <Lock className="w-3 h-3 text-emerald-400" /> Server-side Security Rules
          </span>
        </div>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="glass-panel py-8 px-4 shadow-2xl shadow-black/60 sm:rounded-3xl sm:px-8 border border-white/10">
          {/* PRIMARY PORTAL SELECTOR: [ School Login ] [ Admin Login ] */}
          <div className="grid grid-cols-2 rounded-2xl bg-[#090c10]/90 p-1.5 border border-white/10 mb-6 shadow-inner">
            <button
              id="tab-portal-school"
              type="button"
              onClick={() => {
                setPortalType('school');
                setError(null);
                setSuccessMessage(null);
              }}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 text-xs font-bold rounded-xl transition-all ${
                portalType === 'school'
                  ? 'bg-[#9d512d] text-white shadow-lg'
                  : 'text-[#a99f91] hover:text-[#e4ded6]'
              }`}
            >
              <SchoolIcon className="w-4 h-4" />
              <span>School Login</span>
            </button>

            <button
              id="tab-portal-admin"
              type="button"
              onClick={() => {
                setPortalType('admin');
                setError(null);
                setSuccessMessage(null);
              }}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 text-xs font-bold rounded-xl transition-all ${
                portalType === 'admin'
                  ? 'bg-rose-700 text-white shadow-lg'
                  : 'text-[#a99f91] hover:text-[#e4ded6]'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>Admin Login</span>
            </button>
          </div>

          {/* Error Message Box */}
          {error && (
            <div
              id="auth-error-banner"
              className="mb-5 rounded-lg bg-red-950/70 border border-red-800/80 p-3 text-xs text-red-300 flex items-start gap-2.5"
            >
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div className="leading-relaxed">{error}</div>
            </div>
          )}

          {/* Success Message Box */}
          {successMessage && (
            <div
              id="auth-success-banner"
              className="mb-5 rounded-lg bg-emerald-950/70 border border-emerald-800/80 p-3 text-xs text-emerald-300 flex items-start gap-2.5"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div className="leading-relaxed">{successMessage}</div>
            </div>
          )}

          {/* ============================================================ */}
          {/* SECTION A: SCHOOL PORTAL (LOGIN & REGISTRATION)              */}
          {/* ============================================================ */}
          {portalType === 'school' && (
            <div>
              {/* School Sub-mode Switcher */}
              <div className="flex rounded-2xl bg-[#090c10]/80 p-1 border border-white/10 mb-5">
                <button
                  id="tab-school-login"
                  type="button"
                  onClick={() => {
                    setSchoolMode('login');
                    setError(null);
                    setSuccessMessage(null);
                  }}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                    schoolMode === 'login'
                      ? 'bg-[#202d38] text-[#e4ded6] border border-white/10 shadow-md'
                      : 'text-[#a99f91] hover:text-[#e4ded6]'
                  }`}
                >
                  DISE Code Login
                </button>
                <button
                  id="tab-school-register"
                  type="button"
                  onClick={() => {
                    setSchoolMode('register');
                    setError(null);
                    setSuccessMessage(null);
                  }}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                    schoolMode === 'register'
                      ? 'bg-[#202d38] text-[#e4ded6] border border-white/10 shadow-md'
                      : 'text-[#a99f91] hover:text-[#e4ded6]'
                  }`}
                >
                  Register New School
                </button>
              </div>

              {/* School Login Form */}
              {schoolMode === 'login' && (
                <form onSubmit={handleSchoolLogin} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#e4ded6] mb-1.5">
                      School DISE Code (શાળા ડાયસ કોડ)
                    </label>
                    <div className="relative rounded-xl shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#a99f91]">
                        <Hash className="w-4 h-4" />
                      </div>
                      <input
                        id="input-login-dise"
                        type="text"
                        required
                        value={diseCode}
                        onChange={(e) => setDiseCode(e.target.value)}
                        placeholder="e.g. 24070500101"
                        className="glass-input block w-full pl-10 pr-3 py-2.5 rounded-xl text-sm placeholder-[#a99f91]/60"
                      />
                    </div>
                    <p className="mt-1 text-[11px] text-[#a99f91]">
                      Enter your official 11-digit Gujarat School DISE Code.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#e4ded6] mb-1.5">
                      School Password (પાસવર્ડ)
                    </label>
                    <div className="relative rounded-xl shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#a99f91]">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        id="input-login-password"
                        type="password"
                        required
                        value={schoolPassword}
                        onChange={(e) => setSchoolPassword(e.target.value)}
                        placeholder="••••••••"
                        className="glass-input block w-full pl-10 pr-3 py-2.5 rounded-xl text-sm placeholder-[#a99f91]/60"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      id="btn-school-login-submit"
                      type="submit"
                      disabled={loading}
                      className="w-full btn-terracotta flex justify-center items-center py-3 px-4 rounded-2xl shadow-lg text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      {loading ? (
                        <span className="flex items-center gap-2">
                          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                          Authenticating School...
                        </span>
                      ) : (
                        'Log In with DISE Code'
                      )}
                    </button>
                  </div>
                </form>
              )}

              {/* School Registration Form */}
              {schoolMode === 'register' && (
                <form onSubmit={handleSchoolRegister} className="space-y-4">
                  <div className="p-2.5 rounded-lg bg-amber-950/40 border border-amber-800/60 text-[11px] text-amber-300 flex items-start gap-2">
                    <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span>
                      નવી શાળા નોંધણી આપોઆપ <strong>Pending</strong> રહેશે અને એડમિન દ્વારા મંજૂર થયા પછી જ ગુણ ભરી શકાશે.
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      School Name (શાળાનું નામ) *
                    </label>
                    <div className="relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <input
                        id="input-register-name"
                        type="text"
                        required
                        value={schoolName}
                        onChange={(e) => setSchoolName(e.target.value)}
                        placeholder="e.g. Shree Sarvajanik High School"
                        className="glass-input block w-full pl-10 pr-3 py-2.5 rounded-xl text-sm placeholder-[#a99f91]/60"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#e4ded6] mb-1.5">
                      School DISE Code (શાળા ડાયસ કોડ) *
                    </label>
                    <div className="relative rounded-xl shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#a99f91]">
                        <Hash className="w-4 h-4" />
                      </div>
                      <input
                        id="input-register-dise"
                        type="text"
                        required
                        value={diseCode}
                        onChange={(e) => setDiseCode(e.target.value)}
                        placeholder="e.g. 24070500101"
                        className="glass-input block w-full pl-10 pr-3 py-2.5 rounded-xl text-sm placeholder-[#a99f91]/60"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#e4ded6] mb-1.5">
                      Gujarat District (જિલ્લો) *
                    </label>
                    <select
                      id="select-register-district"
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      className="glass-input block w-full px-3 py-2.5 rounded-xl text-sm"
                    >
                      {GUJARAT_DISTRICTS.map((d) => (
                        <option key={d} value={d} className="bg-[#121921] text-[#e4ded6]">
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#e4ded6] mb-1.5">
                      Password (પાસવર્ડ) *
                    </label>
                    <div className="relative rounded-xl shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#a99f91]">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        id="input-register-password"
                        type="password"
                        required
                        minLength={6}
                        value={schoolPassword}
                        onChange={(e) => setSchoolPassword(e.target.value)}
                        placeholder="Minimum 6 characters"
                        className="glass-input block w-full pl-10 pr-3 py-2.5 rounded-xl text-sm placeholder-[#a99f91]/60"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#e4ded6] mb-1.5">
                      Confirm Password (પાસવર્ડ પુષ્ટિ કરો) *
                    </label>
                    <div className="relative rounded-xl shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#a99f91]">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        id="input-register-confirm-password"
                        type="password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-type password"
                        className="glass-input block w-full pl-10 pr-3 py-2.5 rounded-xl text-sm placeholder-[#a99f91]/60"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      id="btn-register-submit"
                      type="submit"
                      disabled={loading}
                      className="w-full btn-terracotta flex justify-center items-center py-3 px-4 rounded-2xl shadow-lg text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      {loading ? (
                        <span className="flex items-center gap-2">
                          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                          Registering School...
                        </span>
                      ) : (
                        'Register School (Submit for Approval)'
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* ============================================================ */}
          {/* SECTION B: ADMIN LOGIN (ADMIN MOBILE / ID & PASSWORD)        */}
          {/* ============================================================ */}
          {portalType === 'admin' && (
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div className="p-3 rounded-lg bg-red-950/30 border border-red-800/50 text-[11px] text-red-300 flex items-start gap-2">
                <Shield className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>
                  Admin Authentication uses Firebase Auth. Your UID must exist in the <strong>/admins</strong> collection with <strong>role: &quot;admin&quot;</strong>.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#e4ded6] mb-1.5">
                  Admin Mobile / ID
                </label>
                <div className="relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#a99f91]">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <input
                    id="input-admin-identifier"
                    type="text"
                    required
                    value={adminIdentifier}
                    onChange={(e) => setAdminIdentifier(e.target.value)}
                    placeholder="Enter Admin Mobile / ID"
                    className="glass-input block w-full pl-10 pr-3 py-2.5 rounded-xl text-sm placeholder-[#a99f91]/60"
                  />
                </div>
                <p className="mt-1 text-[11px] text-[#a99f91]">
                  Enter your registered Admin Mobile Number or Admin ID.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#e4ded6] mb-1.5">
                  Admin Password
                </label>
                <div className="relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#a99f91]">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="input-admin-password"
                    type="password"
                    required
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="••••••••"
                    className="glass-input block w-full pl-10 pr-3 py-2.5 rounded-xl text-sm placeholder-[#a99f91]/60"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  id="btn-admin-login-submit"
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center items-center py-3 px-4 rounded-2xl shadow-lg text-sm font-bold text-white bg-rose-700 hover:bg-rose-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                      Verifying Admin Authority...
                    </span>
                  ) : (
                    'Login'
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Architecture note */}
          <div className="mt-6 pt-4 border-t border-slate-700/60 text-[11px] text-slate-400 space-y-1.5">
            <div className="flex items-center gap-2 font-medium text-slate-300">
              <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
              <span>Multi-Role Security Architecture</span>
            </div>
            <p>
              • <strong>Role Authorization:</strong> Admin authority is checked server-side directly against <code>/admins/{'{uid}'}</code> in Firestore.
            </p>
            <p>
              • <strong>Zero Hardcoded Credentials:</strong> All authentication credentials reside exclusively in Firebase Authentication.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
