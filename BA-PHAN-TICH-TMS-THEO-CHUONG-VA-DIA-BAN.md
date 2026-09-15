# Báo cáo BA: Phân tích thu NSNN theo địa bàn, Chương và Tiểu mục

> Phần đọc nhanh cho cấp quản lý: mục 1, 2, 3, 7 và 19. Các mục còn lại là đặc tả để BA, thiết kế và kỹ thuật triển khai.

Chi tiết danh mục, ma trận ánh xạ 21 khoản, quy tắc kiểm tra theo trường và bộ ca kiểm thử được quản lý trong phụ lục nghiệp vụ TMS nội bộ có giới hạn truy cập.

## 1. Tóm tắt điều hành

Dashboard Thu ngân sách Nhà nước hiện phục vụ theo dõi tổng thu, tiến độ dự toán, cơ cấu nguồn thu và kết quả theo địa bàn. Để giải thích sâu hơn nguyên nhân tăng giảm, hệ thống cần bổ sung hai chiều phân tích:

- Chương cho biết nhóm cơ quan, đơn vị hoặc đối tượng liên quan đến khoản thu.
- Tiểu mục cho biết bản chất khoản thu như thuế, phí, lệ phí hoặc khoản thu khác.

Luồng phân tích phù hợp là:

```text
Phường/Xã > Cấp quản lý > Chương > Tiểu mục > Số thu và biến động
```

Mã Chương không thể thay cho mã Phường/Xã. Muốn báo cáo chính xác đến địa bàn, mỗi giao dịch phải có mã địa bàn độc lập. Hệ thống cũng cần quản lý thời gian hiệu lực của mã, quy tắc xử lý hoàn và bảng quy đổi từ mã nghiệp vụ sang các dòng báo cáo hiện có.

Phạm vi ưu tiên của phiên bản đầu:

1. Chọn Phường/Xã và kỳ báo cáo.
2. Xem KPI của địa bàn.
3. Xem cơ cấu số thu theo Chương.
4. Click một Chương để xem các Tiểu mục cấu thành.
5. Cảnh báo dữ liệu thiếu, mã chưa ánh xạ và chênh lệch đối soát.

Các quyết định cần đơn vị nghiệp vụ xác nhận trước khi dùng dữ liệu thật gồm cách xác định địa bàn, quy đổi mã theo thời kỳ, cách xử lý hoàn hoặc điều chỉnh và phạm vi dự toán đến cấp Phường/Xã.

## 2. Bối cảnh và vấn đề cần giải quyết

Dashboard tổng hợp có thể cho biết số thu tăng hoặc giảm nhưng chưa luôn trả lời được nguyên nhân. Người dùng cần lần từ địa bàn xuống nhóm đối tượng và khoản thu cụ thể mà không mất ngữ cảnh đang xem.

Các vấn đề nghiệp vụ chính:

- Cơ cấu nguồn thu trên báo cáo và mã hạch toán không phải cùng một hệ thống phân loại.
- Một mã Chương có thể xuất hiện ở nhiều Phường/Xã.
- Mã cũ và mã mới có thể cùng xuất hiện trong dữ liệu lịch sử.
- Khoản hoàn, điều chỉnh âm và mã chưa ánh xạ có thể làm sai tổng thu nếu xử lý như giao dịch thông thường.
- Dự toán và số thực hiện có thể không được cung cấp ở cùng cấp địa bàn.

Nếu không giải quyết các điểm trên, dashboard vẫn hiển thị được biểu đồ nhưng khó bảo đảm số liệu đúng phạm vi và khó giải thích chênh lệch.

## 3. Mục tiêu nghiệp vụ

Hệ thống cần đáp ứng các mục tiêu sau:

1. Giúp lãnh đạo nắm nhanh tình hình thu và các điểm cần chú ý.
2. Giúp cán bộ phân tích xác định địa bàn, nhóm đối tượng và khoản thu tạo ra biến động.
3. Cho phép drill-down từ số tổng hợp xuống Chương và Tiểu mục mà vẫn giữ nguyên kỳ, địa bàn và cấp ngân sách.
4. Đối soát được tổng theo các chiều phân tích.
5. Phân biệt dữ liệu thật, dữ liệu mô phỏng, dữ liệu thiếu và dữ liệu chưa xác minh.
6. Dùng cùng một ý nghĩa dữ liệu trên web, iframe và mobile.

