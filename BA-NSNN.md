# BA Dashboard Thu NSNN

**Trạng thái:** Bản nháp cần xác nhận nghiệp vụ  
**Nguồn tham chiếu chính:** `dac-ta-v2.html`  
**Tài liệu thiết kế:** `THIET-KE-DASHBOARD-NSNN.md`  
**Cập nhật:** 14/09/2026

## 1. Dashboard này dùng để làm gì?

Dashboard Thu ngân sách Nhà nước (NSNN) giúp người dùng:

- Theo dõi số thu theo tháng, quý và lũy kế năm.
- So sánh kết quả với cùng kỳ hoặc một kỳ khác.
- Biết nguồn thu, khoản thu và địa bàn nào đóng góp nhiều nhất.
- Phát hiện địa bàn tăng, giảm, bất thường hoặc thiếu dữ liệu.
- Đi từ tổng quan đến phân tích chi tiết mà vẫn giữ nguyên ngữ cảnh.

## 2. Người dùng chính

| Nhóm người dùng | Nhu cầu |
|---|---|
| Lãnh đạo | Xem nhanh kết quả, xu hướng và điểm cần chú ý |
| Chuyên viên phân tích | Phân tích nguồn thu, khoản thu và nguyên nhân biến động |
| Cán bộ theo dõi địa bàn | Kiểm tra kết quả của từng phường/xã |
| Quản trị dữ liệu | Kiểm tra độ phủ, dữ liệu thiếu và sai lệch |

## 3. Phạm vi chức năng

Ứng dụng gồm bốn khu vực:

| Tab | Mục đích |
|---|---|
| Tổng quan | Xem tình hình thu của toàn thành phố |
| Phân tích thu | Phân tích sâu theo nguồn và khoản thu |
| Chi tiết phường/xã | Phân tích một địa bàn cụ thể |
| So sánh nâng cao | So sánh kỳ, nguồn thu hoặc địa bàn |

Chưa thuộc phạm vi hiện tại:

- Nhập hoặc sửa số liệu gốc.
- Phê duyệt quyết toán.
- Quản lý người dùng và phân quyền nghiệp vụ.
- Dự báo thu chính thức.

## 4. Bộ lọc chung

| Bộ lọc | Ý nghĩa |
|---|---|
| Năm | Năm ngân sách cần xem |
| Loại kỳ | Xem theo tháng hoặc quý |
| Kỳ | Một tháng, một quý, hoặc toàn bộ kỳ đã có số liệu của năm |
| Cách tính | Trong kỳ hoặc lũy kế từ đầu năm |
| Chỉ tiêu | Chỉ tiêu thu cần phân tích |
| Cấp ngân sách | NSNN, NSTW hoặc NSĐP |

Quy tắc:

- Mặc định chọn kỳ mới nhất thực sự có dữ liệu.
- Bộ lọc chung được giữ khi chuyển tab.
- Đổi năm hoặc loại kỳ phải kiểm tra lại kỳ đang chọn.
- Lựa chọn "toàn bộ kỳ" gọi tên theo thực tế của năm: năm đã đủ mười hai tháng thì là
  `Cả năm`, năm đang chạy thì là `Từ đầu năm (N tháng)`.
- "Toàn bộ kỳ" cho cùng một khoảng dù đang để chu kỳ Tháng hay Quý; chu kỳ chỉ quyết định
  độ mịn của danh sách kỳ cụ thể.
- Khi đang xem toàn bộ kỳ, `Cách tính` bị tắt và nêu lý do.
- Địa bàn không phải filter chung của màn Tổng quan.
- Filter riêng của một widget không được làm thay đổi KPI toàn trang.
- Ở Web hẹp, iframe và Mobile, filter đóng thành hai nhóm dễ đọc: `Kỳ báo cáo` và
  `Chỉ tiêu`. Khi mở, các trường giữ nguyên thứ tự nghiệp vụ.
- `Cấp ngân sách` đứng cạnh `Chỉ tiêu`; trường chỉ tiêu được dành nhiều chiều rộng hơn.
- `Đặt lại bộ lọc` đưa báo cáo về Tháng 8/2026, Trong kỳ, Tổng NSNN và TỔNG SỐ.

## 5. Chỉ số chính

