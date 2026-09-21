---
target: web/src/features/report/ReportTab.tsx
total_score: 26
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 4
target_identity: "file:C:\\Users\\admin\\Desktop\\Prototype overview NSNN\\web\\src\\features\\report\\ReportTab.tsx"
target_fingerprint: "sha256:3e5093ff1438f0cbf334fc58a6cbe18338679052003ff74aab64e460b6af7900"
target_path: "C:\\Users\\admin\\Desktop\\Prototype overview NSNN\\web\\src\\features\\report\\ReportTab.tsx"
timestamp: 2026-09-18T07-52-37Z
slug: web-src-features-report-reporttab-tsx
---
# Impeccable Critique + Audit — Tab Báo cáo

Method: dual-agent (A: `/root/critique_design` · B: `/root/audit_evidence`)

## Design Health Score

| # | Heuristic | Score | Key issue |
|---|---|---:|---|
| 1 | Visibility of System Status | 3 | Active states and provenance are strong; competing data contexts weaken certainty. |
| 2 | Match System / Real World | 2 | Fiscal vocabulary is strong, but “Trong kỳ” conflicts with “Thực hiện lũy kế”. |
| 3 | User Control and Freedom | 3 | Reset, paging and disclosures are clear; no quick route to the core NSNN table. |
| 4 | Consistency and Standards | 3 | Cohesive controls; five-KPI mobile layout breaks the shared responsive rule. |
| 5 | Error Prevention | 3 | Constraints and invalid-selection recovery are thoughtful. |
| 6 | Recognition Rather Than Recall | 3 | Labels are visible; users still reconcile simulated and official totals mentally. |
| 7 | Flexibility and Efficiency | 2 | Sorting and CSV exist in three modes; primary NSNN grid lacks export/accelerator. |
| 8 | Aesthetic and Minimalist Design | 2 | Restrained system, but stacked controls and expanded analytics add scanning cost. |
| 9 | Error Recovery | 3 | ResourceView provides alerts, retry and useful empty states. |
| 10 | Help and Documentation | 2 | Hints exist; abbreviations and data relationships remain underexplained. |
| **Total** | | **26/40** | **Acceptable** |

## Audit Health Score

| Dimension | Score | Key finding |
|---|---:|---|
| Accessibility | 2/4 | Mobile removes table headers from the accessibility tree. |
| Performance | 3/4 | LCP/CLS are good; report modes remain in one ~522 KB JS chunk. |
| Theming | 3/4 | Strong token use; no alternate high-contrast/dark theme if later required. |
| Responsive | 3/4 | No page overflow at 320/390/1440px; one 39px target and broken five-KPI strip. |
| Implementation Integrity | 3/4 | Product-specific and coherent; one source-level detector advisory. |
| **Total** | **14/20** | **Good** |

## Design Specificity Verdict

Information architecture has high product specificity; visual composition has medium specificity. The 113-item fiscal tree, dimension pairs, 18/09 reference data, Vietnamese budget terminology and strict `tỷ đồng` rules are unmistakably product-specific. Cards, segmented controls and charts remain conventional government BI patterns.

The CLI detector found one advisory: `.dforecast-tick { font-size: 11px }` sits outside the DESIGN.md typography ramp. Runtime detector found four verified 9.8px `tỷ` suffixes in budget KPIs. The clipped-card finding is a false positive caused by intentional rounded-card clipping; text occlusion was not reproducible.

## What Works

1. Provenance is unusually honest: mock status, source, period and forecast limitations remain visible.
2. All tested routes reflow without document-level horizontal overflow at 320, 390 and 1440px.
3. The interaction system uses native controls, focus rings, `aria-expanded`, captions, sorting, loading and retry consistently.
4. Reduced-motion handling removes spatial motion while preserving short state feedback.

## Priority Issues

### [P1] Competing time bases and sources undermine decision confidence

Budget presents simulated `99,6%` beside official-reference `80,9%` while the global context says “Trong kỳ” and the KPI says “lũy kế”. A budget officer can quote the wrong value. Name both bases explicitly at the comparison point or bind the workspace to YTD. Suggested command: `$impeccable clarify`.

### [P1] Mobile removes column-header semantics

