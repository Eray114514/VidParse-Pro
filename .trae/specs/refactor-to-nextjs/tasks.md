# Tasks
- [ ] Task 1: Clean up existing Vite project and initialize Next.js App Router project with Tailwind CSS.
- [ ] Task 2: Install and configure modern UI libraries (shadcn/ui, Framer Motion, Lucide React).
- [ ] Task 3: Setup Next.js API Routes for Bilibili parsing (Official API -> Cobalt -> Fallback) capped at 1080P (qn=80).
- [ ] Task 4: Setup Python Serverless function (`api/yt.py`) and `requirements.txt` for `yt-dlp` fallback.
- [ ] Task 5: Setup Next.js API Routes for YouTube parsing (Cobalt -> Python yt-dlp fallback).
- [ ] Task 6: Build the modern frontend UI (Input form, Video Player, Download options, Error handling, Loading states).
- [ ] Task 7: Add `vercel.json` to configure deployment settings for both Node.js and Python functions.
- [ ] Task 8: Commit and push all changes to the remote `main` branch.
- [ ] Task 9: Provide user instructions on how to obtain `SESSDATA` from Bilibili.

# Task Dependencies
- [Task 2] depends on [Task 1]
- [Task 3] depends on [Task 1]
- [Task 5] depends on [Task 4]
- [Task 6] depends on [Task 2], [Task 3], and [Task 5]
- [Task 8] depends on [Task 1] through [Task 7]
