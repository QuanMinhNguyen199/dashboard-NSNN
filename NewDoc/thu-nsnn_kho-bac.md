# Thu NSNN_kho bạc

**Mã:** `KB-THUNSNN`\n**Vai trò:** Quy trình kết xuất từ csdltc.mof.gov.vn + mẫu Biểu 01 "Ước thu" + 1 bản B2-01 khác kỳ kết sổ

File gốc

[thu nsnn.xlsx 619562](attachments/ed5ee325-3627-4f24-8217-ed20f65f668c.xlsx)

## Mục đích & tóm tắt nội dung

File gộp 3 nội dung khác nhau: hướng dẫn thao tác kết xuất, một mẫu biểu ước thu chưa có số liệu, và một bản báo cáo B2-01 dùng để đối chiếu.

## Cấu trúc dữ liệu

| Sheet | Số dòng | Nội dung |
|-------|---------|----------|
| `Mo ta du lieu` | 4       | Hướng dẫn thao tác trên `csdltc.mof.gov.vn`: đăng nhập → Báo cáo chấp hành thu → chọn niên độ/kỳ/đơn vị tính → xuất Excel. Nêu rõ 1 kỳ báo cáo tháng N cần lấy 4–5 kỳ khác nhau (tháng N-1 năm trước, lũy kế N-1 năm trước, lũy kế N-1 năm nay, tháng N năm nay, lũy kế N năm nay). |
| `Mẫu biểu cần báo cáo` | 1\.288 (Biểu 01: dòng 1–105) | **Biểu số 01 "Ước thu NSNN"** — 20 chỉ tiêu, 38 cột số, header 4 tầng (dòng 8–11), dòng 12 đánh số cột kèm công thức tham chiếu (`29=21/9`...). Toàn bộ ô số **chưa có dữ liệu** — là mẫu trống. |
| `Biểu báo cáo` | 209 (189 dòng chỉ tiêu) |          |
| `Sheet6` | 12      | Ghi chú quy trình kết xuất báo cáo ước thu tháng 2/2025, tương tự `Mo ta du lieu`. |

## Data Dictionary

Sheet `Biểu báo cáo` có cấu trúc giống hệt mẫu B2-01 — xem [KB-B201-TP25](kbnn-b201-toan-thanh-pho-2025.md) để có data dictionary đầy đủ, không lặp lại ở đây.

## Liên kết với file khác

* [TMS-SPEC](https://uat-outline.thehegeo.com/doc/tms-spec-bGSdzjvKQa) — đặc tả luồng TMS có nhắc lại rằng số tổng thể nên lấy từ `csdltc.mof.gov.vn`/KBNN thay vì tính lại từ TMS.

## Vấn đề / Lưu ý

* Biểu 01 (`Mẫu biểu cần báo cáo`) hoàn toàn chưa có số liệu — chỉ dùng để tham khảo cấu trúc cột khi cần dựng báo cáo ước thu.