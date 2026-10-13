---
target: khối QLDN (src/features/qldn)
total_score: 24
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 3
target_identity: "file:C:\\Users\\admin\\Desktop\\Prototype overview NSNN\\tax-ops\\src\\features\\qldn"
timestamp: 2026-10-13T01-44-05Z
slug: src-features-qldn
---
Method: dual-agent (A: design review · B: detector + browser)

## Design Health Score — 24/40 (Acceptable)

| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of system status | 3 | Phạm vi, "số liệu mô phỏng", ngày theo dõi rõ; không có thời điểm cập nhật dữ liệu từng chỉ tiêu; pop-up nhắc việc đã gỡ |
| 2 | Match system / real world | 3 | Theo đúng 4 nhóm của file Excel; BQ/T8/CK/đpt viết tắt, "TCS 22 (TTH, QOA)" khó đọc với lãnh đạo |
| 3 | User control and freedom | 3 | Tab/nhóm nằm trên địa chỉ; bộ lọc Cảnh báo chỉ ở state; hộp chọn đơn vị không có "bỏ chọn hết"/"chỉ chọn mục này" |
| 4 | Consistency and standards | 2 | Tên đơn vị lệch giữa module; dòng "Bình quân" thật ra là tổng; thang thanh tỷ lệ khác nhau giữa các ô |
| 5 | Error prevention | 2 | Lãnh đạo xem toàn TP thấy "BQ +0,0" ở cả 11 ô; "−0,0 đpt" tô đỏ |
| 6 | Recognition rather than recall | 2 | Chú giải BQ/T8/CK đặt xa ô; tốt/xấu chỉ báo bằng màu; chi tiết có 4 tầng điều khiển |
| 7 | Flexibility and efficiency | 2 | Danh sách 2.410 DN (97 trang) không tìm, không sắp xếp; bảng xếp hạng không sắp xếp theo cột |
| 8 | Aesthetic and minimalist | 3 | Tĩnh, gọn, đúng chuẩn Stripe; Tổng quan Kết quả ~77 con số cùng một cấp |
| 9 | Error recovery | 2 | Trạng thái rỗng của Cảnh báo tốt; không có trạng thái lỗi/đang tải; `NgoaiPhamVi` là ngõ cụt |
| 10 | Help and documentation | 2 | Có dòng hướng dẫn, ghi chú "Chờ chốt"; không có định nghĩa/công thức chỉ tiêu tại chỗ |

## Design specificity
LLM: nội dung riêng cho sản phẩm (từ vựng nghiệp vụ, 4 nhóm của file chấm điểm, ma trận quyền lộ ra giao diện, "chờ chốt quyền"); hình thức theo chuẩn loại sản phẩm đúng chủ đích PRODUCT.md. Lưới ô KPI + thanh + 3 mốc là mẫu chung. Điểm yếu ở logic so sánh và mã hóa tín hiệu.
Detector: CLI `detect.mjs` trên src/features/qldn: 0 phát hiện (exit 0). Trình duyệt: phát hiện thật trong phạm vi qldn — `.qd-kq-moc em` 10,5px (33 phần tử, styles.css:2235), `.figure-line small` 11px, `.bo-loc-seg` đệm dính viền, 33 dấu gạch dài trong nội dung. Dương tính giả: text-occlusion (nhãn overlay của chính detector), side-tab trên canhbao (::before bị display:none trong .qd-alert-page), layout-transition (khớp chuỗi "stroke-width"), skip-link và sidebar (ngoài phạm vi). Tương phản chữ phụ 5,05:1; ô đang chọn 4,57:1 (vừa qua AA). Focus-visible có trên .qd-kq-o và .qd-the-loc-o. Vùng chạm ≥44px ở 390px; không tràn ngang.

