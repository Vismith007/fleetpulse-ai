import { useState, type FormEvent } from 'react';
import { Cpu, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function LoginView() {
  const { login } = useAuth();
  const [email, setEmail] = useState('admin@fleetpulse.io');
  const [password, setPassword] = useState('admin');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    // Simulate async check
    await new Promise((r) => setTimeout(r, 600));
    const ok = login(email, password);
    setLoading(false);
    if (!ok) setError('Invalid credentials. Try admin@fleetpulse.io / admin');
  };

  const DEMO_ACCOUNTS = [
    { email: 'admin@fleetpulse.io',    password: 'admin',    role: 'Admin',      badge: 'bg-red-500/20 text-red-400 border-red-800/40' },
    { email: 'operator@fleetpulse.io', password: 'operator', role: 'Operator',   badge: 'bg-blue-500/20 text-blue-400 border-blue-800/40' },
    { email: 'tech@fleetpulse.io',     password: 'tech',     role: 'Technician', badge: 'bg-amber-500/20 text-amber-400 border-amber-800/40' },
    { email: 'viewer@fleetpulse.io',   password: 'viewer',   role: 'Viewer',     badge: 'bg-zinc-500/20 text-zinc-400 border-zinc-800/40' },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      {/* Background grid */}
      <div className="absolute inset-0 bg-grid-dark bg-grid-md opacity-40 pointer-events-none" />

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 shadow-glow-blue mb-3">
            <Cpu className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-zinc-100">FleetPulse</h1>
          <p className="text-sm text-zinc-500 mt-1">Enterprise IoT Intelligence Platform</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 backdrop-blur-xl p-6 shadow-2xl">
          <h2 className="text-sm font-semibold text-zinc-300 mb-5">Sign in to your organization</h2>

          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
            <div>
              <label className="block text-xs text-zinc-500 mb-1.5">Email address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800/60 px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 outline-none focus:border-blue-700 focus:ring-1 focus:ring-blue-700/30 transition-colors"
                placeholder="you@company.com"
              />
            </div>

            <div>
              <label className="block text-xs text-zinc-500 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800/60 px-3 py-2.5 pr-10 text-sm text-zinc-100 placeholder-zinc-600 outline-none focus:border-blue-700 focus:ring-1 focus:ring-blue-700/30 transition-colors"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-lg border border-red-800/40 bg-red-950/30 px-3 py-2 text-xs text-red-400">
                <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          {/* Demo accounts */}
          <div className="mt-5 pt-4 border-t border-zinc-800">
            <p className="text-[11px] text-zinc-600 mb-3 text-center uppercase tracking-wide">Demo accounts</p>
            <div className="grid grid-cols-2 gap-1.5">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.email}
                  onClick={() => { setEmail(acc.email); setPassword(acc.password); }}
                  className="flex flex-col items-start rounded-lg border border-zinc-800 bg-zinc-800/40 px-2.5 py-2 text-left hover:bg-zinc-700/40 transition-colors"
                >
                  <span className={`rounded-full border px-1.5 py-0.5 text-[9px] font-bold uppercase ${acc.badge}`}>
                    {acc.role}
                  </span>
                  <span className="text-[10px] text-zinc-500 mt-1 truncate w-full">{acc.email.split('@')[0]}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="text-center text-[11px] text-zinc-700 mt-4">
          FleetPulse v3.0 · Enterprise Edition
        </p>
      </div>
    </div>
  );
}
