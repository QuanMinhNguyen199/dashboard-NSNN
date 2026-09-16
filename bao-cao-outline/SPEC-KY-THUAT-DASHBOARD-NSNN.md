# Đặc tả kỹ thuật: Dashboard Thu NSNN

> Dành cho đội phát triển. Phần nghiệp vụ, cây chỉ tiêu và quyết định cần chốt nằm ở báo cáo BA kèm theo; bản này chỉ mô tả phần hiện thực.

## 1. Phạm vi tài liệu

Tài liệu này nhận phương án thiết kế trong báo cáo BA và mô tả phần đội phát triển phải dựng: hợp đồng API, hành vi giao diện theo khổ màn hình và theo trạng thái dữ liệu, và tiêu chí nghiệm thu. Quy tắc tính và định nghĩa chỉ tiêu không lặp lại ở đây; mọi thay đổi quy tắc bắt đầu từ báo cáo BA.

## 2. Hợp đồng API và MCP

API nhận kỳ, chỉ tiêu, phạm vi lọc, chiều nhóm chính và phụ, và phiên bản quy tắc. Kết quả trả về cây dòng báo cáo, cột nhóm, giá trị, đơn vị, thời điểm cập nhật và trạng thái đối soát.

Máy chủ nối dữ liệu, xử lý giao dịch và tính dòng tổng. Giao diện nhận `rowId`, `parentId`, `rowType` cùng giá trị để trình bày, không tự suy công thức từ tên hoặc số thứ tự dòng. Quy tắc dùng chung cho web, iframe và mobile; đổi cách nhóm cột không đổi cách tính.

Khi mở một ô, hỗ trợ Cấp quản lý → Mục → Tiểu mục; Chương nằm trong bộ lọc nâng cao. Máy chủ lấy lựa chọn có phát sinh từ giao dịch đủ điều kiện, giữ kỳ/chỉ tiêu/phạm vi cột và áp dụng danh mục theo hiệu lực. Cấp quản lý không thay địa bàn, cơ quan thuế hay cấp ngân sách. Đổi cấp kiểm tra lại lựa chọn phụ thuộc và báo khi cần đặt lại; không ghép danh mục để giả định có phát sinh.

## 3. Hành vi theo khổ màn hình

Web rộng hiển thị bảng nhóm cột và cố định cột tên chỉ tiêu. Trên iframe hẹp hoặc mobile, thanh bộ lọc giữ đủ chiều rộng, người dùng chọn một nhóm cột để xem rồi mở chi tiết bằng bảng hoặc trang con. Bảng đầy đủ vẫn cuộn ngang được; không ép nhiều tầng tiêu đề vào một màn nhỏ.

## 4. Trạng thái, liên kết và quyền

Quay lại giữ nguyên bộ lọc và vị trí trong bảng. Liên kết dùng ID hoặc token ổn định do hệ thống quản lý. Quyền truy cập kiểm tra ở máy chủ; token không thay thế phân quyền.

Thiếu hoàn toàn dữ liệu giao dịch thì trả trạng thái không có dữ liệu; `null` không đổi thành 0. Tải lỗi thì giữ bộ lọc, đánh dấu dữ liệu cũ nếu còn hiển thị, cho phép tải lại. Thiếu dự toán hoặc phân bổ ngân sách thì ẩn KPI và biểu đồ phụ thuộc, kèm giải thích ngắn ngay tại chỗ.

Dữ liệu mô phỏng, tạm tính và đã đối soát mang nhãn riêng ở tầng dữ liệu, giao diện hiển thị theo nhãn đó chứ không tự suy.

## 5. Tiêu chí nghiệm thu

| ID | Tiêu chí |
|---|---|
| AC01 | Tám mẫu dùng cùng cây chỉ tiêu và bộ tính, chỉ thay chiều nhóm |
| AC02 | Mọi dòng báo cáo giữ tên, quan hệ cha con và điều kiện tương ứng |
| AC03 | A = I + II + III; A* = A - I.1; B và D không có số tổng tự sinh |
| AC04 | Dòng "Trong đó" không làm tăng tổng cha; A và A* không cộng với nhau |
| AC05 | Hoàn, hủy hoàn và thu hồi hoàn phân biệt bằng đúng ký hiệu giao dịch |
| AC06 | Cùng dữ liệu, đổi thứ tự địa bàn, ngành hoặc cơ quan thuế không đổi tổng chỉ tiêu |
| AC07 | Nối ngành nghề và hợp nhất đợt lấy không nhân số tiền |
| AC08 | Click ô giữ kỳ, chỉ tiêu và mọi điều kiện của nhóm cột; quay lại giữ trạng thái |
| AC09 | Có số âm thì dùng bảng hoặc thanh phù hợp; donut tối đa Top 5 và Khác khi đủ điều kiện |
| AC10 | Mã chưa có tên hoặc hiệu lực và dữ liệu thiếu mang trạng thái riêng, vẫn đối soát được |
| AC11 | Thiếu dự toán hoặc cấp hưởng không tạo KPI và biểu đồ giả |
| AC12 | Web, iframe, mobile cho cùng kết quả; máy chủ kiểm tra quyền xem chi tiết |
| AC13 | Dữ liệu TMS và Kho bạc có mốc cập nhật, chỉ đối soát khi cùng phạm vi |
| AC14 | Chọn cấp quản lý thu hẹp giao dịch theo Chương; Mục/Tiểu mục được nhóm từ số của ô, giữ tổng gồm nhóm chưa xác định |
| AC15 | Đổi cấp kiểm tra lại lựa chọn phụ thuộc, có thông báo đặt lại; không làm mất kỳ/chỉ tiêu/địa bàn |
| AC16 | Ngành chính được nối từ mã số thuế đầy đủ trên giao dịch; giữ mã đơn vị phụ thuộc và không nhân số tiền khi danh bạ có dòng trùng |
| AC17 | Thiếu/xung đột ngành hiển thị nhóm chưa xác định và trạng thái; tỷ lệ nối không suy từ số dòng danh bạ |
| AC18 | Địa bàn trụ sở, đơn vị quản lý và Chương danh bạ không ghi đè địa bàn, cơ quan thuế hoặc Chương của chứng từ |
| AC19 | Phiên bản bảng nối và trạng thái hiệu lực đi cùng kết quả; bản danh bạ hiện tại không tự trở thành lịch sử ngành nghề |
| AC20 | Không có chứng từ thì không tạo số thu từ danh bạ; lỗi nguồn không đổi thành 0; mô phỏng luôn có nhãn |
| AC21 | Không nạp danh bạ thật vào bundle, URL, mock hay payload MCP toàn bộ; chỉ trả tổng hợp/danh mục theo quyền |
| AC22 | Bảng tỉnh/thành xử lý đúng vùng ô gộp; mã địa bàn/cơ quan nối theo mã và hiệu lực, không chỉ theo tên |

