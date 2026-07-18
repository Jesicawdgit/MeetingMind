import React, { useState } from 'react';
import { Sparkles, CheckCircle2, ShieldCheck, Zap, ArrowRight, Lock, Mail, User, Briefcase, Building2 } from 'lucide-react';

interface AuthPageProps {
  onLoginSuccess: (user: { name: string; email: string; title: string; company: string }) => void;
}

export default function AuthPage({ onLoginSuccess }: AuthPageProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [title, setTitle] = useState('Senior Project Manager');
  const [company, setCompany] = useState('Acme Corp');
  const [validationError, setValidationError] = useState<string | null>(null);

  const getRegisteredUsers = (): Record<string, any> => {
    const data = localStorage.getItem('meetingmind_registered_users');
    if (!data) {
      const defaultUsers = {
        'sarah.jenkins@meetingmind.ai': {
          name: 'Sarah Jenkins',
          email: 'sarah.jenkins@meetingmind.ai',
          password: 'password123',
          title: 'Principal Product Manager',
          company: 'MeetingMind AI'
        }
      };
      localStorage.setItem('meetingmind_registered_users', JSON.stringify(defaultUsers));
      return defaultUsers;
    }
    try {
      return JSON.parse(data);
    } catch {
      return {};
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !password) {
      setValidationError('Please fill in all required fields.');
      return;
    }

    if (password.length < 6) {
      setValidationError('Security guard rail: Password must be at least 6 characters long.');
      return;
    }

    const users = getRegisteredUsers();

    if (isLogin) {
      // Login flow: check credentials
      const existingUser = users[normalizedEmail];
      if (!existingUser) {
        setValidationError('Account not found. Please sign up or use the demo login.');
        return;
      }
      if (existingUser.password !== password) {
        setValidationError('Incorrect password. Please try again.');
        return;
      }

      // Success! Log the user in
      onLoginSuccess({
        name: existingUser.name,
        email: existingUser.email,
        title: existingUser.title || 'Product Lead',
        company: existingUser.company || 'Intelligence Inc.'
      });
    } else {
      // Signup flow: validate and register
      if (!name.trim()) {
        setValidationError('Please provide your full name to sign up.');
        return;
      }

      if (users[normalizedEmail]) {
        setValidationError('An account with this email is already registered. Please login.');
        return;
      }

      // Register new user
      const newUser = {
        name: name.trim(),
        email: normalizedEmail,
        password: password,
        title: title || 'Senior Project Manager',
        company: company || 'Acme Corp'
      };

      users[normalizedEmail] = newUser;
      localStorage.setItem('meetingmind_registered_users', JSON.stringify(users));

      // Log the newly registered user in
      onLoginSuccess({
        name: newUser.name,
        email: newUser.email,
        title: newUser.title,
        company: newUser.company
      });
    }
  };

  const loadDemoUser = () => {
    // Seed and log in with demo credentials
    const users = getRegisteredUsers();
    const demoEmail = 'sarah.jenkins@meetingmind.ai';
    if (!users[demoEmail]) {
      users[demoEmail] = {
        name: 'Sarah Jenkins',
        email: demoEmail,
        password: 'password123',
        title: 'Principal Product Manager',
        company: 'MeetingMind AI'
      };
      localStorage.setItem('meetingmind_registered_users', JSON.stringify(users));
    }
    
    onLoginSuccess({
      name: users[demoEmail].name,
      email: users[demoEmail].email,
      title: users[demoEmail].title,
      company: users[demoEmail].company
    });
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-slate-50 font-sans text-slate-950 overflow-y-auto lg:overflow-hidden">
      {/* LEFT COLUMN: Stunning High-Impact Onboarding Explanation */}
      <div className="w-full lg:w-1/2 bg-slate-950 text-white p-8 sm:p-12 lg:p-16 flex flex-col justify-between relative overflow-hidden lg:h-screen">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Brand */}
        <div className="flex items-center gap-3 mb-12 shrink-0">
          <div className="w-9 h-9 bg-white text-slate-950 rounded-xl flex items-center justify-center shadow-md">
            <span className="font-black text-xl leading-none italic">M</span>
          </div>
          <span className="text-2xl font-black tracking-tighter uppercase">MeetingMind</span>
        </div>

        {/* Main Pitch (Bold Typography Focus) */}
        <div className="my-auto max-w-xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-900 border border-slate-800 rounded-full text-[10px] font-black uppercase tracking-widest text-indigo-400">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Next-Gen Intelligence
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-none text-white">
            Unleash the <span className="text-slate-400">Mind</span> of Your Meetings.
          </h1>

          <p className="text-slate-400 text-sm sm:text-base leading-relaxed font-medium">
            Stop losing track of key decisions and open loop actions. MeetingMind processes audio files, raw transcripts, or shorthand logs to yield structured execution metrics instantly.
          </p>

          {/* Pillars of Meeting Intelligence */}
          <div className="pt-6 space-y-4">
            <div className="flex gap-3 items-start">
              <div className="bg-slate-900 p-2 rounded-xl shrink-0 border border-slate-800">
                <CheckCircle2 className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wide">Structured Task Pipelines</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Forced JSON outputs structure deadlines, priorities, and ownership automatically to guarantee zero-parsing failures.
                </p>
              </div>
            </div>

            <div className="flex gap-3 items-start">
              <div className="bg-slate-900 p-2 rounded-xl shrink-0 border border-slate-800">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wide">100% Grounded Context Chat</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Leverage Gemini's large-context window. Bypasses buggy RAG chunking to search verbatim transcripts with complete accuracy.
                </p>
              </div>
            </div>

            <div className="flex gap-3 items-start">
              <div className="bg-slate-900 p-2 rounded-xl shrink-0 border border-slate-800">
                <Zap className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wide">Immediate Follow-Up Drafting</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Generate client-ready summary emails in professional markdown instantly, then instruct Gemini to fine-tune tone or priorities.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footnote */}
        <div className="pt-12 text-[10px] font-black uppercase tracking-widest text-slate-500 shrink-0">
          POWERED BY GEMINI-3.5-FLASH • PROTOTYPE STUDIO V1
        </div>
      </div>

      {/* RIGHT COLUMN: Elegant Login/Signup Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 lg:p-16 bg-white lg:h-screen">
        <div className="w-full max-w-md space-y-8">
          <div className="space-y-2">
            <h2 className="text-3xl font-black tracking-tight text-slate-950 uppercase">
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-semibold uppercase tracking-wider">
              {isLogin ? 'Enter credentials to access dashboards' : 'Start your meeting intelligence journey'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {validationError && (
              <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-xs font-semibold text-rose-700">
                {validationError}
              </div>
            )}

            {!isLogin && (
              <div className="space-y-2">
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-700">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rahul Sharma"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 text-xs font-semibold border border-slate-200 focus:border-slate-950 rounded-2xl outline-none transition bg-slate-50/50"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-700">
                Work Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 text-xs font-semibold border border-slate-200 focus:border-slate-950 rounded-2xl outline-none transition bg-slate-50/50"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-700">
                Secure Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 text-xs font-semibold border border-slate-200 focus:border-slate-950 rounded-2xl outline-none transition bg-slate-50/50"
                />
              </div>
            </div>

            {!isLogin && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-700">
                    Job Title
                  </label>
                  <div className="relative">
                    <Briefcase className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="e.g. Lead Dev"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 text-xs font-semibold border border-slate-200 focus:border-slate-950 rounded-2xl outline-none transition bg-slate-50/50"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-700">
                    Organization
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="e.g. Acme Corp"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 text-xs font-semibold border border-slate-200 focus:border-slate-950 rounded-2xl outline-none transition bg-slate-50/50"
                    />
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-2 py-4 px-4 text-xs font-black uppercase tracking-wider text-white bg-slate-950 hover:bg-slate-800 rounded-full transition cursor-pointer shadow-md mt-2"
            >
              <span>{isLogin ? 'Access Dashboard' : 'Create Access Key'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Toggle login / signup */}
          <div className="pt-4 border-t border-slate-100 flex flex-col gap-3">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 text-center cursor-pointer"
            >
              {isLogin ? "New to MeetingMind? Sign up for free" : "Already have an account? Login here"}
            </button>

            {/* Quick Demo Access (Instant wow factor) */}
            <div className="text-center pt-2">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-2">Or bypass auth for preview:</span>
              <button
                type="button"
                onClick={loadDemoUser}
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-full text-xs font-black uppercase tracking-wider cursor-pointer"
              >
                <span>Login with Sarah (Demo Lead)</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
