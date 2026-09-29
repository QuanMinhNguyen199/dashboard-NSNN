# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

React, TypeScript và Vite, tách thành ứng dụng độc lập trong cùng repository với Dashboard Thu NSNN.

## Users

Cán bộ xử lý nghiệp vụ, trưởng phòng, lãnh đạo cơ quan Thuế và quản trị dữ liệu
của Thuế TP Hà Nội. Người dùng làm việc theo ngày, tuần và tháng trên dữ liệu
từ TMS, TTR, ứng dụng hóa đơn, xác minh hóa đơn và tổng đài.

## Product Purpose

Tập trung tiếp nhận dữ liệu, xử lý ngoại lệ, phân công công việc, theo dõi hạn
và lập báo cáo nội bộ. Thành công là giảm thao tác tải, ghép và làm sạch hàng
chục file mỗi kỳ, đồng thời mỗi số trên báo cáo truy được về nguồn và người duyệt.

## Positioning

Đây là bàn làm việc nghiệp vụ có luồng xử lý và truy vết dữ liệu, không phải
một dashboard quan sát số liệu. Hệ thống nối lô dữ liệu nguồn với ánh xạ người
nộp thuế, công việc cán bộ và phiên bản báo cáo đã duyệt.

## Operating Context

Dữ liệu đến theo lô file hoặc API, có thể thiếu cột, đổi mẫu, thiếu mã số thuế
hoặc không cùng kỳ. Báo cáo chạy theo tuần, tháng và năm. Một số nguồn chỉ truy
cập được trong mạng nội bộ hoặc qua ứng dụng cũ.

## Capabilities and Constraints

- Tách state, URL, quyền truy cập và backend khỏi Dashboard Thu NSNN.
- Dữ liệu người nộp thuế là dữ liệu nhạy cảm và phải được kiểm soát theo quyền.
- Ánh xạ MST → cán bộ → phòng/đơn vị có thời gian hiệu lực và lịch sử thay đổi.
- Báo cáo đi qua các trạng thái nháp, chờ duyệt, đã duyệt và phát hành.
- Bản đầu dùng dữ liệu mô phỏng tất định; không công bố thành số nghiệp vụ thật.
- Chu kỳ chuẩn là tuần, tháng và năm.

## Brand Commitments

Giữ ngôn ngữ thể chế, rõ ràng và tiết chế của hệ thống hiện tại: navy, nền xám
xanh nhạt, bề mặt trắng, viền mảnh, typography dày thông tin và tiếng Việt nghiệp vụ.

Sản phẩm này đi theo **chuẩn mực của loại sản phẩm** một cách có chủ đích, không
tìm một thế giới thị giác riêng. Đây là lựa chọn của người dùng trong vòng chọn
hướng ngày 28/09/2026, không phải mặc định do thiếu quyết định. Quy ước vì thế
là cam kết: thực thi đầy đủ, không mỉa mai và không lén cài nét lạ.

Thước đo thủ công là **Stripe Dashboard**: dày thông tin mà vẫn tĩnh, bảng dài
đọc được, số có trọng lượng, trạng thái rõ mà không ồn ào. Khác biệt so với bản
trước không nằm ở cách sắp xếp mà nằm ở mức hoàn thiện.

Hai lằn ranh người dùng đặt ra: giao diện **không được trông như sản phẩm tiêu
dùng**, và **không được đổi vị trí** điều hướng, bộ lọc hay nút mà người dùng đã
quen tay.

**Chữ dùng stack hệ thống, không tự host.** Quyết định của người dùng ngày
28/09/2026 sau khi vòng duyệt cuối đề nghị ngược lại. Ba căn cứ: bề mặt Operate
được phục vụ tốt bằng font hệ thống; dấu tiếng Việt chồng tầng (ế, ự, ỡ) hiển
thị ổn định trong Segoe UI trong khi nhiều webfont subset latin-ext dựng không
đều; và hệ thống chạy trên mạng nội bộ nơi mọi kilobyte tải thêm là chi phí
thật. Đây là lựa chọn đã cân nhắc, không phải mặc định do bỏ sót — đừng mở lại
nếu không có yêu cầu mới từ người dùng.

## Evidence on Hand

- `../28-09/MoM_24_9_Khảo sát quy trình báo cáo các phòng Thuế TP Hà Nội.md`
- `../28-09/Tình hình tài liệu các phòng gửi.md`
- `../28-09/DE-XUAT-WEB-QL-CAN-BO-THUE.md`

Chưa có bộ dữ liệu gốc đầy đủ, cùng kỳ và chưa chỉnh tay cho mọi phòng; mọi số
trong bản demo phải mang nhãn mô phỏng.

## Product Principles

- Công việc và ngoại lệ phải hiện trước biểu đồ.
- Mọi số phải truy được về nguồn, kỳ chốt và phiên bản quy tắc.
- Chỉ tự động khi dữ liệu đủ tin cậy; phần chưa ánh xạ luôn được giữ lại.
- Quyền xem đi theo vai trò và phạm vi tổ chức.
- Báo cáo chính thức luôn có người duyệt và phiên bản phát hành.

## Accessibility & Inclusion

Mục tiêu WCAG 2.1 AA; thao tác bàn phím đầy đủ, vùng chạm tối thiểu 44px trên
mobile và không dùng màu làm tín hiệu trạng thái duy nhất.
