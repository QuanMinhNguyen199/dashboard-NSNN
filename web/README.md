# Dashboard Thu NSNN Hà Nội

Triển khai theo `../THIET-KE-DASHBOARD-NSNN.md` v1.0: bốn workspace, URL state đầy đủ,
drawer xem nhanh, lớp provider API/MCP/Mock có runtime validation, và dữ liệu mô phỏng
tất định dựng từ một kho quan sát gốc duy nhất.

## Chạy

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # tsc -b && vite build
npm run preview
npm run acceptance   # 16 tiêu chí nghiệm thu qua trình duyệt (cần dev server đang chạy)
```

Từ gốc repo cũng chạy được y hệt — mọi lệnh uỷ quyền xuống `web/`.

## Cấu trúc thư mục

```text
src/
  app/          Điểm vào, khung ứng dụng, danh mục tab
  features/     Mỗi workspace một thư mục, không import chéo nhau
  components/   Dùng chung, không biết nghiệp vụ (Card, Bars, charts, Grid, FilterBar)
  data/         ĐIỂM THAY NGUỒN DỮ LIỆU — provider, validate, hook
    providers/  Cài đặt cụ thể: http.ts (API/MCP), mock.ts
    mock/       Kho quan sát mô phỏng và phần dựng widget từ nó
  domain/       Đúng dù dữ liệu đến từ đâu: danh mục, kiểu, toán về kỳ và tỷ lệ
  state/        Chủ sở hữu duy nhất của URL state
  devtools/     Khung xem thử iframe
  styles/