| Chỉ số | Cách hiểu |
|---|---|
| Thu trong kỳ | Số thu riêng của tháng hoặc quý đang chọn |
| Lũy kế YTD | Tổng từ đầu năm đến hết kỳ đang chọn |
| So với cùng kỳ | So sánh với cùng tháng/quý của năm trước |
| Tỷ trọng | Giá trị thành phần chia cho tổng cùng phạm vi |
| Độ phủ | Số địa bàn có dữ liệu trên tổng địa bàn kỳ vọng |
| Dự toán năm | Số giao đầu năm cho phạm vi đang lọc |
| Tiến độ dự toán | Lũy kế từ đầu năm chia dự toán năm |
| Chênh lệch tuyệt đối | Giá trị kỳ B trừ giá trị kỳ A |
| Chênh lệch phần trăm | Chênh lệch chia cho giá trị kỳ A hợp lệ |

Không tính phần trăm nếu giá trị gốc bị thiếu, bằng 0 hoặc quá nhỏ để tỷ lệ còn có nghĩa. Khi
đó hiển thị `Chưa có kỳ trước`.

**Tại sao phải chặn:** chia cho 0 ra `Infinity`, chia cho `null` ra `NaN`, còn chia cho một số
rất nhỏ ra những con số kiểu `+41.200%` — cả ba đều hiện lên như một phát hiện nghiệp vụ trong
khi thực chất là lỗi số học. Một địa bàn chưa nạp số liệu kỳ trước mà hiện `−100%` sẽ bị đọc
thành "địa bàn mất trắng nguồn thu", và đó là loại sai có thể đi thẳng vào báo cáo.

## 6. Nhóm nguồn thu

Dashboard sử dụng bốn nguồn thu cấp cao:

1. Thu nội địa.
2. Thu xuất nhập khẩu ròng.
3. Thu dầu thô.
4. Thu khác từ nhóm IV–VIII.

Thu xuất nhập khẩu ròng phải được đối chiếu từ tổng thu và khoản hoàn/khấu trừ theo công thức
nghiệp vụ được cung cấp.

## 7. Danh mục 21 khoản thu nội địa

1. Doanh nghiệp Nhà nước trung ương.
2. Doanh nghiệp Nhà nước địa phương.
3. Doanh nghiệp có vốn đầu tư nước ngoài.
4. Khu vực ngoài quốc doanh.
5. Thuế thu nhập cá nhân.
6. Thuế bảo vệ môi trường.
7. Lệ phí trước bạ.
8. Phí và lệ phí.
9. Thuế sử dụng đất nông nghiệp.
10. Thuế sử dụng đất phi nông nghiệp.
11. Tiền thuê đất, thuê mặt nước.
12. Tiền sử dụng đất.
13. Thuê và bán nhà thuộc sở hữu Nhà nước.
14. Hoạt động xổ số kiến thiết.
15. Cấp quyền khai thác khoáng sản, tài nguyên nước.
16. Tiền sử dụng khu vực biển.
17. Thu khác ngân sách.
18. Quỹ đất công ích và hoa lợi công sản.
19. Cổ tức, lợi nhuận và vốn địa phương.
20. Cổ tức, lợi nhuận và vốn trung ương.
21. Chênh lệch thu chi Ngân hàng Nhà nước.

Không được cộng đồng thời một dòng tổng và các dòng con của nó.

## 8. Yêu cầu từng tab

### 8.1. Tổng quan

Người dùng cần thấy ngay:

- KPI trong kỳ, lũy kế và tiến độ so dự toán.
- Xu hướng năm hiện tại so với năm trước.
- Cơ cấu bốn nguồn thu.
- Top 5 khoản thu nội địa.
- Địa bàn cần chú ý.
- Độ phủ và cảnh báo dữ liệu.

Điều hướng:

- `Xem đủ 21 khoản` mở tab Phân tích thu.
- Click nguồn thu mở drawer xem nhanh.
- `Xem phân tích đầy đủ` trong drawer mở tab Phân tích thu.
- Click địa bàn mở tab Chi tiết phường/xã.
- Click thành phần waterfall mở So sánh nâng cao.

### 8.2. Phân tích thu

Cho phép chọn:

- Thu nội địa.
- Thu xuất nhập khẩu.
- Thu khác.

