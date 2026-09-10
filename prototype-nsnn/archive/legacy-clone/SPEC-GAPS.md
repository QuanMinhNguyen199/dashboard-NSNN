# SPEC-GAPS — đặc tả v2 so với bản clone nguyên trạng

Bản clone này tái tạo **website ba tab đang chạy**, không phải ứng dụng bốn tab của
`dac-ta-v2.html`. Tài liệu này ghi từng khoảng cách để không ai nhầm "clone đã xong" với
"v2 đã xong".

Ba loại nội dung được tách riêng, không trộn:

- **§2 — Lỗi đã quan sát trên bản gốc**: có thật, đã tái hiện, cố ý giữ nguyên.
- **§3 — Nghiệp vụ v2 đã mô tả rõ**: đủ chi tiết để làm, nhưng nằm ngoài phạm vi lần này.
- **§4 — Chi tiết v2 chưa chốt**: không đủ cơ sở để thực hiện, không được đoán.

Nguồn: `dac-ta-v2.html` (mới nhất), `update_dac-ta-89_tham-khaor.html` (bản trước v2),
`phan-tich.md`, `../reference-nsnn/DOI-CHIEU-DAC-TA-V2.md`, và bản khảo sát website
10/09/2026.

---

## 1. Bảng đối chiếu tổng thể

| Nhóm | Mục tài liệu | Hiện trạng web (đã clone) | Cách giữ nguyên trong clone | Dữ liệu/mapping còn thiếu |
|---|---|---|---|---|
| Điều hướng | v2 §1, §2 | 3 tab `Overview`, `Chi tiết địa bàn`, `So sánh hai kỳ` | Radix Tabs, đúng 3 tab, giữ nguyên tên tiếng Anh `Overview` | v2 cần tab thứ tư `Phân tích thu`; chưa có endpoint nào phục vụ nhóm 21 khoản |
| Chọn ward | v2 §2 | Chọn ward giữ nguyên tab; chỉ click dòng Top địa bàn mới sang Detail | `TopWardsCard` gọi `selectWard` + `switchTab("detail")`; dropdown chỉ gọi `selectWard` | v2 muốn tự sang Tab 3 và **disable** Tab 1–2 — sẽ đổi hẳn luồng điều hướng |
| Bộ lọc | v2 §2 (F1–F5) | 6 select: Năm, Quý, Tháng, Loại kỳ, Chỉ tiêu, Địa bàn + 2 nút | `FilterBar` giữ đúng thứ tự, không sticky, không ô tìm kiếm | v2 cần F2 dạng segment tháng/quý, F4 có search, **F5 cấp ngân sách** (chưa có filter tương ứng) |
| F5 ≠ Chỉ tiêu | v2 §2 | Ô `Chỉ tiêu` là 3 biến thể tổng, không phải cấp ngân sách | Giữ nguyên 3 lựa chọn | **Không được** đổi ô Chỉ tiêu hiện tại thành F5 — hai chiều phân tích khác nghĩa |
| Deep-link | v2 §2 | `?year&quarter&month&acc&item&ward&district&tab&cmpa&cmpb` | `parseUrl`/`serializeUrl` sao chép nguyên `jz`/`Nz` | v2 minh hoạ schema khác (`tab=1&period=M12&mode=TRONG_KY&area=TOAN_TP&level=NSNN`) — **không** thay schema clone |
| Địa giới | v2 §2 | Có nhánh 30 quận/huyện cũ cho năm 2024 và nửa đầu 2025 | `HISTORICAL_DISTRICTS` + GeoJSON lịch sử, đúng logic `Bf` | v2 bỏ hẳn cấp quận/huyện khỏi F4 — nếu chuyển v2 thì nhánh này biến mất |
| So sánh | v2 §6 | 1 ward × 2 kỳ | `CompareTab` giữ nguyên, có draft/commit | v2 cần 2–5 kỳ **hoặc** 2–5 ward, heat table 21 khoản, export Excel, scatter |
| Kỳ so sánh | v2 §2 | Delta của KPI so **kỳ liền trước** (do backend trả `previous`) | Không đổi cách tính, không đổi nhãn | v2 chốt **YoY** là mặc định, MoM chỉ là tuỳ chọn phụ ở Tab 4 |
| Cơ cấu nguồn | v2 §3 | `/api/treemap` trả 6 dòng, gồm `Khác (chênh lệch nhỏ, chưa phân loại)` | Vẽ danh sách thanh ngang, **không** vẽ treemap dù endpoint tên vậy | v2 gộp thành 4 dòng Nội địa / XNK / Dầu thô / Thu khác, với `Thu khác = IV+V+VI+VII+VIII` (**5 nguồn**) |
| Khoản thu | v2 §3 | Không có cấp khoản thu nào trên web | Không thêm | v2 cần đúng **21 khoản nội địa** (`1.1, 1.2, 2…20`); chưa có endpoint |
| SXKD | v2 §3 | Không có | Không thêm | v2 cần 4 khối (DN trung ương, DN địa phương, FDI, ngoài quốc doanh) × 5 sắc thuế gốc + dòng `Thu khác` dẫn xuất |
| XNK | v2 §3 | Chỉ là một dòng trong cơ cấu | Không thêm | v2 cần 7 dòng gộp và công thức ròng (trừ hoàn GTGT, hoàn ưu đãi ô tô/CNHT, hoàn TTĐB xăng khoáng); phải kiểm quy ước dấu trước khi trừ |
| Waterfall | v2 §4 | `/api/waterfall` trả sẵn `bars` + `total_delta`, hiển thị thanh ngang | Vẽ đúng như bản gốc | v2 cần waterfall trên 21 khoản: tổng đầu + Σdelta = tổng cuối, lấy 10 delta lớn nhất, gộp phần dư thành `Khác`, log nếu lệch >1.000 đồng |
| Cảnh báo | v2 §4 | Không có luật cảnh báo nào | Không thêm | v2 có AL-1…AL-6; xem §3.4 dưới |
| Doanh nghiệp | `phan-tich.md` | Không có | Không thêm | v2 **chưa** chốt tab doanh nghiệp; không tự thêm vì tài liệu định hướng có nhắc |
| Dự toán | `phan-tich.md`, `index.html` | Không có | Không thêm | Không có trong v2; KPI tiến độ dự toán của `index.html` là mô phỏng |

