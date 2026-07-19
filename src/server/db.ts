import fs from 'fs';
import path from 'path';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { Meeting } from '../types.js';

const DB_FILE_PATH = path.join(process.cwd(), 'meetings_db.json');

// Initialize database with some realistic sample meetings for interviewers
const INITIAL_MEETINGS: Meeting[] = [
  {
    id: 'sample-1',
    title: 'Project Phoenix Kickoff Meeting',
    date: '2026-07-16T14:00:00.000Z',
    durationSeconds: 1800,
    summary: 'The Project Phoenix kickoff successfully aligned the engineering, design, and product marketing teams. We established the core milestones for Q3, including a beta release by late August and a public launch in late September. Design assets will be finalized within two weeks to allow frontend engineering to begin building screens. There is a general sense of urgency but high enthusiasm across the board.',
    risks: [
      'Frontend start could be delayed if the final design prototypes leak into week 3.',
      'Integrating the legacy authorization API might pose security and timing challenges.',
      'Holiday schedule in late August might temporarily reduce active engineering capacity.'
    ],
    transcriptText: `Rahul: Welcome everyone to the Project Phoenix kickoff. I'm really excited to get this started. Let's align on the core Q3 milestones.
Sarah: From design side, we are currently finishing the mobile layouts. We should have the full high-fidelity Figma files complete in two weeks, which will be August 1st.
Rahul: That's perfect Sarah. Devs will need those assets immediately. Priya, what is the engineering timeline?
Priya: Once we get Figma from Sarah on August 1st, we'll need about three weeks to build the initial beta screens. We want to shoot for a beta release on August 24th. But we do have a risk: the legacy auth API integration is tricky. It could block us if we hit bugs.
Rahul: Good call. Let's make sure we test auth early. John, how about product marketing and followups?
John: I will draft the public launch marketing materials by August 15th. We need to be ready for a late September launch.
Rahul: Great. I will set up our weekly syncs. Let's make sure Sarah delivers Figma on time. Thank you!`,
    sourceType: 'transcript',
    sourceFileName: 'phoenix_kickoff_transcript.txt',
    followUpEmail: `Subject: Project Phoenix Kickoff - Action Items & Milestones

Hi Team,

Great kickoff session today! Here is a summary of our discussion, core milestones, and assigned tasks:

Key Highlights & Q3 Milestones:
- Figma designs completed by Aug 1st.
- Target Beta release on Aug 24th.
- Public launch planned for late September.

Action Items:
1. Complete Figma designs (Owner: Sarah, Deadline: August 1st)
2. Build beta screens & resolve legacy auth API integration (Owner: Priya, Deadline: August 24th)
3. Draft public launch marketing materials (Owner: John, Deadline: August 15th)

Risks Identified:
- Frontend start delayed if designs slide past Aug 1st.
- Complexities with the legacy auth API.

Let's keep up the momentum!

Best regards,
Rahul`,
    tasks: [
      {
        id: 't1',
        meetingId: 'sample-1',
        taskDescription: 'Complete and share high-fidelity Figma designs',
        assigneeName: 'Sarah',
        deadline: 'August 1st',
        status: 'pending'
      },
      {
        id: 't2',
        meetingId: 'sample-1',
        taskDescription: 'Build beta screens and address legacy auth API integration risks',
        assigneeName: 'Priya',
        deadline: 'August 24th',
        status: 'pending'
      },
      {
        id: 't3',
        meetingId: 'sample-1',
        taskDescription: 'Draft public launch marketing materials',
        assigneeName: 'John',
        deadline: 'August 15th',
        status: 'pending'
      }
    ],
    chatHistory: [
      {
        id: 'c1',
        meetingId: 'sample-1',
        userQuery: 'What did Priya say about the engineering risk?',
        aiResponse: 'Priya highlighted that integrating the legacy auth API is complex and could potentially block or delay the beta timeline if the team encounters bugs early in development.',
        timestamp: '2026-07-16T14:35:00.000Z'
      }
    ]
  },
  {
    id: 'sample-2',
    title: 'Weekly UI Design Review',
    date: '2026-07-17T10:00:00.000Z',
    durationSeconds: 1200,
    summary: 'The design review focused on simplifying the user onboarding flows. The current 5-step funnel was deemed too long, causing high dropoff rates. The team agreed to condense onboarding into a 3-step process. Additionally, the typography scale was adjusted for better contrast and legibility.',
    risks: [
      'Aggressive onboarding simplification might omit important compliance fields.',
      'Shorter funnel needs detailed engineering verification to ensure backend handles combined requests.'
    ],
    transcriptText: `Sarah: Hey team, today let's look at the user onboarding metrics. We are seeing a 45% dropoff rate at step 4.
Rahul: That's way too high. Why do we have 5 steps anyway? Can we combine them?
Sarah: Yes, we can merge step 2 and 3, and completely remove step 5. That would leave us with a clean 3-step onboarding. I can design the prototype by Monday.
Rahul: Priya, can backend support this consolidated onboarding request?
Priya: It should be fine, but we'll need to modify the user creation payload. I can start working on the backend model updates as soon as Sarah shares the updated layout on Monday. I should have it ready by next Thursday.
Rahul: Excellent. Let's do this.`,
    sourceType: 'notes',
    sourceFileName: 'design_notes.txt',
    followUpEmail: `Subject: Onboarding Flow Simplification - Action Items

Hi Team,

Thanks for a productive design review today. We have decided to address our 45% onboarding dropoff rate by condensing our flows.

Summary of Plan:
- Merge Steps 2 and 3, and delete Step 5 to create a clean 3-step onboarding flow.

Action Items:
1. Design consolidated 3-step onboarding mockups (Owner: Sarah, Deadline: Monday)
2. Update backend user schema and payload models (Owner: Priya, Deadline: Next Thursday)

We will review Sarah's prototypes on Tuesday morning.

Best,
Rahul`,
    tasks: [
      {
        id: 't4',
        meetingId: 'sample-2',
        taskDescription: 'Design consolidated 3-step onboarding mockups',
        assigneeName: 'Sarah',
        deadline: 'Monday',
        status: 'completed'
      },
      {
        id: 't5',
        meetingId: 'sample-2',
        taskDescription: 'Update backend user creation payload models',
        assigneeName: 'Priya',
        deadline: 'Next Thursday',
        status: 'pending'
      }
    ],
    chatHistory: []
  }
];