Mỗi nhóm cần có KPI, xu hướng, cơ cấu thành phần, bảng chi tiết, đóng góp theo địa bàn và
waterfall khi đủ dữ liệu.

Thu nội địa phải hiển thị đủ đúng 21 khoản và cho phép tìm kiếm, sắp xếp.

### 8.3. Chi tiết phường/xã

Cho phép tìm và chọn một địa bàn từ danh sách hoặc bản đồ. Hai lối chọn dùng chung một trạng
thái nên bấm ở đâu cũng cho cùng kết quả.

Bản đồ giữ nguyên mức toàn thành phố làm mặc định, vì đây là bản đồ nhiệt: phóng sâu vào một
ô là mất bối cảnh so sánh, mà so sánh mới là lý do bản đồ tồn tại. Chọn một địa bàn thì phóng
có trần (tối đa 3×) để mắt bắt được vị trí nhưng vẫn thấy các phường, xã xung quanh; nút
`Toàn thành phố` luôn sẵn để quay lại.

Thông tin chính:

- Thu trong kỳ và YTD.
- So với cùng kỳ.
- Xu hướng.
- Cơ cấu nguồn thu.
- Top khoản thu.
- Độ phủ và nguồn dữ liệu.

Người dùng có thể chọn `So sánh với địa bàn khác` để sang So sánh nâng cao.

### 8.4. So sánh nâng cao

Hỗ trợ ba chế độ:

- So sánh hai kỳ.
- So sánh nguồn hoặc khoản thu.
- So sánh hai địa bàn.

Kết quả gồm KPI A/B, delta, waterfall, bảng chi tiết và xu hướng. Chỉ so sánh các dữ liệu có
cùng phạm vi, chỉ tiêu, cấp ngân sách và đơn vị.

## 8.5. Vì sao mỗi feature tồn tại

Bảng này trả lời câu "bỏ widget đó đi thì mất gì" — nếu không trả lời được thì widget đó không
nên có mặt.

| Feature | Câu hỏi nó trả lời | Bỏ đi thì mất gì |
|---|---|---|
| Dải KPI 4 ô | "Kỳ này thu bao nhiêu, hơn kém cùng kỳ ra sao?" | Người dùng phải tự cộng từ biểu đồ; lãnh đạo mất câu trả lời trong ba giây đầu |
| Ô cảnh báo trong dải KPI | "Có gì bất thường không?" | Thiếu địa bàn chưa nạp số bị bỏ qua, mọi con số bên dưới bị đọc như đã đủ |
| Xu hướng 12 tháng, có đường năm trước | "Kỳ này nằm ở đâu trong mạch cả năm?" | Một con số đơn lẻ không phân biệt được tăng thật với dao động mùa vụ |
| Cơ cấu nguồn thu | "Tiền đến từ đâu?" | Không biết nên tập trung quản lý nguồn nào |
| Top khoản thu nội địa | "Trong 21 khoản, khoản nào chi phối?" | Phải mở bảng 21 dòng mới thấy được điều mà 5 dòng đã đủ nói |
| Top địa bàn, cả cao nhất và thấp nhất | "Phường, xã nào đóng góp nhiều, nơi nào đang hụt?" | Chỉ xem nơi thu cao là bỏ mất nhóm cần hỗ trợ |
| Tăng trưởng địa bàn tách riêng khỏi Top địa bàn | "Nơi nào đang chuyển động mạnh?" | Địa bàn nhỏ nhưng tăng vọt bị lấp sau các địa bàn lớn |
| Theo cấp ngân sách | "Bao nhiêu thuộc NSTW, bao nhiêu thuộc NSĐP; NSĐP nằm ở cấp nào?" | Không tách được phần thành phố thực sự điều hành và không đối chiếu được cấp tỉnh, huyện, xã |
| Waterfall biến động | "Vì sao kỳ này chênh so cùng kỳ?" | Chỉ biết chênh bao nhiêu mà không biết do đâu |
| Bảng chi tiết có tìm kiếm và sắp xếp | "Khoản X cụ thể bao nhiêu?" | Không tra cứu được một khoản cụ thể để đối chiếu báo cáo giấy |
| Đối chiếu thu ròng | "Số gộp và số ròng lệch nhau vì gì?" | Thu xuất nhập khẩu luôn bị hiểu nhầm giữa tổng gộp và số sau hoàn, khấu trừ |
| Bản đồ nhiệt 126 phường, xã | "Phân bố theo không gian thế nào?" | Một danh sách 126 dòng không cho thấy cụm địa lý |
| Bảng thay thế cho bản đồ | Cùng câu hỏi, cho người không dùng được bản đồ | Dữ liệu bản đồ trở thành không tiếp cận được |
| Drawer xem nhanh | "Nguồn này thế nào?" mà không rời Tổng quan | Mỗi lần tò mò một nguồn là một lần mất ngữ cảnh đang xem |
| So sánh nâng cao | "Hai kỳ / hai nguồn / hai địa bàn khác nhau chỗ nào?" | So sánh thủ công bằng cách mở hai tab và tự trừ |
| Thanh phạm vi thu gọn ở khổ hẹp | "Tôi đang xem số của phạm vi nào?" | Sáu ô lọc luôn mở sẽ đẩy KPI và biểu đồ chính xuống dưới; hai nhóm tóm tắt vẫn giữ đủ kỳ, cách tính, chỉ tiêu và cấp ngân sách |
| Xem thử iframe và Mobile | "Khi nhúng hoặc mở trên điện thoại thì trông thế nào?" | Nếu chỉ co một `div`, media query và thao tác vuốt không phản ánh môi trường thật; preview dùng iframe thật, preset thiết bị và kéo tab bằng chuột |

