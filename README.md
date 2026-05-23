# 🪐 StudySphere

StudySphere is a collaborative student ecosystem built for growth. Accelerate your path through peer sessions, industry mentors, and project groups.

## 🚀 Features

- **Collaborative Learning:** Stop coding in isolation. Find students with the exact skills you need, build hackathon projects, and ship products together.
- **1-on-1 Mentorship:** Skip the generic advice. Schedule quick 1-on-1 video calls with seniors and alumni who already passed the exact classes and interviews you are stressing about.
- **Live Video Calls:** Built-in secure video rooms for seamless peer-to-peer and mentor sessions.
- **Opportunities Board:** Discover internships, hackathons, and fellowships shared across the student network.
- **Skill Exchange:** Match with peers to master new frameworks and elevate each other's technical ceilings.

## 🛠 Tech Stack

- **Frontend:** React, TypeScript, Vite, Tailwind CSS, Framer Motion
- **Backend:** Supabase (PostgreSQL, Auth, Edge Functions)
- **Video Infrastructure:** Jitsi Meet External API
- **Icons:** Lucide React

## 🏃‍♂️ Running Locally

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up your `.env.local` file with your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

## 🌐 Deployment

This project is optimized for deployment on [Vercel](https://vercel.com).
Simply import the GitHub repository into Vercel and ensure your environment variables are configured in the Vercel dashboard.
