---
name: Quản lý nghiệp vụ Thuế TP Hà Nội
description: Bàn làm việc nghiệp vụ trên giấy ấm, khung sơn mài đỏ sẫm, bảng số dày thông tin mà vẫn tĩnh.
colors:
  canvas: "#f6f4f2"
  surface: "#ffffff"
  surface-soft: "#f6f4f2"
  surface-tint: "#fbf1f1"
  hover-surface: "#f6f4f2"
  selected-surface: "#f7e5e7"
  selection-bg: "#f7dfe1"
  line: "#e4dedc"
  line-soft: "#f0eceb"
  control-line: "#d8d0ce"
  control-line-hover: "#b2a5a6"
  state-edge: "#8a797c"
  ink: "#241d1f"
  ink-2: "#4f4547"
  ink-3: "#6f6366"
  chrome: "#3a1016"
  seal: "#cf2333"
  gold: "#f3c602"
  brand: "#9a1c2a"
  brand-strong: "#7a1521"
  focus: "#241d1f"
  focus-on-chrome: "#f3c602"
  positive: "#14653a"
  positive-bg: "#eaf4ee"
  warning: "#7a5810"
  warning-bg: "#fbf3df"
  critical: "#c0261c"
  critical-bg: "#fdefed"
  info: "#3f5470"
  info-bg: "#eef0f4"
  on-chrome-1: "#f2dfe1"
  on-chrome-2: "#d9b9bd"
  on-chrome-3: "#b08f95"
  on-chrome-note: "#e8c77a"
  positive-on-chrome: "#7fd0a4"
  scroll-thumb: "#d2c9c7"
  scroll-thumb-hover: "#b0a3a4"
typography:
  display:
    fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "clamp(22px, 2vw, 26px)"
    fontWeight: 650
    lineHeight: 1.25
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "20px"
    fontWeight: 650
    lineHeight: 1.25
    letterSpacing: "-0.02em"
  metric:
    fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "18px"
    fontWeight: 650
    lineHeight: 1.25
    letterSpacing: "-0.015em"
  title:
    fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "14px"
    fontWeight: 650
    lineHeight: 1.4
    letterSpacing: "-0.005em"
  body:
    fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  body-strong:
    fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "13px"
    fontWeight: 600
    lineHeight: 1.45
    letterSpacing: "normal"
  lead:
    fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  label:
    fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "12px"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "normal"
  column-head:
    fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "11px"
    fontWeight: 650
    lineHeight: 1.4
    letterSpacing: "0.01em"
  nav-group:
    fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "10px"
    fontWeight: 700
    lineHeight: 1.4
    letterSpacing: "0.1em"
  mono:
    fontFamily: "ui-monospace, SFMono-Regular, Consolas, monospace"
    fontSize: "12px"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "-0.01em"
rounded:
  panel: "10px"
  control: "6px"
  chip: "4px"
  nav: "4px"
  dialog: "12px"
  circle: "50%"
spacing:
  xs: "4px"
  sm: "8px"
  md: "10px"
  lg: "12px"
  xl: "14px"
  xxl: "16px"
  xxxl: "18px"
  gutter: "20px"
components:
  button-primary:
    backgroundColor: "{colors.brand}"
    textColor: "#ffffff"
    typography: "{typography.body-strong}"
    rounded: "{rounded.control}"
    padding: "0 11px"
    height: "32px"
  button-primary-hover:
    backgroundColor: "{colors.brand-strong}"
    textColor: "#ffffff"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.body-strong}"
    rounded: "{rounded.control}"
    padding: "0 11px"
    height: "32px"
  button-secondary-hover:
    backgroundColor: "{colors.surface-soft}"
    textColor: "{colors.ink}"
  button-quiet:
    backgroundColor: "transparent"
    textColor: "{colors.brand}"
    typography: "{typography.body-strong}"
    rounded: "{rounded.control}"
    padding: "0 8px"
    height: "32px"
  button-quiet-hover:
    backgroundColor: "{colors.surface-tint}"
    textColor: "{colors.brand}"
  panel:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.panel}"
    padding: "0 14px 12px"
  panel-head:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.title}"
    padding: "13px 16px"
    height: "54px"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "0 9px"
    height: "32px"
  nav-item:
    backgroundColor: "transparent"
    textColor: "{colors.on-chrome-1}"
    typography: "{typography.body}"
    rounded: "{rounded.nav}"
    padding: "0 10px"
    height: "38px"
  nav-item-hover:
    backgroundColor: "#ffffff14"
    textColor: "#ffffff"
  nav-item-active:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.brand-strong}"
    rounded: "{rounded.nav}"
    padding: "0 10px"
    height: "38px"
  badge-critical:
    backgroundColor: "{colors.critical-bg}"
    textColor: "{colors.critical}"
    typography: "{typography.label}"
    rounded: "{rounded.chip}"
    padding: "2px 7px"
  badge-mock:
    backgroundColor: "{colors.warning-bg}"
    textColor: "{colors.warning}"
    typography: "{typography.label}"
    rounded: "{rounded.chip}"
    padding: "2px 7px"
  kpi:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.metric}"
    padding: "9px 16px"
    height: "56px"
  toast:
    backgroundColor: "{colors.chrome}"
    textColor: "#ffffff"
    typography: "{typography.body-strong}"
    rounded: "{rounded.panel}"
    padding: "9px 9px 9px 13px"
    height: "46px"
---

# Design System: Quản lý nghiệp vụ Thuế TP Hà Nội

## Overview

**Creative North Star: "Bàn làm việc sơn mài"**

Hệ này là một bàn làm việc nghiệp vụ, không phải một dashboard quan sát. Mặt làm việc là giấy ấm (`--canvas #f6f4f2`) với các khối trắng đặt lên trên; khung bao quanh — sidebar, drawer, cột trái màn đăng nhập, toast, scrim — là sơn mài đỏ sẫm (`--chrome #3a1016`). Hai vật liệu đó tách bạch có chủ ý: người dùng luôn biết đâu là công cụ, đâu là nội dung. Khung sơn mài thay cho navy của bản trước, vì navy không còn liên quan gì tới con dấu cơ quan, còn nền trắng toàn phần làm hệ mất cạnh và đọc ra phần mềm quản trị chung chung.

