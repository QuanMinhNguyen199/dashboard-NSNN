# DATA-MAPPING — đơn vị, mã và nguồn dữ liệu

Ghi lại chính xác dữ liệu bản clone dùng: đơn vị tiền, danh mục mã, mã địa bàn, phạm vi
(scope) của từng widget, và nguồn (fixture nào / endpoint nào). Mục đích là để khi nối dữ
liệu thật hoặc chuyển sang mô hình v2 thì không lẫn đơn vị, không dùng nhầm mã, không cộng
trùng tổng cha/con.

Ngày khảo sát nguồn: **10/09/2026**. Bản clone không tự sinh số liệu nào.

---

## 1. Đơn vị tiền — điểm dễ sai nhất

| Nguồn | Đơn vị | Ví dụ |
|---|---|---|
| API website (`/api/*`) | **đồng** | `481990311953237` = 481,99 nghìn tỷ |
| `../index.html` (prototype mô phỏng) | **tỷ đồng** | `val: 62300` = 62.300 tỷ |

Hai nguồn lệch nhau **10⁹ lần**. Bản clone **chỉ dùng đơn vị đồng**; không có bất kỳ chỗ
nào nhập số của `index.html` vào. Toàn bộ việc đổi đơn vị nằm gọn trong hai hàm ở
`src/lib/format.ts`:

- `money(v)` — bản gốc là `He`. `v` tính bằng đồng.
  `≥10¹²` → `nghìn tỷ` tối đa 2 số lẻ · `≥10⁹` → `tỷ` tối đa 1 số lẻ ·
  `≥10⁶` → `triệu` tối đa 1 số lẻ · còn lại in số thô. `null` → `—`. Locale `vi-VN`.
- `exact(v)` — bản gốc là `Sb`. Làm tròn về số nguyên đồng, phân nhóm bằng dấu `.`,
  hậu tố ` đ`.

Ngưỡng sai lệch cho phép mà đặc tả v2 nêu là **1.000 đồng**, không phải 1.000 tỷ đồng.

Phần trăm: bản gốc **không** dùng một cách viết thống nhất — `Delta` (`oR`) và các chỗ
khác dùng `toFixed(1)` (dấu chấm thập phân), riêng KPI của tab So sánh dùng
`toLocaleString("vi-VN")` (dấu phẩy thập phân). Bản clone giữ nguyên cả hai cách.

---

## 2. Mã địa bàn

| Loại | Định dạng | Ví dụ | Dùng ở đâu |
|---|---|---|---|
| Phường/xã hiện hành | mã 5 chữ số | `00070` Hoàn Kiếm, `09877` An Khánh | tham số `ward` của API, `value` của `<select>` |
| Slug phường/xã | `name_slug`, `_` → `-` | `hoan_kiem` → `hoan-kiem` | tham số `ward` trên **URL trình duyệt** |
| Quận/huyện trước 01/07/2025 | mã 3 chữ số | `002` Quận Hoàn Kiếm | tham số `district` (slug), chỉ dùng cho ranh giới bản đồ |
| GeoJSON | `properties.name_slug` | `hoan_kiem` | khớp vùng bản đồ với dòng `/api/by-ward` |

**Không dùng ID `w0`, `w1`… của `../index.html` ở bất cứ đâu.** Đó là ID mô phỏng, không
phải mã hành chính, và không thể ánh xạ theo vị trí index.

`ward` trên URL và `ward` gửi API là **hai giá trị khác nhau**: URL mang slug, API mang mã
5 chữ số. Chuyển đổi ở `serializeUrl()` (`src/lib/url.ts`) và ở `slugOf` trong
`FiltersProvider`. Parser chấp nhận cả hai dạng trên URL; nếu vừa có `ward` vừa có
`location` thì `ward` thắng và `location` bị ghi vào danh sách cảnh báo.

Danh mục: `/api/wards` trả **126** dòng, sort theo `Intl.Collator("vi")`.
Danh mục quận/huyện lịch sử là hằng số `HISTORICAL_DISTRICTS` (**30** dòng), trích nguyên
văn từ mảng `zf` trong bundle gốc — không tự soạn lại.

---

## 3. Danh mục chỉ tiêu và cấp ngân sách

### 3.1. Ô lọc `Chỉ tiêu` — đúng 3 lựa chọn

| Nhãn hiển thị | Slug trên URL | Chuỗi gửi API |
|---|---|---|
| `TỔNG SỐ` | `tong-so` | `TỔNG SỐ` |
| `THU NGÂN SÁCH NHÀ NƯỚC` | `thu-nsnn` | `THU NGÂN SÁCH NHÀ NƯỚC` |
| `TỔNG SỐ (trừ hoàn thuế GTGT)` | `tong-so-tru-hoan-thue` | `TỔNG SỐ (Đã loại trừ hoàn thuế GTGT)` |

Nhãn hiển thị khác chuỗi gửi API ở lựa chọn thứ ba — đừng gộp làm một.

