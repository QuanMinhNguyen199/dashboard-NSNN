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
- Một bộ chữ duy nhất, Public Sans, tự host trong mã nguồn; chữ số dùng `tabular-nums` trên toàn thân trang.
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
- **Hồng chọn** (`--selected-surface`): hàng đang chọn trong bảng. Nền này giữ nguyên cả khi hover, vì "đang chọn" mạnh hơn "đang trỏ tới". `--selection-bg` là nền bôi chọn văn bản.
- **Đường kẻ** (`--line`) và **đường kẻ mờ** (`--line-soft`): hai bậc, không ba. `--line` cho ranh giới khối và vạch dưới đầu cột; `--line-soft` cho mọi vạch chia bên trong khối.
- **Mực** (`--ink`, `--ink-2`, `--ink-3`): ba bậc. Bậc mờ nhất đạt 5,75:1 trên trắng, 5,24:1 trên giấy và 5,19:1 trên nền ám đỏ — nó là bậc nhỏ nhất được phép, không có bậc thứ tư.
- **Viền điều khiển** (`--control-line`, hover `--control-line-hover`) và **viền mang trạng thái** (`--state-edge`, ≥3:1 với cả nền trắng lẫn đường kẻ kề nó, dùng cho vòng tròn bước và nút phân đoạn đang bật).

### Named Rules

**The Three Reds Rule.** Đỏ trong hệ này mang ba việc và ba việc đó không bao giờ được nhòe vào nhau: `--seal` chỉ nhận diện, `--brand` chỉ hành động, `--critical` chỉ can thiệp. Một màu không thể vừa là thương hiệu vừa là cảnh báo — nếu nút lưu và dòng báo lỗi cùng một sắc đỏ thì người dùng hết cách phân biệt "bấm được" với "có chuyện".

**The Ink Focus Rule.** Vòng focus là mực `--focus`, không phải đỏ. Đỏ đã mang hai nghĩa, nên một vòng đỏ quanh ô đang chọn sẽ đọc thành "ô này có vấn đề". Mực là màu duy nhất không mang nghĩa nào và nó đạt 15:1 trên mọi bề mặt sáng. Trên nền sơn mài vòng mực biến mất, nên ở đó — và chỉ ở đó — focus đổi sang vàng con dấu `--focus-on-chrome` (10,18:1).

**The Neutral Numeral Rule.** Chữ số giữ màu mực trung tính. Màu trạng thái nằm ở nhãn, ở chip và ở dải thông báo, không nằm trong con số. Một con số đỏ đọc ra "số này sai" chứ không đọc ra "số này lớn".

**The Warm Grey Rule.** Không đưa xám xanh lạnh vào trung tính; nó phá sự liền mạch với con dấu. Trung tính ám đỏ rất nhạt đọc ra "cùng một hệ". Ngoại lệ duy nhất đã đăng ký là `--info`.

## Typography

**Display / Body / Label Font:** `"Public Sans", system-ui, -apple-system, "Segoe UI", sans-serif` — biến thể, tự host tại `src/fonts/`, hai subset `vietnamese` và `latin`, tổng 33,7 kB cho toàn dải cân nặng 100–900.
**Mono Font:** `ui-monospace, SFMono-Regular, Consolas, monospace`, cho mã số thuế, tên file và mã tài khoản.

**Character:** Bản trước dùng stack hệ thống, và PRODUCT.md ghi ba căn cứ cho lựa chọn đó: bề mặt tác nghiệp được phục vụ tốt bằng font hệ thống; dấu tiếng Việt chồng tầng (ế, ự, ỡ) dựng ổn định trong Segoe UI trong khi nhiều webfont subset latin-ext dựng không đều; và hệ chạy trên mạng nội bộ nơi mỗi kilobyte tải thêm là chi phí thật. Public Sans được chọn vì nó **đáp ứng cả ba**, không phải vì bỏ qua chúng: nó có subset `vietnamese` riêng với dấu được vẽ thật thay vì ghép từ latin-ext; nó nằm trong mã nguồn và đi qua Vite nên không gọi ra mạng ngoài và không hỏng khi máy trạm không ra được internet; và vì là tệp biến thể, toàn dải 100–900 chỉ tốn 33,7 kB.

**Vì sao không phải bộ chữ khác — đã đo, không đoán.** Be Vietnam Pro dựng dấu đẹp nhất trong các ứng viên nhưng **không có `tnum`**: ở cỡ 14px bề rộng chữ số dao động từ 5,39px tới 9,95px. Với một sản phẩm đầy cột tiền và cột ngày thì đó là mất căn cột, không phải chuyện thẩm mỹ, và nó phá thẳng **The Tabular Number Rule** bên dưới. IBM Plex Sans và Source Sans 3 có `tnum` nhưng dựng dấu chồng tầng rời và cao ở cỡ tiêu đề. Public Sans có cả hai, và là biến thể nên bậc 650 và 550 trong bảng phân cấp vẫn dựng đúng thay vì bị nắn về 700 và 500.

Tính cách của chữ vẫn đến từ cân nặng và khoảng cách nhiều hơn từ hình dáng: trọng lượng 650 cho tiêu đề, `letter-spacing` âm nhẹ cho số và tiêu đề, `tabular-nums` bật trên toàn `body` để các cột số thẳng hàng.

**The Font Must Earn Its Bytes Rule.** Một bộ chữ chỉ được đưa vào khi nó vượt qua ba phép đo, và cả ba đều chạy được trong trình duyệt trước khi quyết định: có subset `vietnamese` riêng hay không; bề rộng mười chữ số dưới `font-variant-numeric: tabular-nums` có bằng nhau không; và tổng kilobyte của các subset thực dùng. Không bộ chữ nào được chọn bằng cảm nhận về "đẹp" mà bỏ qua ba phép đo này. Khi đo `tnum`, đặt `font-variant-numeric` **sau** shorthand `font:` — shorthand reset nó về `normal` và phép đo sẽ nói dối.

