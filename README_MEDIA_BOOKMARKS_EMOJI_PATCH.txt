Chirp patch: post creation, local image uploads (Multer), emoji picker, persistent bookmarks, and demo conversations.

Apply these files to the matching paths in the existing Chirp-connected project. Do not overwrite .git or .env.

1) In backend, run: npm install (installs multer from updated package.json and updates package-lock.json).
2) In pgAdmin Query Tool, select the existing chirp database and run backend/src/migrations/004_media_bookmarks.sql once. This is additive and does not reset data.
3) Ensure backend/.env has the working DATABASE_URL and JWT_SECRET.
4) Restart backend (npm run dev) and frontend (npm run dev).
5) New post composer accepts up to 4 JPG/PNG/GIF/WEBP images, 5 MB each, plus a categorized emoji picker. Text is limited to the schema's 280 characters.
6) Bookmarks persist in PostgreSQL. On first bookmark-page load, if the account has no bookmarks, it bookmarks up to two recent posts from other users as demo content.
7) Messages page seeds up to four demo conversations from existing users only when the signed-in user has no message history; those chats can then be replied to normally.

Uploads are stored in backend/uploads and served from /uploads. Add backend/uploads/ to .gitignore if not already ignored; do not commit uploaded user photos.