Đây là **bốn tổng khác nhau** theo đặc tả v2 (Tổng số gồm vay/chuyển giao; Thu NSNN;
Tổng số trừ hoàn GTGT; Thu NSNN trừ hoàn GTGT). Ô lọc của web chỉ phơi ra ba trong số đó.
Không nhập chúng thành một field.

### 3.2. `location_level` trong `/api/kpi-compare`

Giá trị quan sát được: `city`, `ward`. Các `item` quan sát được:
`TỔNG SỐ`, `THU NGÂN SÁCH NHÀ NƯỚC`, `Thu nội địa không kể dầu thô`, `Thu về dầu thô`,
`Dầu thô + Nội địa`. `acc` nhận `PERIOD` hoặc `YTD`.

Bốn KPI **không** phải bốn ô cùng đổi tên theo ô lọc Chỉ tiêu. Logic gốc (`aR`) là:

| KPI | Nguồn |
|---|---|
| `TỔNG SỐ` | `item="TỔNG SỐ"`, `acc="PERIOD"`, `location_level="ward"` |
| `THU NSNN (THU THUẦN)` | `item="THU NGÂN SÁCH NHÀ NƯỚC"`, `acc="PERIOD"`, `location_level="ward"` |
| `TỶ TRỌNG THU THUẦN` | tính từ hai ô trên |
| `LUỸ KẾ TỪ ĐẦU NĂM (YTD)` | `item="TỔNG SỐ"`, `acc="YTD"`, `ward` — **fallback về `city`** nếu không có |

Mọi dòng có `amount === 0` đều bị bỏ qua khi tìm (hàm `Oa`), nên `0` và "không có dòng"
cho ra cùng một kết quả hiển thị `—`. Đây là quy ước của bản gốc; đặc tả v2 yêu cầu phân
biệt `0` (đã nạp, không phát sinh) với `null` (chưa có dữ liệu) — xem SPEC-GAPS §3.

### 3.3. Mã cấp ngân sách

`/api/by-ward-scope` trả đủ **6 mã**: `NSNN`, `NSTW`, `NSDP`, `PROVINCE`, `DISTRICT`,
`COMMUNE`.

`/api/by-scope` trong **toàn bộ 24 fixture đã khảo sát** chỉ trả **3 mã**:
`NSTW`, `PROVINCE` (NS cấp tỉnh), `COMMUNE` (NS cấp xã). **Không có `NSDP`, không có `NSNN`.**

Sáu cấp **không rời nhau**: `NSNN = NSTW + NSĐP` và `NSĐP = tỉnh + huyện + xã`. Vì vậy
phần trăm của chúng không cộng thành 100% — bản gốc có ghi chú đúng câu này dưới chart
`Theo cấp ngân sách` ở tab So sánh, và bản clone giữ nguyên. **Không cộng tổng cha vào
tổng con.**

---

## 4. Scope của từng widget

Cột "bỏ `ward`" nghĩa là widget luôn hỏi số liệu toàn thành phố, kể cả khi dropdown Địa bàn
đang giữ một phường.

| Widget | Endpoint | Bỏ `ward`? |
|---|---|---|
| KPI (Overview) | `/api/kpi-compare` | có |
| KPI (Chi tiết địa bàn) | `/api/kpi-compare` | không |
| Xu hướng theo tháng (Overview) | `/api/trend` + `/api/heatmap` | có |
| Xu hướng theo tháng (Chi tiết) | `/api/trend` | không |
| Top địa bàn · Xếp hạng · bản đồ | `/api/by-ward` | có (luôn) |
| Top chỉ tiêu / Chi tiết địa bàn | `/api/by-item` | theo tab |
| Theo cấp ngân sách | `/api/by-scope` | theo tab |
| Cơ cấu Thu NSNN | `/api/treemap` | có |
| Waterfall | `/api/waterfall` | có |
| Xếp hạng 126 phường/xã | `/api/heatmap` | có |
| So sánh cơ cấu địa bàn | `/api/by-ward-scope` \| `/api/by-ward-item` | có |
| Đính chính | `/api/corrections` | có |
| Tab So sánh — KPI/thứ hạng | `/api/by-ward` × 2 kỳ | có |
| Tab So sánh — chỉ tiêu / cấp NS | `/api/by-item`, `/api/by-scope` × 2 kỳ | không (`ward` bắt buộc) |
| Tab So sánh — 12 tháng | `/api/trend` | không |

`/api/by-ward` luôn được lọc bỏ các dòng `amount === 0` trước khi dùng (`useWardRows`), nên
số phường "có số liệu" trong cảnh báo độ phủ là số dòng còn lại.

---

## 5. Nguồn dữ liệu và nguyên nhân của các bất nhất đang giữ nguyên

Toàn bộ số liệu đến từ **143 phản hồi thật** trong `../reference-nsnn/api/`, tra qua
`../reference-nsnn/api/manifest.json`. Khoá manifest là URL đã chuẩn hoá theo đúng hàm `e2`
của bundle: bỏ query rỗng, sort key theo thứ tự chữ cái, encode `URLSearchParams`
(dấu cách thành `+`). Middleware dev server chuẩn hoá y hệt trước khi tra.

