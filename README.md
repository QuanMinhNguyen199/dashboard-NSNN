# dashboard-NSNN

Prototype dashboard **Thu Ngân sách TP Hà Nội**: bảy workspace phân tích,
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
npm run acceptance   # 20 tiêu chí trên Chrome thật (cần dev server đang chạy)
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
| [`ci.yml`](.github/workflows/ci.yml) | push **mọi nhánh** và pull request | typecheck → build → 20 tiêu chí nghiệm thu trên Chrome |
| [`deploy-pages.yml`](.github/workflows/deploy-pages.yml) | push `main` | build → phát hành GitHub Pages |

## Nội dung repo

| Thư mục | Nội dung |
|---|---|
| [`web/`](web) | **Ứng dụng.** React + TypeScript + Vite. Source, `DESIGN.md`, script nghiệm thu. |
| [`web/archive/legacy-clone/`](web/archive/legacy-clone) | Bản clone nguyên trạng website ba tab của giai đoạn trước. Không còn trong build, giữ để tra cứu. |
| [`reference-nsnn/`](reference-nsnn) | Bộ khảo sát website tham chiếu: 143 phản hồi API đã lưu, 40 trạng thái giao diện, CSS/bundle gốc, GeoJSON ranh giới 126 phường/xã và 30 quận/huyện trước 01/07/2025. |
| [`verification/`](verification) | Ảnh và text đối chiếu của giai đoạn clone. |
| [`Attachment/`](Attachment) | Ảnh đính kèm của tài liệu đặc tả. |
| `TMS/` | **Nguồn nghiệp vụ bên Thuế.** Tài liệu và bảng nối dùng để rà soát cục bộ; dữ liệu riêng được loại khỏi Git. Tài liệu công khai không nêu tên tệp nguồn. |
| [`bao-cao-outline/noi-bo/`](bao-cao-outline/noi-bo) | **TMS và tích hợp dashboard.** Bốn tài liệu nghiệp vụ và kỹ thuật dùng trong phạm vi được phân quyền. |

## Workspace

Sáu workspace, chung một bộ lọc và một nguồn state. Ba mảng mở theo biên bản
làm việc 18/09/2026 — dự toán và dự báo, quản lý thu, kết quả kiểm tra — là
**chế độ bên trong tab Báo cáo**, không phải tab cấp cao. Dự toán và Quản lý thu
đã nhận phần dữ liệu tổng hợp an toàn từ bộ bàn giao 18-09; phần chưa có giao
dịch/API vẫn chạy bằng số mô phỏng và được ghi rõ trên giao diện.

Chi tiết từng workspace, ba bảo đảm của lớp mock và cách xuất CSV nằm ở
[`web/README.md`](web/README.md).

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
