# Báo cáo BA: Phân tích TMS và tích hợp Dashboard Thu NSNN

Cập nhật: 15/09/2026. Tài liệu dành cho lãnh đạo và nhóm nghiệp vụ; mô tả phương án triển khai, chưa xác nhận hệ thống đã kết nối dữ liệu thật.

## 1. Mục tiêu và phạm vi

Dùng giao dịch TMS để giải thích số thu: thu từ khoản nào, phát sinh ở đâu, thuộc cơ quan thuế và ngành nghề nào. Dashboard phục vụ theo dõi và phân tích; không sửa chứng từ hoặc xử lý hồ sơ thuế.

Lãnh đạo xem kết quả và biến động; cán bộ phân tích mở chi tiết để giải thích số; cán bộ nghiệp vụ kiểm tra quy tắc và đối soát. Quyền xem chứng từ, mã số thuế được cấp riêng với quyền xem tổng hợp.

TMS cung cấp chi tiết để tổng hợp. Số hạch toán của Kho bạc dùng đối soát theo phạm vi thống nhất. TMS có thể cập nhật chậm hơn, nên báo cáo phải ghi kỳ, phạm vi và thời điểm dữ liệu trước khi so sánh.

Đã có hướng dẫn lấy số, tám mẫu báo cáo thu nội địa và các bảng nối ngành nghề theo mã số thuế, địa bàn, cơ quan thuế, tỉnh/thành trước–sau sắp xếp. Còn cần giao dịch thực tế, API và xác nhận hiệu lực các bảng nối để kiểm chứng số tiền. Thu xuất nhập khẩu cần phạm vi dữ liệu và quy tắc riêng.

## 2. Chọn cấp quản lý để xem Mục/Tiểu mục có phù hợp không?

**Phù hợp làm luồng xem đơn giản: chọn Cấp quản lý → xem Mục → mở Tiểu mục.** Người dùng không phải chọn từng Chương; hệ thống vẫn giữ Chương để lọc và tính đúng số.

Quan hệ dữ liệu cần hiểu như sau:

| Quan hệ | Cách sử dụng |
|---|---|
| Cấp quản lý → Chương | Tra cấp của Chương theo danh mục có hiệu lực |
| Mục → Tiểu mục | Tra nội dung hạch toán theo danh mục có hiệu lực |
| Giao dịch có Chương và Tiểu mục | Nối hai nhóm trên để tổng hợp số thu trong phạm vi đã chọn |

**Mục/Tiểu mục không thuộc riêng một cấp quản lý hoặc một Chương.** Danh mục hiện có không cho phép chỉ chọn cấp rồi suy ra toàn bộ Mục/Tiểu mục được dùng ở cấp đó. Danh sách có phát sinh phải lấy từ giao dịch đã lọc; chưa có giao dịch thì chỉ cung cấp tra cứu danh mục, không khẳng định đã phát sinh.

Ví dụ: chọn Cấp xã, hệ thống lấy giao dịch có Chương thuộc cấp xã, nhóm theo Mục và mở Tiểu mục. Chương 857 chỉ là một Chương trong cấp này. Chương nằm trong bộ lọc nâng cao và phần giải thích số liệu, có tìm kiếm mã/tên.

Cấp quản lý của Chương khác Phường/Xã phát sinh, cơ quan thuế quản lý và cấp ngân sách hưởng. Chọn một phường không đồng nghĩa chỉ lấy Chương cấp xã; chọn Chương trung ương cũng không đồng nghĩa toàn bộ tiền thuộc NSTW.

## 3. Cách đưa vào dashboard

Bản dựng hiện có năm tab, dùng chung kỳ, chỉ tiêu và quy tắc tính. Cột trạng thái cho biết phần nào đã chạy được và phần nào còn là phương án chờ duyệt.

