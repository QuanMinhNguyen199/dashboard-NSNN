# Prompt Gemini: Tax Ops Design System cho Figma

Copy prompt bên dưới vào Gemini. Nếu Gemini không đọc được thư mục trên máy, đính kèm `Tax-Ops-Design-System-v1.zip`, `tokens.json`, `tokens.css`, `preview.html` và ảnh preview trong cùng thư mục.

---

Bạn là chuyên gia thiết kế design system và triển khai thư viện component trong Figma. Hãy tạo hoặc hoàn thiện thư viện **Tax Ops — Design System v1** cho ứng dụng nội bộ quản lý nghiệp vụ Thuế TP Hà Nội, dựa trên các file nguồn được cung cấp. Đây là công cụ tác nghiệp cho cán bộ thuế, trưởng phòng, lãnh đạo và vận hành dữ liệu; không phải dashboard marketing hay sản phẩm tiêu dùng.

## Nguồn và thứ tự ưu tiên

1. Nguồn chuẩn về giao diện đang chạy: `tax-ops/src/styles.css` và các component trong `tax-ops/src/components/ui.tsx`.
2. Dùng `tax-ops/design-system/tokens.json` để lấy token, kích thước, icon và mapping component; dùng `tokens.css`, `preview.html` và ảnh preview để đối chiếu.
3. Nếu có `Tax-Ops-Design-System-v1.zip`, ưu tiên kiểm tra plugin import trong đó trước khi tự dựng lại. Plugin được thiết kế để thêm một trang riêng, không sửa các trang/component hiện có.
4. Không lấy các mô tả visual cũ về màu đỏ/vàng, system font hoặc Figma cũ làm chuẩn. Một số tài liệu lịch sử chưa đồng bộ với CSS hiện tại. Giữ các nguyên tắc nghiệp vụ còn phù hợp, nhưng visual và component phải khớp implementation hiện hành.
5. Không bịa token, component, workflow, trạng thái hoặc dữ liệu nghiệp vụ. Nếu file nguồn thiếu thông tin hay hai nguồn hiện hành xung đột, ghi rõ điểm cần xác nhận thay vì tự quyết.

## Hướng thiết kế

- Creative direction: **bàn làm việc trên hệ màu NSNN**. Dùng navy thể chế `#0e2a47` cho sidebar, mobile drawer và khung; canvas xám xanh `#f2f5f9`; bề mặt trắng; mực `#16263c`.
- Xanh thương hiệu `#1657a8` dùng cho nút chính, liên kết và trạng thái đang chọn; hover `#1c5cab`. Thang dữ liệu xanh gồm `#1657a8`, `#3987e5`, `#86b6ef` và `#75869b`. Giữ màu trạng thái NSNN: positive `#187044`, warning `#7a5a12`, critical `#b3352f`. Logo đỏ/vàng Thuế giữ nguyên trong asset nhận diện, không dùng làm màu UI.
- Trung tính xám xanh, viền mảnh, bề mặt phẳng và bóng rất nhẹ. Mật độ thông tin cao nhưng tĩnh, ưu tiên bảng dài dễ quét và số liệu căn cột. Không dùng thẻ nổi dày đặc, gradient trang trí, dark theme hoặc đỏ cho mọi biểu đồ.
- Typography là **Public Sans**, gồm đầy đủ dấu tiếng Việt. Dùng tabular numerals cho số liệu; giữ đúng các text style và weight trong `tokens.json`, gồm weight 650 nếu Figma hỗ trợ variable font.
- Ngôn ngữ giao diện là tiếng Việt nghiệp vụ, gọn và chính xác. WCAG 2.1 AA, focus nhìn thấy rõ, trạng thái không chỉ phân biệt bằng màu.

## Nội dung thư viện cần có

Tạo trang `Tax Ops — Design System v1`, chia thành sáu khu vực: **Hướng dẫn, Foundations, Icons, Controls, Data, Feedback**. Thư viện mục tiêu có 58 color variables (semantic và palette), 11 text styles, các spacing/radius/dimension tokens trong `tokens.json`, 21 icon SVG lấy từ source và 16 component families theo mapping trong token file.

- **Foundations:** màu semantic và alias tới primitive phù hợp; typography; spacing; radius; kích thước; effect styles. Tên biến và style phải có cấu trúc, dễ tìm và bám token nguồn.
- **Controls:** Button Primary/Secondary/Quiet; field Text/Search/Select; Segmented; Navigation. Thể hiện variant và state thực có trong code, gồm default, hover, focus, disabled, selected, và error nơi được hỗ trợ. Button và field có bộ desktop 32px và touch 44px khi áp dụng.
- **Data:** Badge theo các tone có trong source; Table/Cell/Row; Panel; Figure/FigureLine; Pager. Dùng số liệu mẫu có nhãn minh họa, không tạo số liệu nghiệp vụ thật.
- **Feedback:** Notice theo tone, Toast, EmptyState và Dialog; bám nội dung, màu và behavior hiện hữu trong source.
- Dùng Auto Layout, component properties, variants và variable binding khi phù hợp. Đặt tên nhất quán với tiền tố `Tax Ops /`; component mẫu trên canvas nên là instance của main component để việc cập nhật được phản ánh.
- Các kích thước bảng, sidebar, topbar, controls và spacing phải lấy từ `tokens.json`/CSS; không tự nới lỏng mật độ hoặc đổi vị trí điều hướng và bộ lọc quen thuộc.

## Bảo toàn file và kiểm tra

- Nếu file Figma đã có nội dung, tạo trang/thư viện riêng; không ghi đè, xóa hoặc đổi tên nội dung cũ. Tránh tạo trùng nếu trang hoặc collection Tax Ops đã tồn tại.
- Kiểm tra dấu tiếng Việt, cỡ chữ nhỏ, số căn cột, các trạng thái, nội dung dài và khả năng đọc trên nền sáng/navy. Kiểm tra component touch tối thiểu 44px cho trải nghiệm màn hình nhỏ.
- So sánh canvas với `preview.html` và source, không chỉ dựa vào tên file. Preview hiện đã kiểm tra ở 1440px và 390px; việc đó không thay thế kiểm tra canvas sau khi import.
- Chưa được tuyên bố đã hoàn tất import, publish hoặc Code Connect nếu chưa thực sự chạy và kiểm tra trong Figma. Nếu môi trường không thể thao tác Figma, hãy trả lại cấu trúc trang, component/variant, variables, các bước import còn thiếu và mọi khác biệt chưa xác minh.

## Kết quả cần bàn giao

1. Một trang Figma `Tax Ops — Design System v1` có sáu khu vực và component/variable có thể tái sử dụng.
2. Báo cáo ngắn nêu phần đã import/tạo, phần chưa xác minh, vấn đề font hoặc token nếu có, và bước tiếp theo cần người dùng thực hiện.

Trước khi bắt đầu, xác nhận bạn đã đọc được các file đính kèm nào. Nếu có plugin import kit, hãy hướng dẫn chạy plugin trong Figma Desktop trước; không tự dựng lại toàn bộ thư viện nếu plugin đã tạo đúng nội dung.