### Hierarchy
- **Display** (650, `clamp(24px, 2.2vw, 30px)`, 1.22, -0.022em): chỉ tên hệ trong khối nhận diện màn đăng nhập. Đây là chỗ duy nhất trong hệ có chữ lớn, và nó được phép lớn vì màn đăng nhập không phải màn làm việc.
- **Headline** (650, 20px, 1.25, -0.02em): tiêu đề hộp thoại tạo báo cáo, tiêu đề form đăng nhập, tiêu đề màn từ chối quyền.
- **Metric** (650, 18px, 1.25, -0.015em): con số trong dải tổng hợp và trong luồng trạng thái. Giữ nguyên 18px cả trên mobile — dải tổng hợp ở Trang công việc đổi khuôn hình (mỗi ô thành một hàng nhãn-số) chứ không hạ cỡ số, vì con số là thứ người dùng quét trước.
- **Title** (700, 14px, -0.008em): tiêu đề khối `.panel-head h2`. Đây là bậc tiêu đề thường gặp nhất; tiêu đề màn ẩn nên khối chính là đơn vị người dùng đọc. Nó ở **700** chứ không phải 650 vì tên hàng trong bảng cũng là 14px và cũng màu `--ink`: lệch 50 đơn vị cân nặng ở cùng một cỡ và cùng một màu là lệch không nhìn ra, và tiêu đề khối khi đó không hơn được chính nội dung nó quản.
- **Body** (400, 14px/1.5): chữ nền của `body`, nhãn điều hướng, giá trị trong ô chi tiết (nặng 500).
- **Body-strong** (600, 13px): nhãn nút, tên hàng, tên bước, chữ trong dải thông báo, mục danh sách kiểm.
- **Lead** (400, 13px/1.5, `max-width: 72ch`, màu `--ink-2`): dòng mô tả mở đầu mỗi màn (`.page-lead`). Đây là dòng chữ đầu tiên người dùng thấy trong nội dung, vì tiêu đề màn bị ẩn.
- **Label** (600, 12px): nhãn ô chi tiết, nhãn dải tổng hợp, chú thích phụ, dòng phụ của hàng. Dòng phụ quan trọng đã được nâng từ 11px lên 12px và nâng đó vẫn đứng trong bản dựng.
- **Column-head** (700, 11px, +0.02em): đầu cột bảng, sticky, nền giấy mềm, chữ `--ink-3`. Ở 11px giữa các ô 14px, cân nặng 650 đọc ra nhạt hơn ô dữ liệu bên dưới; 700 cộng một chút giãn chữ trả nó về đúng vai đầu cột.
- **Nav-group** (700, 10px, +0.1em, VIẾT HOA): nhãn nhóm điều hướng trong sidebar — bậc duy nhất viết hoa toàn bộ trong hệ, và nó được phép vì đó là tiêu đề cấu trúc, không phải đích bấm.

### Named Rules

**The Silent H1 Rule.** Tiêu đề trang không hiện. `PageIntro` vẫn dựng `<h1>` nhưng gắn `className="sr-only"`: tên màn đã nằm ở mục điều hướng đang mở trong sidebar, in lại nó ở đầu nội dung là nói hai lần và ăn mất dòng đắt nhất của trang. Thẻ vẫn nằm trong DOM vì một trang không có tiêu đề là một trang mà người dùng bàn phím không biết mình đang ở đâu. Không gỡ `<h1>`, và cũng không bỏ `sr-only` để "cho cân". Cùng nguyên tắc này áp xuống cấp khối — xem **The Row Already Said It Rule** ở mục Components.

**The One Leading Per Step Rule.** Mỗi cỡ chữ có ĐÚNG một giãn dòng, và cả hệ chỉ có ba giá trị: **1.25** cho chữ lớn một dòng (display, số trong dải tổng hợp), **1.35** cho nhãn nhỏ và chip, **1.5** cho mọi thứ có thể xuống dòng thành đoạn. Bản trước có tám giá trị — 1.22, 1.25, 1.3, 1.35, 1.4, 1.45, 1.5, 1.6 — và riêng cỡ 12px dùng tới bốn trong số đó. Mắt không đọc ra từng giá trị, nhưng đọc ra việc nhịp dọc không đều, và đó là thứ làm trang có cảm giác chưa được chỉnh.

**The Short Ramp Rule.** Cả hệ chạy trong khoảng 10–30px với chín bậc, và không thêm bậc nào nữa. Phân cấp do đường kẻ, khoảng trắng và cân nặng gánh; nâng cỡ chữ để tạo phân cấp là cách làm của sản phẩm tiêu dùng và nó phá mật độ mà bảng dài cần.

**The Tabular Number Rule.** `font-variant-numeric: tabular-nums` đặt một lần trên `body`, không rắc lẻ từng chỗ. Số tiền và số lượng đi qua `Intl.NumberFormat("vi-VN")`; cột số căn phải bằng lớp `.num`.

## Layout

Khung cố định, nội dung co giãn. Sidebar `position: fixed` rộng 252px; topbar `position: sticky` cao `--topbar-h 60px`, lùi trái 252px; mặt làm việc lùi trái 252px với đệm `18px 20px 32px`. Nội dung nằm trong `.page-stack`: `width: min(100%, 1540px)`, `grid-template-columns: minmax(0, 1fr)`, căn giữa, các khối cách nhau 18px. Trần 1540px giữ cho bảng không kéo dài vô tận trên màn rộng.

Măng sét mang cả hai bậc thao tác từ 901px trở lên. Topbar có một ô cắm rỗng `.topbar-actions` (`display: contents`, nên nút cắm vào trở thành con trực tiếp của hàng flex) đặt sau dải bối cảnh, rồi một cụm `.topbar-actions` thứ hai ngay sau nó mang hai nút cấp hệ thống và khép lại hàng; `PageIntro` bắn cụm `.page-actions` của nó vào đó bằng portal khi `(min-width: 901px)` khớp, và dựng tại chỗ khi không. Từ 900px xuống nút quay về trong luồng nội dung và trải hết bề ngang. `PageIntro` trả về một fragment — `<h1 class="sr-only">` cộng `.page-lead` — chứ không còn bọc trong một khối `.page-intro`; lớp đó không còn tồn tại.