### Chỉ số đánh giá kết quả

- Người dùng hoàn thành luồng từ địa bàn đến Tiểu mục trong không quá ba lần chọn sau khi mở tab Chi tiết phường/xã.
- Tổng Tiểu mục khớp tổng Chương trong cùng phạm vi lọc.
- Mọi mã chưa ánh xạ đều được ghi nhận và có thể tra cứu.
- Người dùng luôn nhìn thấy địa bàn, kỳ và cấp ngân sách đang áp dụng.
- Thay đổi địa bàn không làm mất bộ lọc hoặc gây nhảy bố cục.

## 4. Người dùng và nhu cầu

| Nhóm người dùng | Nhu cầu chính | Mức chi tiết phù hợp |
|---|---|---|
| Lãnh đạo | Tổng thu, tiến độ dự toán, biến động và điểm cần chú ý | Dữ liệu tổng hợp |
| Cán bộ phân tích | Tìm nguyên nhân tăng giảm theo địa bàn, Chương và Tiểu mục | Dữ liệu tổng hợp có drill-down |
| Cán bộ nghiệp vụ | Đối soát mã, khoản hoàn, điều chỉnh và dữ liệu chưa ánh xạ | Dữ liệu nghiệp vụ theo quyền |
| Quản trị dữ liệu | Quản lý danh mục, hiệu lực và chất lượng dữ liệu | Danh mục và nhật ký xử lý |

## 5. Quan hệ giữa TMS, Kho bạc và NSNN

Trong phạm vi báo cáo, TMS được hiểu là hệ thống quản lý thuế tập trung. Ba thành phần nằm trong cùng quy trình thu ngân sách nhưng có vai trò khác nhau:

```text
Người nộp thuế
  > Cơ quan Thuế/TMS quản lý nghĩa vụ và khoản nộp
    > Ngân hàng hoặc Kho bạc tiếp nhận tiền
      > Kho bạc Nhà nước hạch toán theo Mục lục NSNN
        > Dashboard tổng hợp và trình bày số liệu
```

| Thành phần | Vai trò chính |
|---|---|
| TMS | Quản lý người nộp, nghĩa vụ, kỳ và giao dịch thuế |
| Kho bạc Nhà nước | Ghi nhận tiền thực thu và hạch toán theo Chương, Mục, Tiểu mục, cấp ngân sách |
| NSNN | Phạm vi ngân sách được ghi nhận, gồm ngân sách trung ương và ngân sách địa phương |
| Dashboard | Theo dõi số thu, tiến độ dự toán, cơ cấu, biến động và địa bàn |

TMS cung cấp ngữ cảnh nghiệp vụ của khoản thu. Kho bạc ghi nhận và hạch toán dòng tiền vào NSNN. Dashboard sử dụng kết quả đã chuẩn hóa để trả lời: thu được bao nhiêu, từ nhóm nào, thuộc khoản gì, ở địa bàn nào và vào cấp ngân sách nào.

## 6. Khái niệm nghiệp vụ

| Chiều dữ liệu | Câu hỏi trả lời | Ví dụ |
|---|---|---|
| Địa bàn | Khoản thu được ghi nhận hoặc quản lý ở đâu? | Một Phường/Xã cụ thể |
| Chương | Nhóm cơ quan, đơn vị hoặc đối tượng nào liên quan? | Hộ gia đình, cá nhân |
| Mục và Tiểu mục | Bản chất khoản thu là gì? | Thuế TNCN, phí hoặc lệ phí |
| Cấp ngân sách | Khoản thu thuộc cấp ngân sách nào? | NSTW hoặc ngân sách địa phương |
| Dự toán | Mục tiêu thu được giao trong phạm vi nào? | Theo năm, địa bàn và chỉ tiêu |
| Thực hiện | Giá trị đã được ghi nhận theo kỳ | Trong kỳ hoặc lũy kế |

Ví dụ một khoản thu có thể mang đồng thời các thuộc tính:

```text
Địa bàn: Phường A
Chương: Nhóm hộ gia đình, cá nhân
Tiểu mục: Thuế thu nhập cá nhân
Cấp ngân sách: Ngân sách địa phương
Số tiền: Giá trị đã được hạch toán
```

Không được suy Phường/Xã từ mã Chương. Một Chương có thể xuất hiện ở nhiều địa bàn. Một mã tổng hợp ngân sách xã cũng không phải mã nhận diện một xã hoặc phường.

