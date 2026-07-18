import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import { readDatabase, writeDatabase } from './src/server/db.js';
import { Meeting, Task, ChatHistoryItem } from './src/types.js';

dotenv.config();

// Ensure the API key is present
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.warn('Warning: GEMINI_API_KEY is not defined in the environment.');
}

const ai = new GoogleGenAI({
  apiKey: apiKey || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Setup middleware with large payload limit to support base64 audio data
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // --- API Endpoints ---

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // Get all meetings
  app.get('/api/meetings', (req, res) => {
    try {
      const meetings = readDatabase();
      // Exclude heavy transcriptText and followUpEmail for listing if desired, but we can send all for simplicity
      res.json(meetings);
    } catch (error) {
      console.error('Error fetching meetings:', error);
      res.status(500).json({ error: 'Failed to retrieve meetings' });
    }
  });

  // Get single meeting with details
  app.get('/api/meetings/:id', (req, res) => {
    try {
      const meetings = readDatabase();
      const meeting = meetings.find(m => m.id === req.params.id);
      if (!meeting) {
        return res.status(404).json({ error: 'Meeting not found' });
      }
      res.json(meeting);
    } catch (error) {
      console.error('Error retrieving meeting:', error);
      res.status(500).json({ error: 'Failed to retrieve meeting details' });
    }
  });

  // Toggle task status
  app.post('/api/meetings/:id/tasks/:taskId/toggle', (req, res) => {
    try {
      const { id, taskId } = req.params;
      const meetings = readDatabase();
      const meetingIndex = meetings.findIndex(m => m.id === id);
      if (meetingIndex === -1) {
        return res.status(404).json({ error: 'Meeting not found' });
      }

      const task = meetings[meetingIndex].tasks.find(t => t.id === taskId);
      if (!task) {
        return res.status(404).json({ error: 'Task not found' });
      }

      task.status = task.status === 'completed' ? 'pending' : 'completed';
      writeDatabase(meetings);

      res.json({ success: true, task });
    } catch (error) {
      console.error('Error toggling task:', error);
      res.status(500).json({ error: 'Failed to update task status' });
    }
  });

  // Create/Process a meeting (from Notes, Transcript, or Audio)
  app.post('/api/meetings', async (req, res) => {
    try {
      const { type, title: customTitle, content, audioData, mimeType, fileName } = req.body;

      if (!apiKey) {
        return res.status(500).json({ error: 'Gemini API key is missing. Please configure it in Settings > Secrets.' });
      }

      let systemInstruction = `You are an expert project manager and executive assistant.
Analyze the provided meeting details (this could be a written transcript, raw meeting notes, or raw meeting audio).
Extract:
1. A descriptive, professional, and elegant title for the meeting (if not explicitly provided or to improve a generic title).
2. A cohesive, high-quality executive summary outlining the core discussions, decisions, and overall alignment.
3. A list of critical project risks, roadblocks, or technical warnings identified during the meeting.
4. An accurate list of action items, specifying the task description, the assignee's name (try to deduce it from the conversation, otherwise write "Unassigned"), and the deadline (explicit date, or relative deadline like "August 1st", "Monday", "Immediate", or "N/A").
5. A beautifully formatted and professional Markdown follow-up email ready to be sent to all participants.
6. A polished, high-fidelity transcript of the meeting. If the source is text notes, clean them up into a clear chronological order or structured transcript format. If the source is audio, transcribe it verbatim, distinguishing between speakers.

You must return the structured data strictly adhering to the requested JSON schema.`;

      const responseSchema = {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING, description: "Descriptive title of the meeting" },
          summary: { type: Type.STRING, description: "Comprehensive, structured executive summary" },
          risks: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Roadblocks, challenges, or critical project risks mentioned"
          },
          tasks: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                taskDescription: { type: Type.STRING, description: "Clear, action-oriented task description" },
                assigneeName: { type: Type.STRING, description: "Assignee name or 'Unassigned'" },
                deadline: { type: Type.STRING, description: "Deadline date or relative timing (e.g. 'Monday', 'Aug 1st')" }
              },
              required: ["taskDescription", "assigneeName", "deadline"]
            },
            description: "List of action items extracted"
          },
          transcriptText: { type: Type.STRING, description: "Verified text transcript of the meeting" },
          followUpEmail: { type: Type.STRING, description: "A beautifully structured follow-up email in professional markdown" }
        },
        required: ["title", "summary", "risks", "tasks", "transcriptText", "followUpEmail"]
      };

      let responseText = '';

      if (type === 'audio') {
        if (!audioData) {
          return res.status(400).json({ error: 'Missing audioData for audio processing' });
        }

        // Process audio via base64 inline data
        const audioPart = {
          inlineData: {
            data: audioData,
            mimeType: mimeType || 'audio/mp3'
          }
        };

        const response = await ai.models.generateContent({
          model: 'gemini-3.5-flash',
          contents: [
            audioPart,
            `Listen to this meeting audio. Transcribe it fully, analyze it, and extract structured notes. The user has uploaded file: ${fileName || 'meeting_audio.mp3'}.`
          ],
          config: {
            systemInstruction,
            responseMimeType: 'application/json',
            responseSchema
          }
        });

        responseText = response.text;
      } else {
        // Process text notes or transcript
        if (!content) {
          return res.status(400).json({ error: 'Missing content for text processing' });
        }

        const textPrompt = `Here is the meeting ${type === 'transcript' ? 'raw transcript' : 'raw notes'}:
\"\"\"
${content}
\"\"\"

Analyze this content, structure it, and extract all requested deliverables. ${customTitle ? `Adopt the provided custom title: "${customTitle}".` : ''}`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.5-flash',
          contents: textPrompt,
          config: {
            systemInstruction,
            responseMimeType: 'application/json',
            responseSchema
          }
        });

        responseText = response.text;
      }

      // Parse structural response
      const parsedData = JSON.parse(responseText.trim());

      // Create new meeting object
      const meetingId = 'meet-' + Date.now();
      const newMeeting: Meeting = {
        id: meetingId,
        title: customTitle || parsedData.title || 'Untitled Meeting',
        date: new Date().toISOString(),
        durationSeconds: type === 'audio' ? 45 : undefined, // Simulated duration for demo if audio
        summary: parsedData.summary,
        risks: parsedData.risks || [],
        transcriptText: parsedData.transcriptText,
        sourceType: type,
        sourceFileName: fileName || (type === 'audio' ? 'audio_meeting.mp3' : type === 'transcript' ? 'uploaded_transcript.txt' : 'pasted_notes.txt'),
        followUpEmail: parsedData.followUpEmail,
        tasks: (parsedData.tasks || []).map((t: any, idx: number) => ({
          id: `t-${meetingId}-${idx}`,
          meetingId,
          taskDescription: t.taskDescription,
          assigneeName: t.assigneeName || 'Unassigned',
          deadline: t.deadline || 'N/A',
          status: 'pending'
        })),
        chatHistory: []
      };

      const meetings = readDatabase();
      meetings.unshift(newMeeting);
      writeDatabase(meetings);

      res.json(newMeeting);
    } catch (error: any) {
      console.error('Error processing meeting:', error);
      res.status(500).json({ error: 'Failed to process meeting: ' + (error.message || error) });
    }
  });

  // Contextual Q&A on meeting details (using direct transcript injection to preserve 100% accuracy)
  app.post('/api/meetings/:id/chat', async (req, res) => {
    try {
      const { id } = req.params;
      const { query } = req.body;

      if (!query) {
        return res.status(400).json({ error: 'Missing chat query' });
      }

      if (!apiKey) {
        return res.status(500).json({ error: 'Gemini API key is missing. Please configure it in Settings > Secrets.' });
      }

      const meetings = readDatabase();
      const meetingIndex = meetings.findIndex(m => m.id === id);
      if (meetingIndex === -1) {
        return res.status(404).json({ error: 'Meeting not found' });
      }

      const meeting = meetings[meetingIndex];

      const systemInstruction = `You are MeetingMind's AI Assistant, designed to answer queries about a specific meeting.
You have 100% complete access to the entire meeting transcript.
Ensure your answers are precise, clear, and based ONLY on the details discussed in the meeting. Do not assume or extrapolate.
If the information is not explicitly or implicitly mentioned in the transcript, state that clearly: "This was not discussed in the meeting."`;

      const prompt = `Here is the meeting title: "${meeting.title}"
Meeting Date: ${new Date(meeting.date).toLocaleDateString()}

Here is the entire high-fidelity transcript:
\"\"\"
${meeting.transcriptText}
\"\"\"

Here is our conversational chat history so far:
${meeting.chatHistory.map(h => `User: ${h.userQuery}\nAI: ${h.aiResponse}`).join('\n')}

User's Query: "${query}"

Provide your professional, direct, and conversational answer:`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          systemInstruction
        }
      });

      const answer = response.text || 'Unable to generate response.';

      // Save to chat history
      const chatItem: ChatHistoryItem = {
        id: 'chat-' + Date.now(),
        meetingId: id,
        userQuery: query,
        aiResponse: answer,
        timestamp: new Date().toISOString()
      };

      meetings[meetingIndex].chatHistory.push(chatItem);
      writeDatabase(meetings);

      res.json(chatItem);
    } catch (error: any) {
      console.error('Error in contextual chat:', error);
      res.status(500).json({ error: 'Failed to generate chat response: ' + (error.message || error) });
    }
  });

  // Re-generate or customize follow-up email
  app.post('/api/meetings/:id/followup', async (req, res) => {
    try {
      const { id } = req.params;
      const { instructions } = req.body;

      if (!apiKey) {
        return res.status(500).json({ error: 'Gemini API key is missing. Please configure it in Settings > Secrets.' });
      }

      const meetings = readDatabase();
      const meetingIndex = meetings.findIndex(m => m.id === id);
      if (meetingIndex === -1) {
        return res.status(404).json({ error: 'Meeting not found' });
      }

      const meeting = meetings[meetingIndex];

      const prompt = `You are an expert project manager. Draft/re-write a professional follow-up email based on this meeting:
Title: ${meeting.title}
Summary: ${meeting.summary}
Tasks:
${meeting.tasks.map(t => `- ${t.taskDescription} (Assignee: ${t.assigneeName}, Deadline: ${t.deadline})`).join('\n')}

${instructions ? `User instructions for modification: "${instructions}"` : 'Please provide a polished, clear, and comprehensive follow-up email.'}

Return ONLY the markdown body of the follow-up email, starting with the subject line.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
      });

      const updatedEmail = response.text || '';
      meetings[meetingIndex].followUpEmail = updatedEmail;
      writeDatabase(meetings);

      res.json({ success: true, followUpEmail: updatedEmail });
    } catch (error: any) {
      console.error('Error generating follow-up email:', error);
      res.status(500).json({ error: 'Failed to generate follow-up email: ' + (error.message || error) });
    }
  });

  // Delete a meeting
  app.delete('/api/meetings/:id', (req, res) => {
    try {
      const { id } = req.params;
      const meetings = readDatabase();
      const filtered = meetings.filter(m => m.id !== id);

      if (filtered.length === meetings.length) {
        return res.status(404).json({ error: 'Meeting not found' });
      }

      writeDatabase(filtered);
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting meeting:', error);
      res.status(500).json({ error: 'Failed to delete meeting' });
    }
  });


  // --- Vite & Client Asset Routing ---

  if (process.env.NODE_ENV !== 'production') {
    console.log('Starting Vite server in middleware mode...');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    console.log('Serving production static assets...');
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error('Failed to start full-stack server:', error);
});
