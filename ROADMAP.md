# Roadmap phát triển Dashboard Thu NSNN

**Cập nhật:** 18/09/2026  
**Mục tiêu:** Dựng đủ khung Dự toán và dự báo, Quản lý doanh nghiệp, Kiểm tra và Báo cáo để cơ quan thuế có thể xem luồng, góp ý và chọn chức năng ưu tiên.

Trong giai đoạn hiện tại, báo cáo là đầu ra chính. Mỗi mảng cần có chức năng cơ bản để demo; dữ liệu hoặc nghiệp vụ chưa hoàn chỉnh phải được ghi trạng thái rõ ràng.

## 0. Trạng thái triển khai (cập nhật 18/09/2026)

Ba mảng đã dựng xong khung, nằm trong tab `Báo cáo` dưới dạng **chế độ báo
cáo** chứ không phải tab cấp cao. Dự toán và danh bạ đã nhận dữ liệu tổng hợp
từ bộ bàn giao 18-09; số thu chi tiết chưa có giao dịch nguồn vẫn là mô phỏng:

| Mảng | Trạng thái | Chặn bởi |
|---|---|---|
| Dự toán & dự báo | Có mốc điều hành 2026, ước tháng 7–12 và dự toán 126 phường/xã; khung tiến độ, drill-down, xuất CSV đã đủ | Số thực hiện chi tiết để ghép với dự toán; công thức sai số chưa duyệt |
| Quản lý thu | Đã tổng hợp 473.618 bản ghi theo ngành/CQT/địa bàn; danh sách chi tiết token hoá | Giao dịch TMS để tính số thu thật theo từng nhóm |
| Kiểm tra | Khung đủ, KPI cộng khớp bảng đơn vị | Nguồn TTR; nghĩa của "tiền chi thu" |
| Tóm tắt chế độ Thu NSNN | Đã thêm lớp KPI, xếp hạng và xu hướng trước bảng 113 chỉ tiêu | Số vẫn là mô phỏng |

Chỉ tiêu sai số 3% **chưa được coi là đạt**: mới có giao diện và số mô phỏng,
chưa có tập dữ liệu kiểm thử và cách đo đã duyệt. Kết quả kiểm tra vẫn chờ TTR.

## 1. Kết quả cần đạt

Dashboard cần trả lời rõ:

1. Số thu được phân bổ giữa các cơ quan thuế quản lý như thế nào?
2. Ngành nghề kinh doanh nào đóng góp nhiều nhất vào tổng số thu?
3. Thực thu đang ở đâu so với dự thu tháng 9, tháng 10 và quý IV/2026?
4. Khoản thu nào ổn định, có tính thời vụ, phát sinh đột biến hoặc chịu ảnh hưởng của chính sách?
5. Tổ Kiểm tra cần chú ý biến động nào trong tuần và trong tháng?
6. Phường, xã nào đã hoàn thành dự toán và khoản thu nào tạo ra kết quả đó?
7. Có bao nhiêu cuộc kiểm tra đã hoàn thành, số tiền xử lý và số tiền đã nộp là bao nhiêu?

## 2. Phạm vi tính năng

### 2.1. Thu theo cơ quan thuế

Đặt trong tab **Báo cáo**, dưới chế độ xem **Theo cơ quan thuế**.

- Tổng số thu trong phạm vi đang chọn.
- Số thu và tỷ trọng của từng cơ quan thuế.
- Xếp hạng tăng, giảm và đóng góp lớn nhất.
- Diễn biến theo tuần hoặc tháng.
- Phần số thu chưa xác định được cơ quan quản lý.
- Chọn một cơ quan để xem tiếp theo địa bàn, ngành nghề và mã hạch toán.

Mã cơ quan thuế phải lấy từ chứng từ TMS. Không chia số tiền theo số lượng người nộp thuế hoặc theo danh mục cơ quan.