let firestoreDb: Firestore | null = null;
let isFirebaseAttempted = false;

function getFirestoreDb(): Firestore | null {
  if (isFirebaseAttempted) return firestoreDb;
  isFirebaseAttempted = true;

  try {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (projectId && clientEmail && privateKey) {
      if (getApps().length === 0) {
        initializeApp({
          credential: cert({
            projectId,
            clientEmail,
            privateKey: privateKey.replace(/\\n/g, '\n'),
          }),
        });
      }
      firestoreDb = getFirestore();
      console.log('Firebase Firestore initialized successfully via Environment Variables.');
    } else {
      console.log('Firebase credentials not complete in .env. Using local JSON database (meetings_db.json).');
    }
  } catch (error) {
    console.error('Failed to initialize Firebase Admin SDK:', error);
  }

  return firestoreDb;
}

export async function readDatabase(): Promise<Meeting[]> {
  const db = getFirestoreDb();
  if (db) {
    try {
      const snapshot = await db.collection('meetings').get();
      if (!snapshot.empty) {
        const meetings: Meeting[] = [];
        snapshot.forEach(doc => {
          meetings.push({ id: doc.id, ...doc.data() } as Meeting);
        });
        // Sort by date descending
        return meetings.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      }
      
      console.log('Firestore collection is empty. Seeding with initial sample meetings...');
      await writeDatabase(INITIAL_MEETINGS);
      return INITIAL_MEETINGS;
    } catch (error) {
      console.error('Error reading from Firestore, falling back to local file:', error);
    }
  }

  try {
    if (!fs.existsSync(DB_FILE_PATH)) {
      fs.writeFileSync(DB_FILE_PATH, JSON.stringify(INITIAL_MEETINGS, null, 2), 'utf-8');
      return INITIAL_MEETINGS;
    }
    const data = fs.readFileSync(DB_FILE_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading local meetings database:', error);
    return INITIAL_MEETINGS;
  }
}

export async function writeDatabase(meetings: Meeting[]): Promise<void> {
  // 1. Local copy first for high safety
  try {
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(meetings, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error writing local database file:', error);
  }

  // 2. Synchronize to Firestore if available
  const db = getFirestoreDb();
  if (db) {
    try {
      const batch = db.batch();
      
      // Delete previous meetings
      const snapshot = await db.collection('meetings').get();
      snapshot.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      // Write new meetings
      meetings.forEach(meeting => {
        const docRef = db.collection('meetings').doc(meeting.id);
        const { id, ...data } = meeting;
        batch.set(docRef, data);
      });
      
      await batch.commit();
      console.log('Successfully persisted and synchronized all meetings to Firestore.');
    } catch (error) {
      console.error('Error writing to Firestore batch:', error);
    }
  }
}