Bảng màu được dựng lại từ chính con dấu Thuế TP Hà Nội: đỏ `#cf2333` và vàng `#f3c602` đo trực tiếp trên file logo, không ước lượng bằng mắt. Từ đó sinh ra ba vai riêng của sắc đỏ, và việc tách ba vai này là quy tắc chi phối toàn hệ. Trung tính ngả ấm, ám đỏ rất nhạt, vì xám xanh lạnh đặt cạnh đỏ đọc ra "ghép nhầm hai bộ".

Mật độ cao và tĩnh. Thước đo là Stripe Dashboard: bảng dài đọc được, số có trọng lượng, trạng thái rõ mà không ồn. Sản phẩm đi theo chuẩn mực của loại sản phẩm một cách có chủ đích — đây là lựa chọn đã ghi trong PRODUCT.md, không phải mặc định do thiếu quyết định — nên quy ước phải được thực thi đầy đủ, không mỉa mai và không lén cài nét lạ. Lằn ranh người dùng đặt ra vẫn đứng: giao diện không được trông như sản phẩm tiêu dùng.

**Key Characteristics:**
- Giấy ấm làm mặt nền, sơn mài đỏ sẫm làm khung; hai vật liệu không trộn vào nhau.
- Ba vai của sắc đỏ tách rành mạch: dấu ấn, hành động, can thiệp.
- Font hệ thống, không webfont; chữ số dùng `tabular-nums` trên toàn thân trang.
- Khối nội dung có viền mảnh 1px và bóng hai lớp rất nhẹ; không có thẻ nổi.
- Bậc chữ ngắn (10 → 22px, thêm một bậc `clamp` tới 26px ở màn đăng nhập); phân cấp do đường kẻ và cân nặng gánh.
- Bàn phím và cảm ứng là điều kiện: focus 2px trên mọi thứ bấm được, 44px tối thiểu từ 900px trở xuống.
- Không có tràn ngang ở bất kỳ khổ nào: mọi rãnh lưới chứa bảng đều khai báo cơ sở 0.

## Colors

Bảng màu ấm, ám đỏ, một nốt lạnh duy nhất; phần lớn diện tích là trắng và giấy, màu chỉ xuất hiện khi mang nghĩa.

### Primary
- **Đỏ hành động** (`--brand`): đỏ mận sẫm. Dùng cho nút chính, liên kết, `caret-color`/`accent-color` của ô nhập, bước đang xử lý trong luồng duyệt, mũi tên hàng khi hover, mục điều hướng đáy đang mở. Đây là màu duy nhất được phép nói "bấm vào đây".
- **Đỏ hành động đậm** (`--brand-strong`): hover và active của nút chính, và màu chữ của mục điều hướng đang mở khi nó lật sang nền trắng.
- **Đỏ con dấu** (`--seal`) và **vàng con dấu** (`--gold`): hai sắc đo từ logo, là gốc của cả bảng màu. Cần nói thẳng trạng thái hiện tại của chúng trong mã: `--seal` được khai báo nhưng **chưa có một lần `var()` nào** — đỏ con dấu chỉ tồn tại trong ảnh `public/tax-logo.png`; `--gold` có đúng một tham chiếu, ở một quy tắc hiện không bắt được phần tử nào (xem mục Navigation). Sắc vàng thật sự sống trong hệ qua hai token khác: `--focus-on-chrome` và `--on-chrome-note`. Giữ `--seal` và `--gold` như hai token gốc của bảng màu, nhưng đừng coi chúng là màu đang được vẽ.

### Secondary
- **Sơn mài đỏ sẫm** (`--chrome`): vật liệu của khung — sidebar, drawer mobile, cột trái màn đăng nhập, toast, skip-link, và màu chữ của vùng bôi chọn. Ba bậc mực trên nó (`--on-chrome-1`, `--on-chrome-2`, `--on-chrome-3`) đều ≥5,7:1, nên bậc mờ nhất vẫn dùng được cho nhãn nhóm chứ không phải chỉ để trang trí. `--on-chrome-note` là bậc vàng ấm dành riêng cho dòng vai trò và đơn vị của người đang đăng nhập.

### Tertiary
Màu trạng thái, mỗi màu đi kèm một nền rất nhạt dùng cho dải `.notice` và chip:
- **Xanh xác nhận** (`--positive` / `--positive-bg`): việc đã xong, bước đã duyệt, trạng thái rỗng lành tính. Trên nền sơn mài đổi sang `--positive-on-chrome`.
- **Nâu vàng cảnh báo** (`--warning` / `--warning-bg`): sắp đến hạn, dữ liệu mô phỏng, điều cần biết trước khi tin con số.
- **Đỏ can thiệp** (`--critical` / `--critical-bg`): sáng và ngả cam hơn đỏ hành động, để hai thứ không đọc thành một. Chỉ xuất hiện khi người dùng phải xử lý.
- **Xanh thép** (`--info` / `--info-bg`): nốt lạnh duy nhất còn lại, dành cho tin trung tính không đòi hành động.

### Neutral
- **Giấy ấm** (`--canvas`): nền của `html`, `body`, mặt làm việc, ngăn chi tiết và màn từ chối quyền.
- **Trắng** (`--surface`): mặt của mọi khối nội dung, ô nhập, topbar, hàng bảng, và của mục điều hướng đang mở.
- **Giấy mềm** (`--surface-soft`) và **giấy hồng** (`--surface-tint`): nền đầu cột bảng, nền hover của nút phụ, nền hover của nút mờ, dải nhắc cuộn ngang.
- **Hồng chọn** (`--selected-surface`): hàng đang chọn trong bảng và tài khoản mẫu đang chọn. Nền này giữ nguyên cả khi hover, vì "đang chọn" mạnh hơn "đang trỏ tới". `--selection-bg` là nền bôi chọn văn bản.
- **Đường kẻ** (`--line`) và **đường kẻ mờ** (`--line-soft`): hai bậc, không ba. `--line` cho ranh giới khối và vạch dưới đầu cột; `--line-soft` cho mọi vạch chia bên trong khối.
- **Mực** (`--ink`, `--ink-2`, `--ink-3`): ba bậc. Bậc mờ nhất đạt 5,75:1 trên trắng, 5,24:1 trên giấy và 5,19:1 trên nền ám đỏ — nó là bậc nhỏ nhất được phép, không có bậc thứ tư.
- **Viền điều khiển** (`--control-line`, hover `--control-line-hover`) và **viền mang trạng thái** (`--state-edge`, ≥3:1 với cả nền trắng lẫn đường kẻ kề nó, dùng cho vòng tròn bước và nút phân đoạn đang bật).

