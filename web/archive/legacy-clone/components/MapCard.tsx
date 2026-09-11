import { useEffect, useRef, useState } from "react";
import { geoMercator, geoPath, type GeoPath, type GeoProjection } from "d3-geo";
import { select, type Selection } from "d3-selection";
import { zoom, zoomIdentity, zoomTransform, type ZoomBehavior } from "d3-zoom";
import "d3-transition";
import { Card } from "./Card";
import { money } from "../lib/format";
import { areaEra } from "../lib/periods";
import { useFilters } from "../state/FiltersProvider";
import { useGlobalLoading } from "../state/LoadingProvider";
import type { ByWardRow } from "../lib/types";

const RESET_EVENT = "nsnn:reset-zoom";
const W = 800;
const H = 800;

/** `T6` — nút Reset zoom phát sự kiện toàn cục. */
export function requestResetZoom(): void {
  window.dispatchEvent(new Event(RESET_EVENT));
}

/** `RA` — đọc 5 bậc màu và màu "chưa có số liệu" từ CSS variable. */
function readBins() {
  const styles = getComputedStyle(document.documentElement);
  return {
    bins: ["--m1", "--m2", "--m3", "--m4", "--m5"].map((name) =>
      styles.getPropertyValue(name).trim(),
    ),
    nodata: styles.getPropertyValue("--nodata").trim(),
  };
}

/** `k6` — chia bậc theo tỷ lệ trên max, không phải quantile. */
const binIndex = (ratio: number) => Math.max(0, Math.min(4, Math.floor(ratio * 5 - 1e-9)));

interface Feature {
  properties: { name: string; name_slug: string };
}

/** `$A` — chọn GeoJSON và chế độ hiển thị theo kỳ đang lọc. */
export function MapCard({ wardRows }: { wardRows: ByWardRow[] }) {
  const { year, quarter, month } = useFilters();
  const era = areaEra(year, quarter, month);
  const preview = era === "unknown" || era === "mixed";
  const historical = era === "historical";
  const source = historical
    ? "/data/hanoi_30_districts_pre_2025.geojson"
    : "/data/hanoi_126_wards.geojson";

  return (
    <MapCanvas
      key={`${source}:${preview}`}
      source={source}
      historical={historical}
      preview={preview}
      wardRows={historical || preview ? [] : wardRows}
    />
  );
}