## 9. Drawer xem nhanh nguồn thu

Drawer giữ người dùng trong màn Tổng quan và chỉ hiển thị:

- Tên nguồn thu.
- Giá trị, tỷ trọng và YoY.
- Kỳ, cấp ngân sách, độ phủ và nguồn dữ liệu.
- Biểu đồ xu hướng ngắn.
- Nút `Xem phân tích đầy đủ`.

Drawer có URL riêng, đóng được bằng Escape và nút Back của trình duyệt. Trên mobile, drawer
hiển thị toàn màn hình.

## 9.1. Dự toán và tiến độ dự toán

Câu hỏi "đã hoàn thành bao nhiêu phần trăm dự toán" nằm trong nhóm câu hỏi chính
mà lãnh đạo đặt ra, nên dashboard có một ô KPI trả lời nó.

**Nguồn dữ liệu chưa có.** Toàn bộ 143 phản hồi API tham chiếu chỉ chứa trường số
thực hiện (`amount`); không có trường dự toán, kế hoạch hay chỉ tiêu giao. Đặc tả
v2 trước đây chủ động để dự toán ngoài phạm vi vì lý do này.

**Cách prototype đang xử lý.** Lớp mock tự suy ra một con số dự toán từ thực hiện
cả năm trước nhân hệ số 1,08, làm tròn tới tỷ. Con số này **tất định** (cùng bộ
lọc luôn cho cùng kết quả) và bám đúng phạm vi đang lọc, nhưng nó **không phải
chỉ tiêu được giao của Hà Nội**.

**Ràng buộc bắt buộc với giao diện.** Hợp đồng dữ liệu mang trường `origin` nói
rõ số đến từ `mock` hay `api`. Chừng nào `origin` còn là `mock`:

- Nhãn KPI phải mang chữ `(mô phỏng)`.
- Dòng phụ phải nêu cách suy ra và nói rõ đây không phải chỉ tiêu được giao.

Khi API có trường thật, adapter trả `origin: "api"` và hai dấu hiệu trên tự biến
mất — không phải sửa giao diện.

**Cần xác nhận:** xem A09 và A10 ở mục 15.

## 10. Quy tắc dữ liệu

Dashboard này không phải công cụ khám phá dữ liệu cá nhân — số trên màn hình được đọc lên
trong cuộc họp và trích vào báo cáo. Vì vậy mỗi quy tắc dưới đây tồn tại để chặn một cách hiểu
sai cụ thể, chứ không phải để code cho chặt chẽ.