### Named Rules

**The Three Reds Rule.** Đỏ trong hệ này mang ba việc và ba việc đó không bao giờ được nhòe vào nhau: `--seal` chỉ nhận diện, `--brand` chỉ hành động, `--critical` chỉ can thiệp. Một màu không thể vừa là thương hiệu vừa là cảnh báo — nếu nút lưu và dòng báo lỗi cùng một sắc đỏ thì người dùng hết cách phân biệt "bấm được" với "có chuyện".

**The Ink Focus Rule.** Vòng focus là mực `--focus`, không phải đỏ. Đỏ đã mang hai nghĩa, nên một vòng đỏ quanh ô đang chọn sẽ đọc thành "ô này có vấn đề". Mực là màu duy nhất không mang nghĩa nào và nó đạt 15:1 trên mọi bề mặt sáng. Trên nền sơn mài vòng mực biến mất, nên ở đó — và chỉ ở đó — focus đổi sang vàng con dấu `--focus-on-chrome` (10,18:1).

**The Neutral Numeral Rule.** Chữ số giữ màu mực trung tính. Màu trạng thái nằm ở nhãn, ở chip và ở dải thông báo, không nằm trong con số. Một con số đỏ đọc ra "số này sai" chứ không đọc ra "số này lớn".

**The Warm Grey Rule.** Không đưa xám xanh lạnh vào trung tính; nó phá sự liền mạch với con dấu. Trung tính ám đỏ rất nhạt đọc ra "cùng một hệ". Ngoại lệ duy nhất đã đăng ký là `--info`.

## Typography

**Display / Body / Label Font:** một stack duy nhất — `system-ui, -apple-system, "Segoe UI", sans-serif`.
**Mono Font:** `ui-monospace, SFMono-Regular, Consolas, monospace`, cho mã số thuế, tên file và mã tài khoản.

**Character:** Không có font chữ riêng, và đó là quyết định chứ không phải thiếu sót. PRODUCT.md ghi ba căn cứ: bề mặt tác nghiệp được phục vụ tốt bằng font hệ thống; dấu tiếng Việt chồng tầng (ế, ự, ỡ) dựng ổn định trong Segoe UI trong khi nhiều webfont subset latin-ext dựng không đều; và hệ chạy trên mạng nội bộ nơi mỗi kilobyte tải thêm là chi phí thật. Tính cách của chữ vì thế đến từ cân nặng và khoảng cách chứ không từ hình dáng: trọng lượng 650 cho tiêu đề, `letter-spacing` âm nhẹ cho số và tiêu đề, `tabular-nums` bật trên toàn `body` để các cột số thẳng hàng.

### Hierarchy
- **Display** (650, `clamp(22px, 2vw, 26px)`, 1.25, -0.02em): chỉ cột trái màn đăng nhập. Đây là chỗ duy nhất trong hệ có chữ lớn, và nó được phép lớn vì màn đăng nhập không phải màn làm việc.
- **Headline** (650, 20px, 1.25, -0.02em): tiêu đề hộp thoại tạo báo cáo, tiêu đề form đăng nhập, tiêu đề màn từ chối quyền.
- **Metric** (650, 18px, 1.25, -0.015em): con số trong dải tổng hợp và trong luồng trạng thái. Giữ nguyên 18px cả trên mobile — dải tổng hợp ở Trang công việc đổi khuôn hình (mỗi ô thành một hàng nhãn-số) chứ không hạ cỡ số, vì con số là thứ người dùng quét trước.
- **Title** (650, 14px, -0.005em): tiêu đề khối `.panel-head h2`. Đây là bậc tiêu đề thường gặp nhất; tiêu đề màn ẩn nên khối chính là đơn vị người dùng đọc.
- **Body** (400, 14px/1.5): chữ nền của `body`, nhãn điều hướng, giá trị trong ô chi tiết (nặng 500).
- **Body-strong** (600, 13px): nhãn nút, tên hàng, tên bước, chữ trong dải thông báo, mục danh sách kiểm.
- **Lead** (400, 13px/1.5, `max-width: 72ch`, màu `--ink-2`): dòng mô tả mở đầu mỗi màn (`.page-lead`). Đây là dòng chữ đầu tiên người dùng thấy trong nội dung, vì tiêu đề màn bị ẩn.
- **Label** (600, 12px): nhãn ô chi tiết, nhãn dải tổng hợp, chú thích phụ, dòng phụ của hàng. Dòng phụ quan trọng đã được nâng từ 11px lên 12px và nâng đó vẫn đứng trong bản dựng.
- **Column-head** (650, 11px, +0.01em): đầu cột bảng, sticky, nền giấy mềm, chữ `--ink-2`.
- **Nav-group** (700, 10px, +0.1em, VIẾT HOA): nhãn nhóm điều hướng trong sidebar — bậc duy nhất viết hoa toàn bộ trong hệ, và nó được phép vì đó là tiêu đề cấu trúc, không phải đích bấm.

### Named Rules

**The Silent H1 Rule.** Tiêu đề trang không hiện. `PageIntro` vẫn dựng `<h1>` nhưng gắn `className="sr-only"`: tên màn đã nằm ở mục điều hướng đang mở trong sidebar, in lại nó ở đầu nội dung là nói hai lần và ăn mất dòng đắt nhất của trang. Thẻ vẫn nằm trong DOM vì một trang không có tiêu đề là một trang mà người dùng bàn phím không biết mình đang ở đâu. Không gỡ `<h1>`, và cũng không bỏ `sr-only` để "cho cân". Cùng nguyên tắc này áp xuống cấp khối — xem **The Row Already Said It Rule** ở mục Components.

**The Short Ramp Rule.** Cả hệ chạy trong khoảng 10–22px với chín bậc, và không thêm bậc nào nữa. Phân cấp do đường kẻ, khoảng trắng và cân nặng gánh; nâng cỡ chữ để tạo phân cấp là cách làm của sản phẩm tiêu dùng và nó phá mật độ mà bảng dài cần.

