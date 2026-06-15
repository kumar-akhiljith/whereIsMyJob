<img width="1118" height="571" alt="image" src="https://github.com/user-attachments/assets/eda281d3-76ff-4fdf-9683-d2059bdff8a3" />


# Where Is My Job

Where Is My Job is a Chromium-based browser extension that helps job seekers save, organize, and track job applications from LinkedIn and other job sites. It combines application tracking, resume management, and AI-powered assistance into a single workflow.

## Features

### Job Tracking
- Save job applications with a single click
- Track application status:
  - Applied
  - Interviewing
  - Offer
  - Rejected
  - Ghosted
- View all applications in a centralized dashboard
- Pagination support for large job lists

### Resume Management
- Upload and manage multiple resumes
- Secure resume storage using Supabase Storage
- Select a default resume for applications
- Assign job-specific resumes when needed
- Replace resumes for individual applications

### AI-Powered Extraction
- Extract job details automatically:
  - Job title
  - Company name
  - Location
  - Job description
- Supports LinkedIn and other job websites
- OpenRouter AI integration
- Self-hosted LLM fallback using llama.cpp and Qwen 2.5

### AI Assistance
- Generate personalized application emails
- Generate rejection response emails
- Summarize job descriptions
- Additional AI-powered job search utilities

### Authentication
- Google OAuth login
- JWT-based authentication
- Secure user isolation

---

## System Architecture

```text
Chrome Extension
       │
       ▼
Node.js Backend (Render)
       │
       ├── Google OAuth
       ├── MongoDB Atlas
       ├── Supabase Storage
       ├── Redis Queue (BullMQ)
       │
       ▼
AI Worker (AWS EC2)
       │
       ├── OpenRouter API
       └── Self-hosted Qwen 2.5 (llama.cpp)
```

### AI Processing Flow

```text
User clicks Save Job
        │
        ▼
Job saved immediately
        │
        ▼
Status = Processing
        │
        ▼
Request queued in Redis
        │
        ▼
AI Worker processes request
        │
        ▼
Job updated with extracted data
        │
        ▼
Status = Completed
```

This asynchronous architecture ensures users do not wait for AI processing and allows the platform to scale efficiently.

---

## Tech Stack

### Frontend
- JavaScript
- HTML
- CSS
- Chrome Extension Manifest V3

### Backend
- Node.js
- Express.js

### Database
- MongoDB Atlas

### Storage
- Supabase Storage

### Authentication
- Google OAuth 2.0
- JWT

### AI
- OpenRouter
- Qwen 2.5
- llama.cpp

### Infrastructure
- Render
- AWS EC2
- Redis
- BullMQ
- UptimeRobot

---

## Project Structure

```text
where-is-my-job/
│
├── extension/
│   ├── popup.html
│   ├── popup.js
│   ├── content.js
│   ├── background.js
│   ├── jobs.html
│   ├── sidepanel.html
│   └── sidepanel.js
│
├── backend/
│   ├── routes/
│   ├── models/
│   ├── services/
│   ├── middleware/
│   ├── utils/
│   └── workers/
│
├── docs/
│
└── README.md
```

---

## Installation

### Backend

```bash
git clone https://github.com/yourusername/where-is-my-job.git

cd backend

npm install

npm run dev
```

### Extension

1. Open Chrome
2. Navigate to:

```text
chrome://extensions
```

3. Enable Developer Mode
4. Click **Load unpacked**
5. Select the extension directory

---

## Environment Variables

Create a `.env` file:

```env
PORT=

MONGODB_URI=

JWT_SECRET=

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

CLIENT_URL=

SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=

OPENROUTER_API_KEY=

REDIS_URL=

LLAMA_SERVER_URL=
```

---

## Scalability

The platform is designed to support thousands of users through:

- Stateless backend architecture
- Redis-based job queue
- Background AI workers
- Horizontal worker scaling
- AI provider failover
- Decoupled resume storage

---

## Roadmap

- AI-powered cover letter generation
- Interview preparation assistant
- Resume optimization suggestions
- Job match scoring
- Recruiter email discovery
- Job analytics dashboard
- Premium subscription features

---

## Security

- JWT authentication
- Google OAuth sign-in
- Secure resume storage
- User data isolation
- No password storage

---

## License

MIT License

---

## Author

Akhiljith K

Where Is My Job was built to simplify the job application process by helping users save, organize, and manage applications while leveraging AI to reduce repetitive tasks during the job search journey.
