import { useEffect, useRef, useState } from "react";
import { geoMercator, geoPath, type GeoPath } from "d3-geo";
import { select, type Selection } from "d3-selection";
import { zoom, zoomIdentity, type ZoomBehavior } from "d3-zoom";
import "d3-transition";
import { Card, money } from "@/components/primitives";

// Ranh giới Hà Nội sau phép chiếu Mercator cao hơn rộng (tỉ lệ ≈ 5:6). Khung
// vuông cũ để thừa lề hai bên mà vẫn cao bằng đúng chiều rộng thẻ.
const W = 500;
const H = 600;
/** Thang đơn sắc lam: nhạt là thấp, đậm là cao. */
const BINS = ["#86b6ef", "#5598e7", "#2a78d6", "#1c5cab", "#0d366b"];
const NO_DATA = "#e5eaf1";

export interface MapRow {
  id: string;
  slug: string;
  name: string;
  amount: number;
}

interface Feature {
  properties: { name: string; name_slug: string };
}

/**
 * Bản đồ 126 phường/xã dựng từ GeoJSON ranh giới thật — không vẽ hình gần đúng.
 * Bản đồ và danh sách dùng chung `selectedId`, nên bấm ở đâu cũng cho cùng kết quả.
 * Luôn kèm một bảng thay thế cho người không dùng được bản đồ.
 */
