import React, { useState, useEffect } from 'react';
import MeetingList from './components/MeetingList';
import IngestPanel from './components/IngestPanel';
import MeetingDetails from './components/MeetingDetails';
import AuthPage from './components/AuthPage';
import SettingsPage from './components/SettingsPage';
import { Meeting, Task, ChatHistoryItem } from './types';
import { Sparkles, Library, CheckSquare, Plus, AlertCircle, RefreshCw, Layers, Settings, LogOut } from 'lucide-react';

export default function App() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>('sample-1'); // Default to first sample for instant wow factor
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isChatSending, setIsChatSending] = useState(false);
  const [isFollowUpGenerating, setIsFollowUpGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Authentication & Settings States
  const [user, setUser] = useState<{ name: string; email: string; title: string; company: string } | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Load user session on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('meetingmind_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error('Failed to parse saved user', e);
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  }, []);

  // Fetch meetings whenever the active user changes
  useEffect(() => {
    if (user?.email) {
      fetchMeetings(user.email);
    } else {
      setMeetings([]);
      setSelectedId(null);
      setIsLoading(false);
    }
  }, [user?.email]);

  const fetchMeetings = async (userEmail?: string) => {
    try {
      setIsLoading(true);
      const emailToUse = userEmail || user?.email;
      if (!emailToUse) {
        setMeetings([]);
        setSelectedId(null);
        return;
      }

      const response = await fetch(`/api/meetings?userEmail=${encodeURIComponent(emailToUse)}`);
      if (!response.ok) {
        throw new Error('Could not fetch meetings');
      }
      const data = await response.json();
      setMeetings(data);
      if (data.length > 0) {
        const exists = data.some((m: Meeting) => m.id === selectedId);
        if (!exists || selectedId === 'sample-1') {
          setSelectedId(data[0].id);
        }
      } else {
        setSelectedId(null);
      }
    } catch (err: any) {
      console.error(err);
      setError('Failed to load meeting list from database.');
    } finally {
      setIsLoading(false);
    }
  };

  // Process a new meeting asset (Audio, transcript, notes)
  const handleProcessMeeting = async (payload: {
    type: 'audio' | 'transcript' | 'notes';
    title?: string;
    content?: string;
    audioData?: string;
    mimeType?: string;
    fileName?: string;
  }) => {
    try {
      setIsProcessing(true);
      setError(null);

      const response = await fetch('/api/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...payload,
          userEmail: user?.email
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Gemini processing failed');
      }

      const newMeeting: Meeting = await response.json();
      setMeetings(prev => [newMeeting, ...prev]);
      setSelectedId(newMeeting.id);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred while communicating with Gemini.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Toggle action item status
  const handleToggleTask = async (taskId: string) => {
    if (!selectedId) return;
    try {
      // Optimistic update
      setMeetings(prev =>
        prev.map(m => {
          if (m.id === selectedId) {
            return {
              ...m,
              tasks: m.tasks.map(t => (t.id === taskId ? { ...t, status: t.status === 'completed' ? 'pending' : 'completed' } : t))
            };
          }
          return m;
        })
      );

      const response = await fetch(`/api/meetings/${selectedId}/tasks/${taskId}/toggle`, {
        method: 'POST'
      });

      if (!response.ok) {
        throw new Error('Failed to toggle task on backend');
      }
    } catch (err) {
      console.error(err);
      // Revert in case of error
      fetchMeetings();
    }
  };

  // Send a chat message about the active meeting
  const handleSendChatMessage = async (query: string) => {
    if (!selectedId || isChatSending) return;
    try {
      setIsChatSending(true);

      const response = await fetch(`/api/meetings/${selectedId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });

      if (!response.ok) {
        throw new Error('Chat generation failed');
      }

      const chatItem: ChatHistoryItem = await response.json();

      setMeetings(prev =>
        prev.map(m => {
          if (m.id === selectedId) {
            return {
              ...m,
              chatHistory: [...m.chatHistory, chatItem]
            };
          }
          return m;
        })
      );
    } catch (err) {
      console.error(err);
      alert('Failed to send question to Gemini. Ensure your API key is configured correctly.');
    } finally {
      setIsChatSending(false);
    }
  };

  // Rebuild follow-up email draft with instructions
  const handleRebuildFollowUp = async (instructions: string) => {
    if (!selectedId || isFollowUpGenerating) return;
    try {
      setIsFollowUpGenerating(true);

      const response = await fetch(`/api/meetings/${selectedId}/followup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instructions })
      });

      if (!response.ok) {
        throw new Error('Rebuilding email failed');
      }

      const data = await response.json();

      setMeetings(prev =>
        prev.map(m => {
          if (m.id === selectedId) {
            return {
              ...m,
              followUpEmail: data.followUpEmail
            };
          }
          return m;
        })
      );
    } catch (err) {
      console.error(err);
      alert('Failed to customize email. Please try again.');
    } finally {
      setIsFollowUpGenerating(false);
    }
  };

  // Delete a meeting
  const handleDeleteMeeting = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this meeting? This is irreversible.')) return;

    try {
      const response = await fetch(`/api/meetings/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete meeting');
      }

      setMeetings(prev => prev.filter(m => m.id !== id));
      if (selectedId === id) {
        setSelectedId(meetings.length > 1 ? meetings.find(m => m.id !== id)?.id || null : null);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to delete meeting');
    }
  };

  const handleStartNewMeeting = () => {
    setSelectedId(null);
  };

  const selectedMeeting = meetings.find(m => m.id === selectedId) || null;

  // AUTHENTICATION GATE: Redirect unauthenticated requests to our onboarding page
  if (!user) {
    return (
      <AuthPage
        onLoginSuccess={(loggedInUser) => {
          setUser(loggedInUser);
          localStorage.setItem('meetingmind_user', JSON.stringify(loggedInUser));
        }}
      />
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-100 font-sans text-slate-800">
      {/* LEFT SIDEBAR: previous meetings */}
      <div className="w-80 h-full shrink-0 hidden md:block">
        <MeetingList
          meetings={meetings}
          selectedId={selectedId}
          onSelectMeeting={(id) => {
            setSelectedId(id);
            setIsSettingsOpen(false); // Close settings when selecting another meeting
          }}
          onDeleteMeeting={handleDeleteMeeting}
          onStartNewMeeting={() => {
            handleStartNewMeeting();
            setIsSettingsOpen(false);
          }}
          user={user}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onLogout={() => {
            setUser(null);
            localStorage.removeItem('meetingmind_user');
          }}
        />
      </div>

      {/* RIGHT WORKSPACE */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Mobile Navigation bar */}
        <div className="bg-slate-950 text-white px-4 py-3 flex items-center justify-between md:hidden shrink-0">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-400" />
            <span className="font-extrabold text-sm uppercase tracking-tight">MeetingMind</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                handleStartNewMeeting();
                setIsSettingsOpen(false);
              }}
              className="text-[10px] font-black uppercase bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-full cursor-pointer"
            >
              + New
            </button>
            <button
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              className="p-1 text-slate-300 hover:text-white"
              title="Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setUser(null);
                localStorage.removeItem('meetingmind_user');
              }}
              className="p-1 text-slate-400 hover:text-rose-400"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Workspace body */}
        <div className="flex-1 overflow-hidden relative">
          {isLoading ? (
            <div className="absolute inset-0 bg-white flex flex-col items-center justify-center gap-3">
              <LoaderSpinner />
              <p className="text-xs font-medium text-slate-500 font-mono animate-pulse">Initializing MeetingMind workspace...</p>
            </div>
          ) : isSettingsOpen ? (
            // SETTINGS PAGE ROUTE
            <SettingsPage
              user={user}
              onUpdateUser={(updated) => {
                setUser(updated);
                localStorage.setItem('meetingmind_user', JSON.stringify(updated));
              }}
              onClose={() => setIsSettingsOpen(false)}
            />
          ) : selectedId === null ? (
            // INGESTION FORM VIEW
            <div className="h-full overflow-y-auto bg-slate-50">
              <IngestPanel
                onProcessMeeting={handleProcessMeeting}
                isProcessing={isProcessing}
                error={error}
              />
            </div>
          ) : selectedMeeting ? (
            // ACTIVE INTELLIGENCE DASHBOARD VIEW
            <MeetingDetails
              meeting={selectedMeeting}
              onToggleTask={handleToggleTask}
              onSendChatMessage={handleSendChatMessage}
              onRebuildFollowUp={handleRebuildFollowUp}
              isChatSending={isChatSending}
              isFollowUpGenerating={isFollowUpGenerating}
            />
          ) : (
            // Empty welcome/create view
            <div className="h-full flex flex-col items-center justify-center bg-white p-6 text-center">
              <div className="bg-indigo-50 p-4 rounded-full border border-indigo-100 mb-4">
                <Sparkles className="w-8 h-8 text-indigo-500 animate-pulse" />
              </div>
              <h2 className="text-sm font-bold text-slate-800 mb-2">No Active Meetings</h2>
              <p className="text-xs text-slate-500 max-w-sm mb-4">
                Ingest meeting notes, upload verbatim transcripts, or submit voice recordings to activate the intelligence engine.
              </p>
              <button
                onClick={() => {
                  handleStartNewMeeting();
                  setIsSettingsOpen(false);
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs py-2 px-4 rounded-xl shadow-md cursor-pointer transition"
              >
                + Ingest First Asset
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function LoaderSpinner() {
  return (
    <div className="relative flex items-center justify-center">
      <div className="w-12 h-12 rounded-full border-4 border-slate-100 border-t-indigo-600 animate-spin" />
      <Sparkles className="w-4 h-4 text-indigo-500 absolute animate-pulse" />
    </div>
  );
}
