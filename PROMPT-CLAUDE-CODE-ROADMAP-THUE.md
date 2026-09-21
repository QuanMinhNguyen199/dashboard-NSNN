# Prompt triển khai roadmap mới cho Claude Code

## Vai trò

Bạn là Senior Frontend Engineer kiêm Product Engineer đang làm việc trực tiếp trong repository Dashboard Thu NSNN Hà Nội.

Hãy đọc toàn bộ code và tài liệu liên quan trước khi sửa, đặc biệt:

- `ROADMAP.md`
- `BIEN-BAN-HOP-CO-QUAN-THUE-2026-09-18.md`
- `README.md`
- `web/README.md`
- `web/src/app/tabs.ts`
- `web/src/app/App.tsx`
- `web/src/domain/types.ts`
- `web/src/data/`
- `web/src/features/`
- `web/src/styles/dashboard.css`
- Bốn tài liệu trong `bao-cao-outline/noi-bo/`

Mục tiêu của lượt triển khai này là hoàn thiện bản demo với ba nhóm báo cáo mới:

1. Dự toán và dự báo.
2. Quản lý thu.
3. Kiểm tra.

Giai đoạn hiện tại ưu tiên phục vụ báo cáo. Ba nhóm mới phải nằm trong tab `Báo cáo`, không trở thành tab cấp cao. Chưa cần hoàn thiện toàn bộ nghiệp vụ hoặc kết nối đủ dữ liệu thật, nhưng mỗi nhóm phải có luồng sử dụng rõ và các chức năng cơ bản để cơ quan thuế có thể xem, thao tác và góp ý.

## Nguyên tắc bắt buộc

1. Giữ nguyên ngôn ngữ thiết kế hiện tại: navy thể chế, nền xám xanh nhạt, thẻ trắng, viền mảnh, typography và spacing token hiện có.
2. Không tự thiết kế một visual style khác. Tái sử dụng `Card`, `KpiStrip`, `GridRows`, `Bars`, `TrendChart`, `DonutChart`, bảng, filter và các primitive hiện có.
3. Giữ nguyên đúng sáu tab cấp cao ban đầu: `Tổng quan`, `Báo cáo`, `Phân tích thu`, `Chi tiết phường/xã`, `Mã hạch toán`, `So sánh nâng cao`.
4. Không hiển thị `Dự toán & dự báo`, `Quản lý doanh nghiệp` hoặc `Kiểm tra` thành tab cấp cao. Nội dung tương ứng là các chế độ bên trong tab `Báo cáo`.
5. Không đưa dữ liệu nhạy cảm, mã số thuế, số chứng từ hoặc tên doanh nghiệp thật vào mock, URL, log hay bundle công khai.
6. Mọi mock data phải tất định: cùng bộ lọc luôn trả cùng kết quả. Các tổng con phải cộng khớp tổng cha.
7. Mọi số mô phỏng phải có nhãn `Dữ liệu mô phỏng`. Không để mock trông giống số chính thức.
8. Không tự suy dự toán hoặc dự báo thành số nghiệp vụ thật. Mock chỉ phục vụ duyệt giao diện.
9. Phân biệt rõ bốn loại số: thực hiện, dự toán, dự báo và cùng kỳ.
10. Không gọi TMS và Kho bạc là hai nguồn độc lập để đối soát. TMS là lớp chi tiết giúp giải thích số thu.
11. Giữ TypeScript strict, provider pattern, runtime validation và URL state hiện tại.
12. Không import trực tiếp tầng `data/mock` từ các feature mới. Feature chỉ lấy dữ liệu qua hook và `DashboardDataProvider`.
13. Widget không có dữ liệu phải trả trạng thái phù hợp hoặc ẩn theo quy tắc hiện tại. Không tạo thẻ trắng rỗng.
14. Desktop, web hẹp, iframe và Mobile WebView phải dùng được bằng cùng một nguồn state.

## Kiến trúc thông tin

Giữ nguyên thứ tự sáu tab cấp cao:

1. `Tổng quan`
2. `Báo cáo`
3. `Phân tích thu`
4. `Chi tiết phường/xã`
5. `Mã hạch toán`
6. `So sánh nâng cao`

Trong tab `Báo cáo`, thêm bộ chọn `Loại báo cáo` với bốn giá trị:

1. `Thu NSNN`
2. `Dự toán & dự báo`
3. `Quản lý thu`
4. `Kết quả kiểm tra`

Desktop có thể dùng segmented control hoặc bốn nút gọn. Mobile, iframe và web hẹp dùng một `select` full width. Chỉ có một bộ chọn được render ở mỗi breakpoint; không tạo hai control cùng điều khiển một state.

Lưu chế độ báo cáo vào URL bằng tham số đóng:

```text
?tab=report&report=nsnn
?tab=report&report=budget
?tab=report&report=taxpayer
?tab=report&report=inspection
```

Mặc định là `report=nsnn`. Mọi giá trị khác danh sách trên phải trở về mặc định.

Ba URL tạm đã được tạo ở lượt trước phải chuyển hướng mà không gây màn hình trắng:

```text
?tab=budget-forecast  -> ?tab=report&report=budget
?tab=enterprise       -> ?tab=report&report=taxpayer
?tab=inspection       -> ?tab=report&report=inspection
```

Xóa ba mục này khỏi `TABS` và không render chúng trực tiếp trong `App.tsx`. Giữ feature module riêng để code dễ quản lý, nhưng render chúng như nội dung của `ReportTab`.

## 1. Chế độ báo cáo Dự toán và dự báo

Giữ feature độc lập nhưng đổi component cấp màn hình thành view dùng trong `ReportTab`, ví dụ:

```text
web/src/features/budget-forecast/
  BudgetForecastView.tsx
  BudgetProgressTable.tsx
  ForecastChart.tsx
```

### Bộ lọc

Kế thừa bộ lọc chung hiện tại:

- Năm.
- Tháng hoặc quý.
- Trong kỳ hoặc lũy kế.
- Cấp ngân sách.

Bổ sung bộ lọc cục bộ:

- Cách xem: `Theo địa bàn` hoặc `Theo sắc thuế/khoản thu`.
- Trạng thái: `Tất cả`, `Đã hoàn thành`, `Có nguy cơ hụt`, `Vượt dự toán`.

### KPI

- Thực hiện lũy kế.
- Dự toán được giao.
- Tỷ lệ hoàn thành.
- Số còn phải thu.
- Dự báo cuối kỳ.
- Sai số dự báo, chỉ xuất hiện khi đã có số thực tế để đối chiếu.

### Nội dung chính

1. Bảng xếp hạng 126 phường, xã theo tỷ lệ hoàn thành dự toán.
2. Cho sắp xếp theo:
   - Tỷ lệ hoàn thành.
   - Số thực hiện.
   - Phần còn thiếu.
   - Tăng giảm so với cùng kỳ.
3. Mỗi dòng có:
   - Phường, xã.
   - Dự toán.
   - Thực hiện.
   - Tỷ lệ hoàn thành.
   - Còn thiếu hoặc vượt.
   - So cùng kỳ.
   - Trạng thái.
4. Chọn một địa bàn để xem các sắc thuế hoặc khoản thu tạo nên kết quả.
5. Chế độ `Theo sắc thuế/khoản thu` dùng cùng cấu trúc bảng và cho mở tiếp địa bàn liên quan.
6. Biểu đồ thực hiện và dự báo theo thời gian phải phân biệt bằng kiểu đường, nhãn và tooltip; không chỉ dựa vào màu.

### Sai số dự báo

Prototype dùng công thức tạm để demo:

```ts
absolutePercentageError = actual === 0
  ? null
  : Math.abs(forecast - actual) / Math.abs(actual) * 100;
```

Hiển thị mục tiêu `≤ 3%` như một ngưỡng nghiệp vụ đang chờ xác nhận. Không ghi `Đạt` nếu chưa có actual hoặc phạm vi đo chưa hợp lệ. Tách hàm tính sai số để sau này thay công thức mà không sửa component.

## 2. Chế độ báo cáo Quản lý thu

Giữ feature độc lập nhưng render trong `ReportTab`, ví dụ:

```text
web/src/features/enterprise-management/
  EnterpriseManagementView.tsx
  IndustrySummary.tsx
  EnterpriseTable.tsx
```

### KPI và góc nhìn