| Tab | Nội dung chính | Trạng thái |
|---|---|---|
| Tổng quan | Thu trong kỳ, lũy kế, xu hướng, địa bàn biến động; tiến độ dự toán và cơ cấu NSTW/NSĐP chỉ hiện khi có dữ liệu phù hợp | Đã dựng |
| Phân tích thu | Mở nhánh trong cây chỉ tiêu, xem khu vực kinh tế và khoản thu; tách phần hoàn, trả lãi, thu hồi hoàn | Đã dựng |
| Chi tiết phường/xã | Một địa bàn cụ thể: chỉ số, xu hướng, cơ cấu nguồn thu, bản đồ | Đã dựng |
| Mã hạch toán | Cấp quản lý → Mục → Tiểu mục, kèm danh mục Chương và cơ quan thuế | Đã dựng với số mô phỏng ở tầng mã; chưa có số thực |
| So sánh nâng cao | So hai kỳ hoặc hai nhóm cùng chiều, cùng chỉ tiêu và cách tính | Đã dựng |

Tám mẫu báo cáo vẫn là căn cứ nghiệp vụ nhưng **chưa được dựng**. Chúng cần hai lựa chọn “Xem theo” và “Chi tiết theo” để tạo các cặp: địa bàn; cơ quan thuế; địa bàn/cơ quan thuế; ngành nghề; địa bàn/ngành nghề; ngành nghề/địa bàn; cơ quan thuế/ngành nghề; ngành nghề/cơ quan thuế. Hàng là cây chỉ tiêu, cột là nhóm được chọn; đổi thứ tự nhóm trên cùng tập dữ liệu phải giữ nguyên tổng. Đã nhận danh bạ có ngành nghề chính và nhóm ngành để nối theo mã số thuế; tám mẫu còn cần xử lý chất lượng danh bạ, xác nhận thời gian áp dụng và nối với giao dịch thật.

Luồng theo cấp quản lý là cách xem chi tiết bổ sung, không thay cây chỉ tiêu. Cây vẫn dùng điều kiện Chương, Tiểu mục và giao dịch; một khoản thu có thể gồm Tiểu mục của nhiều Mục.

## 4. Bộ lọc và cách đọc số

- **Thanh lọc chung**, theo đúng thứ tự trên màn hình: Năm · Chu kỳ · Tháng hoặc Quý · Cách tính · Chi tiết địa bàn · Cấp ngân sách · Cấp quản lý. Ô chỉ tiêu đã gỡ khỏi thanh vì gần như không ai đổi; tham số vẫn còn trong đường dẫn và hợp đồng API nên liên kết cũ không hỏng.
- **Địa bàn và cấp quản lý là cặp điều hướng**, không phải tinh chỉnh cách xem: chọn một giá trị là mở đúng tab tương ứng. Khi thanh lọc thu gọn ở iframe và mobile, hai ô này vẫn hiện bên ngoài.
- **Cấp ngân sách kéo theo cấp quản lý**: NSTW đưa về Trung ương, NSĐP về Địa phương. Đây là giá trị khởi điểm cho đỡ phải chọn hai lần; chọn tay trong tab vẫn thắng. Hai thứ là hai trường khác nhau của giao dịch và không suy được ra nhau.
- **Địa bàn và cấp quản lý không loại trừ nhau.** Địa bàn là nơi khoản thu phát sinh; cấp quản lý là cấp quản lý đơn vị nộp, đọc từ mã Chương của chính chứng từ đó. Chọn một phường rồi vẫn xem được cấp trung ương, vì đơn vị do trung ương quản lý cũng nộp thuế phát sinh tại phường đó. Đây là điểm dễ nhầm nhất khi duyệt màn hình.
- Đổi cấp thì kiểm tra lại lựa chọn Mục đang mở, đóng lựa chọn không còn phù hợp **kèm thông báo**; kỳ, chỉ tiêu và địa bàn giữ nguyên.
- Dòng phạm vi ghi “Địa bàn · Cấp quản lý · thu nội địa” để người đọc biết tổng đang nói đến đâu. “Đặt lại bộ lọc” trả về mặc định, gồm cả địa bàn và cấp quản lý.
- Web hẹp, iframe và mobile dùng cùng nghiệp vụ. Dưới 768px, bảng nhiều cột xếp chồng thay vì cuộn ngang, và thanh chọn cấp trong tab nhường chỗ cho ô ở thanh lọc. Danh sách dài có tìm kiếm; số âm dùng bảng hoặc thanh thay cho donut.