**The Tabular Number Rule.** `font-variant-numeric: tabular-nums` đặt một lần trên `body`, không rắc lẻ từng chỗ. Số tiền và số lượng đi qua `Intl.NumberFormat("vi-VN")`; cột số căn phải bằng lớp `.num`.

## Layout

Khung cố định, nội dung co giãn. Sidebar `position: fixed` rộng 252px; topbar `position: sticky` cao `--topbar-h 60px`, lùi trái 252px; mặt làm việc lùi trái 252px với đệm `18px 20px 32px`. Nội dung nằm trong `.page-stack`: `width: min(100%, 1540px)`, `grid-template-columns: minmax(0, 1fr)`, căn giữa, các khối cách nhau 18px. Trần 1540px giữ cho bảng không kéo dài vô tận trên màn rộng.

Măng sét mang thao tác cấp trang từ 901px trở lên. Topbar có một ô cắm rỗng `.topbar-actions` (`display: contents`, nên nút cắm vào trở thành con trực tiếp của hàng flex) đặt giữa dải bối cảnh và chip mô phỏng; `PageIntro` bắn cụm `.page-actions` của nó vào đó bằng portal khi `(min-width: 901px)` khớp, và dựng tại chỗ khi không. Từ 900px xuống nút quay về trong luồng nội dung và trải hết bề ngang. `PageIntro` trả về một fragment — `<h1 class="sr-only">` cộng `.page-lead` — chứ không còn bọc trong một khối `.page-intro`; lớp đó không còn tồn tại.

Nhịp khoảng cách chạy theo bậc 4 / 8 / 10 / 12 / 14 / 16 / 18 / 20. Đệm trong khối là `0 14px 12px` (12px từ 720px xuống). Các dải toàn chiều rộng bên trong khối — bảng, danh sách việc, danh sách nguồn, bảng xếp hạng, lưới chi tiết — dùng `margin-inline: -14px` để chạm hẳn mép khối trong khi phần chữ vẫn thụt vào. Hàng bảng cao 38px, ô chi tiết và ô tổng hợp cao tối thiểu 56px, hàng việc 54px, đầu khối 54px.

Hai bố cục làm việc: `.workbench-grid` chia 1.1fr / 0.9fr, và `.case-layout` chia 7fr / 3fr với cột chi tiết `position: sticky` ở `calc(var(--topbar-h) + 18px)`, cao tối đa `calc(100dvh - var(--topbar-h) - 36px)` và tự cuộn. Màn đăng nhập là lưới hai cột `minmax(340px, 42%) / minmax(0, 1fr)`: cột trái sơn mài, cột phải trắng.

**Điểm ngắt.**
- **1361px trở lên** — dải hai cột tồn tại thật, và toàn bộ luật chiều cao của nó sống trong đúng khối media này: `.case-layout` nhận `align-items: stretch` và `max-height: calc(100dvh - var(--topbar-h) - 40px)`; cột chi tiết bỏ `position: sticky` cùng trần riêng của nó; hai cột và hai khối bên trong thành hộp dọc `min-height: 0`; thân khối nhận `flex: 1; overflow: auto`; và `.case-layout .table-wrap` bỏ trần `min(62vh, 560px)` để bảng lấp đầy dải thay vì dừng sớm rồi chừa khoảng trống.
- **1360px trở xuống** — cột chi tiết bên phải biến mất; chọn một hàng mở `<dialog>` trượt từ mép phải, rộng `min(100vw, 520px)`, cao toàn màn, nền giấy ấm. Không có luật chặn chiều cao nào áp ở đây, vì khi dải xếp thành một cột thì chặn chiều cao là bóp nghẹt chính bảng dữ liệu.
- **901px** — ranh giới của thao tác cấp trang: trên nó nút nằm trong măng sét, dưới nó nút nằm trong nội dung.
- **1180px** — lưới hai cột duỗi thành một; luồng trạng thái từ năm cột xuống ba.
- **900px** — sidebar ẩn, topbar và mặt làm việc bỏ lùi trái, nút mở menu hiện, thanh điều hướng đáy hiện lên (nền `#fffffff2`, `backdrop-filter: blur(14px)`), mặt làm việc chừa 86px đáy. Mọi vùng chạm lên 44px và dải nhắc cuộn ngang xuất hiện trên bảng.
- **720px** — màn đăng nhập xếp dọc; dải tổng hợp về hai cột; nút phân đoạn đổi thành `<select>`; ô bảng cao 44px; dải thông báo xếp dọc hoàn toàn; luồng duyệt đổi trục ngang thành trục dọc.

**Chuyển động.** Một hàm gia tốc duy nhất `--ease-out: cubic-bezier(.16, 1, .3, 1)`. Đổi trạng thái 100–160ms; vào màn 200ms; toast 220ms; ngăn chi tiết 180ms. Toàn bộ nằm sau `prefers-reduced-motion: no-preference`, và có một công tắc chung cắt mọi animation cùng transition xuống 0,01ms khi người dùng yêu cầu giảm chuyển động.

### Named Rules

**The 44px Floor Rule.** Từ 900px trở xuống, mọi thứ bấm được cao tối thiểu 44px: nút, ô tìm kiếm, `<select>`, nút phân đoạn, mục điều hướng trong drawer, nút đăng xuất, vùng chọn hàng, nút trong chân bảng. Đây là ràng buộc trong PRODUCT.md, không phải gợi ý.

**The Whole Row Rule.** Hàng bảng bấm được thì cả hàng bấm được: `.row-select` kéo rộng `calc(100% + 24px)` với `margin: -7px -12px` để phủ hết ô, và `tbody tr:has(.row-select:not(:disabled))` nhận `cursor: pointer`. Không bắt người dùng ngắm một nút nhỏ nằm trong hàng.

**The Zero-Basis Track Rule.** Mọi rãnh lưới có thể chứa bảng phải khai báo cơ sở 0: `.page-stack` dùng `grid-template-columns: minmax(0, 1fr)`, và `.case-layout`, `.case-list`, `.case-detail` đều mang `min-width: 0`. Rãnh `auto` mặc định nở tới bề rộng tối thiểu 780px của bảng nghiệp vụ rồi kéo mọi khối anh em vượt khung nhìn ở 390 và 768 — tràn ngang không bắt đầu ở cái bảng, nó bắt đầu ở cái rãnh chứa bảng.

