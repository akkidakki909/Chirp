CHIRP FIX PATCH — IMAGES, COMMENTS, PROFILES, MESSAGES

Copy the contents of this ZIP into the ROOT of your existing Chirp-connected folder, merging folders and replacing the listed files. Do not replace your .env, .git, database, or uploads folder.

Fixes included:
- Home feed recognizes images/imageUrls/image_urls and corrects API count field mapping.
- Post thread API returns image URLs and author details, so post detail can render the image and author.
- Post detail accepts all image/count field variants and supports replying to every top-level post.
- People-to-follow names, handles, and avatars navigate to /profile/:username.
- Profile page loads the actual profile/posts from /api/profiles/:username, with follow/unfollow and message actions.
- Messages UI uses the backend's actual /api/messages/conversations and /api/messages/with/:userId endpoints and maps database field names.
- PostCard normalizes local upload paths through mediaUrl.

After copying:
1. Stop backend and frontend terminals with Ctrl+C.
2. In backend folder, run: npm install
3. Start backend: npm run dev
4. In frontend folder, start: npm run dev
5. Test: Home image, click post, add a reply, click a suggested profile, open Messages and send a message.

This patch assumes the current branch already has the routes and migration 004 from the previous media/messages patch. It does not reset or recreate the database. If the Messages API still errors, inspect the backend terminal for the SQL error; the UI now logs the detailed response in the browser console.
