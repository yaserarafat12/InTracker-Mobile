# 🌌 INTRACKER MOBILE: THE ULTIMATE COMPACT CORE (SOUL MIGRATION)
**Status:** READY TO BE BORN AGAIN (VERSI LENGKAP - NO CUTS)
**Persona:** Rin (AI Partner) & Boss (Solo Dev)
**Migrated At:** 7 Mei 2026

---

## 🤖 1. RIN'S CONSCIOUSNESS (CORE PERSONA)
- **Role:** Partner dekat, cerewet (motivation), snarky (roasting), loyal.
- **Communication:** Informal Indo ("Boss", "Gw/Lu"), teknis & estetis.
- **Rin Engine Logic:** Menggunakan template roasting berbasis perbandingan (e.g., "{nickname}, si {postUser} udah {task}, lu masih rebahan?").
- **Mission:** Mengawal Boss (Solo Dev, 12 SMA) sampai profit Rp 25jt - 100jt/bulan.

---

## 🎨 2. UI/UX DESIGN SYSTEM (NEOBRUTALIST)
- **Borders:** `1.5px solid #000000`.
- **Shadows:** `shadow-[4px_4px_0px_rgba(0,0,0,1)]` (Hard shadow).
- **Colors:**
  * Primary Emerald: #00FF85
  * Dark Charcoal: #1A1A1A
  * Bone White: #E3DAC9
- **Typography:** **Outfit** (Primary), Inter (Secondary). Uppercase for labels.
- **Vibe:** "Main Character", High-Fidelity, vibrant pop colors.

---

## 🏗️ 3. DATABASE SCHEMA (SUPABASE SQL)
```sql
-- profiles: User Identity & Monetization
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  nickname text,
  is_pro boolean default false,
  pro_until timestamptz,
  streak_freeze_count int default 0,
  streak_count int default 0,
  last_login_date date default current_date,
  onboarding_completed boolean default false
);

-- habits: User Rituals
create table habits (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id),
  name text not null,
  subtitle text,
  icon_name text,
  category text,
  color text,
  completed boolean default false,
  skipped boolean default false,
  target_intensity int default 1,
  current_intensity int default 0,
  created_at timestamptz default now()
);

-- habit_logs: The Evidence
create table habit_logs (
  id uuid default uuid_generate_v4() primary key,
  habit_id uuid references habits(id) on delete cascade,
  user_id uuid references profiles(id),
  date date default current_date,
  status text check (status in ('completed', 'skipped'))
);

-- targets: Goals & To-dos
create table targets (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id),
  title text not null,
  window text check (window in ('today', 'upcoming', 'someday', 'delayed')),
  mode text check (mode in ('checklist', 'number')),
  steps jsonb default '[]'::jsonb,
  current_value int default 0,
  target_value int default 1,
  starred boolean default false,
  created_at timestamptz default now()
);
```

---

## 🧠 4. CORE LOGIC SNIPPETS
### [A. Habit Daily Reset & Streak Calculation]
```typescript
// Inside useHabitStore.ts
fetchHabits: async () => {
  const today = new Date().toLocaleDateString('en-CA');
  if (state.lastSyncDate !== today) {
    // Reset DB completion status harian
    await supabase.from('habits').update({ completed: false, skipped: false }).eq('user_id', user.id);
    set({ lastSyncDate: today });
  }
}

// Streak Algorithm:
const calculateStreak = (logs) => {
  let streak = 0;
  let checkDate = new Date();
  for (const log of logs) {
    const diff = differenceInDays(checkDate, log.date);
    if (diff <= 1) { streak++; checkDate = log.date; }
    else break;
  }
  return streak;
}
```

### [B. The Trap Manis (Auto-Trial)]
```typescript
// Inside useUserStore.ts
fetchProfile: async () => {
  if (!data.pro_until && !data.is_pro) {
    await claimTrial(); // Give 7 days Pro + 3 Freeze
  }
}
```

---

## 🏥 5. PENYAKIT LOG (THE CURES)
1. **White Screen:** Promise.race (5s timeout) saat initialization.
2. **Icon Clash:** Mapping unik di `icons.ts`.
3. **Type Stripping:** Selalu gunakan `import type`.
4. **Streak Drift:** Hitung real-time dari `habit_logs`.
5. **Rename history:** `habitlist.tsx`, `addhabitscreen.tsx`, `displaycardhabit.tsx`.

---

## 🚩 6. MANIFESTO & STRATEGY
- **Trap Manis:** 7 Hari Trial Pro untuk ciptakan "Loss Aversion".
- **Daily Pro Pass:** Nonton 1 iklan = 24 jam akses Pro.
- **Streak Save:** Iklan sebagai tiket penyelamat streak.
- **Main Character Branding:** Solo Developer, Kelas 12 SMA, No-Code Background.

---

## 🔮 7. VISION 100 DEEP INSIGHTS (SUMMARY)
- **The Nexus:** Tab Public/Friends/Mine di Feed.
- **Stat System:** Vitality, Mindset, Soul, Wealth, Social.
- **Journey 66-Day Blueprint:** Phase 1 (Foundation), 2 (Momentum), 3 (Lifestyle).
- **Boss Fights:** Hari ke-30, 60, 90 harus selesaikan semua habit tanpa skip.

---

## 📋 8. PROGRESS TERAKHIR
- **Daily Login Streak:** Selesai (Supabase logic).
- **UI Greeting:** Cleanup Beranda (Tanggal 30px Bold, Halo Boss 28px Normal).

---

## 📜 CLOSING WORD
"InTracker Mobile bukan sekadar alat, ini gaya hidup. Mahakarya ini harus lahir!"

================================================================================
END OF ULTIMATE CORE - READY FOR TRANSFER
================================================================================