### 2.2. Thu theo ngành nghề kinh doanh

Đặt trong tab **Báo cáo**, dưới chế độ xem **Theo ngành nghề**.

- Tổng số thu đã xác định được ngành nghề.
- Số thu và tỷ trọng theo ngành hoặc nhóm ngành.
- Top ngành đóng góp nhiều nhất và ngành biến động mạnh.
- Diễn biến theo tuần, tháng và cùng kỳ.
- Nhóm **Chưa xác định ngành nghề** được giữ riêng và vẫn tính trong tổng.
- Chọn một ngành để xem cơ quan thuế, địa bàn, khoản thu và người nộp thuế theo quyền truy cập.

Ngành nghề được nối từ mã số thuế trên giao dịch sang ngành nghề chính trong danh bạ. Phải kiểm soát trường hợp thiếu, trùng, xung đột và sai thời gian áp dụng.

### 2.3. Dự thu tháng 9, tháng 10 và quý IV/2026

Đặt trong tab **Báo cáo**, dưới chế độ xem **Dự thu**; Tổng quan chỉ hiển thị các chỉ số quan trọng nhất.

- Thực thu, dự thu và chênh lệch theo từng kỳ.
- Tỷ lệ hoàn thành dự thu.
- Dự thu theo khoản thu, cơ quan thuế và ngành nghề khi dữ liệu cho phép.
- Danh sách khoản có nguy cơ hụt thu hoặc có khả năng vượt dự kiến.
- Ghi rõ phiên bản, ngày cập nhật và đơn vị cung cấp dự thu.

Ba file đầu vào cần tiếp nhận:

- Dự thu tháng 9/2026.
- Dự thu tháng 10/2026.
- Dự thu quý IV/2026.

Dashboard chỉ hiển thị dự thu do nghiệp vụ cung cấp hoặc được tính theo công thức đã phê duyệt. Chưa có công thức thì không tự ngoại suy từ TMS.

### 2.4. Tính chất của từng khoản thu

Bổ sung thông tin này vào trang chi tiết khoản thu và tooltip giải thích.

- Tính ổn định hoặc mức độ biến động.
- Tính thời vụ và kỳ thường phát sinh.
- Thu thường xuyên hoặc phát sinh một lần.
- Yếu tố ảnh hưởng: chính sách, thị trường, doanh nghiệp lớn hoặc sự kiện bất thường.
- Đơn vị chịu trách nhiệm theo dõi.
- Nguồn xác nhận và thời gian hiệu lực.

Các thuộc tính này dùng để giải thích số liệu, không thay đổi cách cộng tổng số thu.

### 2.5. Báo cáo dành cho Tổ Kiểm tra

Đặt trong tab **Báo cáo**, dưới nhóm **Theo dõi TMS**.

**Báo cáo tuần**

- Tổng thu trong tuần và so với tuần trước.
- Khoản thu, cơ quan thuế và ngành nghề biến động mạnh.
- Giao dịch hoặc nhóm số liệu cần kiểm tra.
- Trạng thái xử lý và người phụ trách.

**Báo cáo tháng**

- Kết quả tháng, lũy kế và so với cùng kỳ.
- Mức hoàn thành dự thu hoặc dự toán.
- Các khoản đóng góp chính và nguyên nhân biến động.
- Nội dung cần theo dõi sang kỳ tiếp theo.

**Biến động chính sách**

- Tên chính sách và thời gian áp dụng.
- Khoản thu, ngành nghề và đối tượng bị ảnh hưởng.
- Hướng tác động dự kiến: tăng, giảm hoặc chưa xác định.
- Số thực tế trước và sau thời điểm áp dụng khi có đủ dữ liệu.
- Nguồn và người xác nhận nhận định.

### 2.6. Khung Dự toán, Quản lý doanh nghiệp và Kiểm tra

Bản demo tiếp theo cần dựng đủ ba mảng, mỗi mảng có các chức năng cơ bản:

