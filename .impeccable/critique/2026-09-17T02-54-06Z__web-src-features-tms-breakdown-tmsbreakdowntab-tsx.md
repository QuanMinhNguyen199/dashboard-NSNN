---
target: Tra cứu mã (TmsBreakdownTab)
total_score: 23
max_score: 40
na_heuristics: 
p0_count: 2
p1_count: 2
target_identity: "file:C:\\Users\\admin\\Desktop\\Prototype overview NSNN\\web\\src\\features\\tms-breakdown\\TmsBreakdownTab.tsx"
target_fingerprint: "sha256:138c48748a39c76207dd75ed3d36574eabfaa49e5c10956540e37455f408487c"
target_path: "C:\\Users\\admin\\Desktop\\Prototype overview NSNN\\web\\src\\features\\tms-breakdown\\TmsBreakdownTab.tsx"
timestamp: 2026-09-17T02-54-06Z
slug: web-src-features-tms-breakdown-tmsbreakdowntab-tsx
---
# Design Critique — Tra cứu mã (+ Báo cáo, Đối soát)

Method: dual-agent (A: design review, cách ly · B: detector + bằng chứng trình duyệt, cách ly). Không suy giảm.

## Design Health Score

| # | Heuristic | Điểm | Vấn đề chính |
|---|---|---|---|
| 1 | Visibility of System Status | 3 | `Số tiền ↓` và `Tỷ trọng ↓` cùng hiện mũi tên vì dùng chung `sortKey="amount"` |
| 2 | Match System / Real World | 3 | `kỳ hạch toán 2025-07` là ISO trong sản phẩm cam kết `vi-VN`; header `Số tiền tỷ` không đọc thành tiếng được |
| 3 | User Control and Freedom | 2 | Bấm thân dòng là ghim, không báo, không undo tại chỗ |
| 4 | Consistency and Standards | 2 | Bốn cột tiền, bốn cách ghi đơn vị; 88 hậu tố `tỷ` lặp ở từng ô |
| 5 | Error Prevention | 1 | Một dòng vừa mang chip `Đối soát được` vừa mang chữ `Chưa đối soát được` |
| 6 | Recognition Rather Than Recall | 2 | Phải nhớ đồng thời cấp, địa bàn và ba chú thích rải rác để biết một con số gồm gì |
| 7 | Flexibility and Efficiency | 2 | Tab Báo cáo 128 cột địa bàn, không ô tìm phường, chỉ đi từng trang |
| 8 | Aesthetic and Minimalist Design | 3 | Đúng hệ và điềm tĩnh, nhưng trang cao 3.849px / 7 thẻ, không mục lục |
| 9 | Error Recovery | 2 | Chẩn đoán xuất sắc, phục hồi bằng không |
| 10 | Help and Documentation | 3 | Chú thích trung thực nhưng nằm cuối thẻ; không có glossary; câu quan trọng nhất biến mất ở 390px |
| **Tổng** | | **23/40** | **Acceptable — cần sửa đáng kể** |

## Design Specificity Verdict

Được viết riêng cho sản phẩm này, nhưng phần đặc thù nằm gần hết trong chữ, không trong hình.

Khung ngoài là ngôn ngữ dashboard nghiệp vụ tiêu chuẩn. Nhưng mô hình thông tin thì không bê đi đâu được: quyết định không đưa Chương thành bậc chọn, `LevelFilter` chia hai hàng vì tỉnh/huyện/xã nằm trong địa phương, panel đối chiếu có dòng `Cộng` bắt buộc, và `ReconciliationPanel` từ chối đặt ngưỡng.

Máy quét tĩnh: 0 phát hiện trên bốn thư mục mục tiêu, đã chứng minh là quét thật bằng hai đối chứng.
Lớp phủ trình duyệt: 98 phát hiện, 97 xác minh, 1 báo động giả.

## Priority Issues

### [P0] Chip `Đối soát được` mâu thuẫn với chính dòng bên cạnh
`ReconciliationTab.tsx:116` chọn style chỉ theo `bridge`, không xét `blockedBy`. Hai vế lệch 8.383 tỷ, ô `Chênh lệch` để trống, đọc thành "chênh bằng 0".
Sửa: `blockedBy.length > 0` ép chip sang `is-review`; đổi nhãn thành `Đã ghép chỉ tiêu`; điền lý do vào ô chênh lệch.
Lệnh: /impeccable clarify

