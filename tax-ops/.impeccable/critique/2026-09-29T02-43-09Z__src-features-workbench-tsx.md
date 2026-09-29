---
target: tax-ops shell và 8 view
total_score: 24
max_score: 40
na_heuristics: 
p0_count: 1
p1_count: 2
target_identity: "file:C:\\Users\\admin\\Desktop\\Prototype overview NSNN\\tax-ops\\src\\features\\Workbench.tsx"
target_fingerprint: "sha256:73116db062e4d831d5ce8e263f7c26fe24fa8cfddfba4c7ba7d076d0deff26fe"
target_path: "C:\\Users\\admin\\Desktop\\Prototype overview NSNN\\tax-ops\\src\\features\\Workbench.tsx"
timestamp: 2026-09-29T02-43-09Z
slug: src-features-workbench-tsx
---
Method: dual-agent (A design review · B detector+browser). Mode: Operate.

## Design Health Score: 24/40 (Acceptable)

| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of System Status | 3 | Toast claims state changes that never happen (Debt.tsx:376) |
| 2 | Match System / Real World | 4 | Operational Vietnamese throughout |
| 3 | User Control and Freedom | 1 | No undo anywhere; Mapping.tsx:56 commits with no confirm |
| 4 | Consistency and Standards | 2 | 3 summary-row implementations, 4 row-action patterns, 4th chip family |
| 5 | Error Prevention | 2 | CONFLICT rule in Rules prevents nothing |
| 6 | Recognition Rather Than Recall | 3 | Reports never applies is-selected |
| 7 | Flexibility and Efficiency | 1 | No shortcuts, no sort, no focusable rows |
| 8 | Aesthetic and Minimalist Design | 3 | 5 of 8 desktop views end above 750px of a 1000px viewport |
| 9 | Error Recovery | 2 | Only recovery control is a dead button |
| 10 | Help and Documentation | 3 | No first-run orientation |

## Design Specificity Verdict

Authored at the copy and data-model level; category-interchangeable at the interaction level.
MockTag declares the upstream system per panel; footnotes carry real bureau knowledge
(Batches.tsx:83). But 6 of 8 views are "four numbers over one read-only table"; Debt, Risk,
Refund have no row-level action. Mapping is the only view that behaves like the stated product.
Under-built against its own positioning, not "too conventional".

Detector: detect.mjs --json src -> exit 2, 28 advisory findings, all in src/styles.css, none in
any .tsx. 14 contract-sanctioned false positives, 12 genuine drift (9/10/15/21px off-ramp type,
5px and 7px radii as 5th and 6th values of a 4-step scale, #d6bd84 outside every ramp).
No visual overlay was produced (headless run, no injection).

## Priority Issues

[P0] Approve/publish do not exist; the one recovery button is dead.
  Reports.tsx has no Duyet/Phat hanh on any row including Cho duyet. Batches.tsx:84 has no onClick.
  Both independently verified. Fix: add Duyet to REVIEW rows and Phat hanh to APPROVED rows writing
  reportVersions with actor+timestamp; give Batches:84 an onClick or delete it. -> harden

[P1] Ten controls in the mobile drawer are under 44px, on the only touch-only surface.
  drawer-close 40x40, eight nav-item 296x36, logout 276x36. Cause: styles.css:164 min-height 36px
  reused with no mobile override. Every prior sweep passed because the drawer was closed.
  Fix: in the <=900px block set .mobile-drawer .nav-item min-height 44px and .drawer-close 44x44. -> adapt

[P1] Keyboard cannot reach the table layer; 8 unnamed tab stops.
  Batches.tsx:46 tr onClick with no tabIndex/role/key handling (60 Tabs never enter tbody).
  ui.tsx:96 gives every .table-wrap tabIndex=0 with no role and no name. No skip link (9 Tabs to
  first content control on Reports). WCAG 2.1.1 and 4.1.2, level A. -> harden

[P2] No-access screen has no mock label, no brand, dead escape link.
  App.tsx:87 renders outside Shell so neither freshness nor .mobile-mock applies; the string
  "Mo phong" is absent while the screen names a person and UBND TP Ha Noi. Breaks the Persistent
  Mock Rule and the project constraint. CTA points at /dashboard-NSNN/ which does not resolve. -> polish

[P2] Four row-action patterns and three summary-row implementations against a contract mandating one.
  Whole-row button (Workbench), tr onClick (Batches), trailing quiet button (Reports, Rules),
  trailing secondary (Mapping), nothing (Debt, Refund, Risk). Reports.tsx:243 builds a third
  summary row that lays out differently from FigureLine at the same breakpoint. The user's standing
  convention is whole-row click. -> distill

## Persona Red Flags

Officer (weekly reconciliation): Debt rows have no action; she exports to Excel to do the work,
the exact behaviour PRODUCT.md exists to eliminate. Filters reset every visit (only view is in URL).
No keyboard path, no sort, no bulk select.

First-timer: 22 competing numbers on Workbench, 8 work rows separated only by a 6px dot. Tapping a
Batches row on mobile changes a panel ~800px below the fold. "Tao bao cao moi" toast claims a draft
that never appears.

Tax leader (monthly, phone): Trang thai and Mo are off-screen behind a 780px table on mobile Reports.
No approve control exists. The period select is frozen to Thang 9/2026.

## Minor Observations

5 of 8 desktop views leave 250-400px empty (page-stack bottom: refund 588, risk 684, rules 736,
debt 747, mapping 779 at 1440x1000). Duplicate "Mo phong" chip 130px apart on mobile. App.tsx:31
scrollTo smooth not gated on prefers-reduced-motion. Toast dies at 4.2s with no history. Login prints
the shared password on screen. Surface brief still lists the deleted DataManagement.tsx.

## Questions to Consider

1. Stripe's density is earned by action; here 6 of 8 views are read-only. What did the density buy?
2. Mapping is the only view that behaves like PRODUCT.md describes. Why is it one view, not the template?
3. The 44px rule is written three times and shipped at 36px on the only touch surface. What process
   let a rule get restated more often than it got checked?
4. Luong phat hanh draws four states and the build implements zero transitions. Is the diagram
   documenting the product or substituting for it?

## Companion audit

Audit Health Score 14/20. A11y 3, Perf 4, Responsive 3, Theming 2, Implementation Integrity 2.
Headline: 87 literal colours bypass tokens, and DESIGN.md declares --control-line and
--control-line-hover which the stylesheet never defines (7 literals instead). Shell switches to
touch at 900px while the 44px contract starts at 720px, so iPad portrait at 768px runs a touch
shell with 32px controls.
