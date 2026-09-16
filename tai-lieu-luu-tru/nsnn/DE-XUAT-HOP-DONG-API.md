# Đề xuất hợp đồng API — bàn trước khi backend dựng

| | |
|---|---|
| **Trạng thái** | Đề xuất để bàn, chưa chốt |
| **Ngày** | 14/09/2026 |
| **Vì sao bàn bây giờ** | Backend `/api/dashboard/*` chưa tồn tại. Sửa hợp đồng sau khi đã có API thật thì tốn gấp nhiều lần |
| **Liên quan** | `THIET-KE-DASHBOARD-NSNN.md` §15, `web/src/domain/types.ts` |

---

## 1. Hiện trạng

Hợp đồng đang có bốn endpoint, tổng **40 trường**:

| Endpoint | Số trường | Các trường |
|---|---|---|
| `getOverview` | 13 | `meta · kpiPeriod · kpiYtd · insight · trend · sources · domesticItems · locations · budgetLevels · centralBudgetSources · localBudgetLevels · estimate · waterfall` |
| `getRevenueAnalysis` | 9 | `meta · scope · kpis · trend · breakdown · groups · netReconciliation · byLocation · waterfall` |
| `getLocationDetail` | 9 | `meta · location · kpiPeriod · kpiYtd · rank · shareOfCity · trend · sources · topItems` |
| `getAdvancedComparison` | 10 | `meta · mode · a · b · delta · deltaPct · rows · waterfall · trendA · trendB` |

**Mỗi trường ứng với đúng một thẻ trên màn hình.** Hệ quả: backend phải biết bố cục
dashboard. Thêm, bỏ hoặc đổi hình dạng một widget là đổi hợp đồng API — tức là một
lần phối hợp phát hành giữa hai đội.

## 2. Quan sát then chốt

**Cả 40 trường đều là cùng một phép hỏi.** Lớp mock chứng minh điều này bằng đúng
một hàm:

```ts
sumOf(filters, { year?, months?, items?, locationIds? }) → number | null
```

KPI, xu hướng, cơ cấu, xếp hạng, bảng, waterfall, donut — tất cả đều gọi nó.
**12 trong 40 trường** đã là cùng một kiểu `AmountRow[]`; phần còn lại là giá trị
đơn hoặc chuỗi điểm theo tháng.

Nói cách khác: hợp đồng trông như 40 thứ khác nhau, nhưng nghiệp vụ bên dưới chỉ
có **một phép hỏi và bốn chiều lát cắt** (kỳ · khoản thu · địa bàn · cấp ngân sách).

## 3. Hai hướng

### Hướng A — giữ hình dạng widget (hiện tại)

**Được:** một lượt gọi cho mỗi tab, backend tối ưu được từng truy vấn, kiểm tra
dữ liệu chặt theo từng tab, giao diện nhận đúng thứ nó cần.

**Mất:** backend phải biết bố cục. Mỗi widget mới là một vòng phối hợp phát hành.
Với dự án nhà nước — nơi backend và frontend thường khác đội, khác nhà thầu, khác
nhịp phát hành — đây là chi phí lặp lại suốt vòng đời sản phẩm.

### Hướng B — hình dạng nghiệp vụ

Một endpoint, nhận danh sách lát cắt:

```ts
POST /api/dashboard/query
{
  filters: DashboardFilters,
  slices: [
    { id: "kpiPeriod",  by: "total" },
    { id: "sources",    by: "source" },
    { id: "locations",  by: "location" },
    { id: "trend",      by: "month", months: 12, withPrevious: true }
  ]
}
→ { meta, results: { kpiPeriod: AmountRow, sources: AmountRow[], ... } }
```

**Được:** backend dựng **một** máy truy vấn thay vì 40 trường. Thêm widget là việc
của riêng frontend. Hợp đồng nhỏ và ổn định.

**Mất:** nhiều lượt gọi hơn hoặc cần endpoint gộp; khó cache theo tab; kiểm tra
dữ liệu lỏng hơn; backend mất khả năng tối ưu riêng từng payload.

## 4. Đề xuất: hướng A có ba sửa đổi

Giữ bốn endpoint — lượt gọi và cache là lợi ích thật, không nên vứt. Nhưng sửa ba
điểm để tách được nhịp phát hành của hai đội:

### 4.1. Mọi trường widget đều `optional`

Hợp đồng khai báo trường widget là có thể vắng mặt, và giao diện **đã có sẵn cơ
chế xử lý**: `SlotConfig.hidden` loại widget khỏi lưới và `resolveRow` cho widget
còn lại nở đủ 12 cột. Cơ chế này đang chạy ở bốn chỗ:

```
data.waterfall === null          → bỏ cầu nối ở chế độ so nguồn thu
data.budgetLevels.length === 0   → bỏ thẻ cấp ngân sách khi lọc NSTW
data.byLocation.length === 0     → bỏ đóng góp địa bàn với nguồn trung ương
!data.netReconciliation          → bỏ đối chiếu thu ròng ngoài nguồn XNK
```

**Hệ quả:** backend phát hành từng trường một, theo thứ tự ưu tiên của họ. Frontend
không bao giờ vỡ vì thiếu trường — widget chưa có dữ liệu thì không hiện, và bố
cục tự lấp chỗ trống. Đây là thay đổi rẻ nhất trong ba mục và có giá trị lớn nhất.

### 4.2. Một từ vựng lát cắt, ghi thành tài liệu

40 trường được đặc tả qua **một** kiểu dòng và bốn chiều lát cắt, thay vì 40 mô tả
rời. Backend đọc một trang là hiểu toàn bộ hợp đồng:

| Chiều | Giá trị | Trường dùng nó |
|---|---|---|
| `total` | một số | `kpiPeriod`, `kpiYtd`, `delta`, `shareOfCity` |
| `source` | 4 nguồn thu | `sources`, `centralBudgetSources` |
| `item` | 21 khoản nội địa và các mã khác | `domesticItems`, `breakdown`, `topItems`, `rows` |
| `location` | 126 phường, xã | `locations`, `byLocation` |
| `budgetLevel` | NSTW/NSĐP và ba cấp con | `budgetLevels`, `localBudgetLevels` |
| `month` | chuỗi 12 điểm, kèm năm trước | `trend`, `trendA`, `trendB` |

Mọi kết quả dùng chung một kiểu dòng đã có:

```ts
AmountRow { id, name, amount, previous, share?, meta? }
```

### 4.3. Một endpoint thoát hiểm cho widget mới

```ts
POST /api/dashboard/slice
{ filters, by: "item" | "location" | "source" | "budgetLevel" | "month", scope? }
→ { meta, rows: AmountRow[] }
```

Frontend dựng widget mới bằng endpoint này ngay, không chờ backend phát hành. Khi
widget đó ổn định và đáng tối ưu, backend đưa nó vào payload của tab tương ứng như
một trường mới — và theo mục 4.1, việc chuyển đổi không làm vỡ gì.

## 5. Việc cần làm nếu chốt đề xuất này

| Bên | Việc | Ghi chú |
|---|---|---|
| Frontend | Đánh dấu `optional` cho trường widget trong `domain/types.ts` | Kiểu đã có, chỉ thêm `?` và nhánh `hidden` |
| Frontend | Bổ sung `slice` vào `DashboardDataProvider` | Adapter và lớp validate đã có sẵn khung |
| Backend | Dựng bốn endpoint theo từ vựng mục 4.2 | Không cần biết bố cục dashboard |
| Backend | Dựng `/slice` | Một máy truy vấn, bốn chiều lát cắt |
| Hai bên | Chốt thứ tự phát hành từng trường | Nhờ mục 4.1 mà không cần phát hành đồng thời |

## 6. Hai trường còn thiếu, không phụ thuộc hướng nào

| Trường | Vì sao cần | Tham chiếu |
|---|---|---|
| **Dự toán năm** | Câu hỏi "đạt bao nhiêu % dự toán" đang phải trả lời bằng số mô phỏng | `BA-NSNN.md` §9.1, giả định A09 |
| **Ngày chốt số liệu** | Câu hỏi đầu tiên người đọc bị chất vấn trong họp; giao diện chưa có chỗ trả lời | Giả định A10 |

Hợp đồng đã có sẵn chỗ cho cái thứ nhất: `BudgetEstimate.origin` phân biệt `"mock"`
với `"api"`, và giao diện tự gỡ nhãn mô phỏng khi `origin` chuyển sang `"api"`.