---

## 2. Lỗi đã quan sát trên bản gốc — tái hiện, không sửa

Đây là các điểm bất thường có thật, đã kiểm chứng lại trên bản clone. Nguyên nhân kỹ thuật
ghi ở [DATA-MAPPING.md §5](DATA-MAPPING.md). **Không sửa trong nhiệm vụ clone; không thêm
banner "đã sửa lỗi".**

| # | Điểm | Ưu tiên (theo báo cáo kiểm tra) | Trạng thái trong clone |
|---|---|---|---|
| 1 | Kỳ thiếu dữ liệu vẫn bị tính thành −100% trong khối `Theo chỉ tiêu` | P1 | Tái hiện đúng: `joinRows` coi chỉ tiêu vắng mặt là 0, còn KPI phía trên hiện `chưa có số liệu` |
| 2 | KPI `LUỸ KẾ TỪ ĐẦU NĂM` khác điểm lũy kế trên biểu đồ | P1 | Tái hiện đúng: hai endpoint khác nhau, không hợp nhất |
| 3 | Bảng `XẾP HẠNG 126 PHƯỜNG/XÃ` đếm 127 và hạng #1 là mã tổng hợp Kho bạc | P1 | Tái hiện đúng: không lọc bản ghi tổng hợp khỏi `/api/heatmap` |
| 4 | Xếp hạng không theo kỳ đang chọn, nhiều dòng hiện `0 (0.0%)` | P1 | Tái hiện đúng: `last` lấy giá trị tháng cuối chuỗi 36 tháng |
| 5 | `THEO CẤP NGÂN SÁCH` trống dù khối khác có tỷ lệ NSTW/NSĐP | P1 | Tái hiện đúng: `/api/by-scope` thiếu `NSDP`, điều kiện hiển thị đòi cả hai |
| 6 | Overview tràn ngang trên điện thoại (390px → document 512px) | P2 | Tái hiện đúng: đo được **512px** ở viewport 390×844, khớp báo cáo |

Mục tiêu v2 khác hẳn ở #1: v2 yêu cầu phân biệt `0` (đã nạp, không phát sinh) với `null`
(chưa có dữ liệu), không đổi dữ liệu thiếu thành 0 và không tạo kỳ trước bằng một phần trăm
giả. Muốn đạt điều đó phải sửa cả payload lẫn cách render — nằm ngoài phạm vi clone.

---

## 3. Nghiệp vụ v2 đã mô tả đủ rõ nhưng chưa làm

### 3.1. Bốn tab và luồng điều hướng

v2 §1–2: Tab 1 `Tổng quan`, Tab 2 `Phân tích thu`, Tab 3 `Chi tiết địa bàn`,
Tab 4 `So sánh nâng cao`. Tab 1–2 chỉ toàn thành phố; chọn một phường/xã thì tự sang Tab 3
và **disable** Tab 1–2, trừ khi đang ở Tab 4. Về toàn thành phố thì Tab 1–2 hoạt động lại,
Tab 3 nhắc chọn địa bàn.

