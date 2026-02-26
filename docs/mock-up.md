## Assistant List View

Looking at the screenshot carefully, here are the specific problems:

**Organization selector** — it's floating in the top-right of the content area next to "Create Assistant." Those are two completely different concerns (org context vs. creating a resource) and they shouldn't share a toolbar. The org switcher belongs in the sidebar, near the logo/brand. The "+" next to it implying "create org" is especially confusing next to a "Create Assistant" button.

**"Open Studio" button** — it's a small outlined text button crammed at the end of a table row next to a red trash icon. The primary action of the entire page shouldn't be a secondary-looking button competing with a destructive action.

**The table itself** — showing a raw truncated UUID as a column is purely technical noise. No stats, no status, no quick metrics. It tells an operator nothing useful about how their assistants are performing.

**Missing information density** — the roadmap spec calls for 7d conversations, supported%, handoff%, and status on this list. None of that is there.

Let me build the right version:Here's every decision and why:

**Org switcher moved to sidebar** — it now lives at the top of the left nav as a dropdown button with the org avatar and name. That's where every B2B SaaS product puts it (Linear, Vercel, Slack). It's a context selector, not a page action.

**"Open Studio" is a card-level CTA** — it sits in a dedicated footer section at the bottom of each card, full-width-ish with an arrow icon. On hover the whole card lifts slightly and the button turns mint. It's unmistakably the primary action without competing with anything destructive.

**Cards replace the table** — each card shows the assistant icon + type, status chip, autonomy level chip, and three stats (7d convos, supported%, handoff%) with trend arrows. This is the information density the roadmap called for. The raw UUID column is completely gone.

**Needs Attention banner** — the Onboarding assistant has degraded metrics, so a contextual amber banner appears above the grid explaining exactly what's wrong and offering a Review CTA. This is the "Needs Attention" panel from the roadmap spec, adapted for the list view.

**Filter chips** — lightweight row of filters (All / Live / Draft / Support / Docs / Onboarding) so operators can narrow down when they have many assistants.

**Empty card** — the fourth slot in the grid is a dashed "New Assistant" card that fills naturally as you add assistants. No need for a separate empty state until the list is truly empty.

---

## Assistant Detailed View
Ok, I can see the problems clearly. Both views have the same fundamental issues:

1. **No real split view** — the "Live Preview" is a tiny footer bar, not a panel
2. **Tabs are just inline text** — no visual tab component at all
3. **Single scrolling column** — no hierarchy, no grouping, just form fields stacked
4. **No trust/confidence signals** in the preview
5. **The dark theme is flat** — no depth, no surface layers

Let me build you a proper reference mockup you can hand to the agent as a visual target.Here's what this does differently from what the agent produced, and why each decision matters:

**Proper split view** — 54% config left, 46% live preview right, with a clear 1px divider. The preview is a first-class panel, not a footer bar or an afterthought.

**Real tab bar** — tabs have icons, an active mint underline indicator, and proper hover states. They look like tabs, not text in a row.

**Visual hierarchy in the config** — form fields are grouped into titled sections (Identity / Guardrails / Widget), each with an uppercase label. Related fields sit in a 2-column grid. There's breathing room between sections.

**Behavior tab with trust architecture** — the Autonomy Level selector (Conservative / Balanced / Proactive), the confidence threshold slider, the low-confidence behavior options, and the action allowlist are all fully interactive. This is the delegation control surface from the roadmap, rendered as a real UI.

**Live preview with citations** — the right panel has a working welcome state, a real user/assistant message exchange, an expandable citations section (click "2 sources"), and an "Open trace" link. The confidence badge (Supported · 94%) is prominent and human-readable.

**Dark theme with depth** — three distinct surface levels (`--bg`, `--surface`, `--elevated`) give the UI depth instead of being a flat dark grey. The mint accent has a glow on the save button and live dot.

----

**Please use the Skeleton Loader whereever applicable**
**If possible lets define our color palette and use it throughout the app**
