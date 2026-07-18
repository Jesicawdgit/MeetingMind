import React, { useState, useRef } from 'react';
import { Upload, FileText, FileAudio, AlertCircle, RefreshCw, Copy, Check, FileCode2 } from 'lucide-react';

interface IngestPanelProps {
  onProcessMeeting: (payload: {
    type: 'audio' | 'transcript' | 'notes';
    title?: string;
    content?: string;
    audioData?: string;
    mimeType?: string;
    fileName?: string;
  }) => Promise<void>;
  isProcessing: boolean;
  error: string | null;
}

const SAMPLE_NOTES = `Sarah complained that our current checkout flow has too many friction points and is hurting our SaaS conversion. We need a simpler 2-step checkout instead of 5 steps.
Rahul approved this and tasked Sarah to deliver complete Figma design mockups for checkout redesign by next Monday, July 24th.
Priya pointed out a massive security risk: our current payment webhook doesn't verify signatures correctly, meaning someone could spoof successful payments!
Rahul agreed this is a critical priority roadblock. Priya will patch the payment webhook signature verification immediately and deploy a hotfix by Wednesday morning, July 19th.
John said we need to align the financial dashboard to the new transaction structures. He will rewrite the database migrations for checkout telemetry by next Friday, July 28th.
Rahul will host the checkout review sync on Tuesday next week. Let's keep focused!`;

const SAMPLE_TRANSCRIPT = `Rahul: Welcome to the security audit preparation meeting. We have our external SOC 2 audit starting on August 1st, so we have exactly two weeks.
Priya: Yes, we still need to audit our AWS IAM permissions. Currently, some developers have wildcard administrative access, which is a major compliance risk.
Rahul: Good point. We must enforce least privilege. Priya, can you review all active AWS IAM roles and restrict them by this Friday, July 21st?
Priya: Sure, I'll take care of that.
John: Regarding our database compliance, we need to ensure our backups are encrypted at rest.
Rahul: Excellent. John, are our production RDS snapshots encrypted?
John: No, some older ones are not. I will enable KMS encryption for all RDS backups and verify compliance by Tuesday next week, July 25th.
Rahul: Great. Sarah, we also need to compile our physical security guidelines and update the employee onboarding handbook.
Sarah: I can handle the physical guidelines and draft the updated handbook pages. I will send them over to you, Rahul, for sign-off by next Thursday, July 27th.
Rahul: Thank you Sarah. Let's execute this list. This audit is critical for our enterprise clients.`;

