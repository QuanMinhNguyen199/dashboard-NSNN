# Đối chiếu tài liệu nghiệp vụ với website và prototype HTML

Đã đọc: `dac-ta-v2.html` (mới nhất theo người dùng), `update_dac-ta-89_tham-khaor.html`, `phan-tich.md`, toàn bộ CSS/markup/JavaScript của `index.html`, prompt và báo cáo khảo sát hiện có. File v2 trong workspace hiện mang đuôi `.html`, không phải `.md`; đây là bản xuất tài liệu, không phải ứng dụng dashboard.

## 1. Phân biệt vai trò của bốn nguồn

| Nguồn | Vai trò | Không được suy diễn |
|---|---|---|
| Website + bộ `reference-nsnn` | Hiện trạng giao diện, hành vi, query và dữ liệu API đã quan sát | Không coi mọi phép tính hiện có là nghiệp vụ đã được duyệt |
| `dac-ta-v2.html` | Đặc tả nghiệp vụ mới nhất; ưu tiên hơn tài liệu cũ nếu mô tả nghiệp vụ khác nhau | Không coi mọi widget được yêu cầu là đã tồn tại trên website |
| `update_dac-ta-89_tham-khaor.html` | Phản hồi bên thuế và bước đặc tả trước v2 | Không khôi phục thiết kế KPI cũ hoặc danh mục quận/huyện vào yêu cầu v2 |
| `phan-tich.md` | Mục tiêu phân tích và mô hình phân cấp khái niệm | Không tự thêm dashboard doanh nghiệp/dự toán vì tài liệu định hướng có nhắc đến |
| `index.html` | Prototype một trang có dữ liệu mô phỏng và filter cascade hoạt động | Không coi dữ liệu, mã địa bàn, phân bổ, font/style của file này là dữ liệu hoặc UI website gốc |

Yêu cầu đang áp dụng vẫn là tái tạo UI website nguyên trạng. Đặc tả v2 được dùng để hiểu mục tiêu và chuẩn bị mô hình dữ liệu, đồng thời ghi nhận các khoảng cách. Muốn triển khai đủ UI bốn tab v2 là thay đổi phạm vi riêng, không thể đồng thời gọi là clone y hệt web ba tab.

## 2. Những điều v2 đã chốt so với tài liệu cũ

### Phạm vi và điều hướng

- Bốn tab: Tổng quan; Phân tích thu; Chi tiết địa bàn; So sánh nâng cao.
- Tab 1–2 chỉ toàn thành phố. Chọn một phường/xã thì tự sang Tab 3 và disable Tab 1–2; ngoại lệ đang Tab 4 thì không ép chuyển. Về toàn thành phố thì Tab 1–2 hoạt động, Tab 3 nhắc chọn phường/xã.
- Tab 3 tái sử dụng widget Tab 1–2 theo địa bàn, thêm card xếp hạng; bỏ hai bảng Top địa bàn, bỏ phần XNK và dòng dầu thô. Cơ cấu còn Nội địa + Thu khác; Thu khác bằng 0 thì dùng nhãn `100% thu nội địa` thay widget.
- Tab 4 luôn truy cập được; so sánh 2–5 kỳ bất kỳ hoặc 2–5 phường/xã cùng kỳ.
- Drill-down: cơ cấu Nội địa/XNK/Khác → phần tương ứng của Tab 2; dầu thô → panel tại chỗ; Top khoản → Tab 2 với khoản được highlight; Top địa bàn → F4/Tab 3; so sánh địa bàn → Tab 4.

### Bộ lọc F1–F5

| Mã | Yêu cầu v2 | Mặc định |
|---|---|---|
| F1 | Dropdown năm báo cáo từ niên độ có dữ liệu | Năm hiện tại |
| F2 | Segment Tháng/Quý + dropdown kỳ | Kỳ mới nhất có dữ liệu |
| F3 | Segment Trong kỳ/Lũy kế | Trong kỳ |
| F4 | Dropdown có search: Toàn TP + 126 phường/xã | Toàn thành phố |
| F5 | Dropdown Tổng NSNN/NSTW/NSĐP | Tổng NSNN |