## 7. Phạm vi triển khai

### Phạm vi MVP

- Hiển thị số thu và tiến độ dự toán theo kỳ, địa bàn và cấp ngân sách.
- Hiển thị cơ cấu Chương tại Phường/Xã được chọn.
- Drill-down từ Chương xuống Tiểu mục.
- Hiển thị số tiền, tỷ trọng và biến động cùng kỳ.
- Quản lý mã theo thời gian hiệu lực.
- Gắn cờ khoản hoàn, điều chỉnh, dữ liệu thiếu và mã chưa ánh xạ.
- Giữ ngữ cảnh khi mở trang chi tiết hoặc chuyển giữa các biểu đồ.

### Giai đoạn sau

- Đối soát giao dịch giữa các hệ thống nguồn.
- Phân tích bất thường và cảnh báo tự động.
- Quản trị quy tắc quy đổi mã trên giao diện.
- So sánh nhiều địa bàn hoặc nhiều nhóm Chương nâng cao.
- Theo dõi quá trình xử lý dữ liệu chưa ánh xạ.

### Ngoài phạm vi dashboard lãnh đạo

- Xử lý hồ sơ thuế.
- Chỉnh sửa giao dịch tài chính gốc.
- Hiển thị thông tin nhận diện người nộp khi chưa có quyền phù hợp.
- Thay thế chức năng nghiệp vụ của TMS hoặc hệ thống Kho bạc.

## 8. Tình huống sử dụng chính

### UC01: Xem tình hình thu của một địa bàn

1. Người dùng chọn Phường/Xã và kỳ báo cáo.
2. Hệ thống hiển thị thu trong kỳ, lũy kế, tỷ lệ hoàn thành dự toán và biến động cùng kỳ.
3. Người dùng nhìn thấy phạm vi dữ liệu đang áp dụng.

Kết quả: người dùng biết địa bàn đang thu đến đâu so với dự toán.

### UC02: Tìm nhóm đối tượng tạo ra biến động

1. Từ một địa bàn, người dùng xem cơ cấu theo Chương.
2. Hệ thống sắp xếp Chương theo số tiền hoặc mức tăng giảm.
3. Người dùng chọn một Chương cần phân tích.

Kết quả: người dùng xác định nhóm đối tượng đóng góp lớn hoặc biến động mạnh.

### UC03: Xem khoản thu cấu thành một Chương

1. Người dùng chọn Chương.
2. Hệ thống hiển thị các Tiểu mục thuộc Chương trong cùng phạm vi lọc.
3. Người dùng xem số tiền, tỷ trọng và xu hướng của từng Tiểu mục.

Kết quả: người dùng biết khoản thu nào tạo ra tổng của Chương.

### UC04: Xử lý dữ liệu không đạt điều kiện

1. Hệ thống phát hiện mã hết hiệu lực, chưa ánh xạ, thiếu địa bàn hoặc có chênh lệch tổng.
2. Dashboard hiển thị trạng thái phù hợp và không tự suy diễn giá trị.
3. Cán bộ có quyền mở thông tin đối soát.

Kết quả: dữ liệu có vấn đề không bị trình bày như số liệu đã xác nhận.

## 9. Yêu cầu chức năng theo tab

### Tab Tổng quan

Phần đầu trang ưu tiên thông tin điều hành:

- Thu trong kỳ và lũy kế.
- Tỷ lệ hoàn thành dự toán.
- Biến động so với cùng kỳ.
- Cơ cấu NSTW và ngân sách địa phương.
- Nguồn thu và địa bàn cần chú ý.

Phân tích Chương đặt ở lớp thông tin thứ hai dưới dạng Top Chương đóng góp lớn hoặc tăng giảm mạnh. Danh sách đầy đủ mở qua `Xem chi tiết` để trang không quá dài.

### Tab Phân tích thu

Cho phép chọn chiều phân tích:

```text
Nguồn thu | Chương | Tiểu mục
```

- Nguồn thu dùng các nhóm báo cáo hiện hành.
- Chương cho biết nhóm đơn vị hoặc đối tượng đóng góp.
- Tiểu mục cho biết bản chất khoản thu.

Nhóm báo cáo và mã hạch toán là hai hệ thống phân loại khác nhau. Hệ thống cần bảng quy đổi từ Chương, Tiểu mục sang dòng báo cáo.

### Tab Chi tiết phường/xã

