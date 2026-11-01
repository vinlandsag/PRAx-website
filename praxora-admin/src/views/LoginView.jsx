import React, { useState } from 'react';
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  User,
  KeyRound,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import VeylithLogo from '../components/VeylithLogo';

export default function LoginView() {
  const { login, register } = useAuth();
  const { toastSuccess, toastError } = useToast();

  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('superadmin@system.local');
  const [password, setPassword] = useState('Password123!');
  const [displayName, setDisplayName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const personas = [
    {
      role: 'super_admin',
      name: 'Sarah Jenkins',
      badge: 'Super Admin',
      email: 'superadmin@system.local',
      color: 'border-amber-500/40 bg-amber-500/10 text-amber-300 hover:border-amber-500',
      desc: 'Full administrative access & security policies',
    },
    {
      role: 'admin',
      name: 'David Chen',
      badge: 'Operations Admin',
      email: 'admin@system.local',
      color: 'border-[#8B7CFF]/40 bg-[#8B7CFF]/10 text-[#8B7CFF] hover:border-[#8B7CFF]',
      desc: 'Task creation, member invites & reviews',
    },
    {
      role: 'moderator',
      name: 'Amina Patel',
      badge: 'Community Mod',
      email: 'moderator@system.local',
      color: 'border-[#55D6BE]/40 bg-[#55D6BE]/10 text-[#55D6BE] hover:border-[#55D6BE]',
      desc: 'Chat moderation, muting & announcements',
    },
    {
      role: 'member',
      name: 'Alex Rivera',
      badge: 'Active Member',
      email: 'alex.rivera@system.local',
      color: 'border-slate-700 bg-slate-800/40 text-slate-300 hover:border-slate-500',
      desc: 'Task submission & community chat',
    },
  ];

  const handleQuickPersona = async (persona) => {
    setEmail(persona.email);
    setPassword('Password123!');
    setMode('login');
    setError('');
    setLoading(true);
    try {
      await login(persona.email, 'Password123!');
      toastSuccess(`Authenticated as ${persona.name} (${persona.badge})`);
    } catch (err) {
      setError(err.message || 'Authentication failed');
      toastError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError('Please provide both email address and password.');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'login') {
        const user = await login(email.trim(), password);
        toastSuccess(`Welcome back to Veylith, ${user.display_name}!`);
      } else {
        if (!displayName.trim()) {
          setError('Display name is required for registration.');
          setLoading(false);
          return;
        }
        const user = await register({
          email: email.trim(),
          password,
          displayName: displayName.trim(),
          inviteCode: inviteCode.trim() || undefined,
        });
        toastSuccess(`Welcome to Veylith, ${user.display_name}! Account created.`);
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#08090D] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden antialiased selection:bg-[#8B7CFF] selection:text-white">
      {/* Ambient background lighting */}
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-[#8B7CFF]/10 via-[#55D6BE]/5 to-transparent rounded-full blur-3xl pointer-events-none"
        aria-hidden="true"
      />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center">
        {/* Brand Header */}
        <div className="flex justify-center mb-4">
          <VeylithLogo size="lg" showTagline={false} subBadge="CONTROL" />
        </div>

        <p className="text-sm font-medium text-[#737E91] tracking-wide mt-1">
          Everything in sync.
        </p>

        <h1 className="mt-6 text-2xl font-bold tracking-tight text-[#F3F5FA] font-display">
          {mode === 'login' ? 'Sign in to Veylith Control' : 'Register for Veylith'}
        </h1>
        <p className="mt-1.5 text-xs text-[#A0A8B8]">
          {mode === 'login'
            ? 'Operations governance, task lifecycle, and telemetry suite.'
            : 'Enter your credentials and invitation code to create an account.'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4 sm:px-0">
        <div className="bg-[#0D1017] py-8 px-6 sm:px-10 shadow-2xl shadow-black/80 rounded-2xl border border-[#252C3A]">
          {/* Error Alert */}
          {error && (
            <div
              role="alert"
              className="mb-6 p-3.5 rounded-xl bg-[#FF6B78]/10 border border-[#FF6B78]/30 flex items-start gap-3 text-xs text-[#FF6B78]"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium leading-relaxed">{error}</div>
            </div>
          )}

          {/* Form */}
          <form className="space-y-4" onSubmit={handleSubmit} noValidate>
            {mode === 'register' && (
              <div>
                <label
                  htmlFor="displayName"
                  className="block text-xs font-semibold text-[#A0A8B8] uppercase tracking-wider mb-1.5"
                >
                  Full Display Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#737E91] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="displayName"
                    name="displayName"
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="e.g. Elena Rostova"
                    className="w-full pl-10 pr-4 py-2.5 bg-[#131722] border border-[#252C3A] rounded-xl text-sm text-[#F3F5FA] placeholder-[#737E91] focus:outline-none focus:border-[#8B7CFF] focus:ring-1 focus:ring-[#8B7CFF] a11y-focus transition-all"
                  />
                </div>
              </div>
            )}

            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold text-[#A0A8B8] uppercase tracking-wider mb-1.5"
              >
                Work Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#737E91] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@system.local"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#131722] border border-[#252C3A] rounded-xl text-sm text-[#F3F5FA] placeholder-[#737E91] focus:outline-none focus:border-[#8B7CFF] focus:ring-1 focus:ring-[#8B7CFF] a11y-focus transition-all"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-semibold text-[#A0A8B8] uppercase tracking-wider mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#737E91] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-11 py-2.5 bg-[#131722] border border-[#252C3A] rounded-xl text-sm text-[#F3F5FA] placeholder-[#737E91] focus:outline-none focus:border-[#8B7CFF] focus:ring-1 focus:ring-[#8B7CFF] a11y-focus transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#737E91] hover:text-[#F3F5FA] transition-colors p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {mode === 'register' && (
              <div>
                <label
                  htmlFor="inviteCode"
                  className="block text-xs font-semibold text-[#A0A8B8] uppercase tracking-wider mb-1.5"
                >
                  Invitation Code <span className="text-[#737E91] font-normal">(Optional)</span>
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-[#737E91] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="inviteCode"
                    name="inviteCode"
                    type="text"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                    placeholder="e.g. QUEST-VIP-2026"
                    className="w-full pl-10 pr-4 py-2.5 bg-[#131722] border border-[#252C3A] rounded-xl text-sm text-[#F3F5FA] placeholder-[#737E91] font-mono focus:outline-none focus:border-[#8B7CFF] focus:ring-1 focus:ring-[#8B7CFF] a11y-focus transition-all"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 min-h-[44px] flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#8B7CFF] to-[#6355d8] hover:from-[#9c90ff] hover:to-[#7466e3] shadow-lg shadow-[#8B7CFF]/20 a11y-focus transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>{mode === 'login' ? 'Sign In to Veylith' : 'Create Veylith Account'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Mode Switcher */}
          <div className="mt-6 pt-5 border-t border-[#252C3A] text-center">
            {mode === 'login' ? (
              <p className="text-xs text-[#A0A8B8]">
                Have an invitation code?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('register');
                    setError('');
                  }}
                  className="font-semibold text-[#8B7CFF] hover:text-[#55D6BE] transition-colors a11y-focus rounded"
                >
                  Create an account
                </button>
              </p>
            ) : (
              <p className="text-xs text-[#A0A8B8]">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setError('');
                  }}
                  className="font-semibold text-[#8B7CFF] hover:text-[#55D6BE] transition-colors a11y-focus rounded"
                >
                  Sign in here
                </button>
              </p>
            )}
          </div>
        </div>

        {/* Demo Personas Quick Access */}
        <div className="mt-8">
          <div className="flex items-center gap-2 mb-3 px-1">
            <Sparkles className="w-3.5 h-3.5 text-[#55D6BE]" />
            <span className="text-[11px] font-semibold text-[#A0A8B8] uppercase tracking-wider font-mono">
              Quick Access Demo Personas (1-Click Login)
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {personas.map((p) => (
              <button
                key={p.role}
                type="button"
                onClick={() => handleQuickPersona(p)}
                disabled={loading}
                className={`p-3 rounded-xl border text-left transition-all duration-200 a11y-focus group min-h-[56px] ${p.color}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold truncate">{p.name}</span>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded uppercase font-semibold bg-black/40">
                    {p.badge}
                  </span>
                </div>
                <p className="text-[10px] text-[#A0A8B8] truncate mt-1 group-hover:text-[#F3F5FA] transition-colors">
                  {p.desc}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-8 text-center text-[11px] text-[#737E91]">
          <span>Veylith Operations Suite v2.0 · Protected by JWT & SQLite WAL</span>
        </div>
      </div>
    </div>
  );
}