Thanh filter sticky, có trên cả bốn tab. Đổi filter tính lại toàn bộ widget tab hiện tại. F4 không còn cấp quận/huyện trong mô hình v2. Ở Tab 4: chế độ theo thời gian disable F2, chế độ theo địa bàn disable F4.

Deep-link v2 minh họa: `?tab=1&year=2025&period=M12&mode=TRONG_KY&area=TOAN_TP&level=NSNN`. Schema này khác URL của website ba tab. Không thay schema của clone bằng schema v2.

### Thời gian và so sánh

- Bên thuế xác nhận ưu tiên cùng kỳ năm trước. V2 quy định dùng một hàm tính kỳ so sánh chung, không để mỗi widget tự quyết định.
- PERIOD tháng so cùng tháng N−1; YTD tháng so khoảng từ T1 đến tháng đó N−1; PERIOD quý so cùng quý N−1; YTD quý so Q1 đến quý đó N−1.
- Mốc mặc định là YoY. MoM chỉ là tùy chọn phụ ở Tab 4, khác với nhiều delta so kỳ liền trước trên website hiện tại.
- Quý: ưu tiên file báo cáo quý riêng. Nếu không có, cộng ba tháng thành phần và gắn nhãn `Số cộng dồn từ 3 tháng — chưa đối chiếu báo cáo quý chính thức`.
- V2 chưa quy định đầy đủ cách xử lý fallback quý thiếu một trong ba tháng; không coi tháng chưa nạp là 0 hoặc coi tổng thiếu tháng là báo cáo quý đầy đủ.
- Tháng chưa có dữ liệu phải ngắt đường, không nối hoặc vẽ điểm 0. `0` là đã có dữ liệu nhưng không phát sinh; `—` là chưa nạp/không có dữ liệu.

## 3. Mô hình chỉ tiêu cần hiểu đúng

Phân cấp khái niệm: Thu NSNN → nguồn I–VIII → khoản thu → sắc thuế/loại thu. Doanh nghiệp là hướng phân tích ở tài liệu định hướng và HTML mô phỏng, chưa được v2 chốt thành một tab doanh nghiệp riêng.

### Tám nguồn cấp I–VIII

| Mã | Nguồn |
|---|---|
| I | Thu nội địa không kể dầu thô |
| II | Thu về dầu thô |
| III | Thu cân đối từ hoạt động xuất nhập khẩu |
| IV | Thu viện trợ |
| V | Các khoản huy động, đóng góp |
| VI | Thu hồi cho vay của Nhà nước và quỹ dự trữ tài chính |
| VII | Tạm thu ngân sách |
| VIII | Các khoản thu NSNN không có trong công thức |

Overview v2 gộp thành bốn dòng Nội địa, XNK, Dầu thô, Thu khác. `Thu khác = IV+V+VI+VII+VIII`: đủ **5 nguồn**, không phải 4 như một câu trong bản cập nhật cũ. Phần Thu khác của Tab 2 vẫn hiển thị cả năm nguồn, kể cả giá trị 0. V và VIII có thể âm; không tự clamp về 0.

### Đúng 21 khoản thu nội địa

Tập mã: `1.1`, `1.2`, `2`, `3`, `4`, `5`, `6`, `7`, `8`, `9`, `10`, `11`, `12`, `13`, `14`, `15`, `16`, `17`, `18`, `19`, `20`.