Nhịp khoảng cách chạy theo bậc 4 / 8 / 10 / 12 / 14 / 16 / 18 / 20. Đệm trong khối là `0 14px 12px` (12px từ 720px xuống). Các dải toàn chiều rộng bên trong khối — bảng, danh sách việc, danh sách nguồn, bảng xếp hạng, lưới chi tiết — dùng `margin-inline: -14px` để chạm hẳn mép khối trong khi phần chữ vẫn thụt vào. Hàng bảng cao 38px, ô chi tiết và ô tổng hợp cao tối thiểu 56px, hàng việc 54px, đầu khối 54px.

Hai bố cục làm việc: `.workbench-grid` chia 1.1fr / 0.9fr, và `.case-layout` chia 7fr / 3fr với cột chi tiết `position: sticky` ở `calc(var(--topbar-h) + 18px)`, cao tối đa `calc(100dvh - var(--topbar-h) - 36px)` và tự cuộn. Màn đăng nhập là lưới hai cột `minmax(300px, 36%) / minmax(0, 1fr)`: cột trái sơn mài, cột phải trắng. 42% của bản trước là 670px sơn mài ở khổ 1600 cho một con dấu và hai dòng chữ — mảng màu lớn hơn thứ nó chứa; 36% giữ được vai trò làm khung mà không thành khoảng trống. Cụm form rộng `min(380px, 100%)` — hai ô nhập trải 560px đọc ra một biểu mẫu bị kéo giãn, vì ô dài gấp mấy lần nội dung nó chứa.

**Điểm ngắt.**
- **1361px trở lên** — dải hai cột tồn tại thật, và toàn bộ luật chiều cao của nó sống trong đúng khối media này: `.case-layout` nhận `align-items: stretch` và `max-height: calc(100dvh - var(--topbar-h) - 40px)`; cột chi tiết bỏ `position: sticky` cùng trần riêng của nó; hai cột và hai khối bên trong thành hộp dọc `min-height: 0`; thân khối nhận `flex: 1; overflow: auto`; và `.case-layout .table-wrap` bỏ trần `min(62vh, 560px)` để bảng lấp đầy dải thay vì dừng sớm rồi chừa khoảng trống.
- **1360px trở xuống** — cột chi tiết bên phải biến mất; chọn một hàng mở `<dialog>` trượt từ mép phải, rộng `min(100vw, 520px)`, cao toàn màn, nền giấy ấm. Không có luật chặn chiều cao nào áp ở đây, vì khi dải xếp thành một cột thì chặn chiều cao là bóp nghẹt chính bảng dữ liệu.
- **901px** — ranh giới của thao tác: trên nó nút nằm trong măng sét, dưới nó nút nằm trong nội dung. Áp cho cả thao tác cấp trang lẫn cấp hệ thống.
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
- **Nút hiện/ẩn mật khẩu** nằm chồng lên mép phải ô nhập, cao 34px, không viền không nền, chữ 12px/650 màu `--ink-2`. Nó **chỉ được dựng khi ô đã có ký tự** — trên ô rỗng nó là một đích bấm không làm gì. Ô nhập chỉ chừa `padding-right: 58px` khi nút có mặt, bằng `:has(button)`.

### Chips (Badge)
- **Mặc định là chữ có chấm, không phải viên thuốc:** nền trong suốt, không viền, không đệm, chữ 12px/600, và một chấm tròn 6px `currentColor` đứng trước qua `::before`. Bốn tông dùng dạng này: neutral (`--ink-2`), positive, warning, info. Chấm cộng chữ nghĩa là trạng thái không bao giờ chỉ được truyền bằng màu.
- **Hai ngoại lệ có nền:** tông `critical` và cờ "Mô phỏng" chuyển thành chip có nền nhạt, bo 4px, đệm `2px 7px` — đó là hai thứ phải nhìn thấy trước khi đọc. Chip mô phỏng bỏ chấm vì nó không phải một trạng thái trong chuỗi. Chip này chỉ còn dùng ở màn từ chối quyền, nơi không có khung bao quanh để nói đây là bản mô phỏng; măng sét không mang nó nữa.

### Cards / Containers (Panel)
- **Corner Style:** 10px, `overflow: hidden`.
- **Background:** trắng trên nền giấy ấm.
- **Border & Shadow:** có khung — viền 1px `--line` và bóng hai lớp rất nhẹ (xem Elevation & Depth). Stylesheet còn giữ một khai báo cũ hơn viết `border: 0` cho `.panel`, nhưng nó bị quy tắc muộn hơn ghi đè; trạng thái đang chạy là khối **có** viền và bóng.
- **Đầu khối:** cao tối thiểu 54px, đệm `13px 16px`, vạch dưới `--line`. Tiêu đề 14px/700, không kèm nhãn nguồn — xem **The Panel Is Not A Bibliography Rule** bên dưới. Dòng mô tả (`max-width: 72ch`, màu `--ink-3`) là tùy chọn và **không dùng ở khối chi tiết** — xem quy tắc dưới. Khi đầu khối có vùng thao tác, nó chuyển sang lưới (`display: grid`) để thao tác xuống dòng dưới tiêu đề thay vì bóp tiêu đề; đó là lý do đầu khối chi tiết ở Nợ và Lô dữ liệu cao hơn ở Hoàn thuế và Báo cáo, chứ không phải vì còn sót dòng phụ. Chiều cao đầu khối vì thế là kết quả của nội dung, không phải một con số đặt trước — đúng lý do hàng lưới chung phải là subgrid.
- **Internal Padding:** `0 14px 12px`, xuống `0 12px 12px` từ 720px.
- **Trong dải hai cột:** khối thành hộp dọc, thân nhận `flex: 1; min-height: 0; overflow: auto`, và hai đầu khối nằm trên cùng một hàng lưới (xem quy tắc dưới).