Bố cục nghiệp vụ:

1. Bộ chọn Phường/Xã và kỳ báo cáo.
2. Dải KPI của địa bàn.
3. Cơ cấu số thu theo Chương.
4. Danh sách Chương đóng góp lớn hoặc biến động mạnh.
5. Xu hướng của Chương đang chọn.
6. Bảng Tiểu mục thuộc Chương đang chọn.

Tên địa bàn phải luôn hiện trong vùng ngữ cảnh. Khi đổi địa bàn, bộ lọc giữ nguyên kích thước để tránh giật giao diện.

### Tab So sánh

- So sánh hai kỳ trong cùng một địa bàn hoặc hai địa bàn trong cùng kỳ.
- Chỉ so sánh khi phạm vi, cách tính và quy tắc quy đổi mã tương thích.
- Hiển thị chênh lệch số tiền, tỷ lệ và thành phần tạo ra chênh lệch.

## 10. Bộ lọc và điều hướng

Bộ lọc toàn màn hình:

- Năm, chu kỳ và kỳ báo cáo.
- Trong kỳ hoặc lũy kế.
- Cấp ngân sách.
- Chỉ tiêu báo cáo.

Bộ lọc theo ngữ cảnh:

- Phường/Xã.
- Cấp quản lý của Chương.
- Chương, Mục và Tiểu mục.
- Mã hiện hành hoặc mã lịch sử.

Quy tắc điều hướng:

- Drill-down phải giữ kỳ, địa bàn, cách tính và cấp ngân sách.
- Nút quay lại trả người dùng về đúng trạng thái trước đó.
- URL dùng token hoặc ID ngẫu nhiên, không đưa mã nghiệp vụ nhạy cảm trực tiếp vào đường dẫn công khai.
- Khi không có quyền xem chi tiết, hệ thống chỉ hiển thị dữ liệu tổng hợp.

## 11. Từ điển KPI

| KPI | Định nghĩa | Công thức cơ bản | Ngoại lệ cần xử lý |
|---|---|---|---|
| Thu trong kỳ | Số thu phát sinh trong kỳ đang chọn | Tổng số tiền hợp lệ trong kỳ | Hoàn và điều chỉnh theo quy tắc nghiệp vụ |
| Lũy kế từ đầu năm | Số thu từ đầu năm đến hết kỳ chọn | Tổng các kỳ hợp lệ từ đầu năm | Thiếu kỳ phải được cảnh báo |
| Tỷ lệ hoàn thành dự toán | Mức thực hiện so với dự toán cùng phạm vi | Lũy kế / Dự toán x 100% | Không tính nếu thiếu hoặc dự toán bằng 0 |
| Tăng giảm cùng kỳ | Mức thay đổi so với cùng kỳ năm trước | (Kỳ này - Kỳ trước) / Kỳ trước x 100% | Kỳ trước bằng 0 cần quy ước hiển thị riêng |
| Tỷ trọng Chương | Phần đóng góp của một Chương | Thu Chương / Tổng thu cùng phạm vi x 100% | Tổng thu bằng 0 thì không tính tỷ trọng |
| Chênh lệch dự toán | Phần còn thiếu hoặc vượt dự toán | Lũy kế - Dự toán | Phải giữ dấu âm hoặc dương |
| Cơ cấu cấp ngân sách | Tỷ trọng NSTW và ngân sách địa phương | Thu từng cấp / Tổng thu x 100% | Chỉ tính trên dữ liệu xác định được cấp ngân sách |

Mỗi KPI phải dùng cùng kỳ, địa bàn, cấp ngân sách, chỉ tiêu và trạng thái dữ liệu. Đơn vị hiển thị cần thống nhất, ưu tiên tỷ đồng hoặc nghìn tỷ đồng theo quy mô số liệu.

## 12. Quy tắc nghiệp vụ

### BR01: Xác định địa bàn

Dữ liệu giao dịch phải có `location_code` hoặc khóa liên kết địa bàn đã được xác nhận. Nếu thiếu, hệ thống đưa vào nhóm `Chưa xác định địa bàn`. Không được suy địa bàn từ Chương.

### BR02: Hiệu lực mã

Chương, Mục, Tiểu mục và địa bàn phải được tra theo ngày hạch toán. Mỗi phiên bản có `effective_from` và `effective_to`.

### BR03: Quy đổi mã