- SXKD: `1.1` DN trung ương; `1.2` DN địa phương; `2` DN có vốn ĐTNN; `3` ngoài quốc doanh. Đây là **4 khối**, không gộp DN trung ương/địa phương thành một mục như HTML mô phỏng.
- Nhà, đất: `8` thuế sử dụng đất nông nghiệp; `9` phi nông nghiệp; `10` tiền thuê đất; `11` tiền sử dụng đất; `12` thuê/bán nhà thuộc sở hữu nhà nước.
- Phí, lệ phí và khác: `4` TNCN; `5` BVMT; `6` lệ phí trước bạ; `7` phí/lệ phí; `13` xổ số; `14` cấp quyền khai thác khoáng sản/tài nguyên nước; `15` sử dụng khu vực biển; `16` thu khác ngân sách; `17` quỹ đất công ích/hoa lợi/công sản; `18` thu hồi vốn/cổ tức/LNST NSĐP hưởng 100%; `19` cổ tức/LN được chia/LNST NSTW hưởng 100%; `20` chênh lệch thu chi NHNN.

Khoản thu không đồng nghĩa sắc thuế. Không thêm chỉ tiêu cha `1` bên cạnh `1.1`/`1.2` khi cộng hoặc xếp hạng 21 khoản. Mã con phải kèm mã cha/nhánh: `I.1.1` và `III.1.1` không phải cùng chỉ tiêu.

SXKD chi tiết mỗi khối có 5 dòng gốc: GTGT, TTĐB, TNDN, Tài nguyên, Khí thiên nhiên/khí than; dòng thứ sáu `Thu khác = tổng khối − 5 dòng gốc` là số dẫn xuất, gắn `Số tính toán` trong UI v2. Không mang phân bổ sắc thuế theo tỷ lệ cố định của HTML mô phỏng sang dữ liệu nghiệp vụ.

### XNK gộp/ròng

- Tổng gộp gồm 7 dòng `1.1` xuất khẩu, `1.2` nhập khẩu, `1.3` TTĐB hàng NK, `1.4` GTGT hàng NK, `1.5` thuế bổ sung hàng NK, `1.6` BVMT hàng NK, `1.7` thu khác.
- Thu cân đối ròng = tổng gộp − hoàn GTGT − hoàn XNK ưu đãi ô tô/CNHT − hoàn TTĐB xăng khoáng.
- Cơ cấu tổng thể v2 dùng XNK ròng và mẫu số Thu NSNN đã loại trừ hoàn GTGT. Phải kiểm tra quy ước dấu của nguồn để không trừ một lần nữa nếu payload đã lưu hoàn thuế dạng âm.
- Không gộp Tổng số gồm vay/chuyển giao, Thu NSNN, Tổng số trừ hoàn thuế và Thu NSNN trừ hoàn thuế thành một field chỉ vì tên gần giống.
- Dầu thô có panel tại chỗ với giá trị, YoY, hai dòng theo hiệp định/hợp đồng và Condensate; không tự thêm phần thứ tư vào Tab 2.

## 4. Nội dung widget v2

- Tổng quan: KPI; xu hướng kép N/N−1; cơ cấu bốn nguồn; cơ cấu cấp ngân sách; Top 5 khoản nội địa; Top 5 địa bàn cao/thấp; Top 5 địa bàn tăng/giảm. Top khoản có số tiền, tỷ trọng trên Nội địa và YoY; cơ cấu nguồn có mẫu số khác.
- Phân tích thu: ba phần Nội địa, XNK, Thu khác. Nội địa có ba KPI (tổng, tỷ trọng trong thu ngân sách, YoY), grouped bar ba nhóm với N−1 nhạt/N đậm, drill-down từng nhóm, SXKD theo sắc thuế, xếp hạng đủ 21 khoản.
- Chi tiết địa bàn: reuse widget theo scope, card hạng và đóng góp, loại nhóm không phân bổ theo địa bàn như yêu cầu v2; nút về toàn thành phố/đổi địa bàn/so sánh địa bàn.
- So sánh nâng cao: builder 2–5 mốc; nhiều năm dùng line 12 tháng, kỳ rời rạc hoặc nhiều địa bàn dùng grouped bar; legend bật/tắt; tooltip các mốc đang bật và delta so mốc đầu; heat table 21 khoản sort mọi cột, xuất Excel; CAGR chỉ `[COULD]` khi so từ ba năm.
- Waterfall v2 dùng đúng 21 khoản: cột tổng gốc + các delta + cột tổng cuối. Hiện 10 delta lớn nhất theo trị tuyệt đối, phần dư gộp Khác; sai lệch tổng trên 1.000 đồng phải log. Mẫu waterfall ngang trên web hiện tại không phải toàn bộ thiết kế này.