| Mảng | Nội dung bản demo |
|---|---|
| Dự toán và dự báo | Thực hiện so với dự toán; xếp hạng phường, xã; xem theo sắc thuế hoặc khoản thu; thử nghiệm dự báo một số báo cáo; theo dõi sai số |
| Quản lý doanh nghiệp | Thu theo doanh nghiệp, nhóm doanh nghiệp và ngành nghề; tăng giảm cùng kỳ; mở chi tiết theo cơ quan thuế, địa bàn và mã hạch toán |
| Kiểm tra | Tổng số cuộc, số đã hoàn thành, số tiền xử lý, số đã nộp; xem theo đơn vị, phòng và kỳ báo cáo từ TMS, TTR |

Mục tiêu cơ quan thuế nêu cho dự báo là sai lệch không quá 3%. Cần thống nhất công thức sai số, kỳ đo, tập kiểm thử và cách xử lý khoản đột biến trước khi dùng làm tiêu chí nghiệm thu.

Tên chỉ tiêu "tiền chi thu" trong ghi nhận cuộc họp chưa rõ. Cần xác nhận có phải "tiền truy thu" hay một chỉ tiêu khác trước khi triển khai.

### 2.7. Trích xuất báo cáo

- Xuất theo đúng phạm vi và bộ lọc đang xem.
- Hỗ trợ sắp xếp theo số tiền, mức tăng giảm và tỷ lệ hoàn thành.
- Ghi nguồn, thời điểm cập nhật và trạng thái số liệu.
- Phân biệt thực tế, dự toán, dự báo và dữ liệu mô phỏng.
- Mẫu file và quyền xuất cần được cơ quan thuế phê duyệt.

## 3. Dữ liệu cần bổ sung

| Dữ liệu | Dùng cho | Trạng thái cần xác nhận |
|---|---|---|
| Giao dịch TMS có số tiền, mã số thuế và mã cơ quan thuế | Thu theo cơ quan, ngành và kỳ báo cáo | Cần dữ liệu thật có thể truy vết |
| Danh mục cơ quan thuế có hiệu lực | Tên đơn vị và quy tắc gộp mã | Cần xác nhận phiên bản theo thời gian |
| Danh bạ mã số thuế và ngành nghề | Thu theo ngành nghề | Cần xử lý thiếu, trùng và xung đột |
| Ba file dự thu | So sánh thực thu với dự thu | Chờ tiếp nhận và xác nhận công thức |
| File tính chất khoản thu | Giải thích biến động | Chờ tiếp nhận và thống nhất thuộc tính |
| Danh mục chính sách và thời gian hiệu lực | Phân tích tác động chính sách | Chờ đơn vị nghiệp vụ xác nhận |
| Dự toán theo địa bàn và sắc thuế hoặc khoản thu | Xếp hạng phường, xã và phân tích mức hoàn thành | Chờ cấu trúc dữ liệu và quy tắc tổng hợp |
| Dữ liệu TTR | Số cuộc kiểm tra, kết quả xử lý và số đã nộp | Chờ trường dữ liệu, khóa nối và quyền truy cập |
| Mẫu báo cáo xuất | Trích xuất theo nhu cầu lãnh đạo và các phòng | Chờ danh sách mẫu ưu tiên |

## 4. Thứ tự triển khai

### Giai đoạn 1: Dựng đủ khung demo

- Dựng ba mảng Dự toán và dự báo, Quản lý doanh nghiệp, Kiểm tra.
- Mỗi mảng có điều hướng, bộ lọc, KPI, bảng hoặc biểu đồ chính và điểm mở chi tiết.
- Bổ sung xếp hạng phường, xã theo tỷ lệ hoàn thành dự toán.
- Hiển thị thời điểm cập nhật dữ liệu.

### Giai đoạn 2: Chuẩn hóa dữ liệu và hợp đồng API

