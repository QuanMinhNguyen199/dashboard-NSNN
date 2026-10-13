/** Shared motion lifecycle for both portal applications. The caller supplies its
 * local Motion import so either application can be built independently. */
type Animation = { cancel: () => void; finished: Promise<unknown> };
type Driver = (target: HTMLElement, keyframes: {
  opacity: number[];
  transform?: string[];
}, options: {
  duration: number;
  ease: [number, number, number, number];
}) => Animation;

const surfaces = '[data-motion], .workspace-view, .panel, .dworkspace > *, .login-page, .mobile-drawer, .case-detail, .toast, .ddrawer, dialog[open]';

export function installWebMotion(root: HTMLElement, animate: Driver) {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const running = new Map<HTMLElement, { animation: Animation; restore: () => void }>();
  const pending = new Set<HTMLElement>();
  let frame = 0;
  let disposed = false;

  const stop = (el: HTMLElement) => {
    const active = running.get(el);
    running.delete(el);
    active?.animation.cancel();
    active?.restore();
  };
  const reset = () => {
    cancelAnimationFrame(frame);
    frame = 0;
    pending.clear();
    for (const el of running.keys()) stop(el);
  };
  const play = (el: HTMLElement, feedback = false) => {
    stop(el);
    if (disposed || reduced.matches || document.hidden || !el.isConnected) return;
    const box = el.getBoundingClientRect();
    if (!box.width || !box.height || box.bottom < 0 || box.top > innerHeight) return;
    const overlay = el.matches('.mobile-drawer, .ddrawer, .toast, dialog');
    const properties = overlay ? ['opacity', 'transform'] : ['opacity'];
    const original = properties.map((name) => ({ name, value: el.style.getPropertyValue(name), priority: el.style.getPropertyPriority(name) }));
    const restore = () => {
      for (const { name, value, priority } of original) {
        if (value) el.style.setProperty(name, value, priority);
        else el.style.removeProperty(name);
      }
    };
    const transform = overlay ? getComputedStyle(el).transform : 'none';
    const animation = animate(el, {
      // Default markup is fully visible; data never counts up or waits to render.
      opacity: [feedback ? 0.65 : 0.78, 1],
      ...(overlay ? { transform: [`translateY(8px)${transform === 'none' ? '' : ` ${transform}`}`, transform] } : {}),
    }, {
      duration: feedback ? 0.12 : overlay ? 0.24 : 0.18,
      ease: [0.33, 1, 0.68, 1],
    });
    running.set(el, { animation, restore });
    const complete = () => { if (running.get(el)?.animation === animation) stop(el); };
    // Wait for every animated property before restoring the original inline styles.
    void animation.finished.then(complete, complete);
  };
  const queue = (el: HTMLElement) => {
    pending.add(el);
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      const targets = [...pending];
      pending.clear();
      // Animate a changed region once, not every nested card/table in it.
      for (const target of targets) {
        if (!targets.some((parent) => parent !== target && parent.contains(target))) play(target);
      }
      for (const el of running.keys()) if (!el.isConnected) stop(el);
    });
  };
  const discover = (node: Node) => {
    if (!(node instanceof HTMLElement)) return;
    if (node.matches(surfaces)) queue(node);
    node.querySelectorAll<HTMLElement>(surfaces).forEach(queue);
  };
  const observer = new MutationObserver((records) => {
    if (reduced.matches || document.hidden) return;
    for (const record of records) {
      if (record.type === 'childList') record.addedNodes.forEach(discover);
      else if (record.target instanceof HTMLElement && record.target.matches(surfaces)) queue(record.target);
    }
  });
  observer.observe(root, { subtree: true, childList: true, attributes: true, attributeFilter: ['data-motion-key', 'open'] });
  const click = (event: MouseEvent) => {
    if (!(event.target instanceof Element)) return;
    const button = event.target.closest<HTMLButtonElement>('button');
    if (button && root.contains(button) && !button.disabled && button.getAttribute('aria-disabled') !== 'true') play(button, true);
  };
  const visibility = () => { if (document.hidden) reset(); };
  root.addEventListener('click', click);
  reduced.addEventListener('change', reset);
  document.addEventListener('visibilitychange', visibility);
  discover(root);
  return () => {
    disposed = true;
    observer.disconnect();
    root.removeEventListener('click', click);
    reduced.removeEventListener('change', reset);
    document.removeEventListener('visibilitychange', visibility);
    reset();
  };
}