### Luật bất thường v2

| Luật | Điều kiện được ghi trong v2 |
|---|---|
| AL-1 | YoY ≤ −30% **và** trị tuyệt đối delta ≥ 1% tổng thu phạm vi; đỏ |
| AL-2 | 15% ≤ trị tuyệt đối YoY < 30% **và cùng điều kiện quy mô**; cam |
| AL-3 | YoY địa bàn − YoY toàn TP ≤ −20 điểm phần trăm; đỏ |
| AL-4 | Thấp hơn trung bình ba kỳ gần nhất từ hai kỳ liên tiếp; cam |
| AL-5 | Âm ở khoản không thuộc hoàn thuế/điều chỉnh; cam |
| AL-6 | Địa bàn chưa nạp dữ liệu kỳ hiện tại; thông tin |

Điều kiện quy mô AL-1/AL-2 là bắt buộc, tránh cảnh báo các khoản rất nhỏ biến động ±100%. Các công thức này không được thay thế bằng logic `renderNotes()` của `index.html` (mức giảm −10% và tiến độ dự toán mô phỏng).

## 5. Kết quả đọc và chạy `index.html`

- Một trang vanilla HTML/CSS/JS; không có hệ bốn tab v2 hoặc ba tab website. Có bộ lọc năm/kỳ/địa bàn/nguồn/khoản/sắc thuế, chip, breadcrumb, bảng mở rộng, hồ sơ doanh nghiệp và điểm cần chú ý.
- Font Be Vietnam Pro/IBM Plex Sans/IBM Plex Mono, header xanh, sticky filter, card khác website, hỗ trợ dark theo CSS. Chỉ tái sử dụng nếu được yêu cầu giao diện HTML này, không mang vào clone web hiện tại.
- `YEAR=2026`, `PREV=2025`, `LAST_MONTH=8`; năm chỉ có một option; mặc định YTD 8 tháng. Dữ liệu seeded `mulberry32(20260831)`, 25 khoản tổng cộng (trong đó 12 nhóm nội địa), 15 doanh nghiệp ẩn danh; không phải 21 khoản nội địa chuẩn v2.
- Tiền trong HTML là **tỷ đồng**, API web là **đồng**. Trộn trực tiếp sẽ lệch 10^9 lần.
- Địa bàn HTML dùng ID `w0`, `w1`… và tỷ trọng phân bổ mô phỏng, không phải mã hành chính 5 chữ số của API. Danh sách có 126 tên nhưng không được coi là danh mục chuẩn chỉ vì đủ số lượng.
- `buildFilters()` lọc khoản theo nguồn, lọc sắc thuế theo khoản/nguồn, xóa lựa chọn con không còn hợp lệ; `drillLevel()/renderDrill()` dùng breadcrumb đi từ nguồn → khoản → sắc thuế.
- `activeKhoan()/wardFactor()` loại nhóm trung ương không phân bổ khi chọn ward; `sum()/monthly()` tạo số liệu theo cùng phạm vi. Đây là mẫu tổ chức hàm, không phải phép biến đổi được phép dùng với API nếu chưa mapping.
- Đã chạy và thử Nội địa → Ngoài quốc doanh → danh mục sắc thuế phụ thuộc, chọn Hoàn Kiếm hiện card hạng. KPI toàn TP mô phỏng lúc mở: 513,42 nghìn tỷ; cùng kỳ 464,07; YoY +10,6%; tiến độ dự toán 77,3%. Không dùng các số này thay fixture website.
- `sum()` dùng `arr[m] || 0`; phần drill lọc dòng chỉ có giá trị dương; YTD cố định T1–T8. Những cách này không đáp ứng hoàn toàn quy tắc v2 về null/âm/kỳ động và không nên sao chép như logic chuẩn.
- Doanh nghiệp và dự toán là tính năng có trong tài liệu định hướng/HTML, chưa có đủ yêu cầu trong v2 để tự đưa thành hạng mục bắt buộc của prototype bốn tab.

