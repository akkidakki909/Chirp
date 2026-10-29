CHIRP ADMIN PANEL PATCH (additive; does not change the database)

1. Copy AdminPanel.jsx to:
   frontend/src/pages/AdminPanel.jsx

2. Open frontend/src/App.jsx. Add this import alongside the other page imports:
   import AdminPanel from './pages/AdminPanel'

3. Inside the EXISTING nested <Route element={<Layout />}> block, add:
   <Route path="/admin" element={<AdminPanel />} />
   Do not remove or replace any existing routes.

4. The component calls these authenticated backend endpoints:
   GET   /api/admin/reports?status=all
   PATCH /api/admin/reports/:id
   GET   /api/admin/users
   PATCH /api/admin/users/:id/role
   PATCH /api/admin/users/:id/status

   These endpoints must be implemented and mounted by your existing backend moderation/futureScope routes. In server.js, a common setup is:
   import futureScopeRoutes from './routes/futureScope.js';
   app.use('/api', futureScopeRoutes);
   Only add these if they are not already present; never duplicate route mounts.

5. Restart frontend and backend, log in with an account whose database role is admin (or moderator for reports), then open:
   http://localhost:5173/admin

If the page loads but shows 401/403, the frontend route is now working; the remaining issue is the login token or database role. If it shows a route/API error, inspect the backend terminal and browser Network tab. This patch was not tested against your live local database.
