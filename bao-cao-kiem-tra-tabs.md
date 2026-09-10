# Kiểm tra thực tế dashboard Thu NSNN Hà Nội

Ngày kiểm tra: 10/09/2026. Trang: https://dev-nsnn.thehegeo.com/

Kiểm tra bằng Chrome tự động ở 1440×1000 và 390×844. Đây là kiểm tra hành vi và tính nhất quán trên bản dev, chưa đối chiếu số tiền với dữ liệu nghiệp vụ gốc. Không sửa ứng dụng.

## Kết quả chính

Phát hiện 5 nhóm vấn đề ưu tiên cao và 1 vấn đề responsive. Các bất nhất số liệu dưới đây đã quan sát trực tiếp; nguyên nhân phía backend chưa được xác định. Không chấm điểm tổng thể về hiệu năng/theming/WCAG vì chưa có đủ phép đo và mã nguồn gốc.

### 1. [P1] So sánh biến thiếu dữ liệu thành giảm 100%

- Vào So sánh hai kỳ → Hoàn Kiếm → tháng 9/2025 và tháng 9/2026.
- Phần đầu cảnh báo năm 2026 có 0 phường báo cáo, KPI ghi “chưa có số liệu”, chênh lệch “—”.
- Nhưng “Theo chỉ tiêu” vẫn ghi -19,96 nghìn tỷ / -100.0%; NSTW ghi -19,26 nghìn tỷ / -100.0%.
- Tái hiện tương tự ở Phúc Lợi.
- Tác động: người đọc có thể hiểu thiếu báo cáo là mất toàn bộ nguồn thu.
- Đề xuất: giữ trạng thái thiếu dữ liệu xuyên suốt KPI, biểu đồ và bảng; không tính chênh lệch hay tỷ lệ nếu một kỳ thiếu.
- Bằng chứng: [ảnh so sánh](.audit/compare-ready.png), [nội dung](.audit/compare-ready.txt).

### 2. [P1] Lũy kế trên thẻ và trên biểu đồ không khớp

- Overview → 2026 → tháng 8 → Thực hiện trong kỳ → Tổng số → toàn thành phố.
- KPI YTD là 532,48 nghìn tỷ; điểm đường lũy kế tháng 8 trên biểu đồ gần 1.400 nghìn tỷ.
- Đường này giảm về khoảng 532 nghìn tỷ từ tháng 9, trong khi các tháng chưa có báo cáo vẫn được vẽ tiếp.
- Chưa xác định con số nào là đúng; cần đối chiếu cách tổng hợp và phạm vi dữ liệu của hai thành phần.
- Đề xuất: thống nhất cách tính YTD, phạm vi địa bàn và xử lý kỳ chưa có số liệu; thể hiện đính chính rõ nếu giảm do điều chỉnh.
- Bằng chứng: [Overview tháng 8](.audit/aug-ready.png).

### 3. [P1] Bảng xếp hạng phường/xã chứa mã tổng hợp Kho bạc

- Overview → kéo đến “Xếp hạng 126 phường/xã theo tháng”.
- Nội dung lại ghi 127 phường/xã; hạng nhất là “MÃ TỔNG HỢP BÁO CÁO KHO BẠC NHÀ NƯỚC KHU VỰC I - HÀ NỘI”, 33,16 nghìn tỷ, 100%.
- Đây không phải tên một phường/xã trong bộ chọn địa bàn.
- Đề xuất: loại bản ghi tổng hợp khỏi tập địa bàn để xếp hạng, tính mẫu số và đếm số phường.
- Bằng chứng: [Overview](.audit/overview.png), [Overview tháng 8](.audit/aug-ready.png).

### 4. [P1] Bảng xếp hạng theo tháng không phản ánh kỳ đang chọn