| Quy tắc | Tại sao cần | Bỏ qua thì hỏng thế nào |
|---|---|---|
| `0` là dữ liệu hợp lệ | Một địa bàn thu 0 đồng trong kỳ là sự kiện có thật và đáng chú ý | Ẩn số 0 đi thì mất đúng trường hợp cần báo động |
| Số âm là điều chỉnh hợp lệ | Hoàn thuế, khấu trừ và nguồn V, VIII mang dấu âm theo đúng nghiệp vụ | Cắt số âm làm tổng cộng sai, waterfall không khớp |
| `null` khác `0` | `null` là "chưa nạp", `0` là "đã nạp và bằng 0" | Gộp hai thứ này lại là báo cáo sai hiện trạng thu |
| Không đổi thiếu thành 0 | Suy diễn phần chưa có là suy diễn không có căn cứ | Địa bàn chưa nạp số sẽ hiện `−100%` như thể mất trắng nguồn thu |
| Không hiện `NaN`, `Infinity`, `−100%` giả | Ba giá trị này trông giống một phát hiện nghiệp vụ | Người đọc tin vào một lỗi số học |
| Tháng tương lai để trống | Đường biểu đồ nối qua tháng chưa tới sẽ ngụ ý số liệu đã có | Đọc nhầm dự kiến thành thực hiện |
| Không cộng YTD của các tháng | YTD tháng 8 đã chứa tháng 1–7; cộng lại là cộng trùng | Tổng phồng lên nhiều lần, không ai phát hiện vì vẫn "có vẻ hợp lý" |
| Quý dẫn xuất phải ghi rõ | Quý gộp từ ba tháng không đồng nhất với quý do cơ quan chốt | Đối chiếu với báo cáo chính thức bị lệch mà không rõ nguyên nhân |
| Không xếp hạng dòng tổng như một địa bàn | Dòng tổng thành phố và tổng Kho bạc lớn hơn mọi phường, xã | Bảng xếp hạng luôn bị hai dòng đó chiếm đầu, vô nghĩa |
| Nguồn do trung ương quản lý không phân bổ về địa bàn | Hải quan và dầu thô hạch toán ở cấp thành phố | Cộng nguyên phần thành phố vào từng phường làm tổng 126 địa bàn vượt xa tổng thật |
| Waterfall khớp tổng | Tổng các bước phải đúng bằng giá trị cuối trừ đầu | Biểu đồ giải thích biến động mà chính nó không cân thì không dùng để giải thích được |
| Phân rã khớp chỉ số | Tổng cột chênh lệch của bảng phải bằng chênh lệch mà KPI công bố | Bảng và KPI nói hai con số khác nhau dưới cùng một nhãn kỳ, cách nhau 20px, và người đọc không có cách nào biết bên nào đúng |
| Partial vẫn hiển thị dữ liệu | Chờ đủ 126/126 mới cho xem là chặn mất việc điều hành hằng ngày | Độ phủ được đặt trong KPI/widget liên quan, không lặp thành banner ở mọi tab |

## 11. Trạng thái màn hình

| Trạng thái | Hành vi |
|---|---|
| Loading | Giữ khung giao diện ổn định và báo đang tải |
| Ready | Hiển thị dữ liệu, bao gồm giá trị 0 |
| Partial | Hiển thị dữ liệu; độ phủ nằm trong KPI hoặc widget cần thông tin đó |
| No data | Giải thích không có dữ liệu và gợi ý đổi filter |
| Not applicable | Ẩn widget và cho widget bên cạnh mở rộng |
| Error | Thông báo rõ và cho phép thử lại khi phù hợp |

## 12. API và MCP

UI không phụ thuộc trực tiếp vào nguồn dữ liệu. Dữ liệu có thể đến từ API, MCP, fixture hoặc
mock thông qua cùng một provider contract.

MCP chỉ được gửi:

- Dữ liệu widget đã định kiểu.
- Metadata về kỳ, phạm vi, đơn vị, nguồn và độ phủ.
- Navigation intent thuộc danh sách cho phép.

MCP không được gửi JavaScript, HTML, CSS, event handler, component tùy ý hoặc URL thô. Toàn
bộ payload phải được kiểm tra trước khi render.

## 13. Mock data

Nếu chưa có API đầy đủ, prototype được phép dùng mock data với các điều kiện:

- Kết quả cố định giữa các lần tải trang.
- KPI, chart, ranking và waterfall tính từ cùng dữ liệu gốc.
- Có dữ liệu cho 2024–2026; năm 2026 chỉ đến kỳ thực tế đã quy định.
- Có đủ 21 khoản thu và danh mục địa bàn.
- Có trường hợp số 0, số âm và dữ liệu thiếu để kiểm thử.
- Không trộn mock với tổng chính thức.
- Giao diện **không** mang nhãn "dữ liệu mô phỏng" — xem mục 13.1.

## 13.1. Vì sao giao diện không mang nhãn "dữ liệu mô phỏng"

Bản dựng này được bàn giao cho đội frontend làm **thiết kế chính**, không phải để
trình chiếu cho người ra quyết định. Nhãn mô phỏng là giàn giáo của giai đoạn
prototype: nếu để lại, đội frontend sẽ chép nó vào sản phẩm thật.

**Hệ quả phải chấp nhận.** Ứng dụng vẫn chạy trên số liệu mô phỏng, và từ nay
không còn gì trên màn hình nói điều đó. Rủi ro "một con số giả bị trích vào báo
cáo thật" không biến mất — nó chuyển từ giao diện sang **quy trình**:

- Bản chạy thử chỉ dùng để duyệt thiết kế, không dùng trong cuộc họp chuyên môn.
- Người trình chiếu phải nói rõ tính chất số liệu.
- Tài liệu bàn giao nêu rõ ở `BAO-CAO-PROTOTYPE.md` mục 4.

**Khi nối API thật** thì hệ quả này tự hết. Hợp đồng vẫn giữ `BudgetEstimate.origin`
để phân biệt `mock` với `api`, nên nếu sau này cần bật lại một dấu hiệu nào đó thì
dữ liệu để làm việc đó đã có sẵn.

## 14. Tiêu chí nghiệm thu

Mỗi tiêu chí ở đây tương ứng một cách hỏng đã từng xảy ra hoặc chắc chắn sẽ xảy ra nếu không
ai canh. Đây không phải danh sách "nên có" — đạt hết mới gọi là dùng được.

| # | Tiêu chí | Canh cái gì |
|---|---|---|
| 1 | Bốn tab điều hướng đúng và giữ filter chung | Đổi tab mà filter reset thì người dùng phải chọn lại từ đầu mỗi lần đi sâu vào chi tiết |
| 2 | URL mở lại đúng tab, filter, drawer và đối tượng chọn | Không có cái này thì không gửi được một góc nhìn cụ thể cho người khác, cũng không nhúng iframe vào đúng trạng thái |
| 3 | Tổng quan điều hướng đúng tới các workspace chi tiết | Tổng quan chỉ có giá trị nếu đi tiếp được từ một con số đáng ngờ sang chỗ giải thích nó |
| 4 | Drawer đóng/mở đúng bằng chuột, bàn phím và nút Back | Drawer không nghe nút Back là cái bẫy điều hướng quen thuộc nhất trên web |
| 5 | Thu nội địa có đúng 21 khoản | Thiếu hoặc thừa một khoản là tổng sai; thừa do lẫn dòng tổng vào dòng con thì tổng phồng gấp đôi |
| 6 | Null, zero và số âm được xử lý đúng | Xem §10 — ba giá trị này là ba nghiệp vụ khác nhau, gộp lại là báo cáo sai |
| 7 | KPI, cơ cấu và waterfall đối chiếu được | Ba widget cùng một nguồn mà ra ba con số khác nhau thì không widget nào còn đáng tin |
| 8 | Request cũ không ghi đè response mới | Đổi filter nhanh tay sẽ để lại số của filter cũ dưới nhãn filter mới — sai mà không có dấu hiệu nào |
| 9 | MCP payload không hợp lệ bị từ chối an toàn | Nguồn ngoài đẩy được markup hoặc handler vào UI là lỗ hổng thực thi mã |
| 10 | Không tràn ngang ở 390px, 1024px và 1440px | Tràn ngang làm mất cột số bên phải — người dùng không biết là mình đang thiếu thông tin |
| 11 | Không thẻ nào bị cắt nội dung ngang | Khác tiêu chí 10: trang không tràn nhưng nội dung trong thẻ vẫn bị `overflow: hidden` nuốt |
| 12 | Thẻ cùng hàng cao bằng nhau | Mép dưới lệch nhau làm lưới trông như hỏng và làm người đọc nghi ngờ cả phần số liệu |
| 13 | Giao diện có trạng thái loading, partial, no-data và error | Không phân biệt được "đang tải", "không có dữ liệu" và "lỗi" thì người dùng không biết nên chờ, nên đổi filter hay nên báo sự cố |
| 14 | Tính chất dữ liệu được nêu ở tài liệu bàn giao | Xem mục 13.1: giao diện là bản thiết kế nên không mang nhãn mô phỏng; trách nhiệm chuyển sang tài liệu và quy trình trình chiếu |
| 15 | Không có lỗi JavaScript chưa xử lý | Một lỗi chưa bắt có thể làm widget dừng cập nhật mà vẫn giữ số cũ trên màn hình |
| 16 | TypeScript và production build sạch | Build hỏng thì không deploy được; type sai thường là dấu hiệu của một giả định dữ liệu sai |