```

Import dùng alias `@/` trỏ vào `src/`, nên đổi chỗ một file không kéo theo việc sửa
`../../` khắp nơi.

Chiều phụ thuộc một chiều: `app → features → components → domain`, và `features → data →
domain`. `domain/` không import gì từ `data/` hay `features/`.

## Thay API

Toàn bộ giao diện chỉ biết tới interface `DashboardDataProvider`
([`src/domain/types.ts`](src/domain/types.ts)), không biết dữ liệu đến từ đâu. Thay API là
đổi **một** file: [`src/data/index.ts`](src/data/index.ts).

Ba mức, theo công sức từ ít tới nhiều:

| Tình huống | Việc phải làm |
|---|---|
| Backend trả đúng envelope ở `domain/types.ts` | Sửa đường dẫn trong `createProvider`, chạy với `VITE_DASHBOARD_PROVIDER=api` |
| Backend có sẵn nhưng hình dạng khác | Viết một lớp mới trong `data/providers/` implement `DashboardDataProvider`, nắn dữ liệu về đúng kiểu, đăng ký ở `data/index.ts`. Không đụng `features/` |
| Đổi luôn hợp đồng | Sửa `domain/types.ts` trước, TypeScript chỉ ra mọi chỗ cần theo |

Dữ liệu từ ngoài **luôn** đi qua [`src/data/validate.ts`](src/data/validate.ts) trước khi
tới giao diện. Đừng bỏ bước đó kể cả khi backend là của mình — validate ở đây chặn cả
payload sai hình dạng lẫn navigation intent không nằm trong danh sách cho phép.

**Khi đã có API thật thì xoá được:** cả thư mục `src/data/mock/`, nhánh mock trong
`data/index.ts`, và `MockDashboardProvider`. Hai chỗ còn lại đang gọi thẳng vào tầng mock
để tính nhanh — `features/location-detail/LocationDetailTab.tsx` và
`features/revenue-preview/RevenuePreviewDrawer.tsx` dùng `sumOf`/`trendOf` — cần đổi sang
nhận dữ liệu qua props hoặc qua hook.

`acceptance` dùng `puppeteer-core` với Chrome cài sẵn; đặt `CHROME_PATH` nếu Chrome ở
đường dẫn khác.

## Bốn workspace

| Tab | URL | Câu hỏi chính |
|---|---|---|
| Tổng quan | `?tab=overview` | Tình hình thu ngân sách toàn thành phố ra sao? |
| Phân tích thu | `?tab=revenue-analysis&section=domestic&view=overview` | Nguồn hoặc khoản thu nào tạo ra kết quả đó? |
| Chi tiết phường/xã | `?tab=location-detail&location=00004` | Một địa bàn cụ thể đang hoạt động ra sao? |
| So sánh nâng cao | `?tab=advanced-compare&mode=period&periodA=2025m8&periodB=2026m8` | Hai kỳ, nguồn thu hoặc địa bàn khác nhau thế nào? |

Drawer xem nhanh: `?tab=overview&panel=revenue-preview&source=domestic`.
Mở drawer dùng `pushState`; Back đóng drawer và giữ nguyên bộ lọc.

Bộ lọc chung — `year`, `periodType`, `period`, `acc`, `level`, `indicator` — giữ nguyên
khi chuyển tab và được sở hữu bởi **một** nơi duy nhất:
[`src/state/DashboardState.tsx`](src/state/DashboardState.tsx). Không component nào khác
đọc hay ghi `location.search`.

## Chế độ dữ liệu

Mặc định là `MockDashboardProvider`. Đổi bằng biến môi trường:

```bash
VITE_DASHBOARD_PROVIDER=api npm run dev   # POST /api/dashboard/*
VITE_DASHBOARD_PROVIDER=mcp npm run dev   # POST /mcp/dashboard/*
```

Cả ba provider trả cùng một envelope `DashboardResponse` và **đều đi qua runtime
validation** trước khi tới UI ([`src/data/validate.ts`](src/data/validate.ts)).
Widget không biết dữ liệu đến từ provider nào.

MCP chỉ được trả **dữ liệu** và **navigation intent trong danh sách đóng**:
`OPEN_REVENUE_PREVIEW`, `OPEN_REVENUE_ANALYSIS`, `OPEN_LOCATION_DETAIL`,
`OPEN_ADVANCED_COMPARISON`. Mọi intent khác, cũng như intent trỏ tới mã địa bàn hoặc mã
nguồn không có trong danh mục, đều bị `sanitizeNavigation` loại bỏ im lặng. Ứng dụng tự
dịch intent đã kiểm tra thành URL nội bộ — không nhận URL thô, component, HTML, JavaScript
hay CSS class từ bên ngoài.

## Dữ liệu mô phỏng

Nguồn duy nhất là kho quan sát trong
[`src/data/mock/observations.ts`](src/data/mock/observations.ts):

```ts
RevenueObservation { year, month, locationId, itemCode, sourceCode, budgetLevel, amountVnd }
```

KPI, xu hướng, cơ cấu, xếp hạng, bảng và waterfall đều gọi chung `amountOf`/`sumOf`; không
widget nào sinh số riêng, nên các tổng cộng khớp nhau ở mọi chiều. Hàm sinh là thuần và
tất định — cùng bộ lọc luôn cho cùng kết quả.

Phủ: 2024–2026 (2026 tới tháng 8), 126 phường/xã có thật, đúng 21 khoản thu nội địa, bốn
nguồn cấp cao, NSTW và NSĐP.

**Giả định của mock, đã kiểm chứng bằng số:**

- Đơn vị nội bộ là **đồng**, chuẩn hoá đúng một lần tại `amountOf`.
- Tổng 126 phường/xã = tổng thành phố **trừ** nguồn trung ương quản lý (XNK, dầu thô).
  Hai nguồn này không phân bổ theo địa bàn và bị loại hẳn khi phạm vi là một phường/xã.
- Hai phường/xã cố ý thiếu dữ liệu năm 2026 để kiểm thử trạng thái `partial`; đó là quan
  sát **thiếu**, không phải giá trị 0.
- `I.15 Tiền sử dụng khu vực biển` bằng 0 — giá trị 0 hợp lệ, hiển thị là 0.
- `V`, `VIII` và ba dòng hoàn thuế XNK mang giá trị **âm** hợp lệ, không bị clamp.
- Quý được cộng từ ba giá trị PERIOD tháng và mang cờ `derivedQuarter`; mock không có file
  báo cáo quý riêng.
- Chỉ tiêu là **ba tổng khác nhau**: `thu-nsnn` bỏ nguồn VI và VII;
  `tong-so-tru-hoan-thue` bỏ dòng hoàn GTGT `III.2.1`.

## Quy tắc số liệu được thực thi

- `0` là dữ liệu hợp lệ; số âm hợp lệ; `null` là chưa có — **không** cái nào bị đổi thành
  cái kia.
- `%YoY` trả `null` khi mẫu số là `null`, `≤ 0`, hoặc nhỏ hơn 500 triệu đồng. Giao diện ghi
  “Chưa đủ cơ sở”, **không** sinh `−100%` từ dữ liệu thiếu.
- Không cộng đồng thời chỉ tiêu cha và con: danh mục chỉ chứa 21 mã lá của nội địa, không
  có mã cha `1`.
- Waterfall lấy 10 bước lớn nhất, gộp phần dư thành “Khác”, và **tổng các bước luôn bằng
  đúng chênh lệch chung** — runtime validation từ chối payload lệch quá 1.000 đồng.
- Xếp hạng địa bàn chỉ chạy trên danh mục 126 phường/xã; dòng tổng thành phố và dòng tổng
  Kho bạc không nằm trong danh mục nên không thể lọt vào bảng.
- Không hiển thị `NaN` hay `Infinity`; mọi phần trăm theo locale `vi-VN`, một số lẻ.

## Lưới động

Span đi qua CSS custom property đã kiểm tra, **không** dựng tên class Tailwind bằng chuỗi
động. `resolveRow` trong [`src/components/Grid.tsx`](src/components/Grid.tsx) nở widget còn lại thành 12 cột
khi sibling bị ẩn: 8+4 → 12, 7+5 → 12, 6+6 → 12. Không dùng `grid-auto-flow: dense` vì nó
đảo thứ tự đọc và thứ tự tab bàn phím.

Ví dụ đang chạy: chọn `Cấp ngân sách = NSTW` làm widget “Cơ cấu NSTW và NSĐP” mất nghĩa và
bị loại khỏi lưới, “Tăng trưởng địa bàn” bên cạnh nở ra đủ 12 cột.

## Ngôn ngữ thị giác

Corporate là chính, Geometric ở cấu trúc, Flat ở bề mặt. Một tông xanh mang **mọi** đại
lượng định lượng, phân biệt bằng độ đậm nhạt; xanh lá và đỏ chỉ nói chiều tăng/giảm và
luôn kèm tam giác chỉ hướng. Thang lam đã qua kiểm định: độ sáng đơn điệu, ΔL ≥ 0,06 giữa
các bậc liền kề, đầu nhạt đạt 2,11:1 trên nền trắng. Chi tiết trong [DESIGN.md](DESIGN.md).

## Giới hạn còn lại

- **Chưa nối API thật.** `VITE_DASHBOARD_PROVIDER=api` đã có adapter và validation nhưng
  backend `/api/dashboard/*` chưa tồn tại; chạy chế độ đó sẽ ra trạng thái lỗi có nút thử
  lại — đúng như thiết kế, không phải hỏng.
- **Mock không phải số liệu nghiệp vụ.** Giao diện ghi rõ “Dữ liệu mô phỏng phục vụ
  prototype” ở đầu trang. Không trộn mock với tổng chính thức trong bất kỳ phép tính nào.
- **Xuất Excel chưa làm** — đặc tả §9 nêu ở phần bảng 21 khoản; hiện có tìm kiếm và sắp
  xếp mọi cột, chưa có nút xuất.
- **CAGR khi so từ ba năm** là `[COULD]` trong đặc tả, chưa triển khai.
- Ở màn hình dưới 768px, bảng chi tiết ẩn hai cột phụ (Cùng kỳ, Tỷ trọng) để bốn cột còn
  lại đọc được nguyên số thay vì cắt chữ ở cả sáu cột.

## `archive/legacy-clone/`

Bản clone nguyên trạng website ba tab của lượt trước (`dev-nsnn.thehegeo.com`) cùng tài
liệu và script kiểm chứng của nó. Không còn nằm trong build; giữ lại để tra cứu. Fixture
API thật vẫn ở `../reference-nsnn/`, và plugin `plugins/nsnn-api.ts` vẫn phục vụ chúng ở
`/api/*` nếu cần đối chiếu.