**The Row Already Said It Rule.** Đầu khối chi tiết chỉ định danh bản ghi bằng tên, còn mọi trường đã hiện trên hàng đang chọn thì ở lại trên hàng. Bốn khối chi tiết của dải (Nợ, Hoàn thuế, Báo cáo, Lô dữ liệu) đã bỏ hẳn dòng phụ vì nó lặp lại đúng các cột nằm cách đó vài trăm pixel về bên trái — mã số thuế che, đơn vị và cán bộ ở Nợ; ngày nhận và đơn vị ở Hoàn thuế; kỳ, đơn vị chủ trì và nguồn ở Báo cáo; mốc cập nhật ở Lô dữ liệu. Đọc cùng một trường hai lần trên một màn, và trả giá bằng một đầu khối cao hơn, là lỗ kép. Đây chính là **The Silent H1 Rule** áp xuống một cấp.

Kèm theo một điều kiện, vì đây là chỗ cách làm rẻ tiền sẽ làm mất dữ liệu: con số nào chỉ có trong dòng phụ mà không có trong bảng thì phải chuyển đi đâu đó, không được bỏ. Ở Lô dữ liệu, `{thieu.length} đơn vị chưa gửi` đã chuyển vào dải cảnh báo sẵn có trong thân khối, nay đọc là "{loi.length} file cần xem lại, trong đó {thieu.length} đơn vị chưa gửi". Bỏ dòng phụ là bỏ một chỗ đặt chữ, không phải bỏ một dữ kiện.

**The Table Sets The Strip Height Rule.** Trong dải hai cột, chiều cao do **bảng** quyết định, không do khối chi tiết. Hai cột trước đây cùng nằm trong một hàng lưới cao bằng cái cao hơn, nên một bản ghi nhiều thông tin kéo cả hai cột lên theo: ở Lô dữ liệu, chọn lô TTR có 8 file làm dải cao 900px trong khi bảng chỉ cần 473px — nửa dưới cột bảng thành khoảng trống, và chiều cao trang nhảy mỗi lần đổi hàng.

Cách làm là `contain: size` trên thân khối chi tiết. Nó khai chiều cao nội tại của thân bằng 0, nên thân không còn tham gia quyết định chiều cao hàng lưới; thân vẫn giãn hết hàng nhờ `stretch`, và phần dôi ra đi vào thanh cuộn của chính nó (`scrollbar-width: thin`, `scrollbar-gutter: stable` để nội dung không dịch khi thanh cuộn hiện). Đây là cách duy nhất giữ được subgrid canh đầu khối: đưa thân ra khỏi luồng bằng `position: absolute` thì khối không còn là mục lưới để subgrid bám vào.

Luật này chỉ chi phối THÂN khối. Đầu khối vẫn nằm chung một hàng lưới và vẫn cao theo nội dung cao hơn — xem quy tắc ngay dưới. Hệ quả còn lại: ở Báo cáo, bản ghi có nút đẩy trạng thái làm đầu khối cao từ 66px lên 96px, nên dải cao thêm 30px so với bản ghi không có nút. Đó là chiều cao của **thao tác**, không phải của dữ liệu tràn.

**The Shared Head Row Rule.** Đầu hai khối trong dải phải nằm trên **cùng một hàng lưới**, không phải cùng một con số đoán trước. Một đầu mang ô tìm kiếm, đầu kia mang dòng phụ — hai nội dung đó không bao giờ cao bằng nhau, nên chiều cao cứng luôn để lại một bên lệch, và thân hai khối bắt đầu ở hai độ cao khác nhau đúng chỗ mắt bắt lỗi đầu tiên khi so hai cột. Cách làm là subgrid: `.case-layout` nhận `grid-template-rows: auto minmax(0, 1fr)`, hai cột và hai khối đều thành subgrid kéo dài hai hàng. Khối `@supports (grid-template-rows: subgrid)` được gác thêm bằng `:has(> .case-list > .panel:only-child):has(> .case-detail > .panel:only-child)` — luật chỉ đúng khi mỗi cột có đúng một khối. Trình duyệt không hỗ trợ subgrid rơi về sàn `min-height: 66px` vẫn còn trong mã: hai cột vẫn bằng nhau, chỉ riêng đầu khối là có thể lệch. Sàn 66px đó là lưới an toàn, không phải cách làm; đừng chỉnh nó để "nắn" cho cân.

### Inputs / Fields
- **Style:** cao 32px, viền 1px `--control-line`, bo 6px, nền trắng, đệm ngang 9px. `<select>` rộng tối thiểu 150px với đệm phải 28px chừa chỗ cho mũi tên.
- **Hover:** viền đậm lên `--control-line-hover`.
- **Focus:** vòng mực 2px offset 2px. Ô tìm kiếm là vỏ bọc chứa icon và `<input>` không viền; vỏ bắt `:focus-within`, tự bỏ viền của mình và vẽ vòng focus quanh cả cụm — vòng focus phải bao quanh thứ người dùng thấy là một ô, không bao quanh phần tử bên trong nó.
- **Disabled:** nền giấy mềm, viền `--line`, chữ `--ink-2`, `opacity: 1` — ô khóa vẫn phải đọc được.
- **Nhãn** 12px/650 màu `--ink-2`, đặt trên ô, cách 6px; nhãn phụ trong hàng bộ lọc là 11px/600 màu `--ink-3`.
- **Placeholder** màu `--ink-3` với `opacity: 1`, vì mặc định của trình duyệt làm nó tụt dưới ngưỡng đọc.

### Login
**The Two Columns Do Two Jobs Rule.** Cột trái là NHẬN DIỆN, cột phải là NỘI DUNG, và không cột nào lấn sang việc của cột kia. Bản trước đặt "Đăng nhập theo vai trò nghiệp vụ" bên trái rồi "Đăng nhập" bên phải — cùng một câu nói hai lần, cách nhau nửa màn hình, và người đọc phải tự đoán câu nào mới là tiêu đề thật. Cột nhận diện không được mang chữ nào của luồng đăng nhập: không tiêu đề, không nút, không đường dẫn.

