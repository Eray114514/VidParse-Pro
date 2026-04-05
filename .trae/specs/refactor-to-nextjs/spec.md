# Video Parser Refactor Spec

## Why
The current Vite-based SPA relies on unstable free proxies and client-side parsing, resulting in frequent failures for Bilibili and fake parsing for YouTube. A Next.js full-stack approach with a multi-channel fallback parsing gateway will provide robust, high-quality video parsing without CORS issues, wrapped in a modern, beautiful UI.

## What Changes
- Replace Vite/React setup with Next.js App Router framework.
- Implement modern UI using Tailwind CSS, shadcn/ui, and Framer Motion.
- Create backend API routes for video parsing (`/api/parse`).
- Implement multi-channel parsing for Bilibili: Official API (with `SESSDATA`) -> Cobalt API -> Third-party fallback.
- Implement multi-channel parsing for YouTube: Cobalt API -> `yt-dlp` (via Vercel Python serverless).
- Ensure Vercel deployment configuration (`vercel.json`, `requirements.txt`) is correct.
- Push the refactored code to the remote `main` branch.
- **BREAKING**: Removes client-side only parsing, transitioning to Serverless functions.

## Impact
- Affected specs: Complete application architecture replacement.
- Affected code: All files in `/workspace` will be replaced or significantly modified.

## ADDED Requirements
### Requirement: Multi-Channel Parsing Gateway
The system SHALL provide a robust parsing backend that automatically tries multiple methods if one fails.

#### Scenario: Bilibili Parsing (Non-Premium User)
- **WHEN** user inputs a Bilibili video URL
- **THEN** the system requests the Official API with `SESSDATA` capping the quality at 1080P (qn=80) since the user has no premium.
- **AND IF** Official API fails, it falls back to Cobalt API.
- **AND IF** Cobalt API fails, it falls back to a third-party API.

#### Scenario: YouTube Parsing
- **WHEN** user inputs a YouTube video URL
- **THEN** the system requests the Cobalt API to fetch the muxed (audio+video) 1080P file.
- **AND IF** Cobalt API fails, it falls back to the Vercel Python Serverless function running `yt-dlp`.

### Requirement: Vercel Deployment Support
The system SHALL include a `vercel.json` configuration file and a `requirements.txt` to ensure both Next.js Node.js Serverless and Python Serverless functions run correctly on Vercel.

## REMOVED Requirements
### Requirement: Vite/React SPA
**Reason**: Client-side proxying is too unstable and prone to CORS/blocking issues.
**Migration**: Migrating entirely to Next.js Full-Stack architecture.