Không tự động gộp mã cũ và mã mới chỉ vì tên hoặc ý nghĩa gần nhau. Quy đổi cần có thời gian hiệu lực, căn cứ nghiệp vụ và trạng thái xác minh.

### BR04: Hoàn và điều chỉnh

Khoản hoàn hoặc điều chỉnh âm phải giữ nguyên bản chất giao dịch. Ví dụ, Hoàn thuế GTGT không được cộng như một khoản thu thông thường. Cách trừ vào chỉ tiêu phải được đơn vị nghiệp vụ chốt.

### BR05: Đối soát tổng

Trong cùng phạm vi lọc:

- Tổng Tiểu mục phải khớp tổng Chương.
- Tổng Chương phải khớp tổng thu được dùng trên KPI.
- Tổng địa bàn phải khớp tổng cấp trên khi cùng phạm vi hạch toán.

### BR06: Dữ liệu rỗng và số không

- `null` nghĩa là chưa có hoặc chưa xác định dữ liệu.
- `0` nghĩa là có dữ liệu và giá trị bằng không.
- Số âm được giữ nguyên và phải có loại giao dịch giải thích.

### BR07: Dữ liệu chưa ánh xạ

Mã không tồn tại hoặc chưa có quy tắc quy đổi được đưa vào nhóm `Chưa ánh xạ`. Dashboard không được bỏ qua giá trị này khi đối soát.

## 13. Dữ liệu cần có

### Dữ liệu giao dịch tối thiểu

| Trường | Mục đích |
|---|---|
| `posting_date` | Xác định ngày hạch toán và phiên bản danh mục |
| `period` | Tổng hợp theo tháng, quý và năm |
| `location_code` | Xác định Phường/Xã hoặc địa bàn |
| `chapter_code` | Liên kết Chương |
| `sub_item_code` | Liên kết Tiểu mục |
| `budget_level` | Phân biệt NSTW và ngân sách địa phương |
| `amount` | Giá trị thu hoặc điều chỉnh |
| `collecting_authority` | Đơn vị quản lý hoặc đơn vị thu |
| `transaction_type` | Thu, hoàn hoặc điều chỉnh |
| `data_status` | Đã xác nhận, tạm tính, mô phỏng hoặc cần kiểm tra |

### Danh mục và bảng nối

| Bảng | Nội dung chính |
|---|---|
| `DimLocation` | Mã, tên, loại địa bàn, địa bàn cha và thời gian hiệu lực |
| `DimChapterVersion` | Mã Chương, tên, cấp quản lý, hiệu lực, mã trước/sau và trạng thái xác minh |
| `DimSubItemVersion` | Mã Tiểu mục, Mục, phân loại và thời gian hiệu lực |
| `BridgeTmsToReport` | Quy đổi Chương và Tiểu mục sang dòng báo cáo của dashboard |
| `FactRevenue` | Giao dịch hoặc số thu đã tổng hợp theo phạm vi được phép |
| `FactBudgetPlan` | Dự toán theo năm, địa bàn, chỉ tiêu và cấp ngân sách |

### Khoảng trống cần bổ sung

| Nội dung | Ảnh hưởng nếu thiếu |
|---|---|
| Số tiền và ngày hạch toán | Không thể tính xu hướng và thay dữ liệu mô phỏng |
| Mã Phường/Xã | Không thể báo cáo chính xác theo địa bàn |
| Danh mục địa bàn theo thời gian | Có thể sai khi địa bàn đổi tên hoặc sáp nhập |
| Cấp ngân sách | Không tách được NSTW và ngân sách địa phương |
| Dự toán theo phạm vi | Không tính được tỷ lệ hoàn thành |
| Quy tắc hoàn và điều chỉnh | Có thể tính sai tổng thu |
| Bảng quy đổi sang dòng báo cáo | Không nối được mã nghiệp vụ với chỉ tiêu hiện tại |
| Quy tắc đổi mã theo thời kỳ | So sánh lịch sử có thể sai |

Hai khoảng trống cần ưu tiên là mã địa bàn cho tab Chi tiết phường/xã và bảng quy đổi cho tab Phân tích thu.

## 14. Ngoại lệ và chất lượng dữ liệu

