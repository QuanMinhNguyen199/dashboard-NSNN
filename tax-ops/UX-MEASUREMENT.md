# Kết quả kiểm tra UX — 29/09/2026

Đối tượng: Web quản lý Thuế, http://localhost:5174. Chrome headless, desktop 1440×1000 và mobile 390×844. Một lượt đo trên máy phát triển; không phải kiểm thử người dùng, không phải dữ liệu mạng thực tế hoặc điểm SUS.

## Thay đổi

- Panel có viền và shadow; chữ phụ quan trọng tăng 11 → 12px.
- Sidebar bớt đậm; bỏ ký hiệu HN thay thế logo, giữ tên cơ quan.
- Tổng hợp mobile gọn hơn; bổ sung giải thích nguồn dữ liệu.
- Tạo báo cáo mở form, chặn dữ liệu trống, thêm bản nháp cùng lịch sử v1. Lưu trong phiên trình duyệt theo tài khoản, tồn tại khi đổi mục/tải lại.
- CTA tạo báo cáo ở Nợ, Kiểm tra và Hoàn thuế mở cùng form. Các thao tác demo chưa có chức năng thật nói rõ giới hạn.
- Giữ chuyển cảnh, hover chỉ trên thành phần tương tác và chế độ giảm chuyển động.

## So sánh trước/sau

| Chỉ số, cùng viewport 390×844 | Trước | Sau |
|---|---:|---:|
| Mép trên công việc đầu tiên | 336px | 281px |
| Công việc nhìn thấy trọn vẹn trên màn đầu | 4 | 4 |
| Chữ phụ công việc | 11px | 12px |
| Viền panel | 0px | 1px |
| Shadow panel | Không | Hai lớp nhẹ |
| Tạo báo cáo | Chỉ toast; không mở form | Form → bản nháp và lịch sử |

Công việc xuất hiện sớm hơn 55px (16,4% vị trí dọc ban đầu), nhưng số hàng nhìn thấy trọn vẹn chưa tăng. Không suy diễn con số này thành tăng năng suất người dùng.

## Kết quả tự động

- 14/14 kiểm tra tác vụ đạt: 5 mục sidebar; mở form/focus; dữ liệu trống; Tab trap; tạo bản nháp; tải lại; Escape/trả focus; 3 CTA nghiệp vụ; chọn hồ sơ; hover đúng phạm vi; reduced motion; bố cục mobile; drawer; lỗi JavaScript.
- 8 màn × 2 kích thước đạt kiểm tra giao diện hiện có: không tràn trang, vùng chạm và tiêu đề hợp lệ.
- Chuyển mục, gồm animation: 341, 235, 223, 230, 235ms; trung vị 235ms. Năm mẫu chưa đủ kết luận hiệu năng phổ quát.
- Nhấn tạo → bản nháp xuất hiện: 30ms, sau khi đã nhập dữ liệu. Đây không phải thời gian người dùng hoàn thành form.
- Không có lỗi JavaScript không được xử lý trong kịch bản.

## Giới hạn và bước đo người thật

Chưa đo tỷ lệ hoàn thành, thời gian suy nghĩ, độ hài lòng hoặc SUS với người sử dụng thật. Không tự quy đổi kết quả tự động thành điểm UX.

Đề xuất thử với cán bộ và lãnh đạo: tìm hồ sơ vênh nguồn, tạo bản nháp theo kỳ, tìm báo cáo chờ duyệt. Ghi số hoàn thành không trợ giúp, thời gian, lỗi và câu hỏi người dùng; so sánh trước/sau trên cùng nhiệm vụ. Các dữ liệu và trạng thái hiện vẫn là demo, chưa lưu lên máy chủ.

## Chạy lại

Tại tax-ops, khi portal đang chạy:

```sh
node scripts/measure-ux.mjs
node scripts/acceptance.mjs
```

Số đo thô và ảnh: `.impeccable/review/ux-results.json`, `ux-before.json`, `ux-after-desktop.png`, `ux-after-mobile.png`.