## 5. Quy tắc nghiệp vụ phải giữ

| Nội dung | Quy tắc |
|---|---|
| Tổng thu nội địa A | Thu do ngành thuế quản lý + Thu khác ngân sách + Quỹ đất công ích/hoa lợi công sản |
| Tổng thu nội địa trừ dầu A* | A trừ dầu thô và condensate; không phải thu ròng sau hoàn |
| Dòng tổng và “Trong đó” | Cộng đúng công thức; không cộng thêm dòng đã nằm trong cha, không cộng A với A* |
| Hoàn và thu hồi hoàn | Phân biệt bằng điều kiện giao dịch; B/D là tiêu đề không tính tổng; chưa tự tính A − B + D |
| Khu vực kinh tế | Có thể trải qua nhiều cấp quản lý; DNNN có cả nhánh trung ương và địa phương |
| Phân loại khoản thu | Dùng đủ điều kiện Chương và Tiểu mục; tiền chậm nộp có thể nằm trong khoản thuế tương ứng |
| Trong kỳ và lũy kế | Lấy theo ngày hạch toán; lũy kế từ đầu năm đến hết kỳ chọn, cùng chỉ tiêu và phạm vi; kỳ thiếu phải được ghi nhận |
| Tiến độ dự toán | Lũy kế / dự toán năm cùng phạm vi × 100%; thiếu dự toán hoặc dự toán không dương thì không tính |
| So sánh và tỷ trọng | Chênh lệch = kỳ này − kỳ so sánh; tỷ lệ = chênh lệch / kỳ so sánh × 100% khi kỳ so sánh dương. Tỷ trọng = thành phần / tổng cùng phạm vi × 100% khi cơ cấu đủ điều kiện |
| Thiếu, 0 và số âm | Phân biệt rõ; giữ nhóm chưa xác định để đối soát, không thay thiếu dữ liệu bằng 0 |

21 khoản của prototype cần đối chiếu với cây báo cáo mới. Các phần chưa tách được như khu vực biển và vốn/cổ tức/lợi nhuận theo cấp hưởng giữ ở nhánh xác định được, kèm trạng thái chờ xác nhận.

## 6. Dữ liệu cần bàn giao và người xác nhận

| Nhóm dữ liệu | Cần bổ sung hoặc chốt | Đầu mối |
|---|---|---|
| Giao dịch TMS | Khóa dòng, ngày hạch toán, số tiền/đơn vị/dấu, loại giao dịch, tham chiếu hủy; tránh trùng khi hợp nhất các đợt và chứng từ doanh nghiệp lớn | Chủ sở hữu TMS, đội tích hợp |
| Địa bàn và cơ quan thuế | Đã nhận bảng mã: 126 địa bàn hai cấp khớp đủ danh mục phường/xã, và 32 cơ quan thuế. Còn thiếu cột hiệu lực theo thời gian | Quản trị dữ liệu |
| Ngành nghề | Đã có danh bạ mã số thuế → ngành nghề chính → nhóm ngành; cần xử lý dòng trùng, thiếu/xung đột nhóm ngành và xác nhận hiệu lực. Mặc định phân tích theo ngành chính, chưa có cơ sở chia tiền cho nhiều ngành | Nghiệp vụ, quản trị dữ liệu |
| Tỉnh/thành trước–sau sắp xếp | Đã có bảng chuyển đổi; cần xác nhận thời gian áp dụng, xử lý ô gộp và chọn cách quy đổi kỳ lịch sử | Quản trị dữ liệu, nghiệp vụ |
| Chương, Mục/Tiểu mục | Tên, cấp quản lý, quan hệ và hiệu lực; bổ sung mã ngoài danh mục hiện có | Nghiệp vụ báo cáo |
| Quy tắc còn mở | Khoảng Chương địa phương, cận mã thu phạt, hoàn nộp thừa, dấu hủy, tách khu vực biển | Nghiệp vụ, kế toán |
| Ngân sách và đối soát | Dự toán, phân bổ NSTW/NSĐP, mốc cập nhật và phạm vi so với Kho bạc | Đơn vị quản lý số liệu ngân sách |

