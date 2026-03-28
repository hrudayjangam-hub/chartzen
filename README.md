# 🧘‍♂️ ChatZen: Collaborative AI Workspace

**"Think together, build smarter."** ChatZen is a high-fidelity, collaborative AI assistant designed for real-time group dynamics and professional media editing.

---

## 🚀 Key Features

- **Collab-Sync (Group Chats):** Multi-member sessions with real-time identity switching and AI-awareness.
- **VidGen Studio:** Real-time video manipulation tool (Speed, Trim, Mute) built directly into the conversation.
- **Serverless Full-Stack:** Cloud-persistence and instant syncing using **Supabase** (No Node.js required).
- **Multi-Engine Intelligence:** Supports **OpenAI (GPT-4o)** and **Google Gemini** with automatic fallback.
- **Cyber-Zen Theme:** A premium Electric Purple & Neon Blue glassmorphic UI.

---

## 🛠️ Global Setup (One-Time)

### 1. Database (Supabase)
1. Create a project at [supabase.com](https://supabase.com).
2. Go to the **SQL Editor** and run the following schema:
   ```sql
   create table public.chatzen_sessions (
     id text primary key,
     title text not null,
     tags jsonb default '[]',
     members jsonb default '[]',
     active_member_id text,
     created_at timestamp with time zone default now()
   );

   create table public.chatzen_messages (
     id text primary key,
     session_id text references public.chatzen_sessions(id) on delete cascade,
     text text,
     sender text not null,
     media jsonb,
     member_name text,
     created_at timestamp with time zone default now()
   );

   alter publication supabase_realtime add table chatzen_messages;
   ```
3. Copy your **Project URL** and **Anon Key** from Settings > API.

### 2. Launching ChatZen
- Just open `index.html` in any browser.
- Open **Settings** (Gear Icon) and paste your **Supabase Keys** and **API Keys** (OpenAI/Gemini).

---

## 📱 Multi-Device Sync Guide

ChatZen is built for the "Brain-Circuit." To use it across multiple devices:

1. **Host it:** Drag this folder into [Netlify Drop](https://app.netlify.com/drop) to get a live URL.
2. **Access:** Open that URL on your phone or another laptop.
3. **Sync:** Enter the **same Supabase keys** in the settings modal on the new device.
4. **Live-Sync:** Watch as your messages and sessions appear instantly across all screens!

---

## 🎬 VidGen Studio: Tips
- **Trim:** Setting start/end times precisely focuses the AI's feedback on specific clips.
- **Speed:** 0.5x is perfect for detailed technical analysis, while 2.0x is great for quick reviews.
- **Persistence:** All "Studio" edits are saved so you can revisit them later in the session.

---

"Think together, build smarter. ChatZen is ready."