Drill-down v2: cơ cấu Nội địa/XNK/Khác → phần tương ứng của Tab 2; dầu thô → panel tại chỗ;
Top khoản → Tab 2 với khoản được highlight; Top địa bàn → F4/Tab 3; so sánh địa bàn → Tab 4.

Web hiện tại chỉ có một drill-down duy nhất: click dòng Top địa bàn → Tab Chi tiết.

### 3.2. Bộ lọc F1–F5 sticky

| Mã | Yêu cầu v2 | Mặc định | Web hiện tại |
|---|---|---|---|
| F1 | Dropdown năm từ niên độ có dữ liệu | Năm hiện tại | Có (`Năm`), mặc định năm lớn nhất |
| F2 | Segment Tháng/Quý + dropdown kỳ | Kỳ mới nhất có dữ liệu | Hai select rời `Quý` và `Tháng`, mặc định "Tất cả" |
| F3 | Segment Trong kỳ / Lũy kế | Trong kỳ | Select `Loại kỳ`, mặc định `PERIOD` — khớp về nghĩa, khác về dạng control |
| F4 | Dropdown **có search**, Toàn TP + 126 phường/xã | Toàn TP | Select native, **không có search** |
| F5 | Dropdown Tổng NSNN / NSTW / NSĐP | Tổng NSNN | **Không có** |

Thanh filter v2 phải sticky và có mặt trên cả bốn tab. Thanh filter hiện tại không sticky và
tab So sánh ẩn bớt Năm/Quý/Tháng.

### 3.3. Mô hình chỉ tiêu

- **8 nguồn cấp I–VIII**: I Nội địa (không kể dầu thô) · II Dầu thô · III XNK · IV Viện trợ ·
  V Huy động, đóng góp · VI Thu hồi cho vay/quỹ dự trữ · VII Tạm thu · VIII Các khoản thu
  NSNN không có trong công thức.
- Overview v2 gộp thành **4 dòng**: Nội địa, XNK, Dầu thô, Thu khác — trong đó
  `Thu khác = IV + V + VI + VII + VIII`, tức **5 nguồn**. Câu "sum 4 mục" của bản 8/9 đã bị
  v2 thay thế và không còn đúng.
- Tab 2 phải hiện đủ cả 5 nguồn trong Thu khác, **kể cả giá trị 0**. Nguồn V và VIII có thể
  âm — không tự clamp về 0.
- **21 khoản nội địa**, ba nhóm: SXKD `1.1+1.2+2+3`; Nhà đất `8+9+10+11+12`;
  Phí/lệ phí/khác `4+5+6+7+13+14+15+16+17+18+19+20`. Không thêm chỉ tiêu cha `1` bên cạnh
  hai con `1.1`/`1.2` khi cộng hay xếp hạng.
- Mã khoản phải mang đường dẫn cha: `I.1.1` khác `III.1.1`. **Không dùng một map toàn cục
  chỉ khoá bằng `1.1`.**
- Khoản thu ≠ sắc thuế ≠ doanh nghiệp. Không dùng chung một tên `tax` cho mọi cấp.

### 3.4. Bộ luật cảnh báo AL-1…AL-6

| Luật | Điều kiện | Màu |
|---|---|---|
| AL-1 | YoY ≤ −30% **và** \|delta\| ≥ 1% tổng thu phạm vi | đỏ |
| AL-2 | 15% ≤ \|YoY\| < 30% **và cùng điều kiện quy mô** | cam |
| AL-3 | YoY địa bàn − YoY toàn TP ≤ −20 điểm phần trăm | đỏ |
| AL-4 | Thấp hơn trung bình 3 kỳ gần nhất trong 2 kỳ liên tiếp | cam |
| AL-5 | Âm ở khoản không thuộc hoàn thuế/điều chỉnh | cam |
| AL-6 | Địa bàn chưa nạp dữ liệu kỳ hiện tại | thông tin |

Điều kiện quy mô của AL-1/AL-2 là **bắt buộc**, để không cảnh báo các khoản rất nhỏ biến
động ±100%. Không thay bộ luật này bằng logic `renderNotes()` của `../index.html` (ngưỡng
−10% và tiến độ dự toán mô phỏng).

### 3.5. Hàm tính kỳ so sánh dùng chung

v2 quy định **một** hàm chung cho mọi widget: PERIOD tháng so cùng tháng N−1; YTD tháng so
T1→tháng đó của N−1; PERIOD quý so cùng quý N−1; YTD quý so Q1→quý đó của N−1. Quý ưu tiên
file báo cáo quý riêng; nếu thiếu thì cộng ba tháng và gắn nhãn
`Số cộng dồn từ 3 tháng — chưa đối chiếu báo cáo quý chính thức`.