### [P0] Bốn con tổng khác nhau cho cùng một kỳ
KPI 43.189 tỷ · bảng Cơ quan thuế ~47.400 tỷ · tab Đối soát 44.243 tỷ · tổng chứng từ 50.056 tỷ. Thẻ Cơ quan thuế khai "Số thực tế" trong khi trang treo `Số mô phỏng`.
Sửa: dòng cầu nối dưới bảng Cơ quan thuế; tag nguồn ở cấp thẻ.
Lệnh: /impeccable clarify

### [P1] Nhóm "chưa xác định" tô bằng bậc đậm nhất của thang dữ liệu
`charts.tsx:52` gán màu theo `rankByAmount` nên lát lớn nhất nhận `--donut-1`. DESIGN.md quy định bậc chưa có số liệu là `--nodata`, tách khỏi thang.
Sửa: kéo nhóm chưa xác định ra khỏi ramp, tô `--nodata`, xếp cuối legend.
Lệnh: /impeccable colorize

### [P1] 87 chỗ chữ 8,4px, đơn vị lặp 88 lần trái quy tắc của chính hệ thống
`.dtable` 12px × `.dmoney i` 0.7em = 8,4px, sàn 11px. DESIGN.md: đơn vị ghi một lần ở đầu cột.
Kèm: dòng `Cộng` của `CorrespondencePanel` cộng số gốc rồi làm tròn, lệch 1 so với tổng các dòng hiển thị (`TmsPanels.tsx:277`).
Sửa: bỏ `<i>tỷ</i>` khỏi ô bảng, đưa lên header; `Cộng` cộng trên giá trị đã làm tròn.
Lệnh: /impeccable typeset

### [P2] Bấm ngôi sao không phát tín hiệu định vị (ĐÃ SỬA MỨC ĐỘ)
ĐÍNH CHÍNH: lượt critique xếp `<tr onClick>` là P1 vi phạm WCAG với lý do bàn phím không tới được. Audit đo và BÁC BỎ: 119 điểm dừng Tab, 12/12 nút ghim tới được, Enter hoạt động, vòng focus hiện ở 100% điểm dừng. `<tr onClick>` là affordance dư thừa cho chuột, không phải đường duy nhất.
Khiếm khuyết thật: `PinStar` gọi thẳng `pinned.toggle` còn dòng gọi `toggle` cục bộ có `setFlash`, nên bấm ngôi sao hoặc nhấn Enter KHÔNG phát `dpin-flash` — nhóm dùng bàn phím là nhóm dễ mất dấu nhất lại không nhận được tín hiệu.
Sửa: `PinStar` nhận prop `onToggle` gọi `toggle` cục bộ; giữ `stopPropagation`.
Lệnh: /impeccable harden

## Persona Red Flags

Lãnh đạo thành phố: bức tường mũi tên xanh lá 14/14 dòng; tag `Số mô phỏng` đọc như nhãn phân loại; không bao giờ tới thẻ thứ 7 ở mốc 3.500px.
Cán bộ thuế đối soát: mất niềm tin ở dòng `Cộng` lệch 1; bảng Cơ quan thuế vượt KPI 4.200 tỷ; cột `Chênh lệch` trống cả 6 dòng; không export.
Người xem lần đầu: không glossary; hai điều khiển tên gần trùng cùng sửa một state với hai nhãn khác nhau; ở 390px câu giải thích quan trọng nhất biến mất.

## Minor Observations

10 đoạn `.dhint` dài 174–275 ký tự/dòng. Nút sắp xếp cao 19px. Ba cách viết kỳ trên hai tab. Nhãn `dt` tô xanh thương hiệu đọc thành link. Tab Báo cáo: con lớn hơn cha ở gần mọi cột địa bàn; 390px cần 43 lần bấm `Cột sau`.
Báo động giả đã loại: `tight-leading` 1,30 — lỗi làm tròn số thực, không phải lỗi giãn dòng.

## Questions to Consider

1. Nếu 45,1% chưa tra được Mục cha, bảy thẻ phía dưới đang đo cái gì? Màn hình này để đọc ngân sách hay để sửa danh mục?
2. Ai được phép nói "khớp"? Cùng sản phẩm vừa từ chối đặt ngưỡng vừa phát ra `Khớp tuyệt đối` và `Đối soát được`.
3. Bảy thẻ thuộc về một tab, hay là bốn tab bị gộp vì chưa ai dám cắt?
