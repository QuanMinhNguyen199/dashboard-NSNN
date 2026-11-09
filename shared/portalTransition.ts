import './portalTransition.css';

const key = 'portal-login-motion-v1';
const ease = 'cubic-bezier(0.16, 1, 0.3, 1)';
type Flight = { src: string; time: number; title: string; loadingAt?: number };
let flight: Flight | null = null;
let overlay: HTMLDivElement | null = null;
let safety: number | undefined;
let arriving = false;
const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const isLoginTransitionActive = () => flight !== null;

function remember(value: Flight | null) {
  flight = value;
  try {
    if (value) sessionStorage.setItem(key, JSON.stringify(value));
    else sessionStorage.removeItem(key);
  } catch { /* Same-document transitions still work without storage. */ }
}

function finish() {
  window.clearTimeout(safety);
  overlay?.remove();
  overlay = null;
  arriving = false;
  remember(null);
  document.documentElement.removeAttribute('data-portal-entering');
  document.documentElement.removeAttribute('data-portal-revealing');
  const root = document.getElementById('root');
  if (root) {
    root.inert = false;
  }
}

function stage(src: string, title: string) {
  if (overlay) return overlay;
  overlay = document.createElement('div');
  overlay.className = 'portal-flight';
  overlay.innerHTML = '<svg class="portal-flight-backdrop" aria-hidden="true" width="100%" height="100%"><defs><mask id="portal-reveal-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="100%" height="100%"><rect width="100%" height="100%" fill="white"/><circle class="portal-reveal-hole" cx="0" cy="0" r="0" fill="black"/></mask></defs><rect width="100%" height="100%" fill="#0e2a47" mask="url(#portal-reveal-mask)"/></svg><div class="portal-flight-mark"><img alt=""/></div><strong class="portal-flight-title" aria-hidden="true"></strong><p role="status" aria-live="polite" aria-label="Đang tải"><span aria-hidden="true"></span></p>';
  overlay.querySelector('img')!.src = src;
  overlay.querySelector('.portal-flight-title')!.textContent = title;
  const letters = overlay.querySelector('p > span')!;
  Array.from('...').forEach((_, index) => {
    const span = document.createElement('span');
    span.className = 'portal-loading-dot';
    span.style.animationDelay = `${index * 160}ms`;
    letters.append(span);
  });
  document.body.append(overlay);
  // A failed destination or interrupted navigation must never trap the user.
  safety = window.setTimeout(finish, 8000);
  return overlay;
}

async function play(el: Element, frames: Keyframe[], duration: number) {
  const animation = el.animate(frames, { duration, easing: ease, fill: 'forwards' });
  try { await animation.finished; } catch { /* Cancellation is a valid interruption. */ }
  animation.commitStyles?.();
  animation.cancel();
}

function markPlacement(layer: HTMLElement, mark: HTMLElement, box: { x: number; y: number; width: number; height: number }) {
  const cover = layer.getBoundingClientRect();
  const layout = getComputedStyle(mark);
  // Fixed overlays can be narrower than innerWidth when a scrollbar gutter
  // is reserved. Use the mark's actual layout origin, independent of transform.
  const width = parseFloat(layout.width);
  const height = parseFloat(layout.height);
  const x = cover.x + parseFloat(layout.left) + width / 2;
  const y = cover.y + parseFloat(layout.top) + height / 2;
  return `translate(${box.x + box.width / 2 - x}px, ${box.y + box.height / 2 - y}px) scale(${box.width / width}, ${box.height / height})`;
}

function waitForDashboard(root: HTMLElement) {
  if (!root.querySelector('.dskeleton')) return Promise.resolve();
  return new Promise<void>(resolve => {
    const done = () => { observer.disconnect(); window.clearTimeout(timeout); resolve(); };
    const observer = new MutationObserver(() => { if (!root.querySelector('.dskeleton')) done(); });
    observer.observe(root, { childList: true, subtree: true });
    // Slow or unavailable data must still expose the dashboard's loading/error UI.
    const timeout = window.setTimeout(done, 2500);
  });
}

/** The selected account is acknowledged immediately; auth remains owned by App. */
export async function departLogin(logo: HTMLImageElement, commit: () => void) {
  if (flight) return;
  const source = logo.getBoundingClientRect();
  const heading = logo.closest('.login-mark')?.querySelector<HTMLElement>('strong');
  remember({ src: logo.src, time: Date.now(), title: heading?.textContent ?? 'Quản lý nghiệp vụ Thuế' });
  const layer = stage(logo.src, flight!.title);
  const mark = layer.querySelector<HTMLElement>('.portal-flight-mark')!;
  const title = layer.querySelector<HTMLElement>('.portal-flight-title')!;
  const titleBox = title.getBoundingClientRect();
  const headingBox = heading?.getBoundingClientRect();
  const titleFrom = headingBox ? `translate(${headingBox.x + headingBox.width / 2 - (titleBox.x + titleBox.width / 2)}px, ${headingBox.y + headingBox.height / 2 - (titleBox.y + titleBox.height / 2)}px) scale(${parseFloat(getComputedStyle(heading!).fontSize) / parseFloat(getComputedStyle(title).fontSize)})` : 'none';
  const root = document.getElementById('root');
  if (root) root.inert = true;
  const from = markPlacement(layer, mark, source);
  const fade = play(layer.querySelector('.portal-flight-backdrop')!, [{ opacity: 0 }, { opacity: 1 }], reduced() ? 100 : 360);
  // Keep the source mark unique while its shared element travels.
  logo.style.visibility = 'hidden';
  if (heading) heading.style.visibility = 'hidden';
  try {
    await Promise.all([
      fade,
      play(mark, reduced() ? [{ opacity: 0 }, { opacity: 1 }] : [{ transform: from }, { transform: 'translate(0, 0) scale(1)' }], reduced() ? 100 : 560),
      play(title, reduced() ? [{ opacity: 0 }, { opacity: 1 }] : [{ transform: titleFrom }, { transform: 'translate(0, 0) scale(1)' }], reduced() ? 100 : 560),
    ]);
    layer.classList.add('is-loading');
    remember({ ...flight!, loadingAt: Date.now() });
    await play(layer.querySelector('p')!, [{ opacity: 0 }, { opacity: 1 }], reduced() ? 80 : 240);
    document.documentElement.dataset.portalEntering = '';
    commit();
  } catch (error) {
    finish();
    throw error;
  } finally {
    logo.style.visibility = '';
    if (heading) heading.style.visibility = '';
  }
}