Bản clone không tự tính kỳ so sánh: nó render `previous` do `/api/kpi-compare` trả về.

---

## 4. Chi tiết v2 chưa chốt — không được đoán

1. **Số lượng KPI ở Tổng quan.** v2 §1 và khung §3 vẫn nói "4 KPI", nhưng §3.1 ghi gộp
   Card 3 + 4 thành một khối cảnh báo. Không được lấy lại Card 3 (Nội địa) / Card 4 (SXKD)
   của bản 8/9 để lấp chỗ trống.
2. **Mapping của KPI 2.** §3.1 ghi là YTD dòng 17 cột I của workbook; §3.3 lại ghi là mục A
   kèm nhãn đã loại trừ hoàn GTGT. Workbook gốc (`Biểu báo cáo!C17/I17`) **không có trong
   workspace này**, nên không thể xác minh dòng/cột/đơn vị. Chưa đủ cơ sở để đổi mapping KPI
   của clone.
3. **Drill-down cấp ngân sách.** §3.4 chỉ có heading và ảnh tham chiếu, chưa có quy tắc.
4. **§4.3, §4.5, §5.1** có heading/sơ đồ nhưng thiếu công thức, quy tắc sort khi bằng nhau,
   mẫu số bình quân và empty state.
5. **Scatter §6.6** chỉ xuất hiện trên sơ đồ: chưa nêu trục X/Y, kích thước/màu điểm hay
   tương tác. Không tự chọn trục rồi gọi là "đúng đặc tả".
6. **AL-4** chưa nói rõ cửa sổ trung bình có tính cả kỳ hiện tại hay không. Mẫu số YoY bằng
   0 hoặc âm cũng chưa có quy ước phần trăm đầy đủ.
7. **Quý thiếu tháng.** Chưa có quy tắc cho trường hợp file quý thiếu một trong ba tháng.
   Không coi tháng chưa nạp là 0, cũng không coi tổng thiếu tháng là quý đủ dữ liệu.
8. **Ảnh đính kèm thiếu.** `attachments/7e8d6d66-bcb7-4457-a367-116dc57bb209.png` của v2 và
   `6feb90ba-9a12-4013-b721-01441676532c.png` của bản cập nhật không tìm thấy trong
   `Attachment/`. Không tạo ảnh thay thế và không coi ảnh khác là bản đã duyệt.

---

## 5. Những gì `../index.html` đóng góp — và không đóng góp

`../index.html` là prototype một trang, dữ liệu mô phỏng. Nó **không** phải nguồn giao diện
hay dữ liệu cho bản clone.

Học được về cách tổ chức tương tác: `activeKhoan`/`sum`/`monthly` gom truy vấn theo cùng một
phạm vi; `buildFilters` lọc khoản theo nguồn và sắc thuế theo khoản, xoá lựa chọn con khi
mất hiệu lực; `drillLevel`/`renderDrill` dùng breadcrumb đi từ nguồn → khoản → sắc thuế.
Đây là **mẫu tổ chức hàm**, không phải phép biến đổi được phép áp lên API khi chưa mapping.

Không mang sang: font Be Vietnam Pro/IBM Plex, header xanh, dark mode, filter dạng chip,
KPI tiến độ dự toán, hồ sơ doanh nghiệp, `YEAR=2026 / LAST_MONTH=8`, seeded random
`mulberry32`, 25 khoản (12 nhóm nội địa — **không phải 21 khoản chuẩn v2**), 15 doanh
nghiệp ẩn danh, ID địa bàn `w0…w125`, và đơn vị tỷ đồng.

Một số cách làm trong đó không đạt yêu cầu v2 và **không nên sao chép**: `sum()` dùng
`arr[m] || 0` (biến null thành 0), phần drill chỉ lấy dòng có giá trị dương, YTD cố định
T1–T8.

---

## 6. Nếu chuyển hẳn sang v2

Đó là **đổi phạm vi**, không phải thêm tính năng. Khi đó phải viết lại các mục hành vi/UI
mâu thuẫn trong prompt clone chứ không chỉ thêm một câu "ưu tiên v2". Không dựng hai ứng
dụng song song và không thêm nút chuyển `legacy/v2` nếu người dùng chưa yêu cầu.

Cần có trước khi bắt đầu: workbook gốc để xác minh mapping KPI; endpoint cho 21 khoản nội
địa và 7 dòng XNK; quy ước dấu của các dòng hoàn thuế; và câu trả lời cho toàn bộ §4.