**The Band Owns the Height Rule.** Trong dải hai cột, chiều cao do dải quyết định, không do từng khối. Dải bị chặn ở một trần duy nhất, hai cột kéo bằng nhau, và bên nào tràn thì cuộn trong thân khối của chính nó. Hệ quả: đừng đặt trần chiều cao riêng lên bảng hay lên cột chi tiết khi đang ở trong dải — hai trần chồng nhau làm bảng dừng sớm và để lại một khoảng trống dưới đáy cột. Luật này chỉ áp từ 1361px; đem nó xuống khổ hẹp là bóp nghẹt bảng.

**The Fixed Furniture Rule.** Không đổi vị trí điều hướng, bộ lọc hay nút mà người dùng đã quen tay. Sidebar trái, topbar trên, bộ lọc nằm trong đầu khối, thao tác chính nằm bên phải đầu khối — đây là lằn ranh người dùng đặt ra, và mọi màn mới thừa hưởng nó.

## Elevation & Depth

Hệ gần như phẳng. Độ sâu chủ yếu đến từ vật liệu — sơn mài đỏ sẫm làm khung, trắng làm mặt, giấy ấm làm nền — và từ hai bậc đường kẻ. Bóng chỉ nhận ba nhóm việc: đóng khung khối, phản hồi khi trỏ tới, và nâng lớp phủ.

### Shadow Vocabulary
- **Khối nội dung** (`box-shadow: 0 1px 2px rgb(41 37 38 / 5%), 0 5px 14px rgb(41 37 38 / 4%)`, kèm `border: 1px solid var(--line)`): áp cho `.panel`, `.kpi-strip`, `.figure-line`. Hai lớp rất nhạt, đủ để khối tách khỏi giấy mà không đọc thành thẻ nổi.
- **Nút có nền** (`0 1px 1px #29252614` cho nút chính, `0 1px 1px #2925260f` cho nút phụ): tắt hẳn khi `:active`, kèm `translateY(.5px)` để cú bấm có trọng lượng.
- **Mục điều hướng đang mở** (`0 2px 5px rgb(0 0 0 / 10%)`): thanh trắng nổi lên khỏi nền sơn mài.
- **Nâng khi trỏ tới** (`0 3px 8px rgb(41 37 38 / 10%)` kèm `translateY(-2px)`): chỉ hàng bảng, hàng việc và ô tổng hợp bấm được.
- **Nút phân đoạn đang bật** (`0 1px 2px #2925261f` kèm viền `--state-edge`): một mảnh trắng nhô lên khỏi rãnh xám.
- **Lớp phủ** (`--shadow-overlay: 0 18px 48px #29131833`): ngăn chi tiết, drawer mobile, toast, hộp thoại báo cáo. Nền mờ phía sau là `rgb(36 29 31 / 45%)`, scrim của drawer là `#29252680`.
- **Mép dính** (`0 1px 3px rgb(41 37 38 / 3%)` cho topbar, `0 -6px 20px #29252612` cho thanh điều hướng đáy): gần như không thấy, chỉ để mép không trôi vào nội dung khi cuộn.

### Named Rules

**The Hover Belongs to Handles Rule.** Hiệu ứng nâng bị khóa sau `@media (any-hover: hover) and (any-pointer: fine)` và chỉ áp cho ba thứ thật sự bấm được: hàng bảng có vùng chọn còn bật, hàng việc dạng `<button>`, và ô tổng hợp dạng `<button>`. Một khối chỉ để đọc mà nhấc lên khi rê chuột là hứa một hành động không tồn tại.

**The Two-Line Rule.** Cấu trúc bên trong khối do hai bậc đường kẻ gánh: `--line` cho ranh giới khối và vạch dưới đầu cột, `--line-soft` cho mọi vạch chia bên trong. Không thêm bậc thứ ba, và không dùng bóng để thay đường kẻ bên trong khối.

## Shapes

Bốn bậc bo góc, mỗi bậc gắn với một loại vật: khối nội dung, hộp thoại chi tiết và toast dùng 10px (`--radius-panel`); nút, ô nhập, `<select>`, ô tìm kiếm, nút đóng dùng 6px (`--radius-control`); chip trạng thái và vùng chọn hàng dùng 4px (`--radius-chip`); mục điều hướng dùng 4px. Hộp thoại tạo báo cáo là ngoại lệ duy nhất với 12px. Hệ còn khai báo `--radius-hairline: 2px` nhưng không nơi nào dùng — coi đó là token cũ, đừng dựng bậc thứ năm quanh nó.

Thanh cuộn tùy biến cũng lấy bậc khối (`--radius-panel`) thay vì một con số rời, để không có bán kính nào sống ngoài thang.

Hình tròn (`50%`) dành riêng cho dấu bước: chấm 6px mở đầu chip trạng thái, chấm 11px trên dòng thời gian, vòng 20px trong danh sách kiểm, vòng 26px trong luồng duyệt. Viền luôn 1px, trừ vòng tròn dòng thời gian (2px) và vạch trên của mục điều hướng đáy đang mở (2px).

Biểu trưng là ảnh `public/tax-logo.png` dựng qua `<img>`, cắt tròn bằng `clip-path: circle(42.5% at 50% 50%)`, hiện ở ba cỡ: 46px trong sidebar và drawer, 50px trên màn từ chối quyền, 64px trên màn đăng nhập.

### Named Rules

**The Emblem Not Lettermark Rule.** Khối nhận diện luôn là ảnh con dấu cộng hai dòng chữ ("Quản lý nghiệp vụ Thuế" / "Thuế TP Hà Nội"). Không thay con dấu bằng ký tự lồng hay ký hiệu viết tắt, không vẽ lại con dấu bằng SVG suy diễn, không đặt chữ đè lên nó.

**The Circle Means Step Rule.** Hình tròn trong hệ này luôn có nghĩa "một bước trong chuỗi" hoặc "một chấm trạng thái". Không bo tròn nút, không dựng avatar tròn, không dùng dáng viên thuốc cho chip.

## Components

