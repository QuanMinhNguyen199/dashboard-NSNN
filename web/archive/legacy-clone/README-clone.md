# prototype-nsnn

Prototype dashboard `Thu NSNN Hà Nội` theo kiến trúc master layout: tab điều hướng đứng
trước bộ lọc, KPI dạng dải compact và workspace 12 cột responsive. Overview mới bám đặc tả
v2; hai tab Chi tiết địa bàn và So sánh hai kỳ tiếp tục dùng các endpoint/fixture đã khảo sát.

Overview đang dùng một `MockDashboardProvider` tách biệt, có nhãn rõ trên giao diện. Mock là
deterministic, phủ 2024–2026 (2026 đến tháng 8), 126 địa bàn và đúng 21 khoản thu nội địa.
KPI, xu hướng, cơ cấu, xếp hạng và waterfall đều tính từ cùng một mô hình nên đối chiếu được;
không trộn mock với tổng chính thức. Giá trị nội bộ của mock là tỷ đồng.

Tài liệu kèm theo:

- [SPEC-GAPS.md](SPEC-GAPS.md) — khoảng cách giữa đặc tả v2 và bản clone này.
- [DATA-MAPPING.md](DATA-MAPPING.md) — đơn vị, mã chỉ tiêu, mã địa bàn, nguồn dữ liệu.
- [VERIFICATION.md](VERIFICATION.md) — các trường hợp đã kiểm chứng và kết quả đối chiếu.

## Chạy

```bash
npm install
npm run dev          # http://localhost:5173
```

Mở đúng URL của nhiệm vụ:

```
http://localhost:5173/?year=2026&acc=PERIOD&item=tong-so&tab=overview
```

Lệnh khác:

```bash
npm run build        # tsc -b && vite build  -> dist/
npm run preview      # chạy bản build, vẫn replay fixture
npm run verify       # chụp 40 trạng thái vào ../verification/ (cần dev server đang chạy)
npm run interactions # 30 kiểm thử hành vi (cần dev server đang chạy)
node scripts/overview-check.mjs # kiểm tra Overview ở 390/1024/1440px
```

`verify` và `interactions` dùng `puppeteer-core` với Chrome cài sẵn trên máy. Nếu Chrome ở
đường dẫn khác, đặt `CHROME_PATH`.

## Kiến trúc dữ liệu Overview

Contract kiểu nằm trong `src/overview/types.ts`; bộ sinh dữ liệu nằm trong
`src/overview/data.ts`, còn `src/overview/providers.ts` chọn provider và kiểm tra JSON bên
ngoài trước khi đưa vào UI. Đặt `VITE_DASHBOARD_PROVIDER=api` để dùng `/api/overview`, đặt
`VITE_DASHBOARD_PROVIDER=mcp` để dùng `/mcp/dashboard/overview`; mặc định là mock. Payload
giữ metadata về kỳ, phạm vi, cấp ngân sách, đơn vị, nguồn và độ phủ. MCP chỉ được trả dữ liệu ứng với các
widget đã đăng ký; không được truyền component, HTML, JavaScript hay CSS tùy ý.

Các giả định tạm thời: Thu NSNN bằng 97,2% tổng mô phỏng; tổng loại trừ hoàn thuế bằng 94,4%;
quý mock được cộng từ ba giá trị PERIOD tháng và có nhãn “được tổng hợp”. Hai quan sát địa
bàn năm 2026 được để thiếu nhằm kiểm thử trạng thái partial, không đổi thành 0.

## Chế độ dữ liệu hai tab cũ

Ứng dụng gọi `/api/*` y như bản gốc. Plugin Vite [`plugins/nsnn-api.ts`](plugins/nsnn-api.ts)
đứng trước và phục vụ theo thứ tự:

1. **Fixture** — 143 phản hồi thật đã lưu trong `../reference-nsnn/api/`, tra theo URL đã
   chuẩn hoá đúng cách bundle gốc dựng URL (bỏ query rỗng, sort key, encode bằng
   `URLSearchParams`). Header trả về `x-nsnn-source: fixture`.
2. **Cache proxy** — nếu trước đó đã lấy từ API gốc, đọc lại từ `.api-cache/`.
3. **Proxy API gốc** — chỉ khi bật `NSNN_PROXY=1`; kết quả được cache lại.
4. **502** — mặc định, khi không có fixture. Ứng dụng hiển thị đúng trạng thái lỗi của bản
   gốc (`Không tải được dữ liệu. Thử lại`). Không có thông báo kỹ thuật nào được thêm vào UI.

```bash
NSNN_PROXY=1 npm run dev            # cho phép gọi API gốc khi thiếu fixture
NSNN_REFERENCE=../reference-nsnn npm run dev   # trỏ tới thư mục tham chiếu khác
NSNN_UPSTREAM=https://... npm run dev
```

