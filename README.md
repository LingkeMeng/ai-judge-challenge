# AI Judge Challenge

A web application that automatically reviews human-annotated answers using AI judges. Users can upload submissions, configure AI judges, assign judges to questions, run LLM evaluations, and view results with filters and pass/fail statistics.

## Tech Stack

- **React 18** + **TypeScript** + **Vite**
- **Supabase** (PostgreSQL) for persistence
- **OpenAI API** for LLM evaluations (GPT-4o-mini by default)

## Quick Start

```bash
npm install
npm run dev
```

Open http://localhost:5173

### Environment Variables

Create a `.env` file:

```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_OPENAI_API_KEY=your_openai_api_key
```

### Database Setup

Apply the migrations in `supabase/migrations/` to your Supabase project (via `supabase db push` or the Supabase Dashboard SQL Editor).

## App Flow

1. **Upload** – Import JSON with `submissions` (queueId, questions with content + answer)
2. **Judges** – Create/edit/deactivate AI judges (name, prompt, model, active flag)
3. **Queues** – Select a queue, assign judges per question template, click **Run AI Judges**
4. **Results** – View evaluations with filters (Judge, Question, Verdict) and pass rate

## Sample Data

Use `test_input.json` in the project root for a quick import test.

## Project Structure

```
src/
├── api/          # Supabase CRUD for all entities
├── components/   # Layout, Navbar
├── lib/          # importJson, runJudges (LLM orchestration)
├── pages/        # Upload, Judges, Queues, Queue detail, Results
└── types/        # TypeScript types
```

---

## Time Spent

**~5–7 hours** (including setup, core features, UI polish, and testing)

---

## Trade-offs & Decisions

| Area | Decision | Reason |
|------|----------|--------|
| **LLM calls from client** | OpenAI API called directly from the browser | Keeps the stack simple (no backend). For production, a backend/edge function would proxy API calls to avoid exposing the key. |
| **Verdict mapping** | Spec says "inconclusive"; DB uses "partial" | Schema uses `partial` and `pending`; LLM can return "inconclusive" and we map it to `partial` for consistency. |
| **Question templates** | Find-or-create by content on import | Same question text across submissions shares one template, so judge assignment is per question type instead of per submission. |
| **No pagination** | Load all evaluations, queues, judges | Fine for small/medium datasets; would add pagination for large-scale use. |
| **No file attachments** | Not implemented | Bonus feature; would require multimodal LLM support and file upload storage. |
| **Single LLM provider** | OpenAI only | Simplest path; could add an abstraction for Anthropic/Gemini later. |

---

## Evaluation Rubric Notes

| Category | Notes |
|----------|-------|
| **Correctness** | All required flows work: import → judges CRUD → assign → run → results |
| **Backend & LLM** | Supabase for persistence; `runJudges.ts` handles LLM calls and JSON parsing |
| **Code quality** | Page-level components, small API modules, `useCallback` for loaders |
| **Types & safety** | Shared types in `types/index.ts`, no `any` in core logic |
| **UX & polish** | Loading states, empty states, pass rate, multi-select filters |

---

## Submission Instructions

- **Screen recording** (Loom, MP4, or GIF) covering: Import sample data → Judges CRUD → Judge assignment → Run evaluations → Results view
- Email recording URL to: **hiring@besimple.ai**
- Reviews within 24 hours; qualified candidates will be contacted for a video-call interview
