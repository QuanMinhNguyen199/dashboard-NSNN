import { Bars, Card, Money, inScale, moneyScale, pct } from "@/components/primitives";
import { OFFICIAL_18_09 } from "@/data/official-18-09";

/** Mốc tham chiếu chung và phần dữ liệu mở rộng đã có trong tài liệu bàn giao. */
export function OfficialBudgetSnapshot({ variant }: { variant: "summary" | "details" }) {
  const { city2026, forecast2026 } = OFFICIAL_18_09;
  const values = [
    city2026.plan,
    city2026.augustActual,
    city2026.ytdAugustActual,
    forecast2026.annualEstimate,
  ];
  const unit = moneyScale(values);
  const completion = city2026.plan === 0 ? null : (city2026.ytdAugustActual / city2026.plan) * 100;
  const forecastUnit = moneyScale(forecast2026.monthlyEstimate.map((row) => row.amount));
  const locationUnit = moneyScale(OFFICIAL_18_09.locationPlans2026.map((row) => row.plan));
  const topLocations = [...OFFICIAL_18_09.locationPlans2026]
    .sort((a, b) => b.plan - a.plan)
    .slice(0, 10);

  if (variant === "summary") {
    return (
      <Card
        className="dofficial-reference"
        title="Tham chiếu điều hành 2026"
        subtitle="Số bàn giao · lũy kế 8 tháng · mốc dùng chung, không đổi theo cách xem"
        unit={unit}
      >
        <dl className="dofficial-reference-list">
          <div>
            <dt>Dự toán năm</dt>
            <dd><Money value={city2026.plan} scale={unit} /></dd>
          </div>
          <div>
            <dt>Thực hiện tháng 8</dt>
            <dd><Money value={city2026.augustActual} scale={unit} /></dd>
          </div>
          <div>
            <dt>Lũy kế 8 tháng</dt>
            <dd><Money value={city2026.ytdAugustActual} scale={unit} /></dd>
          </div>
          <div>
            <dt>Tiến độ dự toán</dt>
            <dd>{pct(completion)}</dd>
          </div>
          <div>
            <dt>Ước thực hiện cả năm</dt>
            <dd><Money value={forecast2026.annualEstimate} scale={unit} /></dd>
          </div>
        </dl>
      </Card>
    );
  }

  return (
    <details className="dofficial-snapshot">
      <summary>
        <span>Xem dữ liệu tham chiếu mở rộng</span>
        <small>
          Ước thu cuối năm và dự toán chi tiết 126 phường, xã
        </small>
      </summary>
      <div className="dstack is-compact">
      <Card
        title="Dự toán và ước thực hiện đã bàn giao"
        subtitle="Số ước được giữ riêng với số thực hiện; không dùng để thay cho kết quả đã chốt"
      >
        <div className="dstack-row">
          <section>
            <h3 className="dsubhead">Ước thu từng tháng cuối năm 2026</h3>
            <Bars
              rows={forecast2026.monthlyEstimate.map((row) => ({
                id: `forecast-${row.month}`,
                name: `Tháng ${row.month}`,
                amount: row.amount,
                previous: null,
              }))}
              money={forecastUnit}
              showMoneyUnit
            />
          </section>
          <section>
            <h3 className="dsubhead">10 địa bàn có dự toán cao nhất</h3>
            <Bars
              rows={topLocations.map((row) => ({
                id: row.id,
                name: row.name,
                amount: row.plan,
                previous: null,
              }))}
              money={locationUnit}
              showMoneyUnit
            />
          </section>
        </div>

        <details className="dforecast-table">
          <summary>Xem đầy đủ dự toán 126 phường, xã</summary>
          <div className="dtable-wrap">
            <table className="dtable is-compact dofficial-plan-table">
              <caption className="sr-only">Dự toán thu năm 2026 của 126 phường, xã</caption>
              <thead>
                <tr>
                  <th scope="col">Phường, xã</th>
                  <th scope="col" className="is-num">Tổng dự toán</th>
                  <th scope="col" className="is-num">Trừ tiền sử dụng đất</th>
                  <th scope="col" className="is-num">Tiền sử dụng đất</th>
                </tr>
              </thead>
              <tbody>
                {OFFICIAL_18_09.locationPlans2026.map((row) => (
                  <tr key={row.id}>
                    <th scope="row">{row.name}</th>
                    <td className="is-num" data-label="Tổng dự toán">{inScale(row.plan, locationUnit)}</td>
                    <td className="is-num" data-label="Trừ tiền sử dụng đất">
                      {inScale(row.planExcludingLandUse, locationUnit)}
                    </td>
                    <td className="is-num" data-label="Tiền sử dụng đất">
                      {inScale(row.components.landUse ?? 0, locationUnit)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <th scope="row">Cộng 126 địa bàn</th>
                  <td className="is-num" data-label="Tổng dự toán">
                    {inScale(OFFICIAL_18_09.locationPlanTotal, locationUnit)}
                  </td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            </table>
          </div>
        </details>
      </Card>
      </div>
    </details>
  );
}
