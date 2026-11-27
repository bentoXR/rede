# HCIA Studio — Huawei HCIA-Datacom V2.0

Interactive, warm-editorial study companion for the 23-chapter **Huawei HCIA-Datacom V2.0** PDF textbook (~1,118 pages in English).

## Features
- **Daily Session Mode (5 / 15 / 30 min):** Open and start immediately — automatically blends spaced reviews (missed challenges, bookmarks, highlights) with new lessons.
- **Step-by-step Reading:** Warm paper aesthetic (`#FAF9F6`), `Plus Jakarta Sans` + `Inter` / `Source Serif 4` + `JetBrains Mono` typography with bold lead-ins and size toggles (`18px` / `20px` / `22px`).
- **Original Huawei Diagrams:** High-resolution cropped WebP diagrams inline with click-to-zoom lightbox.
- **4 Interactive Layers:** Instant glossary popovers, clickable VRP CLI token breakdown, text highlighting + bookmarks, and embedded mini-challenges (multiple choice, multi-select, match pairs, sequence ordering, fill-in-the-blank).
- **Free Cloud Sync & AI Tutor:** Optional **Supabase** progress sync (PC <-> phone) and **Cloudflare Worker + Gemini** contextual tutor.

## Local Development
```bash
npm install
npm run dev
```

## Convert More Chapters (03–23)
Requires `pdftotext`, `pdftoppm`, `python3`, `Pillow`, and `numpy`:
```bash
# Phase 1 (Chapters 01 & 02)
python3 tools/extract_hcia.py --chapters 1 2

# Batch convert all 23 chapters
python3 tools/extract_hcia.py --all
```

## Free Deployment (Cloudflare Pages)
- **Build command:** `npm run build`
- **Build output directory:** `dist`
- **Root directory:** `front-end/hcia-studio`
- Optional **Supabase Sync:** Run `supabase/schema.sql` in Supabase SQL Editor and paste URL/Anon Key in `.env` or the in-app **Sync & AI** button.
- Optional **AI Tutor:** Deploy `cloudflare/tutor-worker.js` to Cloudflare Workers with `GEMINI_API_KEY` secret and paste the Worker URL in `.env` or **Sync & AI**.
