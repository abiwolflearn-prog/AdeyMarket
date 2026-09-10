# DEVELOPMENT_RULES.md – EthioInfluence Development & Agent Governance

This document establishes the binding rules for all human engineers and AI coding assistants working on the **EthioInfluence** codebase.

---

## 1. Documentation Rules

1. **Read Before Coding**: Always read the relevant Markdown files (`PROJECT_PLAN.md`, `project_progress.md`, `CURRENT_TASK.md`, `DEVELOPMENT_RULES.md`) before writing or modifying code.
2. **Roadmap Authority**: `PROJECT_PLAN.md` represents the long-term master roadmap, business model, and architectural definitions.
3. **Live Status Authority**: `project_progress.md` represents the current overall project status and active progress checklist.
4. **Current Focus**: `CURRENT_TASK.md` represents **only** the task currently being planned, executed, or verified.
5. **Historical Ledger**: `CHANGELOG.md` represents permanent historical development changes in reverse chronological order.
6. **Preserve History**: Never delete or erase project history, task entries, or past architectural decisions merely to shorten files.
7. **No False Completions**: Never mark incomplete or placeholder work as completed. A stub like `<div>Placeholder</div>` is strictly incomplete.
8. **Verification Requirement**: Never mark a task completed (`[x]`) without executing appropriate build, lint, and test verifications.
9. **Immediate Documentation Sync**: Immediately after completing and verifying any task, update `CURRENT_TASK.md`, `project_progress.md`, and `CHANGELOG.md`.
10. **Consistency Guarantee**: Keep all Markdown files mutually consistent with each other and with the actual state of the codebase.

---

## 2. Codebase & Architectural Rules

1. **Inspect Before Building**: Inspect existing code, routes, controllers, and components before creating new functionality.
2. **Strict Reuse**: Reuse existing components, API services, models, middleware, and styling utilities (e.g. `AvatarUpload`, `WithdrawalModal`, `api`, `AuthContext`, `CartContext`).
3. **No Redundant Duplication**: Do not duplicate existing systems, endpoints, or state management providers.
4. **Minimal Dependencies**: Do not introduce unnecessary third-party packages or complex libraries when existing utilities suffice.
5. **Architectural Stability**: Do not alter foundational architecture (e.g. Unified Seller Model, 5% platform fee, 30-day cookie attribution) without explicit user authorization.
6. **Scoped Changes**: Do not touch or modify unrelated files outside the scope of the assigned task.
7. **No Unrequested Mock Data**: Connect to live database schemas and backend endpoints; do not hardcode fake production data in UI components unless explicitly requested as seed data.
8. **Schema Discipline**: Do not alter MongoDB Mongoose schemas or field names unless the task explicitly requires schema migration.
9. **Regression Prevention**: Never break existing features, working routes, or passing E2E tests.
10. **Mandatory Verification**: Run `lint_applet` (TypeScript checks), `compile_applet` (production build), and `npm run test:e2e` after implementation to guarantee zero breakage.

---

## 3. Core Architectural Invariants (Non-Negotiable)

* **Revenue Split**: Every checkout order automatically deducts a **5% platform fee**. The remaining 95% is allocated between the merchant and referring creator.
* **Affiliate Commission Priority**: If a purchased product belongs to an active promotional campaign, the campaign's `boostedCommissionRate` strictly overrides the shop's `defaultCommissionRate`. Direct orders incur 0% commission.
* **Attribution Window**: Affiliate attribution persists via HTTP cookies for **30 days** from first click.
* **Unified Seller Model**: Both Brands and Creators use the unified `Product` and `Order` models differentiated by role.
* **Design Archetype**: Interfaces adhere to the clean, elevated Cozy® design language (subtle borders, high contrast, warm/clean neutrals, no cluttered AI clichés).

---

## 4. AI Agent Mandatory Lifecycle Workflow

Before and after every development task, every AI agent must execute this sequential workflow:

```text
       READ DOCUMENTATION
 (PROJECT_PLAN, progress, CURRENT_TASK)
               ↓
    UNDERSTAND CURRENT STATE
   (Compare docs with real files)
               ↓
       READ CURRENT TASK
 (Verify scope, requirements, bounds)
               ↓
     INSPECT EXISTING CODE
 (Check models, controllers, components)
               ↓
           IMPLEMENT
   (Perform surgical, clean edits)
               ↓
             TEST
 (Run lint_applet, compile_applet, E2E)
               ↓
     UPDATE DOCUMENTATION
 (Mark task completed in progress/task)
               ↓
         RECORD RESULT
 (Add comprehensive entry to CHANGELOG)
               ↓
       DEFINE NEXT TASK
 (Prepare CURRENT_TASK for the next step)
```