**Không có phần mô phỏng nào trong bản clone.** Không sinh số ngẫu nhiên, không nội suy,
không điền giá trị thay cho fixture thiếu.

Nguyên nhân đã truy được của các điểm bất thường (giữ nguyên, không sửa):

1. **`THEO CẤP NGÂN SÁCH` trống** — `/api/by-scope` không trả dòng `NSDP`, trong khi điều
   kiện hiển thị của bản gốc (`lL`) đòi có **cả** `NSTW` lẫn `NSDP` và tổng hai dòng khác 0.
   Khối `SO SÁNH CƠ CẤU GIỮA CÁC ĐỊA BÀN` vẫn hiện tỷ lệ NSTW/NSĐP vì nó dùng endpoint
   khác (`/api/by-ward-scope`) — endpoint này có đủ `NSDP`. Đây là khác biệt dữ liệu giữa
   hai endpoint, không phải lỗi giao diện.

2. **Bảng xếp hạng đếm 127 và có mã Kho bạc** — `/api/heatmap` chứa bản ghi tổng hợp
   `MÃ TỔNG HỢP BÁO CÁO KHO BẠC NHÀ NƯỚC KHU VỰC I - HÀ NỘI` nằm cùng tập với 126 phường/xã.
   Bản gốc không loại bản ghi này trước khi đếm, xếp hạng và tính mẫu số tỷ trọng, nên
   hạng #1 chiếm `100.0%`.

3. **Xếp hạng không phản ánh kỳ đang lọc** — `zie` dựng chuỗi từ **toàn bộ** tháng trong
   `/api/heatmap` và lấy `last` = giá trị tháng cuối chuỗi (2026-12) làm khoá xếp hạng, chứ
   không lấy giá trị của kỳ đang chọn. Vì tháng 12/2026 phần lớn bằng 0 nên nhiều dòng hiện
   `0 (0.0%)`.

4. **Thứ tự các dòng bằng 0 có thể khác ảnh gốc** — API không bảo đảm tie-break. Bản clone
   **giữ nguyên thứ tự từ fixture** và không thêm sắp xếp phụ; `Array.prototype.sort` của
   V8 ổn định nên thứ tự đầu vào được bảo toàn. Ảnh khảo sát được chụp từ một lần gọi live
   khác nên vài dòng giá trị 0 có thứ tự khác — xem VERIFICATION.md §3.

5. **Thiếu dữ liệu thành −100%** ở tab So sánh — `joinRows` (`oM`) coi chỉ tiêu vắng mặt ở
   một kỳ là `0`, rồi tính `delta` và `%` bình thường. Khối KPI phía trên lại dùng
   `sideOf` (`aM`) trả `null` khi `amount === 0`, nên hiển thị `chưa có số liệu`. Hai chỗ
   xử lý dữ liệu thiếu theo hai cách khác nhau trong cùng một trang.

6. **YTD trên thẻ ≠ điểm lũy kế trên chart** — KPI đọc `/api/kpi-compare`
   (`item=TỔNG SỐ`, `acc=YTD`, có fallback `city`), còn đường lũy kế đọc `/api/trend`
   (`acc=YTD` theo từng tháng). Hai chuỗi này do backend tổng hợp riêng.

---

## 6. Kỳ báo cáo

`/api/periods` trả 50 dòng: 36 `MONTH`, 12 `QUARTER`, 2 `YEAR` (chỉ 2024 và 2025 — **năm
2026 không có dòng `YEAR`**, nên dropdown Kỳ của tab So sánh không có tuỳ chọn `Cả năm` cho
2026; không tự thêm vào).

Mỗi dòng có `n_ward_with_data` và `has_ward_data`; hai trường này được dùng ở:

- `usablePeriods` (`Tz`) — lọc kỳ đã tới và có độ phủ ≥ 50% mức cao nhất, phục vụ chọn kỳ
  mặc định của tab So sánh (`kz`, ưu tiên cùng kỳ năm trước).
- `sparseMonths` (`Aie`) — tháng có dưới 50% số địa bàn báo cáo thì **ngắt đường** trên
  chart xu hướng (`PERIOD`/`YTD` để `undefined`, `connectNulls={false}`), không vẽ điểm 0.

Quý lấy trực tiếp từ danh mục, **không tự cộng ba tháng** — ô lọc Quý có tooltip nói rõ
điều này ("số Kho Bạc gộp sẵn, không phải tự cộng 3 tháng").

Ranh giới địa giới (`areaEra`, bản gốc `Bf`): năm < 2025 → `historical`; năm > 2025 →
`current`; năm 2025 xét tháng (<7 historical, ≥7 current) rồi quý (<3 historical, ≥3
current); năm 2025 không chọn tháng/quý → `mixed` (bản đồ hiện ranh giới 126 phường/xã dạng
xem trước, không tô màu theo số thu, ẩn legend).