export default function IngestPanel({ onProcessMeeting, isProcessing, error }: IngestPanelProps) {
  const [activeTab, setActiveTab] = useState<'notes' | 'audio' | 'transcript'>('notes');
  const [title, setTitle] = useState('');
  const [textNotes, setTextNotes] = useState('');
  const [textTranscript, setTextTranscript] = useState('');

  // Audio File State
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioBase64, setAudioBase64] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Status for preset loading feedback
  const [presetFeedback, setPresetFeedback] = useState<string | null>(null);

  // Convert uploaded audio file to base64
  const handleAudioFileChange = (file: File) => {
    if (!file) return;
    if (!file.type.startsWith('audio/') && !file.name.endsWith('.mp3') && !file.name.endsWith('.wav') && !file.name.endsWith('.m4a')) {
      alert('Please upload a valid audio file (.mp3, .wav, .m4a)');
      return;
    }

    setAudioFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Extract only the base64 data portion
      const base64Data = result.split(',')[1] || result;
      setAudioBase64(base64Data);
    };
    reader.onerror = (err) => {
      console.error('FileReader error:', err);
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleAudioFileChange(e.dataTransfer.files[0]);
    }
  };

  const loadPreset = (type: 'notes' | 'transcript') => {
    if (type === 'notes') {
      setTextNotes(SAMPLE_NOTES);
      setTitle('Checkout Funnel Simplification Sync');
      setActiveTab('notes');
      setPresetFeedback('Loaded Notes Sample!');
    } else {
      setTextTranscript(SAMPLE_TRANSCRIPT);
      setTitle('SOC 2 Compliance Prep');
      setActiveTab('transcript');
      setPresetFeedback('Loaded Transcript Sample!');
    }
    setTimeout(() => setPresetFeedback(null), 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (activeTab === 'notes' && !textNotes.trim()) {
      alert('Please enter meeting notes before submitting.');
      return;
    }
    if (activeTab === 'transcript' && !textTranscript.trim()) {
      alert('Please enter a transcript before submitting.');
      return;
    }
    if (activeTab === 'audio' && !audioBase64) {
      alert('Please select or record a meeting audio file first.');
      return;
    }

    const payload = {
      type: activeTab,
      title: title.trim() || undefined,
      content: activeTab === 'notes' ? textNotes : activeTab === 'transcript' ? textTranscript : undefined,
      audioData: activeTab === 'audio' ? audioBase64 : undefined,
      mimeType: activeTab === 'audio' && audioFile ? audioFile.type : undefined,
      fileName: activeTab === 'audio' && audioFile ? audioFile.name : undefined
    };

    await onProcessMeeting(payload);
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      {/* Introduction Banner (Bold Typography design Focus) */}
      <div className="bg-slate-950 text-white p-6 sm:p-8 rounded-3xl mb-8 relative overflow-hidden border border-slate-900 shadow-md">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl" />
        <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight mb-3">
          Ingestion Center
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-xl font-medium mb-6">
          Submit raw logs, paste notes, or drop recorded files. Our intelligence engine parses full conversations instantly to extract structured tasks, deadlines, summaries, and roadblocks.
        </p>

        {/* Rapid Presets */}
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">DEMO PRESETS:</span>
          <button
            type="button"
            onClick={() => loadPreset('notes')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-full bg-slate-900 hover:bg-slate-800 text-white border border-slate-800 cursor-pointer transition-all active:scale-95"
          >
            <FileText className="w-3 h-3 text-indigo-400" />
            <span>Pasted Notes</span>
          </button>
          <button
            type="button"
            onClick={() => loadPreset('transcript')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-full bg-slate-900 hover:bg-slate-800 text-white border border-slate-800 cursor-pointer transition-all active:scale-95"
          >
            <FileCode2 className="w-3 h-3 text-indigo-400" />
            <span>Verbatim Transcript</span>
          </button>
          {presetFeedback && (
            <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1 animate-pulse ml-1">
              ✓ {presetFeedback}
            </span>
          )}
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
        {/* Source Switch Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50/50 p-1.5">
          <button
            type="button"
            onClick={() => setActiveTab('notes')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-[11px] font-black uppercase tracking-wider rounded-2xl transition cursor-pointer ${
              activeTab === 'notes'
                ? 'bg-slate-950 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Notes</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('transcript')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-[11px] font-black uppercase tracking-wider rounded-2xl transition cursor-pointer ${
              activeTab === 'transcript'
                ? 'bg-slate-950 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-800'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Transcript</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('audio')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-[11px] font-black uppercase tracking-wider rounded-2xl transition cursor-pointer ${
              activeTab === 'audio'
                ? 'bg-slate-950 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-800'
            }`}
          >
            <FileAudio className="w-4 h-4" />
            <span>Audio</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
          {/* Custom title input (optional) */}
          <div>
            <label className="block text-[10px] font-black text-slate-900 uppercase tracking-widest mb-2.5">
              Meeting Title <span className="text-slate-400 font-bold tracking-normal">(Optional)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Q3 Security Briefing or Product Sync"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              id="input-new-meeting-title"
              className="w-full px-4 py-3.5 text-xs font-semibold border border-slate-200 focus:border-slate-400 rounded-2xl outline-none transition text-slate-800 bg-slate-50/30"
            />
          </div>

          {/* TAB 1: Meeting Notes Paste */}
          {activeTab === 'notes' && (
            <div>
              <label className="block text-[10px] font-black text-slate-900 uppercase tracking-widest mb-2.5">
                Raw Meeting Notes <span className="text-slate-400 font-bold tracking-normal">(Paste shorthand or draft bullet points)</span>
              </label>
              <textarea
                placeholder="e.g., Sarah task: complete designs by Tuesday. Rahul approved budget... Priya flagged database leak risk."
                value={textNotes}
                onChange={(e) => setTextNotes(e.target.value)}
                rows={8}
                id="textarea-notes-content"
                className="w-full p-4 text-xs font-semibold border border-slate-200 focus:border-slate-400 rounded-2xl outline-none transition font-sans text-slate-800 bg-slate-50/30 leading-relaxed resize-y"
              />
            </div>
          )}

          {/* TAB 2: Text Transcript Paste / File Upload */}
          {activeTab === 'transcript' && (
            <div>
              <label className="block text-[10px] font-black text-slate-900 uppercase tracking-widest mb-2.5">
                Written Transcript Text <span className="text-slate-400 font-bold tracking-normal">(Paste conversation log)</span>
              </label>
              <textarea
                placeholder="e.g.&#10;Rahul: Let's launch this by next Monday.&#10;Sarah: I will finalize designs.&#10;Priya: Backend is ready."
                value={textTranscript}
                onChange={(e) => setTextTranscript(e.target.value)}
                rows={8}
                id="textarea-transcript-content"
                className="w-full p-4 text-xs font-semibold border border-slate-200 focus:border-slate-400 rounded-2xl outline-none transition font-sans text-slate-800 bg-slate-50/30 leading-relaxed resize-y"
              />
            </div>
          )}

          {/* TAB 3: Audio File upload */}
          {activeTab === 'audio' && (
            <div>
              <label className="block text-[10px] font-black text-slate-900 uppercase tracking-widest mb-2.5">
                Upload Voice Recording
              </label>

              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                id="audio-upload-dropzone"
                className={`border-2 border-dashed rounded-3xl p-10 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-4 ${
                  isDragging
                    ? 'border-slate-900 bg-slate-50'
                    : audioFile
                    ? 'border-emerald-300 bg-emerald-50/10'
                    : 'border-slate-250 hover:border-slate-400 hover:bg-slate-50/50'
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => e.target.files?.[0] && handleAudioFileChange(e.target.files[0])}
                  accept="audio/*"
                  className="hidden"
                  id="input-audio-file"
                />

                {audioFile ? (
                  <>
                    <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
                      <FileAudio className="w-8 h-8 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-800 line-clamp-1">{audioFile.name}</p>
                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mt-1">{(audioFile.size / (1024 * 1024)).toFixed(2)} MB • Audio Format</p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setAudioFile(null);
                        setAudioBase64('');
                      }}
                      className="mt-2 text-[10px] font-black uppercase tracking-wider text-rose-600 hover:underline cursor-pointer"
                    >
                      Remove File
                    </button>
                  </>
                ) : (
                  <>
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <Upload className="w-8 h-8 text-slate-400" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-700">Drag & drop your meeting audio file here</p>
                      <p className="text-[10px] text-slate-400 mt-1">Supports MP3, WAV, M4A up to 25MB</p>
                    </div>
                    <span className="px-4 py-2 text-[10px] font-black uppercase tracking-wider text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-full transition shadow-sm">
                      Browse Files
                    </span>
                  </>
                )}
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2.5 p-4 bg-rose-50 text-rose-700 rounded-2xl border border-rose-100">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <p className="text-xs font-semibold leading-relaxed">{error}</p>
            </div>
          )}

          {/* Run Action */}
          <button
            type="submit"
            disabled={isProcessing}
            id="btn-process-meeting"
            className="w-full flex items-center justify-center gap-2 py-4 px-4 text-xs font-black uppercase tracking-wider text-white bg-slate-950 hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed rounded-full transition duration-150 cursor-pointer shadow-md shadow-slate-200"
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Processing Asset...</span>
              </>
            ) : (
              <>
                <span>Extract Meeting Intelligence</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