Cột trái vì thế chỉ có một khối duy nhất đặt giữa chiều cao (`margin: auto 0` trong cột flex): con dấu 112px, tên hệ bậc `Display` có `text-wrap: balance` và `max-width: 14ch`, một vạch `56×2px` màu `--gold`, rồi tên cơ quan 14px. Vạch vàng là lần dùng sắc vàng con dấu duy nhất trên màn này. Ghi chú dữ liệu mô phỏng ghim đáy sau một vạch `#ffffff1f`.

Cột phải mang toàn bộ phần đọc và làm: `<h1>Đăng nhập</h1>` — thẻ h1 duy nhất của trang — dòng phụ, hai ô nhập, nút gửi, rồi lối đăng nhập một lần.

**Lối phụ đứng sau một vạch "hoặc".** Vạch đó là lưới ba rãnh `1fr auto 1fr` với hai đường kẻ là `::before`/`::after`, nên chữ luôn nằm đúng giữa dù nhãn dài bao nhiêu — không phải một đường kẻ bị chữ đè lên. Nút Keycloak bên dưới **dùng lại đúng thành phần `button is-secondary`** của hệ, chỉ thêm `width: 100%` và `min-height: 44px` để đứng ngang hàng với nút gửi. Vẽ riêng một diện mạo cho nó là tạo bậc nút thứ tư chỉ tồn tại ở một màn.

**Nút tượng trưng phải tự khai là tượng trưng.** Keycloak là hướng đã chọn cho xác thực tập trung nhưng chưa nối trong bản này. Bấm vào nút mở một dòng ghi chú nói thẳng điều đó; nó không giả vờ chuyển hướng rồi quay về. Một nút trông như chạy được mà không chạy là thứ khiến người xem tin nhầm rằng hệ đã có SSO, và đó là hiểu nhầm đắt nhất mà màn này có thể gây ra.

Từ 720px xuống, dải nhận diện co thành một hàng ngang cao tự nhiên — con dấu 46px bên trái, tên hệ và tên cơ quan xếp dọc bên phải — và thành đầu trang thay vì một nửa bố cục. Ghi chú mô phỏng vẫn hiện ở khổ này.

**The Login Is Not A Control Panel Rule.** Màn đăng nhập không mang bảng chọn tài khoản mẫu. Một danh sách in sẵn tên đăng nhập và mật khẩu chung ngay cạnh ô nhập là bộ phận của bản trình diễn chứ không phải của sản phẩm: nó làm màn đầu tiên người xem nhìn thấy tự khai mình là đồ giả, và mọi nhận xét về sau đều bị đặt trong khung đó. Hệ quả phải chịu và không được lách: **ô nhập bắt đầu rỗng**. Điền sẵn một tài khoản cũng là tự khai là demo, chỉ kín đáo hơn. Tài khoản demo vẫn nằm trong `demoAuth`; chỉ lối vào nhanh bị gỡ.

### Navigation
- **Sidebar** rộng 252px, nền sơn mài, cuộn dọc riêng, đệm `20px 14px 14px`. Chín màn chia ba nhóm; nhóm "Dữ liệu" mở đầu bằng **Lượt chạy dữ liệu** rồi tới các màn ghi dữ liệu đã về. Chữ làm điều hướng: mục **không có icon**, chỉ có nhãn 14px. Ba nhóm ("Điều hành" / "Nghiệp vụ" / "Dữ liệu") ngăn nhau bằng `margin-top: 24px` và một vạch `#ffffff2b`; nhãn nhóm là bậc `nav-group`, `aria-hidden` vì `role="group"` đã mang tên. Nhóm là tiêu đề cấu trúc, các mục bên dưới mới là đích điều hướng.
- **Mục nghỉ:** chữ `--on-chrome-1` cân nặng 400, nền trong suốt, cao 38px. Khai báo `font-weight: 550` cũ đã bị gỡ: nó bị một quy tắc sau đè mất nên chưa bao giờ có hiệu lực, và 550 cạnh 600 của mục đang mở là bậc không ai nhìn ra.
- **Hover:** nền `#ffffff14`, chữ trắng, trượt phải 3px — chỉ khi có chuột thật và không yêu cầu giảm chuyển động.
- **Đang mở:** một tín hiệu đặc và duy nhất — mục lật thành **thanh trắng** (`background: var(--surface)`, viền cùng màu), chữ `--brand-strong` cân nặng 600, bóng nhẹ. Vạch vàng bên trái đã bị tắt bằng `::before { content: none }`. Stylesheet còn một quy tắc tô vàng cho `svg` bên trong mục đang mở, nhưng mục điều hướng hiện không dựng icon nào, nên quy tắc đó không bắt được phần tử nào — trạng thái thật là trắng-trên-sơn-mài, không có điểm vàng.
- **Mobile:** dưới 900px sidebar ẩn, thay bằng thanh đáy tối đa sáu ô (icon 20px trên nhãn 10px; ô đang mở nhận chữ `--brand` và vạch trên 2px `--brand`) và một drawer sơn mài `min(84vw, 320px)` dùng lại đúng nội dung sidebar, có scrim, bẫy Tab, `Escape` để đóng, `inert` cắt nhánh nền khỏi cây trợ năng, và focus trả về nút đã mở nó.
- **Skip-link** ẩn phía trên khung nhìn, bật ra khi nhận focus: nền sơn mài, chữ trắng, cao 44px, góc trên trái.

**The Panel Is Not A Bibliography Rule.** Khối không mang nhãn "Nguồn: …". Prop `source` của `Panel` và lớp `.panel-source` đã bị gỡ khỏi cả chín màn. Lý do: nhãn đó chiếm một dòng ở mọi khối để nói một thứ người dùng không hành động được, và khi nối dữ liệu thật nó in ra nguyên tên tệp — `BAO_CAO_DANH_GIA_CONG_TAC_NO_DN_TO_CHUC_20260730 - Có chú thích.xlsx` — dài gấp đôi bề ngang cột, kèm cả lỗi bảng mã của chính tên tệp. Nguồn dữ liệu thuộc về tài liệu, không thuộc về chân từng khối. Tên tệp chỉ còn hiện ở nơi nó LÀ dữ liệu: danh sách file trong một lô.