**Giới hạn:** fixture chỉ phủ những tổ hợp filter đã khảo sát, không phải toàn bộ cơ sở dữ
liệu. 143 URL đã lưu phủ đủ 40 trạng thái trong `VERIFICATION.md`. Các tổ hợp ngoài phạm vi
đó (ví dụ chọn một phường bất kỳ ở tab Chi tiết, hay `acc=YTD` cho cả năm 2026) sẽ trả 502 và
card tương ứng hiện trạng thái lỗi — đây là hành vi cố ý, không phải hỏng. Bật `NSNN_PROXY=1`
nếu cần chạy các tổ hợp đó.

Hai file GeoJSON ranh giới thật được sao chép vào `public/data/`, phục vụ ở
`/data/hanoi_126_wards.geojson` và `/data/hanoi_30_districts_pre_2025.geojson` giống bản gốc.

## Cấu trúc

CSS là **file gốc của website**, sao chép nguyên vẹn vào
`src/styles/index-C1Ij_FY5.css` (Tailwind đã build sẵn, 14.887 byte, không sửa một ký tự).
Vì vậy mọi class trong mã nguồn phải trùng đúng tên class bản gốc dùng.

```
plugins/nsnn-api.ts        replay fixture / proxy cho dev + preview server
src/
  lib/       api.ts        lớp fetch có dedupe + cache (bản gốc: $w, e2, Sz, t2)
             format.ts     He (tiền), Sb (số chính xác), Ob (%), collator vi, cx
             periods.ts    Bf, Bi, yo, Co, i2, kz… — kỳ và ranh giới địa giới
             url.ts        jz (parse), Nz (serialize), map slug ↔ chỉ tiêu
             districts.ts  zf — 30 quận/huyện trước 01/07/2025, trích từ bundle
  state/     FiltersProvider.tsx   Mz — toàn bộ filter, URL sync, danh mục
             LoadingProvider.tsx   Oz/Dw — spinner tài nguyên
  hooks/     useApi.ts (At) · useTopRowCount.ts (x1) · useWardRows.ts (loe)
  components/ 20 component, mỗi file ghi tên hàm gốc trong bundle ở JSDoc
  tabs/      OverviewTab (Uie) · DetailTab (Tie) · CompareTab (soe + phụ trợ)
  App.tsx    coe — app shell và 3 tab
scripts/     verify.mjs · interactions.mjs
```

Mỗi component đều ghi tên hàm tương ứng trong `reference-nsnn/assets/app-readable.js` để đối
chiếu, ví dụ `/** Go — danh sách thanh ngang mảnh */`. Tên hàm trong bundle đã bị minify;
đây là bản dựng lại có thể đọc/sửa, không phải source gốc của dự án.

## Thư viện

React 18 + TypeScript + Vite, Recharts 2 (line/bar/pie), d3-geo + d3-selection + d3-zoom cho
bản đồ SVG, Radix Tabs/Dialog, clsx + tailwind-merge (`Ro` của bản gốc). Đây đúng là các thư
viện bản gốc dùng — không thay thư viện chart.

## Hệ thống thiết kế

`src/styles/system.css` là bộ token duy nhất cho cả ba tab. Nó nạp **sau** CSS gốc
của website và ánh xạ các biến của bản gốc (`--data-main`, `--data-cmp`, `--m1…--m5`,
`--up`, `--down`…) về đúng bộ token đó, nên hai tab dựng theo Tailwind của bản gốc
dùng chung bảng màu mà không phải sửa markup.

Ba nguyên tắc, chi tiết trong [DESIGN.md](DESIGN.md):

1. **Một tông xanh mang dữ liệu.** Mọi đại lượng định lượng nằm trên một thang lam
   đã kiểm định, phân biệt bằng độ đậm nhạt. Xanh lá/đỏ chỉ mang chiều biến động.
2. **Một thang tiền.** `nghìn tỷ · tỷ · triệu` cho cả ba tab; phần trăm luôn
   `vi-VN` một số lẻ.
3. **Thanh mã hoá đúng đại lượng đang sắp xếp.** Danh sách sắp theo %YoY thì thanh
   vẽ theo %YoY.

### Thay đổi so với bản clone nguyên trạng

Đây là phần **cố ý khác** bản gốc `dev-nsnn.thehegeo.com`, để cả ba tab thành một
hệ thống. `npm run verify` vì thế **không còn** dùng để so khớp với
`reference-nsnn/screenshots` — nó chỉ còn là ảnh chụp trạng thái của bản hiện tại.

