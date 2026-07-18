import React, { useState } from 'react';
import { Sparkles, User, Briefcase, Building2, Mail, Key, Shield, Calendar, ArrowLeft, Save, CheckCircle } from 'lucide-react';

interface SettingsPageProps {
  user: {
    name: string;
    email: string;
    title: string;
    company: string;
    joinedDate?: string;
  };
  onUpdateUser: (updated: { name: string; email: string; title: string; company: string }) => void;
  onClose: () => void;
}

export default function SettingsPage({ user, onUpdateUser, onClose }: SettingsPageProps) {
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [title, setTitle] = useState(user.title);
  const [company, setCompany] = useState(user.company);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateUser({ name, email, title, company });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50/50 overflow-hidden">
      {/* Header Panel */}
      <div className="bg-white border-b border-slate-200 p-6 sm:p-8 shrink-0">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full cursor-pointer transition text-slate-600"
            title="Back to dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 text-[10px] font-black text-indigo-600 uppercase tracking-widest">
            <Shield className="w-4 h-4 text-indigo-600" />
            Security & Profile
          </div>
        </div>

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-none text-slate-950">
          Account Settings
        </h1>
      </div>

      {/* Main Settings content */}
      <div className="flex-1 overflow-y-auto p-6 sm:p-8 max-w-4xl w-full mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* LEFT: Quick Stats Card */}
          <div className="space-y-6">
            <div className="bg-slate-950 text-white rounded-3xl p-6 shadow-md border border-slate-900 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-xl pointer-events-none" />
              
              <div className="w-12 h-12 rounded-full bg-white/10 text-white flex items-center justify-center font-black text-sm border border-white/15 mb-4">
                {name.split(' ').map(n => n.charAt(0)).join('').toUpperCase()}
              </div>

              <h2 className="text-lg font-black tracking-tight text-white mb-1 leading-snug">{name}</h2>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">{title}</p>
              
              <div className="pt-4 border-t border-white/10 space-y-3">
                <div className="flex items-center justify-between text-[11px] text-slate-400 font-bold uppercase tracking-wider">
                  <span>Organization</span>
                  <span className="text-white font-black">{company}</span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 font-bold uppercase tracking-wider">
                  <span>Joined Date</span>
                  <span className="text-white font-black">{user.joinedDate || 'July 18, 2026'}</span>
                </div>
              </div>
            </div>

            {/* Platform Trust Info */}
            <div className="bg-indigo-50/60 border border-indigo-100 rounded-3xl p-6">
              <h3 className="text-xs font-black text-indigo-950 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-600 animate-pulse" />
                Workspace Token
              </h3>
              <p className="text-xs text-indigo-900 leading-relaxed font-semibold">
                Your connection uses your workspace's API keys which are handled server-side securely. There are no exposed developer secrets on the client dashboard.
              </p>
            </div>
          </div>

          {/* RIGHT: Main Profile Edit fields */}
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm">
              <h2 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-6 border-b border-slate-100 pb-3">
                Profile Information
              </h2>

              <form onSubmit={handleSubmit} className="space-y-5">
                {saveSuccess && (
                  <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-2.5 text-xs font-semibold text-emerald-800 animate-fade-in">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span>Your profile has been successfully saved.</span>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-700">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 text-xs font-semibold border border-slate-200 focus:border-slate-950 rounded-2xl outline-none transition bg-slate-50/50"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-700">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 text-xs font-semibold border border-slate-200 focus:border-slate-950 rounded-2xl outline-none transition bg-slate-50/50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-700">
                      Job Title
                    </label>
                    <div className="relative">
                      <Briefcase className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        required
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 text-xs font-semibold border border-slate-200 focus:border-slate-950 rounded-2xl outline-none transition bg-slate-50/50"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-700">
                      Organization / Company
                    </label>
                    <div className="relative">
                      <Building2 className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        required
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 text-xs font-semibold border border-slate-200 focus:border-slate-950 rounded-2xl outline-none transition bg-slate-50/50"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-slate-950 hover:bg-slate-800 text-white rounded-full font-black text-xs uppercase tracking-wider transition cursor-pointer shadow-md"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Changes</span>
                  </button>
                </div>
              </form>
            </div>

            {/* API Keys Configuration explanation */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm">
              <h2 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-4 border-b border-slate-100 pb-3 flex items-center gap-2">
                <Key className="w-4 h-4 text-slate-600" />
                API Keys & Gateway Credentials
              </h2>
              <p className="text-xs text-slate-500 leading-relaxed font-semibold mb-4">
                MeetingMind relies on Google's model integrations to parse raw audio/transcripts. The credentials are high-security parameters declared within your environment settings file.
              </p>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 font-mono text-xs text-slate-700 space-y-1.5">
                <div className="flex justify-between">
                  <span>GEMINI_API_KEY</span>
                  <span className="text-emerald-600 font-bold">✓ ACTIVE (SERVER-SIDE)</span>
                </div>
                <div className="flex justify-between">
                  <span>WORKSPACE_INGRESS</span>
                  <span className="text-emerald-600 font-bold">✓ INJECTED</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