**The Screen Needs A Requirement Rule.** Mỗi màn phải truy được về một epic trong BRD. Màn "Cách lấy dữ liệu" từng tồn tại để ghi cách mỗi phòng lấy dữ liệu, mẫu báo cáo và tần suất — nhưng câu đó chỉ nằm ở dòng *Mục đích* của biên bản khảo sát 24/9, tức mục tiêu của một **buổi làm việc**, không phải một yêu cầu sản phẩm. Đầu ra của buổi khảo sát là chính bản BRD. Sáu epic trong BRD không epic nào cần màn đó; thứ gần nhất, FT-05.2 "ghi rõ nguồn – tham số – thời điểm", đã là màn Lượt chạy dữ liệu. Màn bị gỡ. Một yêu cầu trong biên bản họp không tự nó thành một tab.

**The Page Carries Data, Not Commentary Rule.** Dải `.notice` chỉ được dùng cho trạng thái của **bản ghi đang chọn** bên trong khối chi tiết. Không đặt dải thông báo ở cấp trang. Năm màn từng mở đầu bằng một dải cảnh báo chung — "Ngưỡng chưa có văn bản căn cứ", "Hệ số K chỉ để tham khảo", "Kéo tự động chưa được phép cho mọi nguồn" — và cả năm đều nói điều đúng nhưng không đổi theo dữ liệu, nên sau lần đọc thứ hai chúng thành một dải màu người dùng lướt qua, đồng thời đẩy bảng xuống dưới nếp gấp. Điều kiện và giới hạn thuộc về tài liệu; màn hình mang dữ liệu.

### Notice
Dải thông báo trong khối: cao tối thiểu 44px, bo 6px, không viền, nền là bậc nhạt của màu trạng thái (`warning` / `critical` / `info` / `positive`). Nhãn in đậm 650 mang màu trạng thái; phần giải thích chuyển về màu mực `--ink-2` để đọc được, không nhuộm theo tông.

**The Notice Wraps Rule.** Nhãn và phần giải thích nằm cùng hàng khi còn chỗ và **xuống dòng** khi hết chỗ: `flex-wrap: wrap`, nhãn `flex: 0 1 auto` (co được), phần giải thích `flex: 1 1 22ch`. Trước đây nhãn để `flex: none` nên trong cột hẹp của ngăn chi tiết nó giữ nguyên bề ngang còn phần giải thích bị ép xuống vài chục pixel — mỗi dòng một chữ. Đây là lỗi đã được báo trên bản dựng, không phải phòng xa.

### Detail Panel (DetailGrid)
Lưới `<dl>` bốn cột trên desktop, hai cột trong ngăn chi tiết và từ 720px xuống. Mỗi ô cao tối thiểu 56px, đệm `9px 16px`, ngăn nhau bằng `--line-soft` theo cả hai trục; nhãn là bậc `label` màu `--ink-3`, giá trị 14px/500 màu mực, dòng phụ 11px/400.

**The Single Left Edge Rule.** Mọi thứ trong ô căn về một mép trái duy nhất: `justify-items: start`, `text-align: left`, và `margin: 0` trên cả `dt` lẫn `dd`. Trình duyệt cho `<dd>` một thụt lề mặc định 40px, nên nếu không xóa thì giá trị bị đẩy sang phải trong khi nhãn ngay trên nó lại sát trái — hai mép trong một ô là lỗi đọc, không phải phong cách.

### Page Intro & Page Actions
`PageIntro` không dựng khung riêng: nó trả về `<h1 class="sr-only">` cộng dòng dẫn `.page-lead` (13px/400, `max-width: 72ch`, màu `--ink-2`), rồi gửi cụm thao tác đi nơi khác.

**The Action Lives in the Masthead Rule.** Từ 901px trở lên, thao tác cấp trang nằm trong măng sét, không nằm trong nội dung. Khi tiêu đề màn đã ẩn, một nút đứng một mình ở đầu nội dung chiếm trọn một hàng để nói một việc — trong khi măng sét đang thừa bề ngang. Nút được bắn vào ô cắm `#page-actions-slot` bằng portal, nên nó vẫn thuộc về màn đang mở về mặt dữ liệu và vẫn nằm đúng thứ tự đọc của măng sét. Dưới 901px thì ngược lại: măng sét đã chật vì nút mở điều hướng, kỳ làm việc và phạm vi, nên nút quay về nội dung và trải hết bề ngang. Đừng dựng lại một hàng tiêu đề chỉ để có chỗ đặt nút.

**The One Name Per Job Rule.** Một việc có MỘT nút và MỘT nhãn, đứng cố định một chỗ. Ba màn nghiệp vụ từng tự dựng nút tạo báo cáo riêng — "Tạo báo cáo tuần" ở Nợ, "Tạo báo cáo tháng 9" ở Kiểm tra, "Tạo báo cáo kỳ này" ở Hoàn thuế — ba nhãn cho cùng một hành động, và kỳ báo cáo bị đóng cứng vào nhãn nút trong khi kỳ là thứ hộp thoại hỏi. Người dùng không học được "nút này ở đâu" vì câu trả lời đổi theo màn. Nay chỉ còn `Tạo báo cáo`, không kèm kỳ.

**Hai bậc thao tác, hai chỗ đứng.** Măng sét mang hai cụm khác nhau và không trộn:

| Bậc | Thuộc về | Chỗ đứng | Ví dụ |
|---|---|---|---|
| Cấp trang | Màn đang mở | `#page-actions-slot`, bắn vào bằng portal | ô tìm kiếm, bộ lọc kỳ |
| Cấp hệ thống | Cả hệ, có mặt trên mọi màn | `.topbar-actions` thứ hai, dựng thẳng trong `Shell` | `Nhập dữ liệu`, `Tạo báo cáo` |