## Priority issues
1. [P1] Tốt/xấu của chênh lệch chỉ báo bằng màu; số mất đơn vị — `Moc` bỏ " đpt" (KetQuaCongTac.tsx:198), nghĩa chỉ nằm ở lớp is-tot/is-xau; với chỉ tiêu "thấp là tốt" dấu + là tin xấu. Vi phạm PRODUCT.md và WCAG 1.4.1; tên đọc của ô là chuỗi ghép vô nghĩa. Fix: ▲/▼ hoặc chữ tốt hơn/kém hơn; aria-label tóm tắt có nghĩa cho .qd-kq-o; giữ đơn vị. Cmd: harden, clarify.
2. [P1] So sánh của lãnh đạo hỏng ở phạm vi toàn TP; dòng "Bình quân" là tổng — 11 ô "BQ +0,0"; dòng is-tong ghi "Bình quân chung toàn thuế (30 đơn vị)" nhưng hiện 5.945/8.085/163 (tổng). "−0,0 đpt" tô đỏ. Fix: khi phạm vi ⊇ toàn thuế, ô BQ đổi nội dung (vd "12/30 đơn vị dưới BQ"); đổi nhãn dòng thành "Toàn thuế (cộng 30 đơn vị)"; |d|<0,05 là trung tính. Cmd: clarify.
3. [P1] Pop-up nhắc việc: biên bản §3 yêu cầu, code hiện không có (đã gỡ sau khi nêu xung đột với The No-Overlay Rule). Quyết định còn mở. Cmd: shape → harden.
4. [P2] Thứ tự nhóm đổi theo khổ màn hình (order ở ≤1360px, styles.css:2213-2216) — thứ tự nhìn ≠ thứ tự Tab, WCAG 1.3.2/2.4.3; thanh tỷ lệ "thấp là tốt" co thang theo max×1,3 nên 5,8% trông đầy gần bằng 84,8%. Fix: bỏ order, xếp bằng cột lưới; thang cố định có nhãn hoặc bỏ thanh cho chỉ tiêu thấp-là-tốt. Cmd: adapt, layout.
5. [P2] Bảng/danh sách dài thiếu công cụ — Danh sách DN không tìm/sắp xếp; bảng xếp hạng chỉ tốt→xấu, 10 dòng/trang. Fix: SearchField MST/tên, sắp xếp theo cột, "kém nhất trước". Cmd: harden, optimize.

## Persona red flags
Alex (power user): không tìm/sắp xếp Danh sách DN; bộ lọc Cảnh báo không lên địa chỉ; chọn 5 TCS phải bỏ tích 20 ô; đổi "Theo số NNT/tiền" làm mất trang và lựa chọn "Theo cán bộ".
Sam (bàn phím/trình đọc): tên đọc ô KPI không đơn vị, không nghĩa; "Theo cán bộ" bị tắt chỉ giải thích qua title; hộp chọn đơn vị không chuyển/trả focus; thứ tự focus đổi ở ≤1360px; nhãn mốc 10,5px; H2 "Cảnh báo nhắc việc" lặp H1.
Lãnh đạo Thuế TP rà 30 đơn vị trước họp: Tổng quan không trả lời "đơn vị nào cần hỏi" (11 ô toàn TP, BQ +0,0); bảng "Theo đầu việc" không bấm được; tên đơn vị lệch giữa module.

## Minor observations
Nhóm Thu NSNN trùng tên với ô; "KPI chờ thống nhất cách tính" màu xanh giống link; gạch dưới dòng tổng bị cụt; Module 1 không có mốc so sánh nào; 2/4 ô dải số đầu Tổng quan đối tượng là "—" với vai cấp phòng; thanh năm thành lập/vốn trông bấm được nhưng không bấm được; hàng tab mobile cắt chữ không vệt mờ; "Xuất Excel" đứng trước bộ lọc ở mobile Cảnh báo; đơn vị "tỷ đồng" của Danh sách DN chỉ ở chân bảng.

## Questions to consider
1. Lãnh đạo có 90 giây trước họp: câu đầu là "thành phố đạt bao nhiêu" hay "đơn vị nào kéo tụt"? Tổng quan chỉ trả lời câu thứ nhất.
2. Với cán bộ (không số giao, không BQ), lưới 11 ô có giúp làm việc, hay chỉ là màn của trưởng phòng bị rút bớt?
3. "Việc quá hạn 10" ở Kết quả sao không dẫn thẳng sang danh sách cảnh báo của đơn vị đó?
