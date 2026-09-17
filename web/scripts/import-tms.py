# -*- coding: utf-8 -*-
"""Gộp chứng từ TMS thành bộ số tổng hợp cho dashboard.

    python scripts/import-tms.py <thư mục chứng từ> [tệp ra]

Chạy tay, không nằm trong build. Đọc toàn bộ file .xlsx trong thư mục chứng từ,
gộp lại rồi ghi ra một tệp JSON chỉ chứa **số đã tổng hợp**.

Ba điều quyết định tính đúng của kết quả, ghi ra đây vì chúng không hiển nhiên:

1. File trộn ba loại dòng. Dòng giao dịch có mã cơ quan thuế; dòng cộng theo mã
   số thuế chỉ có mã số thuế và số tiền; dòng tổng cộng không có cả hai. Ba loại
   có cùng một tổng, nên cộng cả file ra gấp ba lần số thật. Chỉ lấy loại đầu.

2. Các đợt chiết chồng lấn nhau. File đặt tên theo kỳ ghi sổ lấy mọi chứng từ
   ghi sổ trong kỳ đó, kể cả chứng từ hạch toán tháng trước, nên nó giao với
   file điều chỉnh `dc_ht...`. Khử trùng theo `Số hệ thống`: đã kiểm trên một
   đợt chiết, 4.105 giá trị phân biệt trên đúng 4.105 dòng, không ô nào trống.

3. Kỳ tính theo **ngày hạch toán** đọc từ dữ liệu, không theo tên thư mục. Tên
   thư mục là kỳ chiết; hai thứ đó khác nhau, và chính khoảng cách giữa chúng là
   độ trễ so với Kho bạc.

Tệp ra không chứa mã số thuế, số chứng từ hay bất kỳ trường định danh nào của
người nộp thuế. Đó là điều kiện để nó được phép nằm trong bundle.
"""
import collections
import io
import json
import os
import sys
import time

import openpyxl

sys.stdout.reconfigure(encoding="utf-8")

# Tên cột đọc từ hàng tiêu đề chứ không theo vị trí: các đợt chiết có thể khác
# số cột, và dò theo tên thì thêm cột không làm hỏng importer.
NEEDED = [
    "Cơ quan thuế",
    "Mã số thuế",
    "Chương",
    "Tiểu mục",
    "Mục",
    "ĐBHC 2 cấp",
    "Thành tiền VND",
    "Ngày hạch toán",
    "Ngày ghi sổ",
    "Ký hiệu GD",
    "Ký hiệu GD bị hủy",
    "Số hệ thống",
]


def month_of(value):
    """`YYYY-MM` của một ô ngày; None khi ô trống hoặc không phải ngày."""
    if value is None:
        return None
    if hasattr(value, "year"):
        return "%04d-%02d" % (value.year, value.month)
    text = str(value).strip()[:10]
    return text[:7] if len(text) >= 7 and text[4] == "-" else None


def code(value, width):
    """Mã hạch toán giữ số 0 đầu.

    Excel lưu cột Chương và Tiểu mục dạng số, nên `036` đọc ra thành `36`. Đặc
    tả mục 4 yêu cầu chuẩn hoá đúng chuyện này. Bỏ qua thì 35% số tiền của kỳ
    07/2025 rơi vào nhóm "Chương ngoài danh mục" chỉ vì thiếu một chữ số 0.
    """
    if value is None:
        return ""
    text = str(value).strip()
    if not text:
        return ""
    if text.endswith(".0"):
        text = text[:-2]
    return text.zfill(width) if text.isdigit() and len(text) < width else text


def blank():
    return {
        "txCount": 0,
        "amount": 0,
        "byLocation": collections.Counter(),
        "byLocationCount": collections.Counter(),
        "byTaxOffice": collections.Counter(),
        "byTaxOfficeCount": collections.Counter(),
        "byPair": collections.Counter(),
        "byChapter": collections.Counter(),
        "bySection": collections.Counter(),
        "bySubItem": collections.Counter(),
        "bySignal": collections.Counter(),
        "noLocationCount": 0,
        "noLocationAmount": 0,
        "postedFrom": None,
        "postedTo": None,
    }


