# Data dictionary _ Mô tả các file excel

## Đặc tả 

| File | Vai trò |
|:-----|---------|
| [Thu NSNN_kho bạc](./Data%20dictionary%20_%20M%C3%B4%20t%E1%BA%A3%20c%C3%A1c%20file%20excel/Thu%20NSNN_kho%20b%E1%BA%A1c.md) | Quy trình kết xuất từ csdltc.mof.gov.vn + mẫu Biểu 01 "Ước thu" + 1 bản B2-01 khác kỳ kết sổ |
| [TMS-SPEC](./Data%20dictionary%20_%20M%C3%B4%20t%E1%BA%A3%20c%C3%A1c%20file%20excel/TMS-SPEC.md) | Đặc tả yêu cầu gốc — 6 bước nghiệp vụ, nguyên tắc lấy số, 8 mẫu báo cáo |
| [DANH_BA](./Data%20dictionary%20_%20M%C3%B4%20t%E1%BA%A3%20c%C3%A1c%20file%20excel/MAP%20danh%20b%E1%BA%A1%20theo%20ng%C3%A0nh%20ngh%E1%BB%81%20kinh%20doanh.md) | Danh bạ người nộp thuế kèm mã ngành nghề đã chuẩn hóa — nguồn duy nhất cho Bước 5 |
| [Map sử dụng báo cáo](./Data%20dictionary%20_%20M%C3%B4%20t%E1%BA%A3%20c%C3%A1c%20file%20excel/Map%20s%E1%BB%AD%20d%E1%BB%A5ng%20b%C3%A1o%20c%C3%A1o_Kho%20b%E1%BA%A1c%20vs%20TMS.md) | Bộ 4 bảng ánh xạ — ký hiệu giao dịch, CQT-ĐBHC toàn quốc, cầu nối chỉ tiêu TMS↔KBNN |
| [Danh mục Chương & Tiểu mục MLNS](./Data%20dictionary%20_%20M%C3%B4%20t%E1%BA%A3%20c%C3%A1c%20file%20excel/Danh%20m%E1%BB%A5c%20Ch%C6%B0%C6%A1ng%20&%20Ti%E1%BB%83u%20m%E1%BB%A5c%20MLNS.md) | Danh mục Chương & Tiểu mục MLNS (rút gọn) kèm cảnh báo hiệu lực văn bản |
| [MAP 6334](./Data%20dictionary%20_%20M%C3%B4%20t%E1%BA%A3%20c%C3%A1c%20file%20excel/MAP%206334.md) | Ánh xạ ĐBHC & CQT riêng Hà Nội, kèm bảng đối chiếu 63→34 tỉnh/thành |
| [So thu 2015-2025.xlsx](./Data%20dictionary%20_%20M%C3%B4%20t%E1%BA%A3%20c%C3%A1c%20file%20excel/S%E1%BB%95%20thu%202015-2025.md) | Chuỗi dự toán và thực hiện thu NSNN 2015–2026 (tham chiếu, không tham gia luồng TMS) |
| [Dự toán thu NSNN 2026 cho 126 xã, phường](./Data%20dictionary%20_%20M%C3%B4%20t%E1%BA%A3%20c%C3%A1c%20file%20excel/D%E1%BB%B1%20to%C3%A1n%20thu%20NSNN%202026%20cho%20126%20x%C3%A3,%20ph%C6%B0%E1%BB%9Dng.md) | Phương án đề xuất phân bổ dự toán thu NSNN 2026 cho 126 xã, phường |
| [Dữ liệu chứng từ thu NSNN trích từ TMS — cách đọc tên file và nội dung](/doc/5183e718-a819-4e0d-865f-c5507cb639a1) | Quy ước đặt tên file TMS, hai mốc thời gian, quy tắc gộp file theo kỳ |
| [Báo cáo thu NSNN trích từ KBNN — cách đọc đường dẫn và tên file](/doc/07789dd7-af62-4484-91d6-29c9b5a2b7c2) | Quy ước đường dẫn MinIO, tên file, metadata các báo cáo KBNN |

## Dữ liệu mẫu KBNN

| Mã  | Tên file gốc | Vai trò |
|-----|--------------|---------|
| `KB-B201-TP25` | Kho bạc/b2-01-bc-ns__toan-thanh-pho__b201-dbkb-stcptc__excel2007_2025.xlsx | Báo cáo thu và vay NSNN toàn thành phố Hà Nội, niên độ 2025 (kết sổ 25/08/2026) |
| `KB-B201-TP24` | Kho bạc/b2-01-bc-ns__toan-thanh-pho__b201-dbkb-stcptc__excel2007_2024.xlsx | Báo cáo thu và vay NSNN toàn thành phố Hà Nội, niên độ 2024 (kết sổ 25/08/2026) |
| `KB-B201-BD25` | Kho bạc/b2-01-bc-ns__00004-phuong-ba-dinh__b201-dbkb-stcptc__excel2007_2025.xlsx | Báo cáo thu và vay NSNN phường Ba Đình (mã 00004), niên độ 2025 |
| `KB-B201-BD24` | Kho bạc/b2-01-bc-ns__00004-phuong-ba-dinh__b201-dbkb-stcptc__excel2007_2024.xlsx | Báo cáo thu và vay NSNN phường Ba Đình (mã 00004), niên độ 2024 |
| `KB-THCQT25` | Kho bạc/tt-bc-thcqt__toan-thanh-pho__mb-tt-bc-thcqt__excel2007_2025.xlsx | Tổng hợp số thu NSNN theo cơ quan thuế quản lý — niên độ 2025, 25 cột "Thuế cơ sở" |
| `KB-THCQT24` | Kho bạc/tt-bc-thcqt__toan-thanh-pho__mb-tt-bc-thcqt__excel2007_2024.xlsx | Tổng hợp số thu NSNN theo cơ quan thuế quản lý — niên độ 2024, 16 cột "Thuế cơ sở" |


## **Dữ liệu mẫu trên TMS**

| Mã  | Tên file gốc | Vai trò |
|-----|--------------|---------|
| `TMS-02` | TMS/tms_ns01_cqt0101-0157_dc_ht20260201-20260228_ghiso20260301-20260331.xlsx | Chứng từ chi tiết trích TMS — hạch toán 02/2026, ghi sổ 03/2026, 31 CQT Hà Nội |
| `TMS-02-DNL` | TMS/tms_ns01_cqt0101-0157_dc_ht20260201-20260228_ghiso20260301-20260331_dnl.xlsx | Nhánh CCT Doanh nghiệp lớn + CCT Thương mại điện tử, cùng kỳ với TMS-02 |