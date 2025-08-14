# DoBi Steel Fixing — Daily Docket & Payroll Web App

A lightweight web app for Australian steel-fixing operations to capture **daily dockets**, track **worker hours**, manage **contractors/builders**, and generate **weekly payments**—with optional **AI insights** on activity trends.

## Features
- **Auth & Roles:** Admin, Supervisor, Worker (role-aware UI).
- **Daily Dockets:** Date, company/builder, location, schedule no., notes, photos.
- **Worker Hours:** Tonnage work & day-labour hours per worker.
- **Admin Tools:** Manage contractors (ABN, rates), builders & locations, weekly payments.
- **Search/Filter:** Quickly find contractors and dockets.
- **Email Flows:** Verification & password reset (via SendGrid or similar).
- **AI (optional):** Backend analysis (OpenAI API) to summarize usage/insights.

## Tech Stack & Architecture
- **Frontend:** Next.js + Tailwind CSS  
- **Backend:** Next.js API routes (MVC-style business logic, RESTful endpoints)  
- **Database:** MySQL (users, dockets, workers, photos, weekly_payments, builders, locations, contractors)  
- **Email:** SendGrid (or equivalent)  
- **AI:** OpenAI API for summarization/insights (optional)

## Quick Start
```bash
# 1) Clone & install
git clone <your-repo-url>
cd <repo> && npm install

# 2) Configure env (.env)
# DATABASE_URL=mysql://user:pass@localhost:3306/dobi
# SENDGRID_API_KEY=...
# OPENAI_API_KEY=...        # optional if using AI
# APP_URL=http://localhost:3000

# 3) Init DB (create schema & run migrations)
# Use your preferred ORM/tooling to create the tables listed below.

# 4) Run
npm run dev
