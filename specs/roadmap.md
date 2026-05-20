# Roadmap — Next 2–4 Weeks

Focus: **polish the core loop + unlock the two most-wanted features** (forecast + PDF report).

---

## Phase 1 — Stability & Quick Wins (Week 1)

- [ ] Fix inventory UX — simplify stock adjustment flow; show current stock prominently on material cards
- [ ] Improve expense entry speed — reduce taps to log a common expense (prefill category, default today's date)
- [ ] Dashboard burn-rate alert — show "estimated days remaining" based on current spend rate + available balance
- [ ] Budget progress bar — color-coded bar (green / amber / red) in project header

---

## Phase 2 — Budget Forecast (Week 2)

- [ ] Forecast screen — project remaining balance forward based on:
  - Weekly average spend (materials + payroll)
  - Known upcoming payroll (from worker daily rates)
- [ ] "At this rate you run out in X days" — prominent warning on dashboard when < 15 days of runway
- [ ] Phase-level budget view — show spending vs. allocated budget per project phase

---

## Phase 3 — Shareable PDF Report (Week 3)

> `expo-print` + `expo-sharing` are already installed. A payroll PDF report already exists in `app/(app)/reports/index.tsx`.

- [ ] Add financial summary PDF — 1-page report with:
  - Project name + date range
  - Total income / expenses / payroll / balance
  - Expense breakdown by category (table)
  - Phase-level summary
- [ ] Add expense detail PDF — itemized list of all expenses for a date range
- [ ] Improve reports screen — date range picker, report type selector, preview before sharing

---

## Phase 4 — Polish & Cleanup (Week 4)

- [ ] Onboarding flow — guided first-project setup for new team members
- [ ] Empty state screens — helpful prompts when lists are empty (no expenses yet, etc.)
- [ ] Delete / edit confirmations — safeguard against accidental deletions
- [ ] Accessibility pass — minimum font sizes, sufficient color contrast

---

## Deferred (Post-roadmap)

- Offline support
- Photo attachments for receipts
- Gantt chart / timeline for schedule
- Expo SDK upgrade
- Multi-user roles (owner vs. foreman)