| Tình huống | Cách xử lý trên dashboard |
|---|---|
| Không có dữ liệu | Ẩn biểu đồ không cần thiết và ghi rõ phạm vi không có dữ liệu |
| Thiếu một phần địa bàn | Hiển thị phạm vi đã nhận, không tự suy phần còn thiếu |
| Thiếu dự toán | Không hiển thị tỷ lệ hoàn thành; giải thích lý do |
| Mã hết hiệu lực | Tra phiên bản theo ngày hoặc gắn cờ cần kiểm tra |
| Mã chưa ánh xạ | Đưa vào nhóm riêng và giữ giá trị khi đối soát |
| Kỳ trước bằng 0 | Hiển thị số chênh lệch; không tính phần trăm theo công thức thường |
| Có khoản hoàn hoặc số âm | Giữ dấu, ghi loại giao dịch và áp dụng quy tắc đã duyệt |
| Tổng không khớp | Cảnh báo đối soát và không gắn trạng thái đã xác nhận |
| API lỗi hoặc hết thời gian | Giữ bộ lọc, cho phép tải lại và không hiển thị số cũ như số mới |

Các kiểm tra dữ liệu bắt buộc:

- Mã được lưu dưới dạng chuỗi để không mất số 0 ở đầu.
- Mã tham chiếu tồn tại tại ngày hạch toán.
- Các phiên bản cùng mã không chồng thời gian hiệu lực.
- Địa bàn tồn tại và còn hiệu lực.
- Khoản hoàn không bị cộng nhầm vào tổng thu.
- Mã chưa ánh xạ không bị loại khỏi báo cáo chất lượng dữ liệu.

## 15. Phân quyền và bảo mật

- Dashboard lãnh đạo ưu tiên dữ liệu tổng hợp.
- Dữ liệu giao dịch chi tiết chỉ trả về khi người dùng có quyền phù hợp.
- Không đưa thông tin nhận diện người nộp vào biểu đồ, log phía trình duyệt hoặc URL.
- API kiểm tra quyền ở phía máy chủ, không dựa vào việc ẩn component.
- Dữ liệu mô phỏng phải có nhãn rõ và không trộn với dữ liệu đã xác nhận.
- Sự kiện drill-down và thay đổi bộ lọc cần được ghi nhận đủ để truy vết, nhưng không ghi dữ liệu nhạy cảm không cần thiết.

## 16. Yêu cầu API và MCP

API hoặc MCP trả dữ liệu đã chuẩn hóa. Component chỉ hiển thị và phát sự kiện tương tác, không tự suy quy tắc nghiệp vụ.

```json
{
  "schemaVersion": "1.0",
  "context": {
    "period": "2026-08",
    "accType": "YTD",
    "locationId": "loc_random_token",
    "locationName": "Phường mẫu",
    "budgetLevel": "NSDP",
    "dataStatus": "mock"
  },
  "summary": {
    "revenue": 128500000000,
    "planAchievementRate": 0.672,
    "yearOverYearRate": 0.118
  },
  "chapters": [
    {
      "id": "chapter_random_token",
      "code": "857",
      "name": "Hộ gia đình, cá nhân",
      "amount": 46200000000,
      "share": 0.359,
      "changeRate": 0.084,
      "verificationStatus": "verified"
    }
  ],
  "quality": {
    "isReconciled": true,
    "unmappedAmount": 0,
    "warnings": []
  }
}
```

Payload cần có:

- Phiên bản schema.
- Ngữ cảnh bộ lọc đã áp dụng.
- Trạng thái dữ liệu.
- Giá trị, đơn vị và tỷ lệ đã chuẩn hóa.
- Thông tin chất lượng và đối soát.
- ID điều hướng không làm lộ khóa nghiệp vụ nhạy cảm.

## 17. Tiêu chí nghiệm thu

| ID | Tiêu chí |
|---|---|
| AC01 | Người dùng luôn nhìn thấy địa bàn, kỳ, cách tính và cấp ngân sách đang áp dụng |
| AC02 | Cơ cấu Chương đúng trong phạm vi Phường/Xã đã chọn |
| AC03 | Click Chương mở được danh sách Tiểu mục và số tiền tương ứng |
| AC04 | Tổng Tiểu mục khớp tổng Chương sau khi áp dụng cùng quy tắc |
| AC05 | Tổng Chương khớp KPI tổng thu hoặc có cảnh báo chênh lệch |
| AC06 | Mã lịch sử được giải nghĩa theo ngày hạch toán |
| AC07 | Hoàn, điều chỉnh âm và mã chưa ánh xạ được trình bày rõ |
| AC08 | Thiếu dự toán không tạo ra tỷ lệ hoàn thành sai |
| AC09 | Đổi địa bàn không làm giật bộ lọc hoặc mất trạng thái |
| AC10 | Web, iframe và mobile dùng cùng ý nghĩa dữ liệu |
| AC11 | Người không đủ quyền không nhận dữ liệu chi tiết từ API |
| AC12 | Dữ liệu mô phỏng và dữ liệu đã xác nhận có trạng thái phân biệt |

