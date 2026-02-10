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
| Area                      | Decision                                                                          | Reason                                                                          | Trade-off                                                                                                                 |
| ------------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| **Authentication / RBAC** | No user login system or role-based access control                                 | Reduced scope and implementation time; avoided OAuth/session complexity         | Cannot distinguish users or enforce permissions. Production deployment should use JWT-based auth and RBAC.                |
| **Caching**               | No caching for LLM evaluation results; every run triggers a new OpenAI call       | Simplifies implementation and ensures the latest evaluation is always generated | Duplicate evaluations increase latency and cost. Production system could cache results using a deterministic prompt hash. |
| **Pagination**            | No pagination for Evaluations, Judges, or Submissions; all records loaded at once | Dataset is small/medium in this prototype; simpler UI and API logic             | Does not scale well for large datasets. Future improvement would include pagination and/or virtual scrolling.             |

