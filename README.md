# dashboard-NSNN

Prototype dashboard **Thu ngân sách nhà nước — Thành phố Hà Nội**: năm workspace phân tích,
URL state đầy đủ, lớp provider API/MCP/Mock có runtime validation, và dữ liệu mô phỏng tất
định dựng từ một kho quan sát gốc duy nhất.

> **Dữ liệu trong ứng dụng là mô phỏng, không phải số liệu quyết toán.** Giao diện *không*
> hiển thị cảnh báo này — bản dựng là thiết kế bàn giao cho đội frontend, nhãn cảnh báo đã
> được gỡ để không bị chép vào sản phẩm thật. Vì vậy bản chạy thử chỉ dùng để duyệt thiết kế.
> Lý do đầy đủ: [`BA-NSNN.md`](tai-lieu-luu-tru/nsnn/BA-NSNN.md) mục 13.1.

Bản chạy thử: <https://quanminhnguyen199.github.io/dashboard-NSNN/>

## Chạy

```bash
npm install          # uỷ quyền xuống web/
npm run dev          # http://localhost:5173
npm run build
npm run acceptance   # 17 tiêu chí trên Chrome thật (cần dev server đang chạy)
```

Lệnh ở gốc repo chỉ uỷ quyền xuống [`web/`](web); chạy trực tiếp trong `web/` cũng như
nhau. Hướng dẫn đầy đủ, cách **thay API**, giả định của mock và giới hạn còn lại:
[`web/README.md`](web/README.md).

## Cấu trúc mã nguồn

```text
web/src/
  app/          Điểm vào, khung ứng dụng, danh mục tab
  features/     Mỗi workspace một thư mục, không import chéo nhau
  components/   Dùng chung, không biết nghiệp vụ
  data/         ĐIỂM THAY NGUỒN DỮ LIỆU — provider, validate, hook
  domain/       Đúng dù dữ liệu đến từ đâu: danh mục, kiểu, toán về kỳ và tỷ lệ
  state/        Chủ sở hữu duy nhất của URL state
  devtools/     Khung xem thử iframe và thiết bị mobile
```