Mobile CSS uses `thead { display:none }`. Desktop NSNN exposes ten `columnheader` roles; mobile exposes zero, and the same failure affects all report modes. CSS-generated `data-label` text does not restore the table relationship. Keep `<thead>` in the accessibility tree and use explicit header associations. WCAG 1.3.1. Suggested command: `$impeccable audit`.

### [P1] Five KPI cards remain five narrow columns on mobile

At 390px each KPI is roughly 74px wide and labels wrap across four to six lines. Use a two-column `2 + 2 + 1` layout, with the exception KPI spanning the final row. Suggested command: `$impeccable adapt`.

### [P1] The core NSNN table is buried and lacks export

On mobile the table begins around 2,400px down, then introduces a 62vh nested scroll. Unlike the other report modes it has no CSV action. Add a visible jump, export for the current dimension pair, and a mobile `Tóm tắt / Bảng báo cáo` switch. Suggested command: `$impeccable distill`.

### [P2] Mobile first viewport is dominated by context controls

Global filter, report type, local filter and source bar stack before data. The horizontal tab rail hides later destinations without an overflow cue. Compress stable context and add a rail affordance. Suggested command: `$impeccable layout`.

## Secondary Technical Findings

- [P2] Column pagination changes are not announced with `role=status`/`aria-live` (WCAG 4.1.3).
- [P2] Report workspaces are eager-loaded into one production JS chunk (~522 KB); lazy-load modes/tabs.
- [P2] Mobile coarse-pointer link “Khác” measures 39×44px; raise width to the 44px design policy.
- [P3] KPI unit suffixes compute to 9.8px; clamp to `--fs-label`.
- [P3] Forecast axis uses 11px outside the documented typography ramp.

## Persona Red Flags

- **Alex, power user:** no direct jump/export for the 113-row NSNN report; nested page/table scrolling slows the primary task.
- **Sam, accessibility-dependent:** mobile loses every column header association despite otherwise good focus and captions.
- **Casey, distracted mobile user:** data begins below stacked controls, later tabs are hidden, and returning to a nested table requires rebuilding position.

## Cognitive Load

Mobile NSNN fails 4/8 checks: chunking, visual hierarchy, working memory and progressive disclosure. Desktop load is moderate; grouping and visible labels are otherwise disciplined.

## Minor Observations

- NSNN, NSTW, NSĐP and TMS need a concise glossary affordance.
- Budget mobile exposes seven values per row; prioritize status, completion and remaining amount.
- Help for report modes relies on desktop `title` attributes and is lost in the mobile select.
- Data-table alternatives for charts are a strong accessibility practice to retain.

## Questions to Consider

- Is Thu NSNN primarily for understanding the situation or producing/checking the formal 113-row report?
- Which budget value should a director repeat aloud: 99,6% or 80,9%?
- Which two KPIs directly trigger action on mobile?
- Should “Trong kỳ” be allowed beside a lead metric labelled “lũy kế”?

## Remediation — 18/09/2026

Đã xử lý toàn bộ hạng mục P1–P3 và các quan sát phụ có thể giải quyết ở lớp UI:

- Ghi rõ cơ sở lũy kế của Dự toán và tách mốc số bàn giao khỏi KPI mô phỏng.
- Giữ `thead` trong accessibility tree ở mobile; bảng vẫn đọc được quan hệ cột.
- Dải 5 KPI chuyển thành 2–2–1; đơn vị tiền và trục biểu đồ dùng typography token.
- Thêm `Tóm tắt / Bảng báo cáo`, lối đi nhanh, xuất CSV và bỏ cuộn lồng cho bảng NSNN trên mobile.
- Thu gọn thiết lập chiều báo cáo ở màn hình đầu, thêm dấu hiệu còn tab phía phải và giải thích loại báo cáo trên mobile.
- Thêm live status cho phân trang, glossary NSNN/NSTW/NSĐP/TMS và vùng chạm tối thiểu 44px.
- Lazy-load ba workspace phụ; bundle chính giảm từ khoảng 522 KB xuống khoảng 496 KB.
- Sắp thứ tự thẻ Dự toán mobile theo Trạng thái → Hoàn thành → Còn thiếu, rồi mới đến số đối chiếu.

Kiểm chứng: `npm run build`, `npm run check:report-ui`, `node scripts/check-workspaces.mjs`, `npm run acceptance`; detector Impeccable trả `[]`.
