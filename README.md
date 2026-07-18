
## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`
=======
# MeetingMind
MeetingMind is an AI-powered meeting intelligence platform that helps individuals and teams organize and act on information from meetings. In many workplaces, important decisions, action items, and deadlines are forgotten because they're buried in long recordings or transcripts. While AI chatbots can summarize a single meeting, they don't provide a structured system to store, track, search, and manage meeting knowledge over time.

MeetingMind solves this by combining AI with a full-stack application. Users can securely log in, upload meeting transcripts or recordings, receive AI-generated summaries and action items, assign tasks, and maintain a searchable history of meetings. Instead of repeatedly asking an AI about individual conversations, teams build a centralized knowledge base where past discussions, decisions, and responsibilities are preserved and easily accessible.

# Tech Stack

Frontend:
```text
React
TypeScript
Vite
Tailwind CSS
Lucide React icons
```

Backend:
```text
Node.js
Express
TypeScript
Gemini API via @google/genai
File-based JSON storage
```

Runtime:
```text
Development: npm run dev
Production: npm run build && npm start
```

# Architecture
User Browser
   ↓
React Frontend
   ↓ fetch()
Express Backend API
   ↓
Gemini API
   ↓
Structured meeting response
   ↓
meetings_db.json
   ↓
React UI displays dashboard


```text
┌────────────────────────────────────────────────────────────────────────┐
│                          CLIENT LAYER (React)                          │
│                                                                        │
│   ┌──────────────┐     ┌──────────────┐    ┌──────────────────────┐    │
│   │   AuthPage   │     │ IngestPanel  │    │    MeetingDetails    │    │
│   └──────┬───────┘     └──────┬───────┘    └──────────┬───────────┘    │
│          │                    │                       │                │
└──────────┼────────────────────┼───────────────────────┼────────────────┘
           │                    │                       │
           │ HTTP requests      │ JSON payloads         │ Event / Q&A triggers
           ▼                    ▼                       ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        API PROXY LAYER (Express)                       │
│                                                                        │
│                 [ /api/meetings ]      [ /api/meetings/:id/chat ]      │
│                     Routing            Controller Middleware           │
└──────────────────────────────┬──────────────────┬──────────────────────┘
                               │                  │
        Disk read/write        │                  │ Secure JSON payload
        (Persistent Storage)   │                  │ (SSL-Handshake)
                               ▼                  ▼
                    ┌─────────────────────┐   ┌──────────────────────┐
                    │  meetings_db.json   │   │  Google Gemini API   │
                    │   (Structured DB)   │   │ (gemini-3.5-flash)   │
                    └─────────────────────┘   └──────────────────────┘
```