- Tổng số thu thuộc phạm vi doanh nghiệp đang xem.
- Số ngành hoặc nhóm ngành có dữ liệu.
- Ngành đóng góp lớn nhất.
- Tỷ lệ số thu đã xác định được ngành nghề.
- Phần chưa xác định ngành nghề.

### Nội dung chính

1. Bảng hoặc biểu đồ xếp hạng ngành nghề theo số thu.
2. Hiển thị số thu, tỷ trọng và tăng giảm so với cùng kỳ.
3. Cho chuyển giữa:
   - Theo ngành nghề.
   - Theo cơ quan thuế.
   - Theo địa bàn.
4. Chọn một ngành để xem danh sách doanh nghiệp mô phỏng thuộc ngành đó.
5. Bảng doanh nghiệp mô phỏng gồm:
   - Mã hiển thị đã token hóa, không dùng mã số thuế thật.
   - Tên giả rõ ràng là mock.
   - Ngành nghề.
   - Cơ quan thuế quản lý.
   - Địa bàn theo nguồn dữ liệu được ghi rõ.
   - Số thu trong kỳ.
   - So cùng kỳ.
6. Có tìm kiếm, sắp xếp và phân trang.
7. Giữ nhóm `Chưa xác định ngành nghề`; không loại số này khỏi tổng.

Tab `Báo cáo` hiện đã có ba chiều `location`, `taxOffice`, `industry`. Tái sử dụng định nghĩa trong `web/src/domain/report.ts`, không tạo một danh mục ngành hoặc cơ quan thuế thứ hai.

## 3. Chế độ báo cáo Kết quả kiểm tra

Giữ feature độc lập nhưng render trong `ReportTab`, ví dụ:

```text
web/src/features/inspection/
  InspectionReportView.tsx
  InspectionSummary.tsx
  InspectionReportTable.tsx
```

Khung này dùng dữ liệu tổng hợp từ TMS và TTR. Chưa có dữ liệu TTR thật thì dùng mock tất định và gắn nhãn.

### Bộ lọc cục bộ

- Chu kỳ báo cáo: Tuần hoặc Tháng.
- Đơn vị hoặc phòng.
- Trạng thái cuộc kiểm tra.

### KPI

- Tổng số cuộc kiểm tra.
- Số cuộc đã hoàn thành.
- Tỷ lệ hoàn thành.
- Số tiền xử lý qua kiểm tra.
- Số tiền đã nộp.
- Tỷ lệ đã nộp trên số tiền xử lý.

Dùng tên trung tính `Số tiền xử lý qua kiểm tra` trong prototype. Không dùng `Tiền truy thu` cho tới khi cơ quan thuế xác nhận cụm `tiền chi thu` trong biên bản thực sự có nghĩa đó.

### Nội dung chính

1. Xu hướng số cuộc hoàn thành theo tuần hoặc tháng.
2. Bảng kết quả theo đơn vị hoặc phòng.
3. Sắp xếp theo số cuộc, tỷ lệ hoàn thành, số tiền xử lý và số đã nộp.
4. Danh sách nội dung cần chú ý: chậm tiến độ, số đã nộp thấp hoặc biến động lớn.
5. Khối `Biến động chính sách` gồm tên chính sách, ngày hiệu lực, phạm vi ảnh hưởng và trạng thái đánh giá. Dùng nội dung mock trung tính, không bịa tên văn bản pháp luật.

## 4. Nâng cấp tab Báo cáo

`ReportTab` là vỏ chung của bốn loại báo cáo. Nó sở hữu bộ chọn loại báo cáo, đọc và ghi tham số `report` trong URL, sau đó render đúng view tương ứng.

Chế độ `Thu NSNN` giữ bảng chéo 113 chỉ tiêu theo địa bàn, cơ quan thuế và ngành nghề. Bổ sung một lớp tóm tắt phía trên để người dùng không phải tự đọc hàng trăm ô.

Khi `Xem theo = Cơ quan thuế`, hiển thị:

- Tổng thu.
- Số cơ quan có dữ liệu.
- Cơ quan đóng góp lớn nhất.
- Top tăng và giảm so cùng kỳ.
- Phần chưa xác định.
- Biểu đồ xếp hạng và xu hướng.

Khi `Xem theo = Ngành nghề`, hiển thị:

- Tổng thu đã xác định ngành.
- Tỷ lệ đã nối ngành.
- Ngành đóng góp lớn nhất.
- Top tăng và giảm so cùng kỳ.
- Nhóm chưa xác định.
- Biểu đồ xếp hạng và xu hướng.

Đừng tính lại số từ các ô đang phân trang ở frontend. Provider phải trả phần summary riêng để số tóm tắt không phụ thuộc trang cột đang xem.

## 5. Trích xuất báo cáo

Tạo một thành phần dùng chung, ví dụ `ReportExportButton`.

Yêu cầu tối thiểu cho bản demo:

- Xuất CSV UTF-8 có BOM để mở đúng tiếng Việt trong Excel.
- Xuất đúng phạm vi và bộ lọc đang xem.
- Tên file không chứa dữ liệu nhạy cảm.
- Phần đầu file hoặc các cột metadata phải có kỳ, phạm vi, đơn vị, nguồn, thời điểm cập nhật và trạng thái mock.
- Không chỉ xuất các cột đang nhìn thấy nếu bảng có phân trang. Gọi provider hoặc export endpoint để lấy toàn bộ tập được phép xuất.
- Nút xuất có trạng thái đang tạo file, thành công và lỗi.

Thiết kế interface để sau này có thể thêm XLSX/PDF mà không sửa từng chế độ báo cáo.

## 6. Thời điểm cập nhật và trạng thái dữ liệu

Tạo một component dùng chung hiển thị:

- Nguồn dữ liệu.
- Thời điểm dữ liệu được chốt.
- Thời điểm hệ thống tạo báo cáo.
- Trạng thái: chính thức, tạm tính hoặc mô phỏng.

Không dùng `new Date()` lúc gọi mock làm `thời điểm dữ liệu`. Bổ sung riêng:

```ts
interface DataFreshness {
  dataAsOf: string | null;
  generatedAt: string;
  status: "official" | "provisional" | "mock";
  sources: Array<"TMS" | "TTR" | "TREASURY" | "MANUAL_PLAN">;
}
```

Đặt thông tin này ở gần tiêu đề loại báo cáo hoặc vùng bộ lọc, không lặp trong mọi card.

## 7. Hợp đồng dữ liệu

Bổ sung các kiểu rõ ràng vào `web/src/domain/types.ts`. Không dùng `any`.

Tối thiểu cần có:

```ts
interface BudgetProgressRow {
  id: string;
  name: string;
  plan: number;
  actual: number;
  previous: number | null;
  completionRate: number | null;
  remaining: number;
  forecast: number | null;
  forecastError: number | null;
}

interface EnterpriseRevenueRow {
  token: string;
  displayName: string;
  industryId: string | null;
  taxOfficeCode: string | null;
  locationId: string | null;
  amount: number;
  previous: number | null;
}

interface InspectionSummaryData {
  totalCases: number;
  completedCases: number;
  processedAmount: number;
  paidAmount: number;
}
```

Thiết kế đầy đủ payload cho từng loại báo cáo, gồm `meta`, `quality` và phần chưa xác định. Thêm các phương thức tương ứng vào `DashboardDataProvider`, provider mock, provider HTTP/MCP, hooks và runtime validators.

Các endpoint chưa tồn tại trong provider HTTP/MCP phải trả lỗi hoặc `no-data` rõ ràng. Không âm thầm dùng mock khi ứng dụng đang ở chế độ API.

## 8. Responsive, iframe và Mobile WebView

- Desktop dùng lưới 12 cột hiện tại.
- Web hẹp tự chuyển sang layout thích hợp mà không cần reload.
- Mobile ưu tiên KPI gọn, bảng chuyển sang card row hoặc cuộn ngang trong đúng vùng bảng.
- Bộ lọc mobile giữ dạng full width hiện tại.
- Thanh điều hướng mobile phải vuốt được và vẫn click được.
- Không hiển thị thanh chọn resolution hoặc công cụ dev trong nội dung Mobile WebView thật.
- Mọi biểu đồ tương tác phải có cách dùng bằng bàn phím và bảng dữ liệu thay thế khi cần.

## 9. Thứ tự thực hiện

Thực hiện theo thứ tự này:

1. Đọc code, chạy build và acceptance để có baseline.
2. Viết kiểu dữ liệu, provider contract và validators.
3. Tạo mock data tất định và kiểm tổng.
4. Gỡ ba tab cấp cao `budget-forecast`, `enterprise`, `inspection` khỏi thanh điều hướng và `App.tsx`.
5. Thêm `reportMode` vào URL state và dựng bốn chế độ trong `ReportTab`.
6. Đưa ba feature đã tạo vào ba chế độ báo cáo tương ứng; đổi tên component `Tab` thành `View` nếu phù hợp.
7. Nâng cấp phần tóm tắt của chế độ `Thu NSNN`.
8. Thêm xuất CSV và trạng thái dữ liệu.
9. Thêm redirect cho ba URL tạm và giữ toàn bộ URL cũ của sáu tab.
10. Hoàn thiện responsive, iframe và mobile.
11. Cập nhật `README.md`, `web/README.md`, `ROADMAP.md`, dictionary và tài liệu nội bộ liên quan.
12. Chạy lại toàn bộ kiểm thử.

Không dừng sau khi chỉ chuyển vị trí component. Mỗi chế độ báo cáo phải hoạt động với mock data, bộ lọc, sắp xếp, xuất file và responsive.

## 10. Tiêu chí nghiệm thu

### Dự toán và dự báo

- Có thể xếp hạng 126 phường, xã theo tỷ lệ hoàn thành dự toán.
- Chọn một địa bàn xem được khoản thu hoặc sắc thuế cấu thành.
- Thực hiện, dự toán và dự báo không bị trộn nhãn.
- Sai số dự báo chỉ xuất hiện khi có cả forecast và actual.

### Quản lý thu

- Có thể trả lời ngành nào đóng góp nhiều nhất và tăng giảm ra sao.
- Có thể chuyển giữa ngành nghề, cơ quan thuế và địa bàn.
- Nhóm chưa xác định vẫn nằm trong tổng.
- Mã doanh nghiệp trong mock là token, không phải mã số thuế thật.

### Kiểm tra

- Hiển thị được tổng số cuộc, số hoàn thành, số tiền xử lý và số đã nộp.
- Chuyển được giữa báo cáo tuần và tháng.
- Bảng đơn vị có sắp xếp và giữ tổng khớp KPI.
- Chỉ tiêu chưa được xác nhận có nhãn trung tính.

### Báo cáo và dữ liệu

- Thanh điều hướng cấp cao có đúng sáu tab ban đầu, không có tab thứ bảy.
- Tab `Báo cáo` có đúng bốn chế độ và URL phản ánh chế độ đang chọn.
- Ba URL tạm chuyển tới chế độ báo cáo tương ứng; nút Back và Forward hoạt động đúng.
- Thu theo cơ quan thuế và ngành nghề có KPI, xếp hạng và xu hướng rõ ràng trước bảng 113 chỉ tiêu.
- Xuất CSV đúng bộ lọc và toàn bộ phạm vi được phép.
- Hiển thị nguồn và thời điểm cập nhật.
- Mock luôn có nhãn.
- Không có `NaN`, `Infinity` hoặc biến dữ liệu thiếu thành 0.

### Kỹ thuật

- `npm run build` chạy thành công.
- Toàn bộ acceptance hiện có tiếp tục chạy thành công hoặc được cập nhật có lý do khi điều hướng thay đổi.
- Bổ sung kiểm thử trình duyệt cho bốn chế độ báo cáo, sorting, export, freshness, redirect và URL cũ.
- Kiểm tra ở desktop, web hẹp, iframe và ít nhất hai kích thước mobile.
- Không có TypeScript error, console error hoặc lỗi accessibility nghiêm trọng.

## 11. Cách báo cáo kết quả

Sau khi hoàn thành, báo cáo ngắn gọn:

1. Đã thêm hoặc thay đổi những chế độ báo cáo nào.
2. Dữ liệu nào đang là mock và dữ liệu nào lấy từ nguồn hiện có.
3. URL hoặc deep link mới.
4. Các quyết định nghiệp vụ còn chờ xác nhận.
5. Kết quả build và acceptance.
6. Những giới hạn còn lại trước khi nối dữ liệu thật.

Không tuyên bố đã đạt sai số dự báo 3% nếu mới chỉ dựng UI hoặc chạy trên dữ liệu mock.