## 18. Kế hoạch triển khai

### Giai đoạn 1: Chuẩn hóa nghiệp vụ

- Chốt định nghĩa KPI.
- Xác định trường địa bàn.
- Chốt quy tắc hoàn và điều chỉnh.
- Lập bảng quy đổi mã sang dòng báo cáo.
- Xác nhận thời gian hiệu lực của danh mục.

### Giai đoạn 2: Hoàn thiện prototype

- Dùng dữ liệu mô phỏng theo schema chuẩn.
- Hoàn thiện luồng Phường/Xã, Chương và Tiểu mục.
- Bổ sung trạng thái ngoại lệ và kiểm thử responsive.

### Giai đoạn 3: Kết nối dữ liệu thật

- Kết nối API hoặc MCP.
- Đối soát tổng giữa các chiều.
- Kiểm thử phân quyền, hiệu năng và dữ liệu lịch sử.

### Giai đoạn 4: Phân tích nâng cao

- Cảnh báo bất thường.
- So sánh nhiều địa bàn.
- Theo dõi xử lý mã chưa ánh xạ.

## 19. Nội dung cần phê duyệt

| Nội dung | Đơn vị cần xác nhận | Ảnh hưởng |
|---|---|---|
| Cách xác định địa bàn | Nghiệp vụ và quản trị dữ liệu | Độ chính xác của báo cáo Phường/Xã |
| Quy tắc đổi mã theo thời kỳ | Nghiệp vụ | So sánh lịch sử |
| Xử lý hoàn và điều chỉnh | Nghiệp vụ và kế toán | Tổng thu và KPI |
| Bảng quy đổi sang dòng báo cáo | Nghiệp vụ báo cáo | Cơ cấu nguồn thu |
| Phạm vi dự toán | Đơn vị giao và quản lý dự toán | Tỷ lệ hoàn thành |
| Quyền xem dữ liệu chi tiết | Chủ quản hệ thống | Bảo mật và phạm vi API |
| Trạng thái dữ liệu được công bố | Chủ sở hữu dữ liệu | Cách gắn nhãn và sử dụng số liệu |

## Phụ lục A: Mô hình dữ liệu tham chiếu

```text
DimLocation
     |
FactRevenue ---- DimChapterVersion
     |
DimSubItemVersion
     |
BridgeTmsToReport ---- Dòng báo cáo dashboard
     |
FactBudgetPlan
```

Khóa phân tích tối thiểu:

```text
Kỳ + Địa bàn + Chương + Tiểu mục + Cấp ngân sách + Loại giao dịch
```

## Phụ lục B: Nhóm mã minh họa cần xác nhận

| Cấp tỉnh | Cấp xã có ý nghĩa gần tương ứng | Nội dung |
|---:|---:|---|
| 554 | 854 | Kinh tế hỗn hợp ngoài quốc doanh |
| 555 | 855 | Doanh nghiệp tư nhân |
| 556 | 856 | Hợp tác xã |
| 557 hoặc 757 | 857 | Hộ gia đình, cá nhân |
| 558 | 858 | Kinh tế hỗn hợp có vốn Nhà nước chi phối |
| 560 | 860 | Các quan hệ khác của ngân sách |
| 599 | 989 | Các đơn vị khác |

Các cặp trên chỉ hỗ trợ đối chiếu về ý nghĩa. Chúng chưa phải bảng chuyển đổi chính thức và chỉ được gộp sau khi đơn vị nghiệp vụ xác nhận quy tắc theo thời điểm.

Một số mã minh họa khác: 800 dùng cho tổng hợp ngân sách xã; 821 cho đơn vị sự nghiệp công lập; 823 cho trạm y tế xã; 829 cho ban quản lý dự án; 831 và 832 cho các phòng chuyên môn cấp xã. Các quan hệ thay thế giữa mã cũ và mã mới phải được quản lý bằng thời gian hiệu lực, không ghi cứng trong giao diện.
