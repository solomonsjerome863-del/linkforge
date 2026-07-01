---
Task ID: 1
Agent: Main Agent
Task: Market-readiness audit and bug fixes for LinkForge AI

Work Log:
- Audited all 15 API routes and 6 SaaS views for bugs
- Created `/src/lib/auth-storage.ts` for localStorage session persistence
- Rewrote `/src/lib/store.ts` with hydration support and auto-save/clear
- Rewrote `/src/app/page.tsx` with hydration-safe loading pattern (no error boundary, no SSR flash)
- Fixed sites-view: polling URL wrong (missing userId), wrong response shape (data vs data.sites), missing error toast
- Fixed dashboard-view: user! null assertions, missing user in useEffect deps, silent error swallowing
- Fixed suggestions-view: added userId to all API calls, reject button loading state, error toast
- Fixed settings-view: removed calls to non-existent API routes, replaced with client-side persistence
- Created `/src/lib/api-auth.ts` shared validation helper
- Added userId validation to all 10 data API routes + ownership checks
- Fixed analytics-view: seeded random for consistent mock data, fixed funnel bar overflow
- Added delete confirmation dialog for sites
- Created `/src/app/api/pages/route.ts` API endpoint
- Created `/src/components/saas/pages-view.tsx` with summary cards, search, filter, sort, orphan badges
- Created `/src/app/api/suggestions/export/route.ts` for CSV/JSON export
- Wired Pages view into app-shell nav and types
- Updated layout metadata for launch (removed "Blueprint" branding)
- Fixed all ESLint errors (set-state-in-effect)

Stage Summary:
- 0 lint errors, 0 console errors
- Full auth flow tested: signup → dashboard → all 6 views → sign-out → re-login
- Session persistence verified: page reload keeps user logged in
- All API routes return 200 with proper auth validation
- Mobile responsive verified at 375px
