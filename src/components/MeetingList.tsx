import React, { useState } from 'react';
import { Meeting } from '../types.js';
import { FileText, Mic, AlignLeft, Trash2, Search, Plus, Settings, LogOut } from 'lucide-react';

interface MeetingListProps {
  meetings: Meeting[];
  selectedId: string | null;
  onSelectMeeting: (id: string) => void;
  onDeleteMeeting: (id: string, e: React.MouseEvent) => void;
  onStartNewMeeting: () => void;
  user?: { name: string; email: string; title: string; company: string } | null;
  onOpenSettings?: () => void;
  onLogout?: () => void;
}

export default function MeetingList({
  meetings,
  selectedId,
  onSelectMeeting,
  onDeleteMeeting,
  onStartNewMeeting,
  user,
  onOpenSettings,
  onLogout
}: MeetingListProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredMeetings = meetings.filter(meeting =>
    meeting.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    meeting.summary.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getSourceIcon = (type: Meeting['sourceType']) => {
    switch (type) {
      case 'audio':
        return <Mic className="w-4 h-4 text-emerald-600" />;
      case 'transcript':
        return <AlignLeft className="w-4 h-4 text-blue-600" />;
      case 'notes':
        return <FileText className="w-4 h-4 text-purple-600" />;
    }
  };

  const getSourceBadge = (type: Meeting['sourceType']) => {
    switch (type) {
      case 'audio':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            Audio File
          </span>
        );
      case 'transcript':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
            Transcript
          </span>
        );
      case 'notes':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">
            Raw Notes
          </span>
        );
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="w-full flex flex-col h-full bg-white border-r border-slate-200">
      {/* Header action */}
      <div className="p-5 border-b border-slate-100 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-slate-900 rounded-xl flex items-center justify-center shrink-0 shadow-sm shadow-slate-200">
            <span className="text-white font-black text-lg leading-none italic">M</span>
          </div>
          <div>
            <h2 className="text-base font-black uppercase tracking-tight text-slate-900 leading-none">MeetingMind</h2>
            <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-1">Intelligence</p>
          </div>
        </div>
        <button
          onClick={onStartNewMeeting}
          id="btn-new-meeting"
          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 rounded-full transition-all duration-150 shadow-sm shadow-indigo-100 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="p-3.5 border-b border-slate-100">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search meetings..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            id="input-meeting-search"
            className="w-full pl-9 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 focus:border-indigo-400 focus:bg-white rounded-xl outline-none transition font-medium text-slate-800"
          />
        </div>
      </div>

      {/* Meetings List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
        {filteredMeetings.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No meetings found</p>
          </div>
        ) : (
          filteredMeetings.map((meeting) => {
            const isSelected = meeting.id === selectedId;
            const completedTasks = meeting.tasks.filter(t => t.status === 'completed').length;
            const totalTasks = meeting.tasks.length;

            return (
              <div
                key={meeting.id}
                id={`meeting-item-${meeting.id}`}
                onClick={() => onSelectMeeting(meeting.id)}
                className={`p-5 cursor-pointer transition-all duration-150 relative group ${
                  isSelected 
                    ? 'bg-slate-50 border-l-4 border-slate-900 pl-4 shadow-sm' 
                    : 'hover:bg-slate-50/60 pl-5'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    {getSourceIcon(meeting.sourceType)}
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                      {formatDate(meeting.date)}
                    </span>
                  </div>

                  <button
                    onClick={(e) => onDeleteMeeting(meeting.id, e)}
                    id={`btn-delete-${meeting.id}`}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                    title="Delete meeting"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <h3 className={`text-xs font-extrabold tracking-tight leading-snug line-clamp-1 mb-1.5 ${
                  isSelected ? 'text-slate-900' : 'text-slate-700'
                }`}>
                  {meeting.title}
                </h3>

                <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed mb-3">
                  {meeting.summary}
                </p>

                <div className="flex items-center justify-between mt-1">
                  {getSourceBadge(meeting.sourceType)}
                  {totalTasks > 0 && (
                    <span className="text-[10px] font-black uppercase tracking-tight text-slate-400">
                      Tasks: {completedTasks}/{totalTasks}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Profile / Account Footer */}
      {user && (
        <div className="p-4 border-t border-slate-200 bg-slate-50/50 flex items-center justify-between gap-2.5 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-full bg-slate-950 border border-slate-950 text-white flex items-center justify-center font-black text-xs shrink-0">
              {user.name.split(' ').map(n => n.charAt(0)).join('').toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-black text-slate-800 truncate leading-tight">{user.name}</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide truncate mt-0.5 leading-none">{user.company}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={onOpenSettings}
              className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition cursor-pointer"
              title="Account Settings"
              id="btn-sidebar-settings"
            >
              <Settings className="w-4 h-4" />
            </button>
            <button
              onClick={onLogout}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
              title="Log Out"
              id="btn-sidebar-logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