def main(root, out_path):
    files = sorted(
        os.path.join(dirpath, name)
        for dirpath, _, names in os.walk(root)
        for name in names
        if name.lower().endswith(".xlsx") and not name.startswith("~$")
    )
    print("Tìm thấy %d tệp trong %s" % (len(files), root))

    periods = collections.defaultdict(blank)
    seen = set()
    skipped_rollup = 0
    skipped_dup = 0
    started = time.time()

    for index, path in enumerate(files, 1):
        size = os.path.getsize(path) / 1024 / 1024
        wb = openpyxl.load_workbook(path, read_only=True, data_only=True)
        ws = wb.worksheets[0]
        header = None
        rows_here = 0
        for raw in ws.iter_rows(values_only=True):
            if header is None:
                header = {str(v).strip(): i for i, v in enumerate(raw) if v}
                missing = [name for name in NEEDED if name not in header]
                if missing:
                    print("   BỎ QUA (thiếu cột %s): %s" % (", ".join(missing), os.path.basename(path)))
                    break
                continue
            get = lambda name: raw[header[name]] if header[name] < len(raw) else None

            # (1) Chỉ dòng giao dịch.
            office = get("Cơ quan thuế")
            if office in (None, ""):
                skipped_rollup += 1
                continue

            # (2) Khử trùng toàn cục.
            system_no = get("Số hệ thống")
            key = str(system_no).strip()
            if not key:
                continue
            if key in seen:
                skipped_dup += 1
                continue
            seen.add(key)

            # (3) Kỳ theo ngày hạch toán.
            posted = month_of(get("Ngày hạch toán"))
            if posted is None:
                continue
            bucket = periods[posted]

            amount = get("Thành tiền VND")
            amount = int(amount) if isinstance(amount, (int, float)) else 0
            text = lambda name: ("" if get(name) is None else str(get(name)).strip())
            location = text("ĐBHC 2 cấp")
            office = str(office).strip()

            bucket["txCount"] += 1
            bucket["amount"] += amount
            bucket["byTaxOffice"][office] += amount
            bucket["byTaxOfficeCount"][office] += 1
            if location:
                bucket["byLocation"][location] += amount
                bucket["byLocationCount"][location] += 1
                bucket["byPair"]["%s|%s" % (office, location)] += amount
            else:
                bucket["noLocationCount"] += 1
                bucket["noLocationAmount"] += amount
            for field, target, width in (
                ("Chương", "byChapter", 3),
                ("Mục", "bySection", 4),
                ("Tiểu mục", "bySubItem", 4),
                ("Ký hiệu GD", "bySignal", 0),
            ):
                value = code(get(field), width) if width else text(field)
                if value:
                    bucket[target][value] += amount
            booked = month_of(get("Ngày ghi sổ"))
            if booked:
                if bucket["postedFrom"] is None or booked < bucket["postedFrom"]:
                    bucket["postedFrom"] = booked
                if bucket["postedTo"] is None or booked > bucket["postedTo"]:
                    bucket["postedTo"] = booked
            rows_here += 1
        wb.close()
        print(
            "  [%2d/%2d] %6.1f MB  %6d dòng  %s"
            % (index, len(files), size, rows_here, os.path.basename(path)[:62])
        )

    out = {
        "note": (
            "Số tổng hợp từ chứng từ TMS. Chỉ dòng giao dịch, khử trùng theo Số hệ thống, "
            "kỳ theo ngày hạch toán. Không chứa mã số thuế hay số chứng từ."
        ),
        "generatedAt": time.strftime("%Y-%m-%dT%H:%M:%S"),
        "sourceFiles": len(files),
        "transactions": len(seen),
        "skippedRollupRows": skipped_rollup,
        "skippedDuplicateRows": skipped_dup,
        "periods": {},
    }
    for period in sorted(periods):
        b = periods[period]
        out["periods"][period] = {
            "txCount": b["txCount"],
            "amount": str(b["amount"]),
            "bookedFrom": b["postedFrom"],
            "bookedTo": b["postedTo"],
            "locationCoverage": {
                "withLocation": b["txCount"] - b["noLocationCount"],
                "withoutLocation": b["noLocationCount"],
                "amountWithoutLocation": str(b["noLocationAmount"]),
            },
            "byLocation": {k: str(v) for k, v in b["byLocation"].most_common()},
            "byLocationCount": dict(b["byLocationCount"].most_common()),
            "byTaxOffice": {k: str(v) for k, v in b["byTaxOffice"].most_common()},
            "byTaxOfficeCount": dict(b["byTaxOfficeCount"].most_common()),
            "byPair": {k: str(v) for k, v in b["byPair"].most_common()},
            "byChapter": {k: str(v) for k, v in b["byChapter"].most_common()},
            "bySection": {k: str(v) for k, v in b["bySection"].most_common()},
            "bySubItem": {k: str(v) for k, v in b["bySubItem"].most_common()},
            "bySignal": {k: str(v) for k, v in b["bySignal"].most_common()},
        }

    io.open(out_path, "w", encoding="utf-8", newline="\n").write(
        json.dumps(out, ensure_ascii=False, indent=1) + "\n"
    )
    print("\nXong sau %.0f giây." % (time.time() - started))
    print("  giao dịch    : %s" % format(len(seen), ",d").replace(",", "."))
    print("  bỏ dòng cộng : %s" % format(skipped_rollup, ",d").replace(",", "."))
    print("  bỏ dòng trùng: %s" % format(skipped_dup, ",d").replace(",", "."))
    for period in sorted(out["periods"]):
        p = out["periods"][period]
        covered = p["locationCoverage"]["withLocation"]
        print(
            "  %s: %s giao dịch, %s đ, có địa bàn %.1f%%"
            % (
                period,
                format(p["txCount"], ",d").replace(",", "."),
                format(int(p["amount"]), ",d").replace(",", "."),
                100 * covered / max(1, p["txCount"]),
            )
        )
    print("  ghi ra: %s (%.0f KB)" % (out_path, os.path.getsize(out_path) / 1024))


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(__doc__)
        raise SystemExit(2)
    main(sys.argv[1], sys.argv[2] if len(sys.argv) > 2 else "src/data/tms-actuals.json")