## 6. Bổ sung ngành nghề từ danh bạ TMS

### Dữ liệu đã nhận và phần còn cần dựng

Đã nhận danh bạ có mã số thuế, ngành nghề chính, nhóm ngành và thuộc tính người nộp; danh mục ngành; bảng địa bàn TMS, cơ quan thuế và chuyển đổi tỉnh/thành. Bảng nối đã có dữ liệu để chuẩn bị nhập, chưa chứng minh số thu đã được kết nối. Tám mẫu báo cáo vẫn cần được hiện thực theo BA; không coi việc nhận danh mục là hoàn thành báo cáo theo ngành.

Luồng nguồn: giao dịch TMS → mã số thuế đầy đủ → một bản ngành chính phù hợp → danh mục tên/nhóm ngành. Địa bàn và cơ quan thuế nối độc lập từ chứng từ. Chi tiết trường nguồn, kiểm tra đầu vào và điều kiện dùng nằm ở mục 17 của [Đặc tả kỹ thuật TMS nội bộ](noi-bo/SPEC-KY-THUAT-TMS-NOI-BO.md).

### Yêu cầu cho API/MCP và giao diện

| Thành phần | Yêu cầu triển khai |
|---|---|
| Cách xem ngành | “Ngành nghề” mặc định là ngành chính; nhóm ngành lấy từ phân loại đã xác nhận. Không tự suy cây ngành từ độ dài mã |
| Phạm vi | Giữ kỳ, địa bàn, chỉ tiêu và cấp quản lý khi đổi cách nhóm; ngành nghề không thay quy tắc Chương/Tiểu mục |
| Bộ lọc | Danh mục trả mã/tên và trạng thái; có danh mục khác có phát sinh thu. Chỉ hiển thị “có phát sinh” sau khi kiểm tra giao dịch |
| Dòng thiếu ngành/nhóm | Giữ trong “Chưa xác định ngành/nhóm”; cho biết thiếu dữ liệu hay xung đột, không hiện lỗi nguồn như tên ngành |
| Thời gian áp dụng | Hiển thị thông tin phân ngành theo bản chụp khi chưa kiểm chứng hiệu lực; không gắn nhãn đã đối soát chỉ vì nối mã thành công |
| Quyền | Người dùng báo cáo nhận số tổng hợp; danh bạ/MST và chứng từ xử lý phía máy chủ, tra cứu theo quyền |
| Mock | Dùng người nộp và giao dịch giả; tách danh mục đã nhận khỏi số mô phỏng. Không chia tiền theo số doanh nghiệp trong danh bạ |

Đề xuất bổ sung phản hồi: `mappingVersion`, `industryBasis: primaryIndustry`, `temporalStatus: verified | snapshotUnverified`; từng kết quả tra cứu có `mappingStatus: matched | missing | conflict`. Đây là phần mở rộng cần triển khai đồng thời trong kiểu TypeScript, validator và provider; không giả định schema hiện tại đã hỗ trợ. `quality` trả số giao dịch và số tiền bị ảnh hưởng trong phạm vi lọc, gồm nhóm chưa xác định. Các loại vấn đề có thể giao nhau nên không cộng các bộ đếm thành tổng chung.

Frontend nhận kết quả đã tổng hợp, có đơn vị tiền và thời điểm cập nhật. Danh sách ngành/cơ quan hỗ trợ tìm kiếm/phân trang; không tải toàn bộ danh bạ người nộp vào iframe/mobile hoặc gửi qua MCP. Không sử dụng vùng tổng hợp nguồn đang lỗi để tạo KPI.

### Điểm đối chiếu trong code

- `web/src/domain/types.ts`, `web/src/data/validate.ts`, `web/src/data/providers/http.ts`: mở rộng kiểu, kiểm tra phản hồi và đọc ngành chính/phiên bản/trạng thái; tính và nối dữ liệu ở máy chủ.
- `web/src/domain/tms.ts`, `web/src/domain/tms-joins.json`: giữ danh mục và quan hệ địa bàn/cơ quan hiện có; không nhúng danh bạ thật vào tệp frontend.
- `web/src/data/mock/tms.ts`: giữ nhãn mô phỏng và kiểm tra tổng khi mở rộng chiều ngành.

Tiêu chí AC16–AC22 cùng TMS29–TMS42 trong đặc tả nội bộ là yêu cầu nghiệm thu cho phần bổ sung, chưa phải kết quả kiểm thử tính năng đã triển khai.