### Buttons
- **Shape:** bo nhẹ (6px), cao 32px trên desktop và 44px từ 900px xuống, chữ 13px/600, `white-space: nowrap`, icon 17px đặt trước nhãn.
- **Primary:** nền và viền `--brand`, chữ trắng, bóng 1px. Hover chuyển `--brand-strong`; `:active` bỏ bóng và lún nửa pixel.
- **Secondary:** nền trắng, viền `--control-line`, chữ mực. Hover đổi viền sang `--control-line-hover` và nền sang giấy mềm.
- **Quiet:** không nền, không viền, chữ `--brand`, đệm ngang 8px. Hover nhận nền giấy hồng `--surface-tint`. Trên mobile nó bỏ đệm ngang và căn trái trong đầu khối thay vì kéo rộng như hai loại kia.
- **Disabled:** `opacity: .45`, bỏ bóng, bỏ dịch chuyển, `cursor: not-allowed`.
- **Focus:** vòng mực 2px, `outline-offset: 2px`, kế thừa từ quy tắc chung chứ không định nghĩa lại.
- **Nút gửi của màn đăng nhập** là biến thể riêng: cao 44px, chiếm trọn bề ngang form, cùng bảng màu với nút chính.

### Chips (Badge)
- **Mặc định là chữ có chấm, không phải viên thuốc:** nền trong suốt, không viền, không đệm, chữ 12px/600, và một chấm tròn 6px `currentColor` đứng trước qua `::before`. Bốn tông dùng dạng này: neutral (`--ink-2`), positive, warning, info. Chấm cộng chữ nghĩa là trạng thái không bao giờ chỉ được truyền bằng màu.
- **Hai ngoại lệ có nền:** tông `critical` và cờ "Mô phỏng" chuyển thành chip có nền nhạt, bo 4px, đệm `2px 7px` — đó là hai thứ phải nhìn thấy trước khi đọc. Chip mô phỏng bỏ chấm vì nó không phải một trạng thái trong chuỗi. Trên topbar, chip mô phỏng hạ giọng xuống nền giấy mềm với viền `--line`: nó phải hiện diện thường trực mà không cạnh tranh với nội dung.

### Cards / Containers (Panel)
- **Corner Style:** 10px, `overflow: hidden`.
- **Background:** trắng trên nền giấy ấm.
- **Border & Shadow:** có khung — viền 1px `--line` và bóng hai lớp rất nhẹ (xem Elevation & Depth). Stylesheet còn giữ một khai báo cũ hơn viết `border: 0` cho `.panel`, nhưng nó bị quy tắc muộn hơn ghi đè; trạng thái đang chạy là khối **có** viền và bóng.
- **Đầu khối:** cao tối thiểu 54px, đệm `13px 16px`, vạch dưới `--line`. Tiêu đề 14px/650 có thể kèm `.panel-source` 11px/400 màu `--ink-3` nói dữ liệu đến từ đâu. Dòng mô tả (`max-width: 72ch`, màu `--ink-3`) là tùy chọn và **không dùng ở khối chi tiết** — xem quy tắc dưới. Khi đầu khối có vùng thao tác, nó chuyển sang lưới (`display: grid`) để thao tác xuống dòng dưới tiêu đề thay vì bóp tiêu đề; đó là lý do đầu khối chi tiết ở Nợ và Lô dữ liệu cao hơn ở Hoàn thuế và Báo cáo, chứ không phải vì còn sót dòng phụ. Chiều cao đầu khối vì thế là kết quả của nội dung, không phải một con số đặt trước — đúng lý do hàng lưới chung phải là subgrid.
- **Internal Padding:** `0 14px 12px`, xuống `0 12px 12px` từ 720px.
- **Trong dải hai cột:** khối thành hộp dọc, thân nhận `flex: 1; min-height: 0; overflow: auto`, và hai đầu khối nằm trên cùng một hàng lưới (xem quy tắc dưới).

**The Row Already Said It Rule.** Đầu khối chi tiết chỉ định danh bản ghi bằng tên, còn mọi trường đã hiện trên hàng đang chọn thì ở lại trên hàng. Bốn khối chi tiết của dải (Nợ, Hoàn thuế, Báo cáo, Lô dữ liệu) đã bỏ hẳn dòng phụ vì nó lặp lại đúng các cột nằm cách đó vài trăm pixel về bên trái — mã số thuế che, đơn vị và cán bộ ở Nợ; ngày nhận và đơn vị ở Hoàn thuế; kỳ, đơn vị chủ trì và nguồn ở Báo cáo; mốc cập nhật ở Lô dữ liệu. Đọc cùng một trường hai lần trên một màn, và trả giá bằng một đầu khối cao hơn, là lỗ kép. Đây chính là **The Silent H1 Rule** áp xuống một cấp.

Kèm theo một điều kiện, vì đây là chỗ cách làm rẻ tiền sẽ làm mất dữ liệu: con số nào chỉ có trong dòng phụ mà không có trong bảng thì phải chuyển đi đâu đó, không được bỏ. Ở Lô dữ liệu, `{thieu.length} đơn vị chưa gửi` đã chuyển vào dải cảnh báo sẵn có trong thân khối, nay đọc là "{loi.length} file cần xem lại, trong đó {thieu.length} đơn vị chưa gửi". Bỏ dòng phụ là bỏ một chỗ đặt chữ, không phải bỏ một dữ kiện.

**The Shared Head Row Rule.** Đầu hai khối trong dải phải nằm trên **cùng một hàng lưới**, không phải cùng một con số đoán trước. Một đầu mang ô tìm kiếm, đầu kia mang dòng phụ — hai nội dung đó không bao giờ cao bằng nhau, nên chiều cao cứng luôn để lại một bên lệch, và thân hai khối bắt đầu ở hai độ cao khác nhau đúng chỗ mắt bắt lỗi đầu tiên khi so hai cột. Cách làm là subgrid: `.case-layout` nhận `grid-template-rows: auto minmax(0, 1fr)`, hai cột và hai khối đều thành subgrid kéo dài hai hàng. Khối `@supports (grid-template-rows: subgrid)` được gác thêm bằng `:has(> .case-list > .panel:only-child):has(> .case-detail > .panel:only-child)` — luật chỉ đúng khi mỗi cột có đúng một khối. Trình duyệt không hỗ trợ subgrid rơi về sàn `min-height: 66px` vẫn còn trong mã: hai cột vẫn bằng nhau, chỉ riêng đầu khối là có thể lệch. Sàn 66px đó là lưới an toàn, không phải cách làm; đừng chỉnh nó để "nắn" cho cân.

