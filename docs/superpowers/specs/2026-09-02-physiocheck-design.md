# PhysioCheck — Design Spec

## Overview

PhysioCheck is a Physiotherapy Digital Assessment System where therapists select a specialty, get a complete assessment page with all relevant sections (subjective, history, examination, special tests, outcome measures), fill it for their patient, and get progress tracking and PDF reports.

## Decisions

- **Specialty-based pages:** Each of the 10 specialties has its own assessment page with all sections visible. No condition-level selection.
- **Single-user type:** Therapist only. No admin panel. Clinical data seeded via scripts.
- **Persistent patients:** Patient profiles saved for progress tracking across visits.
- **Local MongoDB:** Prototype runs entirely on localhost. Cloud migration = swap connection string.
- **Score-only outcome measures:** Therapist enters pre-calculated scores (e.g., WOMAC: __/96). Full scorable questionnaires deferred to future.
- **Common fields on every page:** Patient details and pain assessment (VAS/NPRS) appear at the top of every specialty assessment.
- **All sections visible:** Special tests grouped by body region are all visible at once (no collapsible sections for now).

## Tech Stack

| Layer | Choice |
|-------|--------|
| Frontend | React + Vite |
| Routing | React Router |
| Styling | Tailwind CSS |
| Backend | Node.js + Express |
| Database | MongoDB + Mongoose |
| Auth | JWT (jsonwebtoken + bcrypt) |
| PDF | jsPDF |
| Charts | Recharts |
| Package Manager | npm |

## Project Structure

```
physiocheck/
├── frontend/                # React + Vite
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/           # Route-level pages
│   │   ├── services/        # API call functions
│   │   ├── context/         # Auth context
│   │   ├── utils/           # Scoring, PDF helpers
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── tailwind.config.js
│   └── package.json
│
├── backend/                 # Node.js + Express
│   ├── models/              # Mongoose schemas
│   ├── routes/              # API routes
│   ├── middleware/           # Auth middleware
│   ├── seed/                # Clinical data seeding scripts
│   ├── server.js
│   └── package.json
│
└── README.md
```

## Data Models

### User

```
name: String, required
email: String, required, unique
password: String, required (hashed with bcrypt)
createdAt: Date
```

### Patient

```
therapistId: ObjectId (ref: User)
name: String, required
age: Number, required
gender: String (Male/Female/Other)
diagnosis: String
date: Date
createdAt: Date
```

### Specialty (seeded clinical data)

```
name: String (e.g., "Orthopaedic")
icon: String (emoji or icon identifier)
sections: [
  {
    title: String (e.g., "Assessment", "History", "Physical Examination")
    subsections: [
      {
        title: String (e.g., "Observation", "Palpation", "ROM")
        fields: [
          { label: String, type: String (text/number/dropdown/checkbox/textarea), options: [String] }
        ]
      }
    ]
  }
]
specialTests: [
  {
    group: String (e.g., "Knee", "Shoulder")
    tests: [
      { name: String, resultOptions: ["Positive", "Negative"] }
    ]
  }
]
outcomeMeasures: [
  { name: String, maxScore: Number, unit: String }
]
```

### Assessment

```
patientId: ObjectId (ref: Patient)
specialtyId: ObjectId (ref: Specialty)
therapistId: ObjectId (ref: User)
date: Date
commonFields: {
  patientName: String
  age: Number
  gender: String
  diagnosis: String
  vas: Number (0-10)
  nprs: Number (0-10)
}
findings: Object (stores all filled values keyed by section/subsection/field)
specialTestResults: Object (keyed by test name -> "Positive"/"Negative")
outcomeScores: Object (keyed by measure name -> score entered)
problemList: [String]
goals: { shortTerm: [String], longTerm: [String] }
notes: String
createdAt: Date
```

## 10 Specialties

1. Orthopaedic
2. Neurological
3. Cardiopulmonary
4. Paediatric
5. Geriatric
6. Sports
7. Women's Health
8. Hand Rehabilitation
9. Burns Rehabilitation
10. Amputee Rehabilitation

Each specialty page has these sections (content varies per specialty):
1. Common Fields (patient details, VAS/NPRS pain assessment)
2. Assessment / Subjective
3. History
4. Physical Examination (with subsections like Observation, Palpation, ROM, etc.)
5. Special Tests / Scales
6. Outcome Measures (score-only entry)

## Pages & Routes

| Page | Route | Purpose |
|------|-------|---------|
| Register | /register | Therapist sign up |
| Login | /login | Therapist login |
| Dashboard | /dashboard | Welcome, quick stats, recent patients |
| New Patient | /patients/new | Create patient profile |
| Patient Detail | /patients/:id | Patient info, past assessments, progress |
| Select Specialty | /patients/:id/assess | Choose from 10 specialties |
| Assessment Form | /patients/:id/assess/:specialtyId | Full specialty assessment page |
| Assessment Detail | /patients/:id/assessments/:assessmentId | View completed assessment, generate PDF |

## API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | /api/auth/register | Register therapist |
| POST | /api/auth/login | Login, returns JWT |
| GET | /api/patients | List therapist's patients |
| POST | /api/patients | Create patient |
| GET | /api/patients/:id | Get patient detail |
| GET | /api/specialties | List all 10 specialties (name + icon) |
| GET | /api/specialties/:id | Get full specialty data (sections, tests, measures) |
| POST | /api/assessments | Save completed assessment |
| GET | /api/assessments/patient/:patientId | All assessments for a patient |
| GET | /api/assessments/:id | Single assessment |

## Assessment Flow

1. Therapist clicks "New Assessment" on a patient's page
2. Frontend fetches /api/specialties -> shows 10 specialty cards
3. Therapist picks a specialty (e.g., Orthopaedic)
4. Frontend fetches /api/specialties/:id -> loads full section data
5. Page renders: common fields at top, then all sections with their subsections and fields
6. Special tests shown grouped by body region, all visible
7. Outcome measures shown as score-entry fields
8. Therapist fills relevant sections -> submits -> POST /api/assessments
9. Therapist can view saved assessment, generate PDF, or compare with future assessments

## Build Order

### Phase 1 — Foundation
1. Setup both projects (Vite + Express + MongoDB connection)
2. User model + auth routes (register/login/JWT)
3. Auth context + protected routes on frontend
4. Login & Register pages
5. Dashboard page (empty shell)

### Phase 2 — Core Assessment Engine
1. Patient model + CRUD routes
2. New Patient page + Patient Detail page
3. Specialty model + seed script (all 10 specialties with their sections, tests, outcome measures)
4. Select Specialty page (10 specialty cards)
5. Assessment Form page — renders sections dynamically from specialty data
6. Assessment Detail page (view filled assessment)

### Phase 3 — Scoring, Progress & Reports
1. Problem list generator (suggest problems based on findings)
2. Goal templates (editable short-term and long-term goals)
3. Progress tracking — compare assessments over time on Patient Detail page
4. Charts with Recharts (pain, ROM, scores over time)
5. PDF report generation with jsPDF
