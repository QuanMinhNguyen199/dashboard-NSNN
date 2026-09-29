---
version: 1
slug: "src-features-workbench-tsx"
primary_target: "src/features/Workbench.tsx"
related_targets: ["src/components/Shell.tsx","src/styles.css","src/features/Debt.tsx","src/features/Risk.tsx","src/features/Refund.tsx","src/features/Reports.tsx","src/features/DataManagement.tsx"]
---

Scope: toàn bộ shell và sáu view của Web quản lý nghiệp vụ Thuế. Visitor mode: Operate.

Audience: cán bộ xử lý nghiệp vụ ngồi cả ca làm trên màn 1366–1920, nhiều cửa sổ song song; trưởng phòng và lãnh đạo dùng cùng màn nhưng thưa hơn. Job: nhận ra việc đến hạn, ngoại lệ và lô dữ liệu hỏng trước khi đọc tổng số, rồi xử lý theo lượt. Constraint: mọi số mang nhãn mô phỏng; WCAG 2.1 AA; chạm 44px trên mobile; không đổi vị trí điều hướng và bộ lọc mà người dùng đã quen.

Unresolved: chưa có dữ liệu thật để đo mật độ hàng tối ưu; chưa chốt có đưa bàn phím tắt vào bản này không.

## Direction contract — 29/09/2026

User selected: trắng–xám ấm, đỏ/vàng theo logo Thuế được cung cấp. User explicitly requests visible borders, edges and shadows. This replaces the previous navy/no-border/no-shadow direction.

Operate: prioritize scanable work lists, source status and selectable records. Keep all eight modules and existing role routing.

Visual contract: light sidebar, white panels on neutral gray, 1px panel boundaries and restrained two-layer shadows. Logo-derived red marks selected navigation and primary actions; gold is reserved for identity. Neutral KPI values; semantic status color stays in labels. Outline icons share 1.6px strokes; remove repeated warning icons from task rows.

Interaction: hover lift only on actionable rows and buttons. Outer panels and read-only values remain still. Preserve keyboard focus, mobile drawer, 44px touch targets and reduced-motion support.

Validation: eight desktop/mobile screens pass acceptance; see DESIGN.md for exact colors, radii and typography.
