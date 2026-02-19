# Smart Bookmark App

A simple bookmark manager built with Next.js, Supabase, and Tailwind CSS. Users can sign up and log in using Google OAuth, add private bookmarks (URL + title), view their bookmarks in real-time, and delete them.

## Features

- Google OAuth authentication (no email/password)
- Private bookmarks per user
- Real-time updates without page refresh
- Add and delete bookmarks
- Responsive UI with Tailwind CSS

## Tech Stack

- Next.js (App Router)
- Supabase (Auth, Database, Realtime)
- Tailwind CSS
- TypeScript

## Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up Supabase:
   - Create a new Supabase project
   - Enable Google OAuth in Authentication > Providers
   - Create a table `bookmarks` with columns:
     - `id` (uuid, primary key, default gen_random_uuid())
     - `user_id` (uuid, foreign key to auth.users)
     - `title` (text)
     - `url` (text)
     - `created_at` (timestamptz, default now())
   - Enable Row Level Security and create policies for user access
4. Copy `.env.local` and fill in your Supabase URL, anon key, and site URL
5. Run the development server: `npm run dev`

## Deployment

Deploy to Vercel by connecting your GitHub repository. Set the environment variables in Vercel dashboard.

Live URL: [Add your Vercel URL here]

## Problems and Solutions

- Node.js version compatibility: Local Node version was 20.5.0, but Next.js requires >=20.9.0. This was resolved by deploying to Vercel, which uses compatible Node versions.
- Supabase RLS setup: Ensured proper policies so users can only access their own bookmarks.
- Real-time updates: Used Supabase's postgres_changes to listen for INSERT and DELETE events on the bookmarks table.
