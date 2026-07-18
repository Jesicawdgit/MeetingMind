import React, { useState, useEffect, useRef } from 'react';
import { Meeting, Task, ChatHistoryItem } from '../types.js';
import { renderMarkdown } from '../utils/markdown';
import {
  FileText,
  CheckSquare,
  MessageSquare,
  Mail,
  AlignLeft,
  Calendar,
  AlertTriangle,
  User,
  Send,
  Loader2,
  Copy,
  Check,
  Wand2,
  ArrowRight,
  Clock,
  Sparkles
} from 'lucide-react';

interface MeetingDetailsProps {
  meeting: Meeting;
  onToggleTask: (taskId: string) => Promise<void>;
  onSendChatMessage: (query: string) => Promise<void>;
  onRebuildFollowUp: (instructions: string) => Promise<void>;
  isChatSending: boolean;
  isFollowUpGenerating: boolean;
}

export default function MeetingDetails({
  meeting,
  onToggleTask,
  onSendChatMessage,
  onRebuildFollowUp,
  isChatSending,
  isFollowUpGenerating
}: MeetingDetailsProps) {
  const [activeTab, setActiveTab] = useState<'summary' | 'tasks' | 'chat' | 'followup' | 'transcript'>('summary');
  const [chatQuery, setChatQuery] = useState('');
  const [emailInstructions, setEmailInstructions] = useState('');
  const [copied, setCopied] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom of chat when messages update
  useEffect(() => {
    if (activeTab === 'chat') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [meeting.chatHistory, activeTab]);

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatQuery.trim() || isChatSending) return;
    onSendChatMessage(chatQuery.trim());
    setChatQuery('');
  };

  const handleSuggestedQuestion = (question: string) => {
    if (isChatSending) return;
    onSendChatMessage(question);
  };

  const handleCopyEmail = () => {
    if (!meeting.followUpEmail) return;
    navigator.clipboard.writeText(meeting.followUpEmail);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCustomizeEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (isFollowUpGenerating) return;
    onRebuildFollowUp(emailInstructions.trim());
    setEmailInstructions('');
  };

  const formatDateFull = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getInitials = (name: string) => {
    if (!name || name === 'Unassigned') return '?';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const SUGGESTED_QUESTIONS = [
    "What were the core decisions made?",
    "List all deadlines and who is responsible.",
    "Explain the critical roadblocks or risks mentioned.",
    "Are there any open questions left unaddressed?"
  ];

  return (
    <div className="flex flex-col h-full bg-slate-50/50 overflow-hidden">
      {/* Header Panel (Bold Typography Focus) */}
      <div className="bg-white border-b border-slate-200 p-6 sm:p-8 shrink-0">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="max-w-4xl">
            <div className="flex items-center gap-2 text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-3">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Analysis Complete
            </div>
            <h1 id="meeting-title" className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-none text-slate-950 mb-4">
              {meeting.title}
            </h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-bold uppercase tracking-wider text-slate-400">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                {formatDateFull(meeting.date)}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                {meeting.durationSeconds ? `${Math.round(meeting.durationSeconds / 60)} Min Session` : 'Session Assets'}
              </span>
              <span>•</span>
              <span className="px-2.5 py-0.5 bg-slate-100 rounded-md text-[9px] font-black tracking-widest border border-slate-200">
                {meeting.sourceType}
              </span>
            </div>
          </div>

          <button
            onClick={() => setActiveTab('followup')}
            className="self-start md:self-end px-5 py-3 bg-slate-900 hover:bg-indigo-600 text-white rounded-full font-black text-xs uppercase tracking-wider transition-all duration-150 hover:shadow-lg active:scale-95 cursor-pointer shrink-0"
          >
            Generate Follow-up
          </button>
        </div>

        {/* Sub Navigation Tabs */}
        <div className="flex border-b border-slate-100 mt-8 -mb-4 overflow-x-auto gap-5 scrollbar-none">
          {[
            { id: 'summary', label: 'Summary & Risks', icon: FileText },
            { id: 'tasks', label: 'Action Items', icon: CheckSquare, badge: meeting.tasks.filter(t => t.status === 'pending').length },
            { id: 'chat', label: 'Contextual Chat', icon: MessageSquare, sparkle: true },
            { id: 'followup', label: 'Follow-up Email', icon: Mail },
            { id: 'transcript', label: 'Raw Transcript', icon: AlignLeft }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-3 px-1 text-[11px] font-black uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 shrink-0 relative cursor-pointer pb-3.5 ${
                  isActive
                    ? 'border-slate-900 text-slate-900'
                    : 'border-transparent text-slate-400 hover:text-slate-800'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-slate-900' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className="bg-slate-900 text-white text-[9px] font-black px-2 py-0.5 rounded-full">
                    {tab.badge}
                  </span>
                )}
                {tab.sparkle && (
                  <Sparkles className="w-3 h-3 text-amber-500 animate-pulse absolute -top-1.5 -right-1.5" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Viewport */}
      <div className="flex-1 overflow-y-auto p-6 sm:p-8">
        {/* TAB 1: Summary & Risks */}
        {activeTab === 'summary' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-7xl mx-auto">
            {/* Executive Summary */}
            <div className="lg:col-span-8 bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm">
              <h2 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-5 border-b border-slate-100 pb-3">
                Executive Summary
              </h2>
              <p className="text-slate-600 leading-relaxed text-sm sm:text-base whitespace-pre-line font-medium">
                {meeting.summary}
              </p>
            </div>

            {/* Identified Risks & Warning Board */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-rose-50 border border-rose-100 rounded-3xl p-6 shadow-sm">
                <h2 className="text-xs font-black text-rose-950 uppercase tracking-widest mb-4 border-b border-rose-200 pb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-700" />
                  Critical Risks
                </h2>

                {meeting.risks.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-xs font-bold text-rose-400 uppercase tracking-widest">No major risks identified</p>
                  </div>
                ) : (
                  <ul className="space-y-3.5">
                    {meeting.risks.map((risk, idx) => (
                      <li
                        key={idx}
                        className="flex gap-2.5 text-xs font-bold text-rose-800 leading-relaxed"
                      >
                        <span className="font-black text-rose-600">!</span>
                        <span>{risk}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Action Items Table */}
        {activeTab === 'tasks' && (
          <div className="bg-white border border-slate-200 rounded-3xl shadow-sm max-w-5xl mx-auto overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-xs font-black text-slate-900 uppercase tracking-widest">
                Action Items & Accountability
              </h2>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 bg-white border border-slate-200/60 px-2 py-1 rounded-md">
                Pending: {meeting.tasks.filter(t => t.status === 'pending').length}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="bg-slate-50/30 border-b border-slate-100">
                    <th className="px-6 py-4.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Task</th>
                    <th className="px-6 py-4.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Assignee</th>
                    <th className="px-6 py-4.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Deadline</th>
                    <th className="px-6 py-4.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {meeting.tasks.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                        <p className="text-xs font-bold uppercase tracking-widest">No action items were extracted from this meeting.</p>
                      </td>
                    </tr>
                  ) : (
                    meeting.tasks.map((task) => {
                      const isCompleted = task.status === 'completed';
                      return (
                        <tr
                          key={task.id}
                          className={`transition duration-150 ${
                            isCompleted ? 'bg-slate-50/50' : 'hover:bg-slate-50/30'
                          }`}
                        >
                          {/* Task Description */}
                          <td className="px-6 py-5">
                            <div className="flex items-start gap-3">
                              <button
                                onClick={() => onToggleTask(task.id)}
                                className={`mt-0.5 rounded-lg border w-5 h-5 flex items-center justify-center shrink-0 cursor-pointer transition-all ${
                                  isCompleted
                                    ? 'bg-slate-900 border-slate-950 text-white'
                                    : 'border-slate-300 hover:border-slate-900 bg-white'
                                }`}
                              >
                                {isCompleted && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                              </button>
                              <p className={`text-xs sm:text-sm leading-normal ${
                                isCompleted ? 'line-through text-slate-400' : 'font-bold text-slate-800'
                              }`}>
                                {task.taskDescription}
                              </p>
                            </div>
                          </td>

                          {/* Assignee */}
                          <td className="px-6 py-5 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black border shadow-sm shrink-0 ${
                                isCompleted
                                  ? 'bg-slate-100 border-slate-200 text-slate-400'
                                  : 'bg-indigo-50 border-indigo-200 text-indigo-700'
                              }`}>
                                {getInitials(task.assigneeName)}
                              </div>
                              <span className={`text-xs ${isCompleted ? 'text-slate-400 font-medium' : 'font-bold text-slate-700'}`}>
                                {task.assigneeName}
                              </span>
                            </div>
                          </td>

                          {/* Deadline */}
                          <td className="px-6 py-5 whitespace-nowrap">
                            <span className={`text-xs font-bold tracking-tight ${isCompleted ? 'text-slate-400' : 'text-slate-600'}`}>
                              {task.deadline}
                            </span>
                          </td>

                          {/* Status Badge */}
                          <td className="px-6 py-5 whitespace-nowrap">
                            {isCompleted ? (
                              <span className="px-2 py-1 bg-slate-100 text-slate-400 text-[9px] font-black uppercase rounded tracking-wider">
                                Completed
                              </span>
                            ) : (
                              <span className="px-2 py-1 bg-amber-100 text-amber-800 text-[9px] font-black uppercase rounded tracking-wider">
                                In Progress
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: Conversational Chat */}
        {activeTab === 'chat' && (
          <div className="flex flex-col h-[520px] bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm max-w-4xl mx-auto">
            <div className="p-5 border-b border-slate-150 bg-slate-50/50 flex items-center justify-between">
              <div>
                <h2 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-slate-800" />
                  Ask Gemini About This Meeting
                </h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Zero-loss accuracy via 100% transcript grounding</p>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/10">
              {meeting.chatHistory.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center p-6 text-center">
                  <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100 mb-4">
                    <Sparkles className="w-6 h-6 text-indigo-600" />
                  </div>
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-1">Instant Context Q&A</h3>
                  <p className="text-xs text-slate-500 max-w-sm mb-5">
                    Query specific decisions, promises or timelines from the meeting. Our long-context engine has parsed the transcript fully.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-w-xl w-full">
                    {SUGGESTED_QUESTIONS.map((q, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSuggestedQuestion(q)}
                        className="text-left text-xs p-3.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition font-semibold text-slate-700 cursor-pointer hover:shadow-sm"
                      >
                        {q} →
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                meeting.chatHistory.map((chat) => (
                  <div key={chat.id} className="space-y-3">
                    {/* User Query */}
                    <div className="flex justify-end">
                      <div className="bg-slate-900 text-white rounded-2xl rounded-tr-none px-4 py-3 max-w-[80%] text-xs font-semibold shadow-sm">
                        <p>{chat.userQuery}</p>
                      </div>
                    </div>

                    {/* AI Response */}
                    <div className="flex justify-start">
                      <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-none p-4 max-w-[85%] shadow-sm flex items-start gap-3">
                        <div className="bg-indigo-50 border border-indigo-100 p-1.5 rounded-xl shrink-0">
                          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                        </div>
                        <div className="text-xs font-medium text-slate-700 leading-relaxed whitespace-pre-line">
                          {chat.aiResponse}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}

              {isChatSending && (
                <div className="flex justify-start animate-pulse">
                  <div className="bg-white border border-slate-200 rounded-2xl p-4 max-w-[85%] shadow-sm flex items-center gap-3">
                    <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" />
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Gemini is searching transcript...</p>
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Input Form */}
            <form onSubmit={handleSendChat} className="p-3.5 border-t border-slate-100 bg-white">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ask MeetingMind: 'What did Priya promise?'"
                  value={chatQuery}
                  onChange={(e) => setChatQuery(e.target.value)}
                  disabled={isChatSending}
                  id="input-chat-query"
                  className="flex-1 px-5 py-3.5 text-xs bg-slate-50 border border-slate-200 focus:border-slate-400 focus:bg-white rounded-2xl outline-none transition font-semibold text-slate-800"
                />
                <button
                  type="submit"
                  disabled={!chatQuery.trim() || isChatSending}
                  id="btn-send-chat"
                  className="bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white px-4 rounded-xl transition cursor-pointer shrink-0 flex items-center justify-center"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 4: Follow-up Email draft */}
        {activeTab === 'followup' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-7xl mx-auto">
            {/* Left side: Email content display */}
            <div className="lg:col-span-8 bg-white border border-slate-200 rounded-3xl shadow-sm flex flex-col overflow-hidden">
              <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <span className="text-xs font-black text-slate-900 uppercase tracking-widest">Email Draft</span>
                <button
                  onClick={handleCopyEmail}
                  id="btn-copy-email"
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold uppercase tracking-wider bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-full transition cursor-pointer shadow-sm"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                      <span>Copy Draft</span>
                    </>
                  )}
                </button>
              </div>

              <div className="p-6 sm:p-8 overflow-y-auto max-h-[500px]">
                {meeting.followUpEmail ? (
                  <div className="border border-slate-100 p-5 rounded-2xl bg-slate-50/20">
                    {renderMarkdown(meeting.followUpEmail)}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No email draft generated yet</p>
                  </div>
                )}
              </div>
            </div>

            {/* Right side: Re-generate or customize instructions */}
            <div className="lg:col-span-4 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm h-fit">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-4 border-b border-slate-100 pb-3 flex items-center gap-1.5">
                <Wand2 className="w-4 h-4 text-indigo-600" />
                Customize Draft
              </h3>

              <p className="text-xs font-medium text-slate-500 leading-relaxed mb-4">
                Instruct Gemini to rewrite this email. You can specify custom tones, highlight urgent priorities, or request formatting modifications.
              </p>

              <form onSubmit={handleCustomizeEmail} className="space-y-4">
                <textarea
                  placeholder="e.g. 'Make it sound highly casual', 'Highlight Priya's action item as critically urgent', or 'Translate it into Spanish'"
                  value={emailInstructions}
                  onChange={(e) => setEmailInstructions(e.target.value)}
                  disabled={isFollowUpGenerating}
                  rows={4}
                  id="textarea-followup-instructions"
                  className="w-full p-4 text-xs font-medium border border-slate-200 focus:border-slate-400 rounded-2xl outline-none transition text-slate-800 bg-slate-50/30"
                />

                <button
                  type="submit"
                  disabled={!emailInstructions.trim() || isFollowUpGenerating}
                  id="btn-regenerate-email"
                  className="w-full inline-flex items-center justify-center gap-1.5 py-3 px-4 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 rounded-full uppercase tracking-wider transition cursor-pointer"
                >
                  {isFollowUpGenerating ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Drafting with Gemini...</span>
                    </>
                  ) : (
                    <>
                      <span>Re-generate Draft</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* TAB 5: Raw Transcript */}
        {activeTab === 'transcript' && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm max-w-4xl mx-auto">
            <h2 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-5 border-b border-slate-100 pb-3">
              Full Meeting Transcript Reference
            </h2>
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-150 font-mono text-xs text-slate-700 leading-relaxed whitespace-pre-line overflow-y-auto max-h-[600px]">
              {meeting.transcriptText || "No transcript available."}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