Thao tác cấp hệ thống không đi qua portal: nó không thuộc màn nào nên không có màn nào để bắn đi. Dưới 901px cả hai bậc đều rơi về nội dung; cụm cấp hệ thống thành `.system-actions`, hai nút chia đôi bề ngang bằng `flex: 1 1 0` để không nút nào trông như phụ của nút kia, và nằm TRÊN dòng dẫn vì nó thuộc về khung chứ không thuộc về trang.

**Hệ quả với trạng thái.** Nút cấp hệ thống bấm được cả khi đang mở chính màn đích, nên yêu cầu mở hộp thoại không được đi qua tham số đường dẫn hay hiệu ứng "chạy khi mount": ở đó không có lần dựng mới nào để bám vào, và lần bấm thứ hai sẽ im lặng không mở. `App` giữ một cờ, màn đích trả cờ lại ngay sau khi dùng.

**The One Door For Files Rule.** Mọi tệp vào hệ đi qua MỘT cửa. Chỗ phân loại tệp nằm bên trong hộp thoại, sau khi bấm, chứ không nằm ở việc chọn đúng nút trước khi bấm — người đang hỏi "nộp cái này ở đâu" là người chưa phân loại được. Hộp thoại `Nhập dữ liệu` hỏi loại trước (phiếu khai cách lấy dữ liệu / file dữ liệu mẫu từ nguồn) rồi lọc `accept` theo loại đã chọn. Màn Lô dữ liệu vì thế không còn nút nhập riêng.

**Ô chọn tệp gốc luôn bị ẩn.** `input[type=file]` in nhãn theo ngôn ngữ trình duyệt ("Choose Files / No file chosen") và không đổi được bằng CSS. Trên một sản phẩm toàn tiếng Việt đó là hai chữ lạc giữa màn. Ô gốc nhận `.sr-only`, `tabIndex={-1}` và `aria-hidden`; control thật là nút `Chọn tệp` bên cạnh, còn tên tệp đã chọn do ta tự in ra.

### Tables
Bảng rộng tối thiểu 780px, nằm trong vùng cuộn có trần `min(62vh, 560px)` — trần này được gỡ khi bảng nằm trong dải hai cột, vì ở đó dải đã lo chiều cao. Vùng cuộn mang `tabIndex={0}`, `role="region"` và `aria-label` — đã là điểm dừng Tab thì phải có tên, nếu không người dùng trình đọc màn hình gặp một loạt điểm dừng câm. Đầu cột sticky, nền giấy mềm, chữ `--ink-2` bậc `column-head`. Ô cao 38px (44px từ 720px), vạch dưới `--line-soft`, hàng cuối bỏ vạch. Hàng đang chọn nhận nền `--selected-surface` và chữ nặng 500. Chân bảng là một dải 12px màu `--ink-3` có vạch trên. Dưới 900px hiện dải nhắc "Vuốt ngang để xem thêm" nền giấy hồng, chữ `--brand`.

**The Row Height Comes From Line Count Rule.** Chiều cao hàng phải đều, và cách giữ nó đều là chặn số DÒNG của mỗi ô — không phải đặt một chiều cao cứng cho hàng, vì chiều cao cứng thì hoặc cắt chữ hoặc chừa chỗ trống.

Khuôn hai dòng `<strong>` + `<small>` mà Nợ (tên + MST), Lô dữ liệu (nguồn + kỳ) và Lượt chạy dùng chính là cơ chế này: MỌI hàng đều hai dòng, nên một tên dài xuống dòng thứ hai cũng không làm hàng cao thêm. Hệ quả: **dòng phụ không bao giờ được dựng có điều kiện**. Bảng báo cáo từng đặt cảnh báo chất lượng làm dòng phụ của tên báo cáo, và vì chỉ ba trên sáu hàng có cảnh báo nên ba hàng cao hơn ba hàng kia — mắt phải căn lại ở mỗi hàng. Cảnh báo chuyển sang cột riêng bên phải, nơi hàng nào cũng có một ô.

Cạm bẫy thứ hai ở cùng chỗ: một dòng phụ **tự xuống dòng** cũng phá nhịp y hệt. Khi cột bị bóp, `TMS 9.4.16.1 – 2.2.7` tách làm hai dòng và ô thành ba dòng, cao hơn phần còn lại 16px. Cột mang dòng phụ vì thế được cấp `min-width` đủ cho chuỗi dài nhất nằm trên một dòng, và phần bị bóp dồn sang cột tên — nơi xuống dòng vô hại vì hàng vốn đã hai dòng.

Cột chứa văn xuôi dài ngắn khác nhau (mô tả, ghi chú tự do) không theo được luật này mà không cắt chữ. Với chúng, hoặc chấp nhận hàng lệch, hoặc để văn xuôi ở khối chi tiết và giữ trong bảng một nhãn ngắn — nhưng không bao giờ cắt bằng `line-clamp`.

**The Real Data Never Enters The Build Rule.** Bộ dữ liệu thật nằm ở `public/du-lieu-that/`, do `scripts/nap-du-lieu-that.py` sinh ra từ `general_data/`, và **cả hai thư mục đều nằm trong `.gitignore`**. App nạp bằng `fetch` lúc chạy; không có tệp thì mọi hàm nạp trả `null` và màn hình rơi về bộ mô phỏng. Không nhúng dữ liệu thật vào `src/data/`: ở đó nó đi theo mọi bản build và lên remote ngay lần push đầu tiên — bộ này có khoảng 21 nghìn dòng người nộp thuế kèm mã số thuế và tên doanh nghiệp thật.

Hệ quả cho giao diện: mỗi màn đọc được cả hai bộ phải rẽ nhánh ở chỗ **đọc dữ liệu**, không rẽ ở chỗ **dựng giao diện**. Màn Nợ quy cả hai bộ về một khuôn `HangNo` rồi dựng một lần; rẽ ở chỗ dựng thì một màn thành hai màn phải nuôi song song.

