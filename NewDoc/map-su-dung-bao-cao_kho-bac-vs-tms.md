# Map sử dụng báo cáo_Kho bạc vs TMS

**Mã:** `MAP-BC`\n**Vai trò:** Bộ 4 bảng ánh xạ — ký hiệu giao dịch, CQT-ĐBHC toàn quốc, cầu nối chỉ tiêu TMS↔KBNN

**File gốc:**

[Bang map su dung cho bao cao.xls 474624](attachments/8078a1b6-5592-4f65-bd7d-1474b4487abf.xls)

 

## Mục đích & tóm tắt nội dung

Workbook định dạng `.xls` cũ, gồm 4 bảng tra cứu độc lập gộp chung — không có quan hệ trực tiếp giữa các sheet, chỉ dùng chung một chỗ lưu trữ.

## Cấu trúc dữ liệu

| Sheet | Số dòng | Nội dung |
|-------|---------|----------|
| `Ky hieu giao dich` | 109 (108 mã) | Bảng giải mã ký hiệu giao dịch (C2, HC, P7...) |
| `CQT-DBHC` | 3\.385  | Hai khối rời nhau: cột A–B (760 mã CQT toàn quốc), cột F–H (63 tên tỉnh + 3.321 phường/xã toàn quốc). Cột C, D, E trống. |
| `MAP chi tieu BC` | 197 (189 dòng KBNN) | Cầu nối 113 chỉ tiêu TMS ↔ 189 dòng báo cáo B2-01/BC-NS |
| `MAP chi tieu BC tien do thu` | 57 (20 chỉ tiêu) | Biểu tiến độ thu, tham chiếu ngược lại `MAP chi tieu BC` bằng công thức Excel |

## Data Dictionary — `CQT-DBHC`

| Cột | Trường | Ghi chú |
|-----|--------|---------|
| A   | Mã cơ quan thuế | 760 dòng, kiểu lẫn lộn (758 text + 1 float + 2 int); mã `42` lặp 2 dòng. |
| B   | Tên cơ quan thuế | 386 tên phân biệt trên 760 mã (N:1). |
| F   | Tên tỉnh | 63 dòng, chỉ 34 tên phân biệt (đã áp mã tỉnh sau sáp nhập). |
| G   | Mã phường xã TMS | 3\.321 dòng, **lưu dạng số** — khác kiểu text bên [TMS-02](tms-du-lieu-02-2026.md), cần ép kiểu khi join. |
| H   | Tên phường xã | 2\.991 tên phân biệt trên 3.321 mã. |

## Data Dictionary — `MAP chi tieu BC`

Hai khối cột cạnh nhau: khối TMS (A–D: STT, tên chỉ tiêu, chỉ tiêu KBNN tương ứng, ô tham chiếu) và khối KBNN (E–G: STT KBNN, tên chỉ tiêu, **dòng số 1–189** trong báo cáo B2-01). Quan hệ **không phải 1:1** — 113 chỉ tiêu TMS ↔ 189 dòng KBNN; 24 chỉ tiêu TMS ghi "BC kho bạc không tách chi tiết", 64 dòng KBNN không có đối ứng TMS (phần XNK, viện trợ, vay, chuyển giao ngân sách).

## Liên kết với file khác

* [TMS-SPEC](https://uat-outline.thehegeo.com/doc/tms-spec-bGSdzjvKQa) — nguồn 113 chỉ tiêu và ký hiệu giao dịch được đối chiếu.
* [MAP-6334](https://uat-outline.thehegeo.com/doc/map-6334-K6wqTViUx0) — bảng rút gọn, đúng phạm vi Hà Nội hơn (760 mã CQT toàn quốc ở đây so với 32 mã ở đó); tên 2 mã lệch nhau: `0101` là "Thuế Thành phố Hà Nội" ở đây nhưng "Thuế TP Hà Nội" ở [MAP-6334](map-63-thanh-34-tinh.md).
* [KB-B201-TP25](kbnn-b201-toan-thanh-pho-2025.md) và các file B2-01 khác — đích của cột G trong `MAP chi tieu BC`.

## Vấn đề / Lưu ý

* Cảnh báo tại ô A1 của `MAP chi tieu BC`: báo cáo KBNN chiết ra có thể **xóa hẳn dòng** của chỉ tiêu không phát sinh, làm số dòng thực tế ít hơn 189. Đã kiểm chứng trên 4 file B2-01 hiện có: **cả 4 đều đủ 189 dòng, 0 lệch vị trí** — nhưng đây chỉ là 4/126+ file có thể có, nên vẫn phải map theo `STT + tên chỉ tiêu`, không map theo số dòng.

  \