/** Resume the same mark after either a React update or a portal document load. */
export function installLoginArrival(root: HTMLElement) {
  const arrive = () => {
    if (!flight || arriving || root.querySelector('.login-page')) return;
    const target = [...root.querySelectorAll<HTMLElement>('.brand .tax-logo, .dheader-mark i')]
      .find(el => {
        const r = el.getBoundingClientRect();
        return getComputedStyle(el).visibility === 'visible' && r.width > 0 && r.height > 0 && r.right > 0 && r.bottom > 0 && r.left < innerWidth && r.top < innerHeight;
      });
    arriving = true;
    const layer = stage(flight.src, flight.title);
    layer.classList.add('is-loading');
    root.inert = true;
    const mark = layer.querySelector<HTMLElement>('.portal-flight-mark')!;
    const title = layer.querySelector<HTMLElement>('.portal-flight-title')!;
    void (async () => {
      try {
        // Measure the destination after fonts and the mounted layout settle.
        const loadingRemaining = Math.max(0, (reduced() ? 240 : 1600) - (Date.now() - (flight!.loadingAt ?? Date.now())));
        await Promise.all([document.fonts.ready, waitForDashboard(root), new Promise(resolve => window.setTimeout(resolve, loadingRemaining))]);
        await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
        layer.classList.remove('is-loading');
        layer.classList.add('is-arriving');
        // A compact layout without a brand mark keeps the loader centered;
        // never fly the logo into an unrelated heading or menu button.
        const box = target?.getBoundingClientRect() ?? mark.getBoundingClientRect();
        const cx = box.x + box.width / 2;
        const cy = box.y + box.height / 2;
        const end = markPlacement(layer, mark, box);
        await Promise.all([
          play(mark, reduced() ? [{ opacity: 1 }, { opacity: 0 }] : [{ transform: 'translate(0, 0) scale(1)' }, { transform: end }], reduced() ? 120 : 620),
          play(title, [{ opacity: 1 }, { opacity: 0 }], reduced() ? 120 : 220),
        ]);
        layer.dataset.phase = 'reveal';
        if (reduced()) {
          document.documentElement.removeAttribute('data-portal-entering');
          await play(layer, [{ opacity: 1 }, { opacity: 0 }], 160);
        } else {
          // Expand a hole in the cover, leaving the dashboard's stacking,
          // background and fixed/sticky compositing unchanged at the handoff.
          const hole = layer.querySelector<SVGCircleElement>('.portal-reveal-hole')!;
          hole.setAttribute('cx', String(cx));
          hole.setAttribute('cy', String(cy));
          const start = Math.min(box.width, box.height) / 2;
          const radius = Math.ceil(Math.hypot(Math.max(cx, innerWidth - cx), Math.max(cy, innerHeight - cy))) + 2;
          hole.setAttribute('r', String(start));
          document.documentElement.dataset.portalRevealing = '';
          document.documentElement.removeAttribute('data-portal-entering');
          const reveal = hole.animate([
            { r: `${start}px` },
            { r: `${radius}px` },
          ], { duration: 980, easing: 'cubic-bezier(0.45, 0, 0.2, 1)', fill: 'forwards' });
          // Hand the mark to its real destination as the first aperture opens.
          await Promise.all([reveal.finished, play(mark, [{ opacity: 1 }, { opacity: 0 }], 180)]);
          hole.setAttribute('r', String(radius));
          reveal.cancel();
        }
        if (document.activeElement === document.body || !root.contains(document.activeElement)) {
          const content = root.querySelector<HTMLElement>('main');
          content?.setAttribute('tabindex', '-1');
          content?.setAttribute('data-portal-focus', '');
          content?.addEventListener('blur', () => content.removeAttribute('data-portal-focus'), { once: true });
          root.inert = false;
          content?.focus({ preventScroll: true });
        }
      } finally { finish(); }
    })();
  };
  const observer = new MutationObserver(arrive);
  observer.observe(root, { childList: true, subtree: true });
  arrive();
  return () => observer.disconnect();
}

// Restore the cover before React paints the destination (same-origin portal).
try {
  const stored: Flight | null = JSON.parse(sessionStorage.getItem(key) ?? 'null');
  if (stored && typeof stored.src === 'string' && typeof stored.title === 'string' && Date.now() - stored.time < 8000) {
    flight = stored;
    document.documentElement.dataset.portalEntering = '';
    stage(stored.src, stored.title).classList.add('is-loading');
  } else sessionStorage.removeItem(key);
} catch { /* No persisted flight to resume. */ }