**Tên thật dài hơn tên mô phỏng.** Bộ mô phỏng được viết vừa khít cột; bộ thật thì không. Tên đơn vị dài tới 40 ký tự ("Phòng Quản lý, Hỗ trợ doanh nghiệp số 1") nuốt mất bề ngang của cột tên doanh nghiệp và đẩy tên xuống ba dòng. Cách xử lý là **rút gọn khi hiển thị** trong bảng và giữ tên đầy đủ ở khối chi tiết, cộng với tách mã số thuế ra cột riêng để ô tên chỉ còn mang một thứ. Không dùng `line-clamp`. Sau khi làm, ở 1920 và 1600 khoảng 95% hàng cao bằng nhau; từ 1440 xuống thì tên doanh nghiệp dài ngắn khác nhau vẫn làm hàng lệch, và đó là giới hạn đã ghi ở **The Row Height Comes From Line Count Rule**.

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
- **Do** đặt thao tác cấp hệ thống ở một chỗ cố định với một nhãn duy nhất, không gắn kỳ hay phạm vi vào nhãn nút.
- **Do** ẩn `input[type=file]` gốc và dựng nút tiếng Việt thay nó.
- **Do** đo bộ chữ trong trình duyệt trước khi chọn; "trông đẹp" không thay được phép đo.
- **Do** chuyển con số chỉ tồn tại trong dòng phụ sang một chỗ khác trong thân khối trước khi bỏ dòng phụ.

### Don't:
- **Don't** tô màu trạng thái vào con số. Màu sống ở nhãn, chip và dải thông báo.
- **Don't** thêm xám xanh lạnh vào trung tính; nó phá sự liền mạch với con dấu.
- **Don't** cho mục điều hướng đang mở một tín hiệu thứ hai. Thanh trắng trên nền sơn mài đã là tương phản mạnh nhất hệ này có.
- **Don't** nâng hoặc đổ bóng một khối chỉ để đọc khi rê chuột; hover chỉ thuộc về thứ bấm được.
- **Don't** dựng lại dòng tổng hợp thành bốn thẻ riêng có viền.
- **Don't** đưa tiêu đề trang hiện lại lên đầu nội dung; sidebar đã nói tên màn.
- **Don't** gọi bộ chữ từ CDN ngoài. Hệ chạy mạng nội bộ; woff2 nằm trong `src/fonts/` và đi qua Vite.
- **Don't** đổi bộ chữ mà không chạy ba phép đo: subset `vietnamese` riêng, `tnum` đều bề rộng, và tổng kilobyte.
- **Don't** thêm bậc chữ mới hay bậc đường kẻ thứ ba để tạo phân cấp.
- **Don't** đặt giãn dòng thứ tư; ba bậc 1.25 / 1.35 / 1.5 là đủ, và mỗi cỡ chữ chỉ dùng một bậc.
- **Don't** phân biệt hai vai bằng 50 đơn vị cân nặng ở cùng cỡ và cùng màu; đó là lệch không nhìn ra.
- **Don't** đổi vị trí điều hướng, bộ lọc hay nút mà người dùng đã quen tay.
- **Don't** đặt trần chiều cao riêng cho bảng hoặc cột chi tiết khi chúng đang nằm trong dải hai cột; hai trần chồng nhau làm bảng dừng sớm.
- **Don't** để khối chi tiết quyết định chiều cao dải; bảng là chuẩn, phần dôi của khối chi tiết đi vào thanh cuộn của nó.
- **Don't** đem luật chặn chiều cao của dải xuống dưới 1361px, nơi dải đã xếp thành một cột.
- **Don't** nắn chiều cao đầu khối bằng một con số đoán trước; hàng lưới chung mới là cách làm.
- **Don't** dựng lại một hàng tiêu đề chỉ để có chỗ đặt nút hành động.
- **Don't** đặt kỳ, phạm vi hay chu kỳ vào nhãn nút. Nhãn nói HÀNH ĐỘNG; kỳ là thứ hộp thoại hỏi.
- **Don't** cho cùng một việc hai nút ở hai màn với hai nhãn khác nhau.
- **Don't** dựng thêm một nút nhập tệp thứ hai ở một màn riêng; phân loại tệp nằm trong hộp thoại, không nằm ở việc chọn đúng nút.
- **Don't** để lộ nhãn gốc của `input[type=file]`.
- **Don't** đặt bảng chọn tài khoản mẫu, mật khẩu in sẵn hay ô nhập điền sẵn lên màn đăng nhập.
- **Don't** dựng nút hiện mật khẩu trên một ô còn rỗng.
- **Don't** để cột nhận diện của màn đăng nhập mang tiêu đề, nút hay bất cứ chữ nào của luồng đăng nhập.
- **Don't** vẽ diện mạo riêng cho một nút chỉ vì nó nằm ở màn đăng nhập; dùng lại bậc nút đã có.
- **Don't** dựng một nút tượng trưng mà không nói nó chưa chạy.
- **Don't** đặt dòng phụ lên khối chi tiết để nhắc lại các cột đã hiện trên hàng đang chọn.
- **Don't** gắn nhãn "Nguồn: …" vào chân khối.
- **Don't** mở đầu một màn bằng dải thông báo chung không đổi theo dữ liệu.
- **Don't** dựng dòng phụ của ô bảng có điều kiện; hàng có và hàng không sẽ cao khác nhau.
- **Don't** nắn chiều cao hàng bằng một con số cứng hay bằng `line-clamp`; chặn số dòng của ô mới là cách làm.
- **Don't** nhúng dữ liệu thật vào `src/`; nó đi theo mọi bản build và lên remote.
- **Don't** rẽ nhánh mô phỏng / dữ liệu thật ở chỗ dựng giao diện; quy hai bộ về một khuôn hàng rồi dựng một lần.
- **Don't** để hệ trôi về dáng sản phẩm tiêu dùng: không gradient, không minh họa, không góc bo lớn, không màu bão hòa ngoài bảng đã đăng ký.