### Inputs / Fields
- **Style:** cao 32px, viền 1px `--control-line`, bo 6px, nền trắng, đệm ngang 9px. `<select>` rộng tối thiểu 150px với đệm phải 28px chừa chỗ cho mũi tên.
- **Hover:** viền đậm lên `--control-line-hover`.
- **Focus:** vòng mực 2px offset 2px. Ô tìm kiếm là vỏ bọc chứa icon và `<input>` không viền; vỏ bắt `:focus-within`, tự bỏ viền của mình và vẽ vòng focus quanh cả cụm — vòng focus phải bao quanh thứ người dùng thấy là một ô, không bao quanh phần tử bên trong nó.
- **Disabled:** nền giấy mềm, viền `--line`, chữ `--ink-2`, `opacity: 1` — ô khóa vẫn phải đọc được.
- **Nhãn** 12px/650 màu `--ink-2`, đặt trên ô, cách 6px; nhãn phụ trong hàng bộ lọc là 11px/600 màu `--ink-3`.
- **Placeholder** màu `--ink-3` với `opacity: 1`, vì mặc định của trình duyệt làm nó tụt dưới ngưỡng đọc.

### Navigation
- **Sidebar** rộng 252px, nền sơn mài, cuộn dọc riêng, đệm `20px 14px 14px`. Chữ làm điều hướng: mục **không có icon**, chỉ có nhãn 14px. Ba nhóm ("Điều hành" / "Nghiệp vụ" / "Dữ liệu") ngăn nhau bằng `margin-top: 24px` và một vạch `#ffffff2b`; nhãn nhóm là bậc `nav-group`, `aria-hidden` vì `role="group"` đã mang tên. Nhóm là tiêu đề cấu trúc, các mục bên dưới mới là đích điều hướng.
- **Mục nghỉ:** chữ `--on-chrome-1` cân nặng 400, nền trong suốt, cao 38px.
- **Hover:** nền `#ffffff14`, chữ trắng, trượt phải 3px — chỉ khi có chuột thật và không yêu cầu giảm chuyển động.
- **Đang mở:** một tín hiệu đặc và duy nhất — mục lật thành **thanh trắng** (`background: var(--surface)`, viền cùng màu), chữ `--brand-strong` cân nặng 600, bóng nhẹ. Vạch vàng bên trái đã bị tắt bằng `::before { content: none }`. Stylesheet còn một quy tắc tô vàng cho `svg` bên trong mục đang mở, nhưng mục điều hướng hiện không dựng icon nào, nên quy tắc đó không bắt được phần tử nào — trạng thái thật là trắng-trên-sơn-mài, không có điểm vàng.
- **Mobile:** dưới 900px sidebar ẩn, thay bằng thanh đáy tối đa sáu ô (icon 20px trên nhãn 10px; ô đang mở nhận chữ `--brand` và vạch trên 2px `--brand`) và một drawer sơn mài `min(84vw, 320px)` dùng lại đúng nội dung sidebar, có scrim, bẫy Tab, `Escape` để đóng, `inert` cắt nhánh nền khỏi cây trợ năng, và focus trả về nút đã mở nó.
- **Skip-link** ẩn phía trên khung nhìn, bật ra khi nhận focus: nền sơn mài, chữ trắng, cao 44px, góc trên trái.

### Notice
Dải thông báo trong khối: cao tối thiểu 44px, bo 6px, không viền, nền là bậc nhạt của màu trạng thái (`warning` / `critical` / `info` / `positive`). Nhãn in đậm 650 mang màu trạng thái; phần giải thích chuyển về màu mực `--ink-2` để đọc được, không nhuộm theo tông.

**The Notice Wraps Rule.** Nhãn và phần giải thích nằm cùng hàng khi còn chỗ và **xuống dòng** khi hết chỗ: `flex-wrap: wrap`, nhãn `flex: 0 1 auto` (co được), phần giải thích `flex: 1 1 22ch`. Trước đây nhãn để `flex: none` nên trong cột hẹp của ngăn chi tiết nó giữ nguyên bề ngang còn phần giải thích bị ép xuống vài chục pixel — mỗi dòng một chữ. Đây là lỗi đã được báo trên bản dựng, không phải phòng xa.

### Detail Panel (DetailGrid)
Lưới `<dl>` bốn cột trên desktop, hai cột trong ngăn chi tiết và từ 720px xuống. Mỗi ô cao tối thiểu 56px, đệm `9px 16px`, ngăn nhau bằng `--line-soft` theo cả hai trục; nhãn là bậc `label` màu `--ink-3`, giá trị 14px/500 màu mực, dòng phụ 11px/400.

**The Single Left Edge Rule.** Mọi thứ trong ô căn về một mép trái duy nhất: `justify-items: start`, `text-align: left`, và `margin: 0` trên cả `dt` lẫn `dd`. Trình duyệt cho `<dd>` một thụt lề mặc định 40px, nên nếu không xóa thì giá trị bị đẩy sang phải trong khi nhãn ngay trên nó lại sát trái — hai mép trong một ô là lỗi đọc, không phải phong cách.

### Page Intro & Page Actions
`PageIntro` không dựng khung riêng: nó trả về `<h1 class="sr-only">` cộng dòng dẫn `.page-lead` (13px/400, `max-width: 72ch`, màu `--ink-2`), rồi gửi cụm thao tác đi nơi khác.

**The Action Lives in the Masthead Rule.** Từ 901px trở lên, thao tác cấp trang nằm trong măng sét, không nằm trong nội dung. Khi tiêu đề màn đã ẩn, một nút đứng một mình ở đầu nội dung chiếm trọn một hàng để nói một việc — trong khi măng sét đang thừa bề ngang. Nút được bắn vào ô cắm `#page-actions-slot` bằng portal, nên nó vẫn thuộc về màn đang mở về mặt dữ liệu và vẫn nằm đúng thứ tự đọc của măng sét. Dưới 901px thì ngược lại: măng sét đã chật vì nút mở điều hướng, kỳ làm việc, phạm vi và chip mô phỏng, nên nút quay về nội dung và trải hết bề ngang. Đừng dựng lại một hàng tiêu đề chỉ để có chỗ đặt nút.

