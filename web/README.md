# Dashboard Thu Ngân sách TP Hà Nội

Triển khai theo `../tai-lieu-luu-tru/nsnn/THIET-KE-DASHBOARD-NSNN.md` v1.1 cộng workspace Mã hạch toán
theo `../bao-cao-outline/noi-bo/`: sáu workspace, URL state đầy đủ,
drawer xem nhanh, lớp provider API/MCP/Mock có runtime validation, và dữ liệu mô phỏng
tất định dựng từ một kho quan sát gốc duy nhất.

## Chạy

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # tsc -b && vite build
npm run preview
npm run acceptance   # 20 tiêu chí nghiệm thu qua trình duyệt (cần dev server đang chạy)
```

Từ gốc repo cũng chạy được y hệt — mọi lệnh uỷ quyền xuống `web/`.

Giao thức phân biệt Web host, iframe và Mobile WebView nằm tại
[`../HOST-INTEGRATION.md`](../tai-lieu-luu-tru/nsnn/HOST-INTEGRATION.md). Báo cáo BA ngắn về phần Mobile nằm tại
[`../REPORT-MOBILE-HOST-INTEGRATION.md`](../tai-lieu-luu-tru/nsnn/REPORT-MOBILE-HOST-INTEGRATION.md).

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
  devtools/     Khung xem thử iframe và thiết bị mobile
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

## Sáu workspace

| Tab | URL | Câu hỏi chính |
|---|---|---|
| Tổng quan | `?tab=overview` | Tình hình thu ngân sách toàn thành phố ra sao? |
| Báo cáo | `?tab=report` | Số thu chia theo địa bàn, cơ quan thuế hoặc ngành nghề thế nào? |
| Phân tích thu | `?tab=revenue-analysis&section=domestic&view=overview` | Nguồn hoặc khoản thu nào tạo ra kết quả đó? |
| Chi tiết phường/xã | `?tab=location-detail&location=00004` | Một địa bàn cụ thể đang hoạt động ra sao? |
| Mã hạch toán | `?tab=tms-breakdown&mgmt=all` | Số thu gồm những Chương, Mục và Tiểu mục nào? |
| So sánh nâng cao | `?tab=advanced-compare&mode=period&periodA=2025m8&periodB=2026m8` | Hai kỳ, nguồn thu hoặc địa bàn khác nhau thế nào? |

Drawer xem nhanh: `?tab=overview&panel=revenue-preview&source=domestic`.
Mở drawer dùng `pushState`; Back đóng drawer và giữ nguyên bộ lọc.

Bộ lọc chung — `year`, `periodType`, `period`, `acc`, `level`, `mgmt` — giữ nguyên
khi chuyển tab và được sở hữu bởi **một** nơi duy nhất:
[`src/state/DashboardState.tsx`](src/state/DashboardState.tsx). Không component nào khác
đọc hay ghi `location.search`.

`period=0` nghĩa là **toàn bộ kỳ đã có số liệu của năm**. Nhãn gọi theo thực tế: năm đã đủ
mười hai tháng thì là `Cả năm`, năm đang chạy thì là `Từ đầu năm (N tháng)` — không gọi
tám tháng là cả năm. Khoảng này không phụ thuộc `periodType`: chu kỳ Tháng hay Quý đều cho
cùng một con số, chu kỳ chỉ quyết định độ mịn của danh sách kỳ cụ thể. Khi đó `acc` mất
tác dụng nên điều khiển `Cách tính` bị tắt kèm lý do.

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
- Không hiển thị banner coverage lặp lại ở đầu mỗi tab. Tổng quan đưa số địa bàn thiếu vào
  KPI `Cần chú ý`; trạng thái `partial` vẫn được giữ trong tầng dữ liệu.
- `I.15 Tiền sử dụng khu vực biển` bằng 0 — giá trị 0 hợp lệ, hiển thị là 0.
- `V`, `VIII` và ba dòng hoàn thuế XNK mang giá trị **âm** hợp lệ, không bị clamp.
- Quý được cộng từ ba giá trị PERIOD tháng và mang cờ `derivedQuarter`; mock không có file
  báo cáo quý riêng.
- Chỉ tiêu là **ba tổng khác nhau**: `thu-nsnn` bỏ nguồn VI và VII;
  `tong-so-tru-hoan-thue` bỏ dòng hoàn GTGT `III.2.1`. Ô chọn chỉ tiêu đã gỡ khỏi thanh
  lọc vì gần như không ai đổi, nhưng tham số `indicator` vẫn nằm trong state và hợp đồng
  API, nên deep link cũ và backend không bị ảnh hưởng.
- `level` (cấp ngân sách được hưởng) kéo theo `mgmt` (cấp quản lý của Chương):
  `NSTW → trung-uong`, `NSDP → dia-phuong`, `NSNN → all`. Đây là giá trị khởi điểm, chọn
  tay trong tab Mã hạch toán vẫn thắng. **Hai tham số này là hai trường khác nhau của giao
  dịch** và không suy được ra nhau — thẻ `Cấp quản lý và cấp ngân sách` trong tab đo đúng
  khoảng chênh giữa chúng.

## Quy tắc số liệu được thực thi

- `0` là dữ liệu hợp lệ; số âm hợp lệ; `null` là chưa có — **không** cái nào bị đổi thành
  cái kia.
- `%YoY` trả `null` khi mẫu số là `null`, `≤ 0`, hoặc nhỏ hơn 500 triệu đồng. Giao diện ghi
  “Chưa có kỳ trước”, **không** sinh `−100%` từ dữ liệu thiếu.
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

Ví dụ đang chạy: chọn `Cấp ngân sách = NSTW` làm widget “Theo cấp ngân sách” mất nghĩa và
bị loại khỏi lưới, “Tăng trưởng địa bàn” bên cạnh nở ra đủ 12 cột.

Ở phạm vi `NSNN`, người dùng chọn trực tiếp lát hoặc chú giải NSTW/NSĐP để đổi phần phân rã.
NSTW được phân theo bốn nguồn thu; NSĐP được phân theo cấp tỉnh, huyện, xã. Widget kiểm tra tổng
`NSNN = NSTW + NSĐP`, `NSTW = tổng bốn nguồn` và `NSĐP = cấp tỉnh + cấp huyện + cấp xã`
trước khi vẽ. Prototype đang dùng phân rã NSĐP mock tất định vì kho quan sát chưa có ba cấp con;
adapter API/MCP phải trả `centralBudgetSources` và `localBudgetLevels`. Số 0 và số âm là giá trị
hợp lệ, không được đổi thành trạng thái thiếu dữ liệu.

## Khổ hẹp và khung nhúng

Dashboard được thiết kế để nhúng vào khung hẹp cạnh một agent, nên bố cục dưới 1280px
không phải bản rút gọn tạm bợ.

| Ngưỡng | Việc nó giải |
|---|---|
| 1279px | Cặp 8+4 nới thành 7+5 và **vẫn đứng cạnh nhau**. Ép mỗi thẻ chiếm trọn hàng làm trang dài gấp đôi mà vẫn thừa chiều ngang |
| 1179px | Dải KPI xuống 2×2, trước khi mỗi ô hẹp hơn chính con số nó phải in |
| 1023px | Nội dung trong thẻ chuyển bố cục hẹp; bảng nhiều cột chiếm trọn hàng thay vì cuộn ngang trong thẻ |
| 767px | Web responsive; thanh lọc chuyển thành bản tóm tắt và lưới hai cột khi mở |
| 699px | Hết chỗ cho hai cột, xếp chồng toàn bộ |

Dưới 768px, thanh lọc đóng gói ngữ cảnh thành hai nhóm `Kỳ báo cáo` và `Phạm vi`. Nút
`Bộ lọc` mở sáu điều khiển theo thứ tự quen thuộc. Hai trường cuối — `Cấp ngân sách` và
`Cấp quản lý` — chia đôi hàng; dưới 340px chúng tự xuống hai hàng. Nút `Đặt lại bộ lọc`
chiếm toàn bộ chiều rộng và đưa state về Tháng 8/2026, Trong kỳ, Tổng NSNN, toàn thành phố
và tất cả cấp quản lý. Cùng cấu trúc này được dùng trong iframe ở mọi chiều rộng.

Ô `Cấp quản lý` là lối đi tắt sang tab Mã hạch toán, cùng vai với `Chi tiết địa bàn`: chọn
một cấp sẽ mở tab đó, còn `Tất cả cấp` chỉ bỏ lọc mà không kéo người dùng khỏi tab đang
đứng. Ô dùng `optgroup` để giữ đúng hình dạng hai bậc — ba cấp tỉnh, huyện, xã nằm **bên
trong** địa phương, không ngang hàng với trung ương.

Hai ô này là **cặp điều hướng**, nên khi panel lọc đóng lại (iframe, mobile, web hẹp) cả
hai vẫn hiện bên ngoài và chiếm trọn hàng bằng nhau. Đặt chúng sau một cánh cửa là sai:
chúng đổi *thứ đang xem*, không phải tinh chỉnh *cách xem*.

Dưới 768px, tab Mã hạch toán bỏ thanh chọn cấp trong tab — ô `Cấp quản lý` ở thanh lọc đã
làm việc đó — và hai bảng năm cột chuyển sang xếp chồng: tên với số tiền một dòng, tỷ
trọng/so cùng kỳ/trạng thái xuống dòng dưới. Nền trạng thái chuyển từ ô sang **dòng**: ở
bản xếp chồng các ô co về bề rộng nội dung nên tô nền ô sẽ vẽ ra ba mảng màu rời rạc. Danh
sách Chương rút còn 6 dòng; ngưỡng đọc bằng `matchMedia` đúng media query của stylesheet
để hai bên không trôi khỏi nhau.

Thẻ cùng một hàng luôn cao bằng nhau: biểu đồ nở hết phần dư, danh sách thanh nở **có
trần** để dòng không bị kéo méo, bảng dài cuộn trong thẻ thay vì nong thẻ cao gấp đôi thẻ
bên cạnh.

### Xem thử iframe

Nút `Xem thử iframe` trên header mở dashboard trong một `<iframe>` **thật**, kèm khổ dựng
sẵn 390/500/720/960/1280 và thanh trượt 320–1440px
([`src/devtools/FramePreview.tsx`](src/devtools/FramePreview.tsx)).

Nút `Xem thử mobile` dùng cùng iframe thật nhưng chọn theo thiết bị: iPhone SE, iPhone 13
mini, iPhone 14, iPhone 14 Pro Max, iPhone 15 Pro Max, Pixel 5, Pixel 7, Galaxy S8+,
Galaxy S20 Ultra, Galaxy S23 và Galaxy Z Fold 5. Preview gửi đúng `platform` iOS/Android.
Thanh tab có thể kéo ngang bằng chuột trong preview; trên màn cảm ứng vẫn dùng vuốt native.

Phải là iframe chứ không phải một khung `div` hẹp: media query đọc kích thước **viewport**
chứ không đọc container, nên thu nhỏ một div chỉ bóp nội dung lại mà bố cục vẫn giữ nguyên
biến thể rộng — xem thử như vậy còn tệ hơn không xem.

Tab và bộ lọc đồng bộ hai chiều: mở khung thì vào đúng trạng thái trang chính, `Thoát` thì
trang chính về đúng trạng thái vừa dừng trong khung. Đổi khổ không tải lại iframe nên thao
tác bên trong giữ nguyên. Khổ ghi vào URL (`?frame=500`) nên gửi link được.

### Bản đồ

Bản đồ mặc định hiện **toàn thành phố**. Chọn một địa bàn thì phóng có trần 3× — đủ để mắt
bắt được vị trí nhưng vẫn thấy các phường, xã xung quanh, vì đây là bản đồ nhiệt và mất
bối cảnh so sánh là mất lý do tồn tại của nó. Nút `Toàn thành phố` hiện khi đang phóng.

Lăn chuột trần phóng to, không cần tổ hợp phím. Khi đã ở mức toàn thành phố mà vẫn lăn
xuống thì không còn gì để thu nhỏ, sự kiện được nhường lại cho trang cuộn — nếu không, trỏ
chuột đặt lên bản đồ sẽ khoá luôn việc cuộn trang trong khung hẹp.

## Ngôn ngữ thị giác

Corporate là chính, Geometric ở cấu trúc, Flat ở bề mặt. Một tông xanh mang **mọi** đại
lượng định lượng, phân biệt bằng độ đậm nhạt; xanh lá và đỏ chỉ nói chiều tăng/giảm và
luôn kèm tam giác chỉ hướng. Thang lam đã qua kiểm định: độ sáng đơn điệu, ΔL ≥ 0,06 giữa
các bậc liền kề, đầu nhạt đạt 2,11:1 trên nền trắng. Chi tiết trong [DESIGN.md](DESIGN.md).

## Kiểm chứng và CI

```bash
npm run typecheck
npm run build
npm run dev &          # nghiệm thu cần một dev server đang chạy
npm run acceptance     # mặc định http://127.0.0.1:5173
```

`scripts/acceptance.mjs` chạy 20 tiêu chí trên Chrome thật qua `puppeteer-core`; đặt
`CHROME_PATH` nếu Chrome ở đường dẫn khác. Mỗi tiêu chí canh một cách hỏng cụ thể, không
phải một danh sách “nên có” — lý do từng cái ở
[`../BA-NSNN.md`](../tai-lieu-luu-tru/nsnn/BA-NSNN.md) §14.

Ba tiêu chí về bố cục đáng chú ý vì chúng bắt những lỗi mà mắt dễ bỏ qua:

| # | Canh cái gì |
|---|---|
| 10 | Trang không tràn ngang ở 390, 1024, 1440px |
| 11 | Không thẻ nào bị `overflow: hidden` nuốt mất nội dung — trang không tràn vẫn có thể mất chữ trong thẻ |
| 12 | Thẻ cùng hàng cao bằng nhau ở 768, 960, 1280, 1600px |

Hai workflow trong [`../.github/workflows/`](../.github/workflows):

| Workflow | Chạy khi | Làm gì |
|---|---|---|
| `ci.yml` | push **mọi nhánh** và pull request | typecheck → build → 20 tiêu chí trên Chrome |
| `deploy-pages.yml` | push `main` | build với `VITE_BASE` theo tên repo → phát hành GitHub Pages |

Base của bản build lấy từ tên repo nên đổi tên repo không làm hỏng đường dẫn asset. Deploy
lên domain riêng ở gốc thì đặt `VITE_BASE=/`.

## Giới hạn còn lại

- **Chưa nối API thật.** `VITE_DASHBOARD_PROVIDER=api` đã có adapter và validation nhưng
  backend `/api/dashboard/*` chưa tồn tại; chạy chế độ đó sẽ ra trạng thái lỗi có nút thử
  lại — đúng như thiết kế, không phải hỏng.
- **Mock không phải số liệu nghiệp vụ, và giao diện KHÔNG nói ra điều đó.** Nhãn cảnh báo
  đã được gỡ vì bản dựng này là thiết kế bàn giao cho đội frontend — để lại thì nhãn sẽ bị
  chép vào sản phẩm thật. Hệ quả: bản chạy thử chỉ dùng để duyệt thiết kế, không dùng trong
  cuộc họp chuyên môn. Lý do đầy đủ ở [`../BA-NSNN.md`](../tai-lieu-luu-tru/nsnn/BA-NSNN.md) mục 13.1.
  Không trộn mock với tổng chính thức trong bất kỳ phép tính nào.
- **Xuất Excel chưa làm** — đặc tả §9 nêu ở phần bảng 21 khoản; hiện có tìm kiếm và sắp
  xếp mọi cột, chưa có nút xuất.
- **CAGR khi so từ ba năm** là `[COULD]` trong đặc tả, chưa triển khai.
- Ở màn hình dưới 768px, bảng chi tiết ẩn hai cột phụ (Cùng kỳ, Tỷ trọng) để bốn cột còn
  lại đọc được nguyên số thay vì cắt chữ ở cả sáu cột.
- **Hai chỗ còn gọi thẳng vào tầng mock.**
  `features/location-detail/LocationDetailTab.tsx` và
  `features/revenue-preview/RevenuePreviewDrawer.tsx` dùng `sumOf`/`trendOf` của
  `data/mock/` để tính nhanh thay vì lấy qua provider. Khi nối API thật thì hai file này
  cần nhận dữ liệu qua props hoặc hook; phần còn lại của `features/` đã sạch.

## `archive/legacy-clone/`

Bản clone nguyên trạng website ba tab của lượt trước (`dev-nsnn.thehegeo.com`) cùng tài
liệu và script kiểm chứng của nó. Không còn nằm trong build; giữ lại để tra cứu. Fixture
API thật vẫn ở `../reference-nsnn/`, và plugin `plugins/nsnn-api.ts` vẫn phục vụ chúng ở
`/api/*` nếu cần đối chiếu.
