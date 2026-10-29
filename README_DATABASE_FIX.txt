Chirp database connection fix

Copy backend/src/db/pool.js into the same path in your Chirp-connected project, replacing that file.

Then check backend/.env. The code expects DATABASE_URL in this form:
DATABASE_URL=postgresql://postgres:YOUR_REAL_PASSWORD@localhost:5432/chirp

Replace YOUR_REAL_PASSWORD with the actual password for your local PostgreSQL user, and chirp with your actual database name if different. If you prefer to keep the URL without a password, set a separate DB_PASSWORD=your_real_password line in backend/.env.

Do not commit backend/.env or share the password. Restart the backend after saving:
  cd C:\Users\aksha\Desktop\Chirp-connected\backend
  npm run dev

This patch improves configuration handling and error messages; it cannot infer or supply your actual PostgreSQL password.