/** `C6` — SVG bản đồ, tooltip, chọn vùng, zoom/reset. */
function MapCanvas({
  wardRows,
  source,
  historical,
  preview,
}: {
  wardRows: ByWardRow[];
  source: string;
  historical: boolean;
  preview: boolean;
}) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const tipRef = useRef<HTMLDivElement | null>(null);
  const legendRef = useRef<HTMLDivElement | null>(null);
  const boxRef = useRef<HTMLDivElement | null>(null);
  const { wardSlug, selectWard, district, selectDistrict } = useFilters();
  const selectedSlug = historical ? district : wardSlug;
  const { start, end } = useGlobalLoading();
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  const store = useRef<{
    svg?: Selection<SVGSVGElement, unknown, null, undefined>;
    g?: Selection<SVGGElement, unknown, null, undefined>;
    paths?: Selection<SVGPathElement, Feature, SVGGElement, unknown>;
    geo?: { features: Feature[] };
    path?: GeoPath;
    zoom?: ZoomBehavior<SVGSVGElement, unknown>;
  }>({});

  // Tải GeoJSON và dựng SVG một lần cho mỗi nguồn.
  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    start();
    (async () => {
      try {
        const geo = await fetch(source, { signal: controller.signal }).then((res) => {
          if (!res.ok) throw new Error(`Map HTTP ${res.status}`);
          return res.json();
        });
        if (cancelled || !svgRef.current) return;

        const svg = select(svgRef.current)
          .attr("viewBox", `0 0 ${W} ${H}`)
          .attr("preserveAspectRatio", "xMidYMid meet");
        const g = svg.append("g");
        const projection: GeoProjection = geoMercator().fitSize([W, H], geo);
        const path = geoPath(projection);
        const zoomBehavior = zoom<SVGSVGElement, unknown>()
          .scaleExtent([1, 12])
          // Kéo để pan; chỉ Ctrl+wheel mới zoom, wheel thường vẫn cuộn trang.
          .filter((event: any) => (event.type !== "wheel" ? !event.ctrlKey && !event.button : event.ctrlKey))
          .on("zoom", (event) => g.attr("transform", event.transform.toString()));
        svg.call(zoomBehavior);

        const paths = g
          .selectAll<SVGPathElement, Feature>("path")
          .data(geo.features as Feature[])
          .join("path")
          .attr("d", (d) => path(d as any))
          .attr("fill", "var(--nodata)")
          .attr("stroke", "#fff")
          .attr("stroke-width", 0.7);

        store.current = { svg, g, paths, geo, path, zoom: zoomBehavior };
        setReady(true);
      } catch {
        if (!cancelled) setFailed(true);
      } finally {
        end();
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
      store.current.svg?.interrupt().on(".zoom", null);
      store.current.paths?.interrupt();
      store.current.g?.remove();
      store.current = {};
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source]);

  // Tô màu, tooltip, zoom vào vùng đang chọn.
  useEffect(() => {
    const { paths, geo, svg, path, zoom: zoomBehavior } = store.current;
    if (!ready || !paths || !geo || !svg || !path || !zoomBehavior || !tipRef.current) return;

    const { bins, nodata } = readBins();
    const bySlug = new Map(wardRows.map((row) => [row.name_slug, row]));
    const max = Math.max(0, ...wardRows.map((row) => row.amount));
    const fillFor = (amount?: number) =>
      amount == null ? nodata : max ? bins[binIndex(amount / max)] : bins[0];

    const tip = tipRef.current;
    const selected = selectedSlug
      ? (geo.features.find((f) => f.properties.name_slug === selectedSlug) ?? null)
      : null;
    const boxRect = () => boxRef.current!.getBoundingClientRect();

    const describe = (feature: Feature) =>
      historical
        ? "Ranh giới quận/huyện trước 01/07/2025"
        : preview
          ? "Ranh giới phường/xã từ 01/07/2025"
          : bySlug.has(feature.properties.name_slug)
            ? money(bySlug.get(feature.properties.name_slug)!.amount)
            : "chưa có số liệu";

    // Tooltip của vùng đang chọn được giữ lại sau khi rời chuột.
    const pinTooltip = () => {
      if (!selected || !svgRef.current || !boxRef.current) {
        tip.style.opacity = "0";
        return;
      }
      const svgRect = svgRef.current.getBoundingClientRect();
      const box = boxRect();
      const transform = zoomTransform(svg.node()!);
      const [cx, cy] = transform.apply(path.centroid(selected as any));
      tip.style.opacity = "1";
      tip.style.left = `${svgRect.left - box.left + (cx / W) * svgRect.width}px`;
      tip.style.top = `${svgRect.top - box.top + (cy / H) * svgRect.height}px`;
      tip.innerHTML = `<b>${selected.properties.name}</b><br>${describe(selected)}`;
    };

    paths
      .on("mousemove", (event: MouseEvent, feature: Feature) => {
        const box = boxRect();
        tip.style.opacity = "1";
        tip.style.left = `${event.clientX - box.left + 12}px`;
        tip.style.top = `${event.clientY - box.top + 12}px`;
        tip.innerHTML = `<b>${feature.properties.name}</b><br>${describe(feature)}`;
      })
      .on("mouseleave", pinTooltip)
      .on("click", (_event: MouseEvent, feature: Feature) => {
        if (historical) {
          selectDistrict(feature.properties.name_slug);
          return;
        }
        const row = bySlug.get(feature.properties.name_slug);
        if (row) selectWard(row.location_code);
      })
      .classed("ward-hl", (d) => d.properties.name_slug === selectedSlug)
      .transition()
      .duration(450)
      .attr("fill", (d) => fillFor(bySlug.get(d.properties.name_slug)?.amount));

    if (selected)
      paths.filter((d) => d.properties.name_slug === selected.properties.name_slug).raise();

    if (!selected) {
      svg.transition().duration(500).call(zoomBehavior.transform, zoomIdentity);
      tip.style.opacity = "0";
    } else {
      const [[x0, y0], [x1, y1]] = path.bounds(selected as any);
      const width = x1 - x0;
      const height = y1 - y0;
      if (width && height) {
        const scale = Math.min(12, Math.min(W / width, H / height) / 1.4);
        const transform = zoomIdentity
          .translate(W / 2, H / 2)
          .scale(scale)
          .translate(-(x0 + x1) / 2, -(y0 + y1) / 2);
        svg
          .transition()
          .duration(500)
          .call(zoomBehavior.transform, transform)
          .on("end", pinTooltip);
      } else {
        pinTooltip();
      }
    }
  }, [ready, wardRows, selectedSlug, selectWard, selectDistrict, historical, preview]);

  // Reset zoom về identity trong ~400ms, giữ nguyên địa bàn đang chọn.
  useEffect(() => {
    const onReset = () => {
      const { svg, zoom: zoomBehavior } = store.current;
      if (svg && zoomBehavior)
        svg.transition().duration(400).call(zoomBehavior.transform, zoomIdentity);
    };
    window.addEventListener(RESET_EVENT, onReset);
    return () => window.removeEventListener(RESET_EVENT, onReset);
  }, []);

  // Legend: 5 bậc, bậc thứ tư không có chữ, cuối cùng là "chưa có số liệu".
  useEffect(() => {
    if (!ready || !legendRef.current) return;
    const { bins, nodata } = readBins();
    // Thang liên tục chỉ ghi hai đầu mút; bản gốc ghi 4/5 nhãn nên bậc thứ tư
    // trống trơ giữa chú giải.
    const labels = ["Thấp", "", "", "", "Cao"];
    legendRef.current.innerHTML =
      labels.map((text, i) => `<i style="background:${bins[i]}"></i>${text}`).join("") +
      `<i style="background:${nodata}"></i>chưa có số liệu`;
  }, [ready]);

  return (
    <Card
      title={
        historical
          ? "Bản đồ 30 quận/huyện trước 01/07/2025"
          : "Bản đồ 126 phường/xã từ 01/07/2025"
      }
      className="lg:sticky lg:top-4"
    >
      {failed && (
        <p role="alert" className="text-sm text-muted">
          Không tải được bản đồ. Vui lòng thử tải lại trang.
        </p>
      )}
      <div ref={boxRef} className="relative">
        <svg
          ref={svgRef}
          className="w-full [&_path]:cursor-pointer [&_path]:stroke-white [&_path.ward-hl]:stroke-ink [&_path.ward-hl]:stroke-1"
        />
        <div
          ref={tipRef}
          className="pointer-events-none absolute z-50 rounded-[.3rem] bg-[#111c] px-2.5 py-1.5 text-[.82rem] text-white opacity-0 transition-opacity"
        />
      </div>
      {!historical && (
        <p className="mt-2 text-xs text-muted">© OpenStreetMap contributors (ODbL).</p>
      )}
      <div
        style={historical || preview || failed ? { display: "none" } : undefined}
        ref={legendRef}
        className="mt-2.5 flex flex-wrap items-center gap-1.5 text-[.76rem] text-muted [&_i]:mr-1 [&_i]:inline-block [&_i]:h-2.5 [&_i]:w-2.5 [&_i]:rounded-sm"
      />
    </Card>
  );
}
