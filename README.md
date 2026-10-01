# NSBE Member Management System

A web application for managing NSBE chapter membership, attendance, events, newsletters, and job postings. The project is built with Express.js and integrates with Google Sheets as the backend data source for member records and program operations.

## Overview

This project is designed to support the day-to-day operations of an NSBE chapter by combining:

- member intake and record management
- VP-only admin dashboard access
- event tracking and attendance logging
- newsletter creation and recipient tracking
- job posting management for chapter members
- CSV export for member data

The app currently serves a small, practical internal tooling workflow for a student organization using a Google Workspace-based data model.

## Current Features
- Membership registration, members filtering
- Add and filter job postings 
- Event creation

### Member management
- Add new members through a public intake endpoint or dashboard
- View, search, filter, and update membership records
- Mark member status as Active, Inactive, or Pending
- Export member data as CSV

### VP dashboard
- Secured dashboard routes with session-based Google OAuth verification
- Access control for the authorized NSBE VP account
- Data operations for members and events through protected API endpoints

### Attendance tracking
- Manage attendance records tied to events
- Support attendance-based workflows for chapter activities

### Newsletters and job postings
- Create newsletters with subject, content, and sent date
- View newsletter history in the UI
- Post and filter job opportunities by title or tag
- Provide job application links for member visibility

### Data layer
- Google Sheets integration via the Google Sheets API
- Automatic sheet initialization for members, attendance, events, newsletter records, and jobs
- Validation using Zod schemas for API safety

## Tech Stack

- Node.js
- Express.js
- Google APIs / Google Sheets integration
- Express Session for VP authentication
- Zod for request validation
- HTML/CSS/JavaScript front-end pages in the public directory

## Project Structure

```text
Nsbe_members/
├── public/
│   ├── attendance.html
│   ├── dashboard.html
│   ├── index.html
│   ├── newsletter.html
│   ├── privacy.html
│   └── terms.html
├── src/
│   ├── attendanceApi.js
│   ├── attendanceSheets.js
│   ├── auth.js
│   ├── csvUtils.js
│   ├── dashboardApi.js
│   ├── dashboardAuth.js
│   ├── dashboardSheets.js
│   ├── googleSheets.js
│   ├── logger.js
│   ├── newsletterApi.js
│   ├── newsletterSheets.js
│   ├── server.js
│   ├── validation.js
│   └── ...
├── test/
│   ├── attendanceSheets.test.js
│   ├── dashboardSheets.test.js
│   ├── googleSheets.test.js
│   └── newsletterSheets.test.js
├── .env.example (if added later)
├── package.json
├── render.yaml
├── token.json
└── README.md
```

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Set up environment variables in a `.env` file:

```env
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URL=http://localhost:3000/auth/callback
SESSION_SECRET=your-session-secret
ALLOWED_ORIGINS=http://localhost:3000
```

For production deployments, also configure the appropriate environment variables required by your hosting platform.

3. Start the application:

```bash
npm start
```

4. Open the following routes in a browser:

- `http://localhost:3000/` for the main site
- `http://localhost:3000/dashboard` for the admin dashboard
- `http://localhost:3000/attendance` for attendance tools
- `http://localhost:3000/newsletter` for newsletters and job postings

## Authentication Notes

The dashboard and protected newsletter/job submission features require Google OAuth authorization for the configured VP account. Users must authenticate through the `/auth` flow before the app can initialize Google Sheets access.

## Development Notes

- The project uses a Google Sheets-backed data model, so the app depends on the correct sheet permissions and service setup.
- Validation is enforced for member, event, newsletter, and job data.
- The application is well-suited for continued expansion into RSVP tools, announcements, chapter analytics, and public-facing NSBE web pages.

## License

This project currently uses the ISC license as defined in the package metadata.

## Status

This is an early-stage member management and operations platform for NSBE chapter administration. The core infrastructure is in place and the project is actively built around Google Sheets-driven workflows and authenticated admin tools.
