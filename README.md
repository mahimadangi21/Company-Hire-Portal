# KL HIRE Dashboard - Integrated Recruitment Portal & Video Screening Engine

An admin-controlled recruitment workflow platform designed to manage the end-to-end interview process — from resume upload through AI parsing, candidate forms, video bot screening, technical scheduling, and report generation.

This project is a monorepo containing the main admin portal, a video screening engine, and an AI resume parser, all connected to a persistent Supabase database.

---

## 🚀 System Architecture

The portal is composed of three interconnected services:
1.  **Vite React Portal (`/app`)**: The administrative control center running on port `5173`.
2.  **Next.js Video Engine & API Backend (`/video-bot`)**: The core microservice running on port `3000` that interacts with Supabase, handles video recording, triggers transcription/AI summaries, and sends emails.
3.  **ATS Resume Intelligence Engine (`/ATS - Data extract Open AI`)**: An Express-based parsing service running on port `3001` that extracts structured candidate profiles from PDF resumes using Groq LLM.

---

## ⚙️ Step-by-Step Installation & Setup

Follow these steps to set up and run the entire portal on your local machine:

### 1. Database Setup (Supabase)
You need a Supabase project. In your Supabase Dashboard SQL Editor, run the following files:
*   First, copy and run the contents of [supabase-schema.sql](file:///c:/Users/achyu/Desktop/VideoScreenBot/KL_HIRE_Dashboard/video-bot/supabase-schema.sql) to set up the core `interviews` table, `questions_bank` table, storage buckets, and RLS policies.
*   Second, copy and run the contents of [jobs-candidates-schema.sql](file:///c:/Users/achyu/Desktop/VideoScreenBot/KL_HIRE_Dashboard/video-bot/jobs-candidates-schema.sql) to set up the persistent `jobs` and `candidates` tables.

### 2. Environment Variables Configuration

#### A. Video Engine & API Backend (`/video-bot`)
Create a `.env.local` file inside the `video-bot` folder and define these keys:
```env
NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_PROJECT_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY

# Gmail SMTP for sending magic links
GMAIL_USER=YOUR_EMAIL@gmail.com
GMAIL_APP_PASSWORD=YOUR_GMAIL_APP_PASSWORD

# App URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_ADMIN_EMAIL=YOUR_EMAIL@gmail.com

# Groq API Key for Whisper (Transcription) and LLaMA (AI Interview Summary)
GROQ_API_KEY=YOUR_GROQ_API_KEY
```

#### B. ATS Resume Intelligence Engine (`/ATS - Data extract Open AI`)
Create a `.env` file inside the `ATS - Data extract Open AI` folder and define these keys:
```env
PORT=3001
GROQ_API_KEY=YOUR_GROQ_API_KEY
GROQ_MODEL=llama-3.3-70b-versatile
```

### 3. Dependencies Installation
From the root directory of `KL_HIRE_Dashboard`, run the following command to automatically install dependencies for all services:
```bash
npm run install:all
```
*(Alternatively, you can manually run `npm install` in `app`, `npm install --legacy-peer-deps` in `video-bot`, and `npm install` in the ATS parser folder).*

### 4. Running the Development Servers
Once dependencies are installed and environment variables are set up, run the following command in the root directory to spin up all three services concurrently:
```bash
npm run dev
```

This single command will boot:
*   **React Frontend** at `http://localhost:5173`
*   **Video Engine Backend** at `http://localhost:3000`
*   **Resume Parsing Backend** at `http://localhost:3001`

---

## 🛠️ Unified Recruitment Workflow

1.  **Job Posting**: Create a new job role in the **Job Postings** tab. This will persist the job in Supabase.
2.  **Resume Upload & AI Parsing**: Upload PDF resumes inside the **Resume Upload** tab. The ATS engine parses the resume via Groq, extracts skills, experience, projects, and education details, and saves the candidate permanently into the database.
3.  **Candidate Forms & Video Invites**:
    *   Set up questions for the job role in the **Video Bot Interview** tab's **Manage Question Bank** modal.
    *   From the **Video Bot Interview** tab, invite the candidate to screen. The backend will randomly select questions (always prioritizing mandatory ones) and email a secure, unique magic link to the candidate.
4.  **AI Video Screening**: The candidate uses the magic link to record their interview responses. Upon completion, the system:
    *   Transcribes the audio using **Groq Whisper**.
    *   Generates a structured bullet-point **AI Summary** using **Groq LLaMA**.
    *   Saves the video, transcript, and summary to Supabase.
5.  **Admin Evaluation**: Admins click **View Interview** on the dashboard to review candidate video replays, read transcripts, and view the AI generated performance summary.
6.  **Technical Scheduling**: For passing candidates, schedule technical interview panels in the **Technical Scheduler** tab.
