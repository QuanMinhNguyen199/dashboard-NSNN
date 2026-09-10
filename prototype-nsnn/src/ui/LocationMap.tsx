import { useEffect, useRef, useState } from "react";
import { geoMercator, geoPath, type GeoPath } from "d3-geo";
import { select, type Selection } from "d3-selection";
import { zoom, zoomIdentity, type ZoomBehavior } from "d3-zoom";
import "d3-transition";
import { Card, money } from "./primitives";

const W = 800;
const H = 800;
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
  const [failed, setFailed] = useState(false);
  const [showTable, setShowTable] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    (async () => {
      try {
        const geo = await fetch("/data/hanoi_126_wards.geojson", { signal: controller.signal }).then(
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
          // Kéo để pan; chỉ Ctrl+wheel mới phóng to, wheel thường vẫn cuộn trang.
          .filter((event: any) =>
            event.type !== "wheel" ? !event.ctrlKey && !event.button : event.ctrlKey,
          )
          .on("zoom", (event) => g.attr("transform", event.transform.toString()));
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
    if (!ready || !paths || !svg || !path || !zoomBehavior || !tipRef.current) return;

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
    if (!selected) {
      svg.transition().duration(400).call(zoomBehavior.transform, zoomIdentity);
      return;
    }
    paths.filter((d) => d.properties.name_slug === selectedSlug).raise();
    const [[x0, y0], [x1, y1]] = path.bounds(selected as never);
    const width = x1 - x0;
    const height = y1 - y0;
    if (!width || !height) return;
    const scale = Math.min(12, Math.min(W / width, H / height) / 1.4);
    svg
      .transition()
      .duration(450)
      .call(
        zoomBehavior.transform,
        zoomIdentity.translate(W / 2, H / 2).scale(scale).translate(-(x0 + x1) / 2, -(y0 + y1) / 2),
      );
  }, [ready, rows, selectedId, onSelect]);

  return (
    <Card
      title="Bản đồ 126 phường, xã"
      subtitle="Ranh giới hành chính từ 01/07/2025 · Ctrl kèm lăn chuột để phóng to"
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