| Điểm | Bản gốc | Bản này | Lý do |
|---|---|---|---|
| Thang màu bản đồ | đỏ → cam → vàng → lá → xanh lá | 5 bậc lam nhạt → đậm | Thang cầu vồng cho đại lượng magnitude khiến ~120 phường rơi vào bậc đỏ; cả bản đồ đọc như cảnh báo |
| Chuỗi so sánh | xanh dương vs cam | hai bậc cùng thang lam | Cam gợi "hai loại khác nhau", trong khi A→B là một chuỗi qua thời gian |
| Nhấn mạnh kỳ | kỳ A đậm, kỳ B nhạt | kỳ B đậm, kỳ A nhạt | B là đích đến của phép so sánh |
| Tiêu đề thẻ | chữ hoa, giãn chữ, 13,6px màu mờ | chữ thường 15px/700 màu mực chính | Đồng bộ với Overview; chữ hoa toàn bộ làm nhãn nhỏ khó đọc |
| Dải KPI | bốn thẻ rời có khe | một khối liền chia bằng đường mảnh | Bốn ô là một chỉ số kép, không phải bốn đối tượng rời |
| Chú giải bản đồ | 5 nhãn, bậc thứ tư để trống | ghi hai đầu mút "Thấp"/"Cao" | Thang liên tục chỉ cần hai đầu mút |
| Chọn địa bàn | chỉ đổi giá trị, Overview không phản ứng | đổi phạm vi và điều hướng | Xem mục dưới |
| Cảnh báo tham số URL | chỉ dựng ở hai tab legacy | dựng ở cả ba tab | Mở URL sai và rơi vào Overview thì không nhận được phản hồi nào |
| Phần trăm | lẫn `.` và `,` thập phân | luôn `,` theo `vi-VN` | |

## Địa bàn là phép đổi phạm vi

Địa bàn không cùng loại với Năm hay Chỉ tiêu: nó không lọc hẹp trang đang xem mà
đổi hẳn đối tượng đang xem. Tổng quan luôn tính cho toàn thành phố, nên nếu chọn
một phường ở đó mà giao diện không đổi gì thì ô lọc trông như bị hỏng.

- Chọn một phường/xã → sang **Chi tiết địa bàn**.
- Về toàn thành phố → quay lại **Tổng quan**.
- Tab **So sánh hai kỳ** tự quản lý địa bàn nên không bị ép chuyển.
- **Không tab nào bị vô hiệu.** Vẫn mở được Tổng quan khi đang chọn phường; thanh
  phạm vi nói rõ Tổng quan tính cho toàn thành phố và mở lối tắt sang chi tiết.

Muốn tắt hành vi này: sửa `selectWard` trong
[`src/state/FiltersProvider.tsx`](src/state/FiltersProvider.tsx) để bỏ lời gọi
`setTab`. Thanh phạm vi vẫn hoạt động độc lập.

## Những điểm cố ý giữ nguyên

Bản gốc có một số điểm bất thường. Nhiệm vụ này là clone nguyên trạng nên chúng **được giữ
lại**, không sửa và không thêm banner "đã sửa lỗi". Nguyên nhân từng điểm ghi trong
[DATA-MAPPING.md](DATA-MAPPING.md) §5.

| Điểm | Biểu hiện |
|---|---|
| Bảng xếp hạng đếm 127 | `XẾP HẠNG 126 PHƯỜNG/XÃ THEO THÁNG` nhưng dòng đếm ghi `127 phường/xã có số liệu`, hạng #1 là `MÃ TỔNG HỢP BÁO CÁO KHO BẠC NHÀ NƯỚC KHU VỰC I - HÀ NỘI` |
| Xếp hạng không theo kỳ lọc | Bảng luôn dựng từ toàn bộ 36 tháng của `/api/heatmap`, thứ hạng lấy giá trị tháng cuối chuỗi (2026-12), nên nhiều phường hiện `0 (0.0%)` dù kỳ đang chọn có số |
| YTD thẻ ≠ đường biểu đồ | KPI `LUỸ KẾ TỪ ĐẦU NĂM` và điểm lũy kế trên chart lấy từ hai endpoint khác nhau (`/api/kpi-compare` và `/api/trend`) |
| `THEO CẤP NGÂN SÁCH` trống | `/api/by-scope` không trả dòng `NSDP`, mà điều kiện hiển thị của bản gốc đòi có cả NSTW lẫn NSDP |
| Thiếu dữ liệu thành −100% | Ở tab So sánh, kỳ thiếu số liệu vẫn được tính chênh lệch trong khối `Theo chỉ tiêu` |
| Tràn ngang trên điện thoại | Overview ở 390×844 có document rộng 512px do dòng xếp hạng 4 cột và sparkline cố định 220px |

## Không làm

Không deploy. Không thêm tab/filter/KPI của đặc tả v2 vào bản clone. Không thêm dark mode,
sidebar, export, ô tìm kiếm trong select, hay bất kỳ thay đổi giao diện nào so với bản khảo sát.