**Cách dùng dữ liệu mới:** nối ngành nghề qua mã số thuế trên giao dịch, giữ riêng mã đơn vị phụ thuộc. Địa bàn lấy từ `DBHC 2 cấp`, cơ quan thuế và Chương lấy từ chứng từ; địa bàn trụ sở, đơn vị quản lý và Chương trong danh bạ chỉ bổ sung thông tin/đối chiếu, không tự ghi đè. Danh bạ chưa có số tiền giao dịch, nên không dùng số doanh nghiệp để chia số thu.

**Chất lượng cần xử lý:** gộp bản danh bạ trùng hoàn toàn, giữ nhóm ngành chưa xác định cho bản thiếu/xung đột, kiểm tra hiệu lực trước khi áp cho kỳ quá khứ. Thiếu nhãn doanh nghiệp trọng điểm chưa đủ để kết luận không thuộc nhóm trọng điểm. Chi tiết kỹ thuật và số lượng kiểm tra nằm ở mục 17 của đặc tả TMS nội bộ.

## 7. Điều kiện nghiệm thu và bước tiếp theo

1. Một giao dịch không tăng số khi nhập lại hoặc nối nhiều ngành; các nhóm chưa xác định vẫn được giữ.
2. Cùng tập giao dịch đủ điều kiện cho cùng tổng khi đổi cách xem; tổng theo Mục trong một cấp khớp số của cấp đó, gồm phần chưa xác định Mục.
3. Chọn cấp chỉ lấy đúng Chương thuộc cấp theo hiệu lực; không làm đổi địa bàn hay tự phân bổ NSTW/NSĐP.
4. Giao dịch mẫu kiểm chứng được thu, hoàn, hủy, thu hồi hoàn và các công thức tổng. Điểm chưa chốt có người chịu trách nhiệm, không gắn nhãn đã xác nhận.
5. Máy chủ kiểm tra quyền và tính số; mã số thuế/chứng từ chỉ hiển thị cho người đủ quyền.
6. Prototype dùng dữ liệu mô phỏng có nhãn rõ. Ở tầng Chương/Mục/Tiểu mục, **tổng** cộng khớp tuyệt đối vì đây là phép chia lại cùng một tổng, nhưng **tỷ lệ** giữa các mã là do lớp mô phỏng đặt ra: điều kiện báo cáo nói mã nào đủ điều kiện, không nói mã nào chiếm bao nhiêu. Màn hình gắn nhãn “Số mô phỏng”, và nhãn tự biến mất khi provider trả dữ liệu thật. Không đọc thứ hạng giữa các Tiểu mục như kết luận nghiệp vụ.
7. Bản dựng hiện chỉ tra danh mục cơ quan thuế. Khi có giao dịch, tổng hợp theo mã cơ quan thuế trên chứng từ và điều kiện dòng báo cáo; bảng ngành nghề cũng không tự tạo số tiền. Nếu cần thêm mô phỏng theo cơ quan/ ngành, dùng giao dịch giả có nhãn rõ, không suy tỷ trọng từ số dòng danh bạ.

Dữ liệu đến muộn hoặc chứng từ được điều chỉnh cần cập nhật lại kỳ liên quan và lưu phiên bản để giải thích số thay đổi. Tần suất đồng bộ, mốc chốt kỳ và người duyệt kết quả đối soát cần được đơn vị quản lý số liệu thống nhất trước vận hành.

Thực hiện theo thứ tự: chốt phạm vi và quy tắc → kiểm tra tập giao dịch mẫu → dựng/điều chỉnh prototype → kết nối API/MCP → đối soát và nghiệm thu. Quy trình xử lý chênh lệch, quản trị quy tắc và cảnh báo nâng cao dành cho giai đoạn sau.

Đọc tiếp [Phụ lục nghiệp vụ TMS](noi-bo/PHU-LUC-NGHIEP-VU-TMS-NOI-BO.md) để nắm điều kiện tính và điểm còn mở; [Đặc tả dashboard](SPEC-KY-THUAT-DASHBOARD-NSNN.md) dành cho đội phát triển.