### Ba con số, cùng một bộ tiêu chí

Ba tài liệu đếm khác nhau vì chúng gom khác nhau, không phải vì chúng bất đồng:

| Nơi | Số | Cách gom |
|---|---|---|
| Bảng trên (BA) | **16** | Gom theo **nhóm nghiệp vụ**: ba lỗi bố cục nằm chung một dòng |
| `THIET-KE` §18 | **18** | Liệt kê theo **phép kiểm**, gồm cả tiêu chí 14 (TypeScript và build) |
| `scripts/acceptance.mjs` | **17** | Số phép chạy **trên trình duyệt**; tiêu chí 14 không chạy được ở đó |

`17 + 1 = 18`: tiêu chí 14 được kiểm bằng `npm run build` chứ không bằng Chrome. Cả hai
lệnh nằm trong GitHub Actions nên mỗi lần đẩy code đều được kiểm lại.

## 15. Giả định cần xác nhận

Các nội dung dưới đây chưa được coi là nghiệp vụ chính thức:

| Mã | Nội dung cần xác nhận |
|---|---|
| A01 | Công thức chính thức của `Thu thuần` |
| A02 | Công thức thu xuất nhập khẩu ròng và hoàn/khấu trừ |
| A03 | Cấp dữ liệu chính xác của các nhóm IV–VIII |
| A04 | Điều kiện loại mẫu số nhỏ khỏi bảng tăng trưởng |
| A05 | Ngưỡng tạo cảnh báo tăng, giảm và bất thường |
| A06 | Quy tắc địa giới lịch sử trước và sau thay đổi hành chính |
| A07 | Người dùng có được truy cập trực tiếp mọi chế độ so sánh hay không |
| A08 | Phạm vi dữ liệu chính thức hiện có theo năm, kỳ và địa bàn |
| A09 | Nguồn dự toán năm: hệ thống nào giữ, lấy theo đường nào, cập nhật theo chu kỳ nào. Prototype đang dùng số mô phỏng — xem mục 9.1 |
| A10 | Ngày chốt số liệu: API có trả mốc "số liệu chốt đến ngày" không. Đây là câu hỏi đầu tiên người đọc bị chất vấn trong họp, hiện giao diện không có chỗ trả lời |

## 16. Thuật ngữ ngắn

| Thuật ngữ | Giải thích |
|---|---|
| NSNN | Ngân sách Nhà nước |
| NSTW | Ngân sách trung ương |
| NSĐP | Ngân sách địa phương |
| PERIOD | Giá trị riêng trong kỳ |
| YTD | Lũy kế từ đầu năm đến kỳ đang chọn |
| YoY | So với cùng kỳ năm trước |
| Coverage | Số đơn vị có dữ liệu trên tổng số đơn vị kỳ vọng |
| Waterfall | Biểu đồ giải thích các thành phần tạo ra chênh lệch |

## 17. Thứ tự tài liệu

```text
BA-NSNN.md
→ DATA-DICTIONARY-NSNN.md
→ THIET-KE-DASHBOARD-NSNN.md
→ API/MCP contract
→ Prompt triển khai
→ Code
```

Mọi thay đổi công thức hoặc phạm vi nghiệp vụ cần cập nhật tài liệu BA trước khi điều chỉnh
thiết kế và code.
