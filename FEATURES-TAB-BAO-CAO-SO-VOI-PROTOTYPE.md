# Feature mới của tab Báo cáo

## Khác prototype cũ

Prototype cũ chỉ là một màn hình tổng quan, gồm KPI, xu hướng tháng, bộ lọc kỳ/địa bàn/nguồn thu và tiến độ dự toán mô phỏng. Tab `Báo cáo` hiện bổ sung:

- Một không gian báo cáo riêng, có URL state và bốn chế độ: Thu NSNN, Dự toán & dự báo, Quản lý thu, Kết quả kiểm tra.
- Bảng chéo 113 chỉ tiêu có thể xem theo Địa bàn, Cơ quan thuế hoặc Ngành nghề; hỗ trợ chiều chi tiết, mở/thu gọn cây dòng và phân trang cột.
- Lớp tóm tắt trước bảng: tổng thu, số nhóm có dữ liệu, nhóm lớn nhất, top tăng/giảm, tỷ lệ đã phân loại, phần chưa xác định, xếp hạng và xu hướng 12 tháng.
- Dữ liệu giữ đúng phạm vi đang lọc, có trạng thái nguồn/cập nhật; không cộng lại từ các cột đang hiển thị.
- Giao diện responsive: bộ chọn chế độ chuyển sang `select` trên màn hình hẹp, bảng giới hạn số cột để tránh tràn ngang.