export function LocationMap({
  rows,
  selectedId,
  onSelect,
}: {
  rows: MapRow[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const boxRef = useRef<HTMLDivElement | null>(null);
  const tipRef = useRef<HTMLDivElement | null>(null);
  const store = useRef<{
    svg?: Selection<SVGSVGElement, unknown, null, undefined>;
    g?: Selection<SVGGElement, unknown, null, undefined>;
    paths?: Selection<SVGPathElement, Feature, SVGGElement, unknown>;
    path?: GeoPath;
    zoom?: ZoomBehavior<SVGSVGElement, unknown>;
    features?: Feature[];
  }>({});
  const [ready, setReady] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [failed, setFailed] = useState(false);
  const [showTable, setShowTable] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    (async () => {
      try {
        // Theo BASE_URL để chạy đúng cả ở gốc lẫn khi site nằm dưới một subpath
        // (GitHub Pages phục vụ ở /dashboard-NSNN/).
        const geoUrl = `${import.meta.env.BASE_URL}data/hanoi_126_wards.geojson`;
        const geo = await fetch(geoUrl, { signal: controller.signal }).then(
          (response) => {
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return response.json();
          },
        );
        if (cancelled || !svgRef.current) return;
        const svg = select(svgRef.current)
          .attr("viewBox", `0 0 ${W} ${H}`)
          .attr("preserveAspectRatio", "xMidYMid meet");
        const g = svg.append("g");
        const path = geoPath(geoMercator().fitSize([W, H], geo));
        const zoomBehavior = zoom<SVGSVGElement, unknown>()
          .scaleExtent([1, 12])
          // Kéo để di chuyển. Lăn chuột trần là phóng to/thu nhỏ — không bắt
          // người dùng đoán ra tổ hợp phím.
          //
          // Một ngoại lệ giữ cho trang không bị khoá: khi bản đồ đã ở mức toàn
          // thành phố mà vẫn lăn xuống (tức đòi thu nhỏ thêm) thì không còn gì
          // để thu, nhường sự kiện lại cho trang cuộn. Nhờ đó cuộn dọc qua bản
          // đồ vẫn trôi bình thường thay vì mắc kẹt tại đó.
          .filter(function (this: SVGSVGElement, event: any) {
            if (event.type !== "wheel") return !event.ctrlKey && !event.button;
            const atCityLevel = ((this as any).__zoom?.k ?? 1) <= 1.001;
            return !(atCityLevel && event.deltaY > 0);
          })
          .on("zoom", (event) => {
            g.attr("transform", event.transform.toString());
            setZoomLevel(event.transform.k);
          });
        svg.call(zoomBehavior);

        const paths = g
          .selectAll<SVGPathElement, Feature>("path")
          .data(geo.features as Feature[])
          .join("path")
          .attr("d", (d) => path(d as never))
          .attr("fill", NO_DATA)
          .attr("stroke", "#fff")
          .attr("stroke-width", 0.7);

        store.current = { svg, g, paths, path, zoom: zoomBehavior, features: geo.features };
        setReady(true);
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();
    return () => {
      cancelled = true;
      controller.abort();
      store.current.svg?.interrupt().on(".zoom", null);
      store.current.g?.remove();
      store.current = {};
    };
  }, []);

  useEffect(() => {
    const { paths, svg, path, zoom: zoomBehavior, features } = store.current;
    if (!ready || !paths || !svg || !zoomBehavior || !tipRef.current) return;

    const bySlug = new Map(rows.map((row) => [row.slug, row]));
    const max = Math.max(0, ...rows.map((row) => row.amount));
    const binOf = (amount: number) =>
      BINS[Math.max(0, Math.min(4, Math.floor((amount / (max || 1)) * 5 - 1e-9)))];
    const tip = tipRef.current;
    const selectedSlug = rows.find((row) => row.id === selectedId)?.slug ?? null;

    paths
      .on("mousemove", (event: MouseEvent, feature: Feature) => {
        const box = boxRef.current!.getBoundingClientRect();
        const row = bySlug.get(feature.properties.name_slug);
        tip.style.opacity = "1";
        tip.style.left = `${event.clientX - box.left + 12}px`;
        tip.style.top = `${event.clientY - box.top + 12}px`;
        tip.innerHTML = `<b>${feature.properties.name}</b><br>${row ? money(row.amount) : "chưa có số liệu"}`;
      })
      .on("mouseleave", () => {
        tip.style.opacity = "0";
      })
      .on("click", (_event: MouseEvent, feature: Feature) => {
        const row = bySlug.get(feature.properties.name_slug);
        if (row) onSelect(row.id);
      })
      .classed("is-selected", (d) => d.properties.name_slug === selectedSlug)
      .transition()
      .duration(400)
      .attr("fill", (d) => {
        const row = bySlug.get(d.properties.name_slug);
        return row ? binOf(row.amount) : NO_DATA;
      });

    const selected = selectedSlug
      ? features?.find((f) => f.properties.name_slug === selectedSlug)
      : null;
    if (!selected || !path) {
      svg.transition().duration(400).call(zoomBehavior.transform, zoomIdentity);
      return;
    }
    paths.filter((d) => d.properties.name_slug === selectedSlug).raise();
    const [[x0, y0], [x1, y1]] = path.bounds(selected as never);
    const width = x1 - x0;
    const height = y1 - y0;
    if (!width || !height) return;
    // Phóng có trần: đưa mắt tới địa bàn đang chọn nhưng vẫn giữ các phường, xã
    // quanh nó trong khung. Lấp đầy khung bằng một ô là mất bối cảnh so sánh —
    // mà so sánh mới là lý do tồn tại của bản đồ nhiệt. Nút "Toàn thành phố"
    // luôn nằm sẵn ở góc để quay về.
    const scale = Math.min(3, Math.min(W / width, H / height) / 1.4);
    svg
      .transition()
      .duration(450)
      .call(
        zoomBehavior.transform,
        zoomIdentity.translate(W / 2, H / 2).scale(scale).translate(-(x0 + x1) / 2, -(y0 + y1) / 2),
      );
  }, [ready, rows, selectedId, onSelect]);

  const scaleBy = (factor: number) => {
    const { svg, zoom: zoomBehavior } = store.current;
    if (svg && zoomBehavior) svg.transition().duration(250).call(zoomBehavior.scaleBy, factor);
  };
  const resetZoom = () => {
    const { svg, zoom: zoomBehavior } = store.current;
    if (svg && zoomBehavior)
      svg.transition().duration(350).call(zoomBehavior.transform, zoomIdentity);
  };

  return (
    <Card
      className="dmap-card"
      title="Bản đồ 126 phường, xã"
      subtitle="Ranh giới hành chính từ 01/07/2025 · lăn chuột để phóng to, kéo để di chuyển"
      actions={
        <button
          type="button"
          className="dlink"
          onClick={() => setShowTable((value) => !value)}
          aria-expanded={showTable}
        >
          {showTable ? "Xem bản đồ" : "Xem dạng bảng"}
        </button>
      }
    >
      {failed && (
        <p className="dnote is-warn" role="alert">
          Không tải được ranh giới bản đồ. Danh sách bên trái vẫn dùng được bình thường.
        </p>
      )}

      {showTable ? (
        <div className="dtable-wrap dmap-table">
          <table className="dtable">
            <caption className="sr-only">Số thu theo phường, xã — bảng thay thế bản đồ</caption>
            <thead>
              <tr>
                <th scope="col">#</th>
                <th scope="col">Phường, xã</th>
                <th scope="col" className="is-num">Số thu</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={row.id} aria-selected={row.id === selectedId}>
                  <td className="is-num">{index + 1}</td>
                  <th scope="row">
                    <button type="button" className="dlink" onClick={() => onSelect(row.id)}>
                      {row.name}
                    </button>
                  </th>
                  <td className="is-num">{money(row.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="dmap" ref={boxRef} hidden={failed}>
          <svg ref={svgRef} role="img" aria-label="Bản đồ số thu theo phường, xã" />
          <div className="dmap-tip" ref={tipRef} aria-hidden="true" />
          {/* Lăn chuột trần để cuộn trang, nên phóng to phải có nút thấy được
              chứ không chỉ trông vào Ctrl kèm lăn chuột — thao tác đó không ai
              đoán ra, và trên màn cảm ứng thì không có. */}
          <div className="dmap-zoom">
            <button type="button" onClick={() => scaleBy(1.6)} aria-label="Phóng to bản đồ">
              +
            </button>
            <button type="button" onClick={() => scaleBy(1 / 1.6)} aria-label="Thu nhỏ bản đồ">
              −
            </button>
            {/* Chỉ hiện khi đang phóng: ở mức ban đầu thì nút này không có
                việc gì làm, để đó chỉ tổ che mất bản đồ. */}
            {zoomLevel > 1.01 && (
              <button type="button" className="dmap-zoom-reset" onClick={resetZoom}>
                Toàn thành phố
              </button>
            )}
          </div>
        </div>
      )}

      <div className="dmap-legend" aria-hidden="true">
        <span>Thấp</span>
        {BINS.map((color) => (
          <i key={color} style={{ background: color }} />
        ))}
        <span>Cao</span>
        <i className="is-nodata" style={{ background: NO_DATA }} />
        <span>chưa có số liệu</span>
      </div>
      <p className="dmap-credit">© OpenStreetMap contributors (ODbL).</p>
    </Card>
  );
}