### Tables
Bảng rộng tối thiểu 780px, nằm trong vùng cuộn có trần `min(62vh, 560px)` — trần này được gỡ khi bảng nằm trong dải hai cột, vì ở đó dải đã lo chiều cao. Vùng cuộn mang `tabIndex={0}`, `role="region"` và `aria-label` — đã là điểm dừng Tab thì phải có tên, nếu không người dùng trình đọc màn hình gặp một loạt điểm dừng câm. Đầu cột sticky, nền giấy mềm, chữ `--ink-2` bậc `column-head`. Ô cao 38px (44px từ 720px), vạch dưới `--line-soft`, hàng cuối bỏ vạch. Hàng đang chọn nhận nền `--selected-surface` và chữ nặng 500. Chân bảng là một dải 12px màu `--ink-3` có vạch trên. Dưới 900px hiện dải nhắc "Vuốt ngang để xem thêm" nền giấy hồng, chữ `--brand`.

### Figure Line
**Dòng tổng hợp là một hàng, không phải bốn thẻ.** Bốn ô "số to, nhãn nhỏ, màu nhấn" xếp ngang là khuôn mẫu mở màn của mọi bản dựng máy sinh; ở đây bốn con số là đếm hàng đợi chứ không phải kết luận, nên chúng đọc như một dòng cộng đặt ngay dưới mô tả trang — vẫn đủ thông tin, không chiếm mất vị trí của việc cần làm. Dòng phụ được giữ lại vì nó mang dữ liệu thật; thứ bị bỏ là cái thẻ, không phải nội dung. Ô bấm được dựng bằng `<button>`, ô chỉ đọc bằng `<div>`, và chỉ ô bấm được mới có hover. Cùng khuôn hình với `KpiStrip`: bốn cột trên desktop, hai cột từ 720px, các ô ngăn nhau bằng `--line-soft` bên trong một khung chung.

### Toast
Nền sơn mài, chữ trắng, bo 10px, cố định góc phải dưới, rộng `min(420px, calc(100vw - 28px))`, bóng lớp phủ, icon xác nhận `--positive-on-chrome`, nút đóng 30px chỉ hiện nền khi hover. Trên mobile nó nhấc lên trên thanh điều hướng đáy bằng `bottom: calc(74px + env(safe-area-inset-bottom))`.

## Do's and Don'ts

### Do:
- **Do** giữ ba vai của đỏ tách bạch: `--seal` nhận diện, `--brand` hành động, `--critical` can thiệp.
- **Do** dùng mực `--focus` cho vòng focus, và chỉ đổi sang vàng `--focus-on-chrome` trên nền sơn mài. Quy tắc `:where(.sidebar, .mobile-drawer, .login-context) …:focus-visible` phải nằm **sau** quy tắc chung: `:where()` không cộng độ ưu tiên, đặt trước thì shorthand `outline` phía trên ghi đè lại màu.
- **Do** căn mọi thứ trong ô chi tiết về một mép trái, kể cả `<dd>`.
- **Do** để dải thông báo xuống dòng khi cột hẹp thay vì bóp chữ thành mỗi dòng một từ.
- **Do** giữ `<h1>` trong DOM ở dạng `sr-only` trên mỗi màn, đúng thứ tự tiêu đề.
- **Do** dùng chấm, nhãn hoặc icon kèm màu cho mọi tín hiệu trạng thái; màu không bao giờ là tín hiệu duy nhất.
- **Do** đặt sàn 44px cho mọi vùng chạm từ 900px trở xuống.
- **Do** đặt mọi animation sau `prefers-reduced-motion` và giữ công tắc cắt chung.
- **Do** dán nhãn "Mô phỏng" ở mọi màn có số liệu, kể cả màn nằm ngoài Shell.
- **Do** cho mỗi vùng cuộn nhận Tab một cái tên.
- **Do** khai báo cơ sở 0 (`minmax(0, 1fr)` hoặc `min-width: 0`) cho mọi rãnh lưới có thể chứa bảng.
- **Do** để dải hai cột quyết định chiều cao và cho phần dài hơn cuộn trong thân khối của nó.
- **Do** dùng subgrid khi hai khối cạnh nhau phải bắt đầu ở cùng một độ cao.
- **Do** đưa thao tác cấp trang lên măng sét từ 901px và trả nó về nội dung bên dưới ngưỡng đó.
- **Do** chuyển con số chỉ tồn tại trong dòng phụ sang một chỗ khác trong thân khối trước khi bỏ dòng phụ.

### Don't:
- **Don't** tô màu trạng thái vào con số. Màu sống ở nhãn, chip và dải thông báo.
- **Don't** thêm xám xanh lạnh vào trung tính; nó phá sự liền mạch với con dấu.
- **Don't** cho mục điều hướng đang mở một tín hiệu thứ hai. Thanh trắng trên nền sơn mài đã là tương phản mạnh nhất hệ này có.
- **Don't** nâng hoặc đổ bóng một khối chỉ để đọc khi rê chuột; hover chỉ thuộc về thứ bấm được.
- **Don't** dựng lại dòng tổng hợp thành bốn thẻ riêng có viền.
- **Don't** đưa tiêu đề trang hiện lại lên đầu nội dung; sidebar đã nói tên màn.
- **Don't** tự host hay tải webfont. Quyết định dùng stack hệ thống có ba căn cứ đã ghi; đừng mở lại nếu không có yêu cầu mới từ người dùng.
- **Don't** thêm bậc chữ mới hay bậc đường kẻ thứ ba để tạo phân cấp.
- **Don't** đổi vị trí điều hướng, bộ lọc hay nút mà người dùng đã quen tay.
- **Don't** đặt trần chiều cao riêng cho bảng hoặc cột chi tiết khi chúng đang nằm trong dải hai cột; hai trần chồng nhau làm bảng dừng sớm.
- **Don't** đem luật chặn chiều cao của dải xuống dưới 1361px, nơi dải đã xếp thành một cột.
- **Don't** nắn chiều cao đầu khối bằng một con số đoán trước; hàng lưới chung mới là cách làm.
- **Don't** dựng lại một hàng tiêu đề chỉ để có chỗ đặt nút hành động.
- **Don't** đặt dòng phụ lên khối chi tiết để nhắc lại các cột đã hiện trên hàng đang chọn.
- **Don't** để hệ trôi về dáng sản phẩm tiêu dùng: không gradient, không minh họa, không góc bo lớn, không màu bão hòa ngoài bảng đã đăng ký.
