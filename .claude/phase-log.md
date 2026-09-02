# Phase Log - Member Management System

## Project Setup
- **Stack**: Node.js/Express, Google Sheets API, Google OAuth
- **Working Dir**: /Users/kighamkerry/member-management-system

## Phases
1. Google Form + Google Sheets DB (4h)
2. Admin Dashboard for VP (6h)
3. Event tracking (4h)
4. Newsletter + Job postings (3h)

---

## Phase 1: Google Form + Google Sheets Integration
- **Status**: CLEAN ✓
- **Files**: src/auth.js, src/server.js, src/googleSheets.js, src/logger.js, src/validation.js
- **Exports**: `appendMember(data)`, `getAllMembers()`, `getMemberByEmail(email)`, `initializeSheet()`, `getAuthUrl()`, `handleCallback(code)`, `validateMember(data)`
- **Constraints**: 
  - Sheet must have headers: Name, Email, Phone, Date Joined, Status
  - OAuth tokens stored in token.json (dev only); production needs secure storage
  - CORS restricted to ALLOWED_ORIGINS env var
  - Email & input validation via Zod schema

## Phase 2: Admin Dashboard for VP
- **Status**: CLEAN ✓
- **Files**: src/dashboardSheets.js, src/dashboardAuth.js, src/dashboardApi.js, src/csvUtils.js, public/dashboard.html
- **Exports**: `deleteMember(email)`, `updateMember(email, data)`, `addEvent(data)`, `getEvents()`, `verifyVP()`, `setVPSession(req, userEmail)`, `escapeCSV(value)`, `toCSV(data, headers)`
- **Key Routes**: 
  - GET /dashboard - Dashboard UI
  - GET /dashboard/api/members - fetch with search/filter
  - PUT /dashboard/api/members/:email - update
  - DELETE /dashboard/api/members/:email - delete
  - GET /dashboard/api/events - fetch events
  - POST /dashboard/api/events - add event
  - GET /dashboard/api/export - CSV export
- **Security**:
  - Session-based auth (x-user-email placeholder replaced with express-session)
  - VP email validation at OAuth callback
  - XSS prevention (textContent instead of innerHTML)
  - CSV injection prevention (proper escaping)
  - Input validation via Zod schemas
  - Secure cookies (httpOnly, sameSite=strict)

---