- Chọn tháng 8/2026: Top địa bàn có Xuân Đỉnh 3,37 nghìn tỷ; Hoàn Kiếm 3,04 nghìn tỷ.
- Bảng xếp hạng bên dưới vẫn dùng 36 tháng 2024-01…2026-12, mã Kho bạc chiếm 100%, các phường hiện 0.
- Mâu thuẫn tồn tại sau khi các trạng thái tải đã kết thúc.
- JS công khai của bản dev cho thấy phần xếp hạng sắp theo thuộc tính `last`; chưa xác minh backend áp dụng bộ lọc như thế nào.
- Đề xuất: xếp hạng đúng kỳ lọc hoặc công bố rõ một kỳ riêng; không dùng kỳ tương lai thiếu dữ liệu thành số 0. Tách phạm vi sparkline lịch sử khỏi kỳ tính thứ hạng.
- Bằng chứng: [nội dung tháng 8](.audit/aug-ready.txt).

### 5. [P1] “Theo cấp ngân sách” trống dù thành phần khác có số liệu

- Overview tháng 8/2026: “Theo cấp ngân sách” báo “Không có số liệu”; khối so sánh cơ cấu phía dưới có tỷ lệ NSTW/NSĐP từng phường.
- Chi tiết Hoàn Kiếm cũng báo trống; chuyển sang so sánh tháng 8/2025 với tháng 8/2026 lại có NSTW, NS cấp tỉnh, NS cấp xã.
- Đề xuất: kiểm tra truy vấn/mapping chỉ tiêu cho component này và thống nhất phạm vi tính; nếu có khác biệt nghiệp vụ phải giải thích ngay trong khối.
- Bằng chứng: [chi tiết Hoàn Kiếm](.audit/detail-ready.png), [so sánh tháng 8](.audit/compare-aug.png).

### 6. [P2] Overview tràn ngang trên điện thoại

- Viewport 390×844; Overview với địa bàn Phúc Lợi, tháng 8/2026.
- Document rộng 512px. Kiểm tra lại sau khi đưa chuột ra ngoài nội dung vẫn tái hiện.
- Các dòng xếp hạng dùng bốn cột và sparkline rộng cố định 220px, khiến giá trị vượt mép phải.
- Đề xuất: đổi cách xếp dòng ở màn hình hẹp, cho sparkline co giãn hoặc chuyển xuống hàng riêng.
- Bằng chứng: [ảnh mobile](.audit/mobile-final-overview.png).

## Những thao tác đã hoạt động

- Cả ba tab Overview, Chi tiết địa bàn và So sánh hai kỳ mở được.
- Chọn Hoàn Kiếm/Phúc Lợi cập nhật địa bàn, KPI và URL.
- Click vùng bản đồ chọn được Phúc Lợi, hiện 319,1 tỷ cho tháng 8/2026 và hạng 17/126.
- So sánh Hoàn Kiếm tháng 8/2025 với tháng 8/2026: 1,6 → 3,04 nghìn tỷ; +1,44 nghìn tỷ / +89,6%; có cảnh báo về số địa bàn báo cáo khác nhau.
- Bộ chọn quý xóa lựa chọn tháng trước đó, tránh giữ hai kỳ xung đột.
- Các nút tổng số/tăng trưởng/độ ổn định, sắc thuế và xem thêm nhận thao tác.
- Reload tab so sánh giữ tab, địa bàn và hai kỳ trong URL.
- Bộ lọc chính có label liên kết với select.
- Các luồng đã hoàn tất không ghi nhận JavaScript pageerror.

## Giới hạn

- Chưa kiểm tra mọi tổ hợp của 126 địa bàn, 3 năm và các chỉ tiêu; chưa kiểm toán số liệu với nguồn gốc.
- Một lượt tự động không tìm thấy nút Reset zoom sau chuỗi thao tác; thử riêng thao tác bản đồ lại thành công. Không đưa timeout đó thành lỗi ứng dụng đã xác nhận. Chưa kết luận nút Reset zoom hoặc Tải lại dữ liệu đạt kiểm thử.
- Tràn ngang tab so sánh từng xuất hiện khi con trỏ ở biểu đồ; cần phân biệt tooltip với lỗi bố cục trước khi đưa thành lỗi độc lập.
- Không thực hiện kiểm thử tải, ghi dữ liệu hay kiểm thử bảo mật.

Ưu tiên xử lý: thiếu dữ liệu → lũy kế → tập địa bàn và kỳ xếp hạng → cấp ngân sách → responsive. Sau khi sửa cần kiểm tra lại các trường hợp đã nêu.