- Thống nhất định nghĩa số thu, kỳ báo cáo và thời điểm chốt dữ liệu.
- Chuẩn hóa mã cơ quan thuế và phép nối ngành nghề.
- Xác định cấu trúc ba file dự thu và file tính chất khoản thu.
- Trả kèm trạng thái chất lượng, phần chưa xác định và nhãn dữ liệu mô phỏng.
- Làm rõ dữ liệu TTR, sắc thuế và chỉ tiêu kết quả kiểm tra.

### Giai đoạn 3: Hoàn thiện báo cáo trọng tâm

- Hoàn thiện chế độ **Theo cơ quan thuế**.
- Hoàn thiện chế độ **Theo ngành nghề**.
- Bổ sung drill-down, bảng chi tiết và xuất báo cáo.
- Kiểm tra tổng không thay đổi khi chuyển cách nhóm dữ liệu.
- Hoàn thiện báo cáo thực hiện dự toán theo địa bàn và sắc thuế hoặc khoản thu.
- Cho phép trích xuất theo mẫu được duyệt.

### Giai đoạn 4: Dự thu, dự báo và tính chất khoản thu

- Nhập ba kỳ dự thu.
- Thể hiện thực thu, dự thu, chênh lệch và mức hoàn thành.
- Gắn thuộc tính giải thích vào từng khoản thu.
- Thử nghiệm dự báo trên một số báo cáo được chọn.
- Đo sai số sau khi có số thực tế; đánh giá mục tiêu không quá 3% theo công thức đã duyệt.

### Giai đoạn 5: Báo cáo Tổ Kiểm tra

- Dựng mẫu báo cáo tuần và báo cáo tháng.
- Bổ sung nhật ký biến động chính sách.
- Thêm trạng thái theo dõi, ghi chú và người phụ trách nếu quy trình nghiệp vụ yêu cầu.
- Tổng hợp các chỉ tiêu đã thống nhất từ TMS và TTR.

## 5. Điều kiện nghiệm thu

- Người dùng nhìn vào màn hình có thể trả lời được cơ quan thuế hoặc ngành nghề nào đóng góp nhiều nhất mà không phải tự ghép nhiều biểu đồ.
- Tổng số thu không thay đổi khi chuyển giữa địa bàn, cơ quan thuế và ngành nghề trong cùng phạm vi lọc.
- Phần chưa nối được cơ quan hoặc ngành nghề luôn được hiển thị và không bị loại khỏi tổng.
- Số dự thu có nguồn, phiên bản và ngày cập nhật; không trộn với thực thu.
- Xếp hạng phường, xã cho thấy tỷ lệ hoàn thành, số thực hiện, dự toán và phần còn thiếu trong cùng phạm vi.
- Người dùng có thể xem theo địa bàn và theo sắc thuế hoặc khoản thu mà tổng vẫn khớp.
- Báo cáo xuất ra giữ nguyên bộ lọc, đơn vị tính, nguồn và thời điểm cập nhật.
- Sai số dự báo được tính theo công thức đã duyệt; giao diện không chỉ hiển thị mục tiêu 3% mà thiếu kết quả đo.
- Mọi số mô phỏng đều có nhãn rõ ràng và không được xuất như báo cáo chính thức.
- Dữ liệu nhạy cảm của người nộp thuế không xuất hiện trong URL, bundle frontend hoặc payload không đúng quyền.

## 6. Những nội dung chưa thực hiện khi chưa đủ dữ liệu

- Không công bố số tiền hoặc thứ hạng thật theo cơ quan thuế và ngành nghề khi chưa có giao dịch TMS.
- Không tự dự báo tháng hoặc quý từ chuỗi số hiện có khi chưa thống nhất mô hình.
- Không dùng số lượng người nộp thuế để phân bổ số thu.
- Không tự kết luận tác động của chính sách khi chưa có nguồn và người xác nhận.
