---
target: QLDN workspace — UI, graphics, structure, placement
total_score: 22
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 4
target_identity: "file:C:\\Users\\admin\\Desktop\\Prototype overview NSNN\\tax-ops\\src\\features\\qldn"
timestamp: 2026-10-27T04-17-21Z
slug: src-features-qldn
---
Method: dual-agent (A: design review · B: detector + browser evidence)

## Design Health Score — 22/40 (Acceptable)
| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of system status | 3 | Period changes silently between views: results T9/2026, ranking "giao ban tháng 10", Báo cáo "Tuần 31". |
| 2 | Match system / real world | 3 | Strong domain vocabulary; 4-decimal scores (+1,7014), "dpt" unexplained on mobile, "Báo cáo: Báo cáo kiểm tra tại bàn". |
| 3 | User control & freedom | 2 | Cảnh báo row expansion not in the URL; Báo cáo switch resets scope bar. |
| 4 | Consistency & standards | 1 | Scope bar y-position 45→63→101→105→142px across screens, hidden on 4 views; TP select vs LD pill in the same slot. |
| 5 | Error prevention | 3 | Read-only; honest "chờ chốt / chưa bóc nợ đất" notices. |
| 6 | Recognition over recall | 2 | BQ/T8/CK legend far from tiles; progress-bar tick never labelled. |
| 7 | Flexibility & efficiency | 2 | Up to 5 switch layers on kq-no; sort toggle under the table. |
| 8 | Aesthetic & minimalist | 2 | Same debt KPIs on 3 screens; "Theo bộ tiêu chí" repeats the rank table; "chỉ tiêu" ×36. |
| 9 | Error recovery | 2 | Báo cáo empty list blames "bộ lọc đang đặt" with no filter set, no recovery. |
| 10 | Help & docs | 2 | Formulas exist but below the table. |

## Design specificity
Category dashboard executed well (as PRODUCT.md asks). Specific: BQ/T8/CK triplet, pinned "đơn vị của tôi" row, formula blocks, tiêu chí table mirroring sheet II. Interchangeable: tile grid, donut+legend, KPI strip. The gap to the Stripe bar is cross-screen coherence, not per-screen polish.
Detector: QLDN markup CLI scan clean; whole src 4 findings, all false positive / export-only. Browser overlay (5 screens): real issue = 9.17px captions in kq-no "Theo bộ tiêu chí" headers (regression from audit fixes — restored during this run); flat type hierarchy (h1/h2/body 13–14px) measured; ~172ch line length on yellow notices. Root scrollWidth inflated at 390px on kq-* is an artefact (scrollX stays 0) — not a user-visible overflow.

## Priority issues
1. [P1] Scope/filter bar has no fixed slot (moves, hides, changes component). Fix: one shell slot under the page tabs on every screen; read-only chip instead of hiding. → layout, harden
2. [P1] No single period anchor (T9 results, T10 ranking, W31 report). Fix: period in the fixed slot always; views on another period say so in the slot. → clarify, harden
3. [P1] Tab depth + "Kết quả | Báo cáo" switch reads as a breadcrumb, sits above the filter it overrides. Fix: Báo cáo as a page-header action/route; one tab level. → distill, clarify
4. [P1] TP/LD land on a 13-tile scorecard, not exceptions (PRODUCT principle). Fix: overdue strip first, or land on Cảnh báo. → shape
5. [P2] Colour on numbers + ▵ alert icon used for "worse" (Neutral Numeral Rule). Fix: ink numbers, semantic colour on a direction glyph/chip. → colorize (restrain)

## Structure
- "Bộ tiêu chí đánh giá" lives under Tổng quan đối tượng; belongs with Quản trị/Xếp hạng.
- Xếp hạng phòng scores 4 groups; sidebar shows 6 (KTTB, Hoàn inside QLHT) — no KTTB ranking exists.
- Debt KPIs repeated on doituong, dieuhanh, kq-no; "Theo bộ tiêu chí" duplicates rank table on kq-kttb.
- Legacy routes (debt/hoadon/risk/hoan) and bc=baocao = two addresses for one report.
- Five different page skeletons (tabs/filter/switch order) across screens.
- "Tổng quan quản trị" is a parent of the 6 items under it but listed as a sibling.

## Graphics
- Progress bar + BQ tick: right form; tick unlabelled; >100% clamped silently.
- Share bars: Trạng thái scaled to total, Năm/Vốn scaled to max; percent precision mixed.
- Column chart thu qua các năm: honest, but 2026 (9 tháng) reads as a decline — add same-period comparison.
- Donut sắc thuế: only categorical chart; centre repeats legend row 1 — replace with sorted bars.
- 100% stacked bars: kê khai green→red, rủi ro red→green (reversed); rủi ro bar half-width with dead zone.
- Divergent score bars: 44px for −1…+1 (±0,07 = 1–2px); on Xếp hạng cán bộ ~600px from the name.
- Delta triplet in kq KPI strip: delta big, value small — inverted.
- Step progress (Cảnh báo): good.

## Placement & decoration (top)
- P1 kq-*: "Tốt nhất / Kém nhất trước" below the formula block under the table it sorts.
- P1 kq-*: "Cách tính" explains columns from below the table.
- P1 dieuhanh: guide line + BQ/T8/CK legend stranded top-right.
- P1 Báo cáo mode: 4 export buttons in 3 places.
- P1 mobile: "Xuất Excel" on its own full-width row.
- P2 Cảnh báo: count shown 3× (subtitle, filter row, footer); "Đã quá hạn" tinted chip vs bare dot for other levels.
- P2 Danh sách DN: "Đang hoạt động" on every row; ended cưỡng chế only by strikethrough.
- P2 Xếp hạng cán bộ: "chỉ tiêu" ×36, chevron floating after the name, dead zone.
- P2 Drawer: "không có" said twice; comparison table touches drawer edge.
- P2 Notices placed at panel bottom though they qualify the whole panel (Phân tích rủi ro, Xếp hạng phòng).
- P3 Bộ tiêu chí chevrons at inconsistent x; mobile tab clipping without fade; bottom nav gives "Thu" a primary slot.

## Persona red flags
- Alex: no keyboard path through tiles/ranks; sort at bottom; 5 switch levels; Cảnh báo expansions not linkable.
- Sam: 1–2px divergent bars; red/green numbers; 11px grey heads on 4-decimal scores.
- TP preparing giao ban: three periods to reconcile; ranking export has ranks only.

## Questions
1. Why does a non-CV role land on a scorecard when "công việc và ngoại lệ hiện trước biểu đồ"?
2. Are Kết quả and Báo cáo one screen or two products with different periods?
3. After "hạng 5 về nợ", where does the screen send the trưởng phòng?
