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
npm run dev          # Cổng đăng nhập chung: http://localhost:5174
npm run build
npm run acceptance   # 20 tiêu chí trên Chrome thật (cần dev server đang chạy)
```

`npm run dev` và `npm run dev:tax-ops` chạy cổng chung `5174`: đăng nhập bằng
`lanhdao.nhanuoc` (LDNN) tự chuyển tới `/nsnn/`; `canbo.thue` và `lanhdao.thue`
vào Tax Ops tại `/`. Mật khẩu mẫu: `demo123`. Chỉ cần forward **5174**, liên kết
giữa hai ứng dụng giữ nguyên tên miền và cổng. Đăng xuất ở NSNN quay về màn đăng nhập.
Đây là phân vai demo bằng sessionStorage, chưa phải xác thực/phân quyền máy chủ.

Dashboard NSNN được build vào `tax-ops/public/nsnn/` khi khởi động cổng chung;
sau khi sửa mã NSNN, chạy lại `npm run dev` để cập nhật. Tax Ops vẫn có HMR.
`npm run build:portal` tạo bản gộp tại `tax-ops/dist`; `npm run preview:portal`
phục vụ bản đó ở `5174`. `npm run dev:nsnn` vẫn chạy NSNN riêng ở `5173`.
GitHub Pages build bản gộp với base `/dashboard-NSNN/`: màn đăng nhập ở gốc site,
Dashboard Thu NSNN ở `/dashboard-NSNN/nsnn/`. Workflow `deploy-pages.yml` cài
phụ thuộc của cả hai ứng dụng, build và phát hành `tax-ops/dist`. Trong GitHub,
chọn **Settings → Pages → Build and deployment → GitHub Actions** nếu repo chưa
chọn nguồn này.
Kiểm tra phân vai: `cd tax-ops && node scripts/check-portal.mjs` khi cổng chung đang chạy.

Hướng dẫn đầy đủ, cách **thay API**, giả định của mock và giới hạn còn lại:
[`web/README.md`](web/README.md).

## Web quản lý nghiệp vụ Thuế

[`tax-ops/`](tax-ops) là ứng dụng độc lập dành cho cán bộ Thuế, tách khỏi
Dashboard Thu NSNN dành cho lãnh đạo thành phố. Ứng dụng có URL, state, dữ liệu
và build riêng; chỉ dùng chung định hướng thiết kế thể chế.

```bash
npm run dev:tax-ops       # http://localhost:5174
npm run build:tax-ops
npm run build:all         # build cả NSNN và Web QL
```

Phạm vi nghiệp vụ và hướng dẫn chi tiết nằm tại [`tax-ops/README.md`](tax-ops/README.md).
Khi chạy hai ứng dụng độc lập, Web QL mở Dashboard NSNN cho tài khoản có quyền `NSNN_VIEW`; liên kết
thêm `from=tax-ops` để Dashboard hiện lối **Quay lại Web QL**. Người mở Dashboard
NSNN trực tiếp không thấy lối vào Web QL. Hai ứng dụng không truyền bộ lọc hoặc
dữ liệu hồ sơ trên URL. URL đích đọc từ `VITE_TAX_OPS_URL` và `VITE_NSNN_URL`;
hệ thống đích vẫn phải xác thực quyền.

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
| [`deploy-pages.yml`](.github/workflows/deploy-pages.yml) | push `main` | build cổng chung Tax Ops + NSNN → phát hành GitHub Pages |

## Nội dung repo

| Thư mục | Nội dung |
|---|---|
| [`web/`](web) | **Ứng dụng.** React + TypeScript + Vite. Source, `DESIGN.md`, script nghiệm thu. |
| [`tax-ops/`](tax-ops) | **Web quản lý nghiệp vụ Thuế.** Trang công việc, nợ, kiểm tra, hoàn thuế, báo cáo và quản lý dữ liệu nội bộ. |
| [`web/archive/legacy-clone/`](web/archive/legacy-clone) | Bản clone nguyên trạng website ba tab của giai đoạn trước. Không còn trong build, giữ để tra cứu. |
| [`reference-nsnn/`](reference-nsnn) | Bộ khảo sát website tham chiếu: 143 phản hồi API đã lưu, 40 trạng thái giao diện, CSS/bundle gốc, GeoJSON ranh giới 126 phường/xã và 30 quận/huyện trước 01/07/2025. |
| [`verification/`](verification) | Ảnh và text đối chiếu của giai đoạn clone. |
| [`Attachment/`](Attachment) | Ảnh đính kèm của tài liệu đặc tả. |
| `TMS/` | **Nguồn nghiệp vụ bên Thuế.** Tài liệu và bảng nối dùng để rà soát cục bộ; dữ liệu riêng được loại khỏi Git. Tài liệu công khai không nêu tên tệp nguồn. |
| [`bao-cao-outline/noi-bo/`](bao-cao-outline/noi-bo) | **TMS và tích hợp dashboard.** Bốn tài liệu nghiệp vụ và kỹ thuật dùng trong phạm vi được phân quyền. |



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
