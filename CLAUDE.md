@AGENTS.md

# Claude Code

Start from `AGENTS.md` above (shared with every agent). This file only adds the
ROADMAP ticket workflow.

Before implementing a ROADMAP ticket:

1. Read the requested `ROADMAP-N` ticket (the maintainer provides it).
2. Read `docs/CONTRIBUTING.md`.
3. Inspect the current implementation and existing tests.
4. Treat the current codebase as the source of truth if historical roadmap
   assumptions differ from the implementation.
5. Implement only the requested ticket.
6. Do not implement future roadmap items, anything in `docs/NON-GOALS.md`, or
   unrelated refactoring.
7. Run the verification commands relevant to the change
   (`AGENTS.md` → How to verify) before considering the task complete.

Reusable prompts for day-to-day work — a full implementation prompt and a
per-ticket review prompt — are in `docs/CONTRIBUTING.md` under "Agent prompts".