Giao diện chỉ biết interface `DashboardDataProvider`. **Thay API là đổi một file:**
[`web/src/data/index.ts`](web/src/data/index.ts) — chi tiết ba mức ở
[`web/README.md`](web/README.md#thay-api).

## CI/CD

| Workflow | Chạy khi | Làm gì |
|---|---|---|
| [`ci.yml`](.github/workflows/ci.yml) | push **mọi nhánh** và pull request | typecheck → build → 17 tiêu chí nghiệm thu trên Chrome |
| [`deploy-pages.yml`](.github/workflows/deploy-pages.yml) | push `main` | build → phát hành GitHub Pages |

## Nội dung repo

| Thư mục | Nội dung |
|---|---|
| [`web/`](web) | **Ứng dụng.** React + TypeScript + Vite. Source, `DESIGN.md`, script nghiệm thu. |
| [`web/archive/legacy-clone/`](web/archive/legacy-clone) | Bản clone nguyên trạng website ba tab của giai đoạn trước. Không còn trong build, giữ để tra cứu. |
| [`reference-nsnn/`](reference-nsnn) | Bộ khảo sát website tham chiếu: 143 phản hồi API đã lưu, 40 trạng thái giao diện, CSS/bundle gốc, GeoJSON ranh giới 126 phường/xã và 30 quận/huyện trước 01/07/2025. |
| [`verification/`](verification) | Ảnh và text đối chiếu của giai đoạn clone. |
| [`Attachment/`](Attachment) | Ảnh đính kèm của tài liệu đặc tả. |
| [`bao-cao-outline/`](bao-cao-outline) | **TMS và tích hợp dashboard.** Bốn tài liệu nghiệp vụ và kỹ thuật, gồm nhóm nội bộ. Mục lục và thứ tự đăng ở [`bao-cao-outline/README.md`](bao-cao-outline/README.md). |

## Tài liệu TMS và tích hợp dashboard

Bắt đầu tại [mục lục TMS](bao-cao-outline/README.md). Bộ đọc hiện tại có bốn tài liệu:

| Tài liệu | Vai trò |
|---|---|
| [Báo cáo BA TMS](bao-cao-outline/BA-PHAN-TICH-TMS-THEO-CHUONG-VA-DIA-BAN.md) | Nghiệp vụ, cách tổ chức dashboard, dữ liệu còn thiếu và quyết định cần chốt. |
| Phụ lục nghiệp vụ TMS nội bộ | Bản đọc cục bộ ở `bao-cao-outline/noi-bo/`, tóm tắt cấp quản lý, Mục/Tiểu mục, cách lấy số và các điểm cần xác nhận. |
| [Đặc tả tích hợp dashboard](bao-cao-outline/SPEC-KY-THUAT-DASHBOARD-NSNN.md) | API/MCP, giao diện, trạng thái dữ liệu và tiêu chí nghiệm thu. |
| Đặc tả kỹ thuật TMS nội bộ | Bản đọc cục bộ ở `bao-cao-outline/noi-bo/`, gồm mô hình dữ liệu, quy tắc 113 dòng, danh mục mã đầy đủ và bảng quy đổi. |

Tài liệu NSNN, prototype, mobile/host và khảo sát cũ được giữ tại [thư mục lưu trữ](tai-lieu-luu-tru/nsnn/README.md). Hai tài liệu nội bộ không được đưa vào Git.

## Tài liệu ở repo

Đi kèm mã nguồn, không đăng lên Outline.

| File | Vai trò |
|---|---|
| [`web/DESIGN.md`](web/DESIGN.md) | Hệ thống thị giác: token, thang màu dữ liệu, quy tắc bố cục. |
| [`web/README.md`](web/README.md) | Hướng dẫn chạy, cấu trúc source, cách thay provider. |
| [`PROMPT-CLAUDE-NSNN.md`](PROMPT-CLAUDE-NSNN.md) | Yêu cầu của giai đoạn clone nguyên trạng. Tài liệu lịch sử. |
| [`dac-ta-v2.html`](dac-ta-v2.html) | Đặc tả nghiệp vụ v2. |
| [`update_dac-ta-89_tham-khaor.html`](update_dac-ta-89_tham-khaor.html) | Phản hồi bên thuế và đặc tả trước v2. |

## Kiến trúc

- **Một kho quan sát gốc.** KPI, xu hướng, cơ cấu, xếp hạng, bảng và waterfall đều tổng hợp
  từ cùng `RevenueObservation`; không widget nào sinh số riêng, nên các tổng khớp nhau ở
  mọi chiều.
- **Một nơi sở hữu URL state.** Bộ lọc chung giữ nguyên khi chuyển tab; drawer dùng
  `pushState` nên Back đóng drawer mà không mất bộ lọc.
- **Ranh giới tin cậy.** API và MCP chỉ được trả dữ liệu cùng navigation intent trong danh
  sách đóng; mọi payload đi qua runtime validation trước khi tới giao diện.
- **Quy tắc số liệu.** `0`, số âm và `null` là ba thứ khác nhau và không bị đánh đồng;
  `%YoY` trả “chưa có kỳ trước” thay vì bịa `−100%`; waterfall luôn khớp tổng chênh lệch.
- **Dựng cho khung hẹp.** Bố cục dưới 1280px không phải bản rút gọn tạm bợ: cặp widget nới
  tỷ lệ trước khi xếp chồng, thanh lọc thu về hai nhóm `Kỳ báo cáo`/`Chỉ tiêu`, và thẻ cùng
  hàng cao bằng nhau. Preview hỗ trợ iframe Web và 11 thiết bị Mobile; trong Mobile preview
  có thể kéo thanh tab ngang bằng chuột như thao tác vuốt.