## 6. Điểm v2 chưa rõ hoặc tự mâu thuẫn

1. §1/khung §3 còn nói 4 KPI; §3.1 ghi Card 3+4 gộp làm cảnh báo. Không được tự dùng lại Card 3 Nội địa/Card 4 SXKD của bản cũ để lấp chỗ.
2. §3.1 KPI 2 là YTD dòng 17 cột I, nhưng §3.3 lại ghi KPI 2 hiện mục A kèm nhãn đã loại trừ hoàn GTGT. Cần chốt mapping trước khi thay dữ liệu KPI; chưa có workbook gốc trong các file đã đọc để xác minh dòng/cột và đơn vị.
3. §3.4 chỉ có heading/ảnh tham chiếu, thiếu quy tắc drill-down cấp ngân sách. Ảnh theo đường dẫn đính kèm có thể không còn đúng nội dung; không suy ra nghiệp vụ chỉ từ tên ảnh.
4. §4.3, §4.5 và §5.1 có heading/sơ đồ nhưng chưa đủ chi tiết công thức, sort tie, mẫu số bình quân, empty state.
5. §6.6 scatter chỉ xuất hiện trên sơ đồ, chưa nêu trục X/Y, kích thước/màu điểm và tương tác. Không tự chọn trục rồi gọi là yêu cầu đã chốt.
6. AL-4 chưa xác định rõ cửa sổ trung bình có loại kỳ hiện tại hay không; cần chốt khi thực thi cảnh báo. Base cùng kỳ bằng 0/âm cũng chưa có đầy đủ quy ước phần trăm.
7. Đường dẫn `attachments/7e8d6d66-bcb7-4457-a367-116dc57bb209.png` của v2 chưa tìm thấy trong `Attachment/`; ảnh `6feb90ba-9a12-4013-b721-01441676532c.png` của bản cập nhật cũng thiếu. Không tạo ảnh hoặc coi một ảnh khác là thay thế đã được duyệt.

## 7. Xử lý trong prompt clone hiện tại

| Điểm khác nhau | Bản clone nguyên trạng | Ý nghĩa v2 để ghi trong gap report |
|---|---|---|
| Tabs | Giữ 3 tab và tên hiện có | Mục tiêu mới có 4 tab |
| Filter | Giữ 6 select web và query gốc | F1–F5, search, sticky, cascade, cấp NS |
| Chọn ward | Theo đúng hành vi web | Auto Tab 3, disable Tab 1–2 |
| So sánh | Một ward/hai kỳ | 2–5 kỳ hoặc 2–5 ward |
| Xu hướng/KPI | Replay và render như web | YoY chung, KPI mới và cảnh báo |
| Địa giới | Giữ nhánh lịch sử web để clone | V2 không còn quận/huyện trong F4 |
| Thiếu dữ liệu/bất nhất | Giữ fixture/hiển thị hiện tại để so ảnh | Mục tiêu v2 phân biệt 0/null, không tính thiếu thành giảm 100% |
| Doanh nghiệp/dự toán | Không tự thêm | Từ nguồn định hướng/HTML, không mặc định thành v2 |

Chuẩn bị semantic mapping và lưu nguồn gốc dữ liệu không làm thay đổi UI là phù hợp. Không xây đồng thời hai ứng dụng hoặc thêm nút chuyển “legacy/v2” nếu người dùng chưa yêu cầu. Nếu sau này chuyển hẳn sang v2, cần thay các mục hành vi/UI mâu thuẫn của prompt, không chỉ thêm một câu “ưu tiên v2” phía cuối.
