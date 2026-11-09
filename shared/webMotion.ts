/** Shared motion lifecycle for both portal applications. The caller supplies its
 * local Motion import so either application can be built independently. */
import { installLoginArrival, isLoginTransitionActive } from './portalTransition';
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
  const uninstallArrival = installLoginArrival(root);
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
    if (disposed || isLoginTransitionActive() || reduced.matches || document.hidden || !el.isConnected) return;
    const box = el.getBoundingClientRect();
    if (!box.width || !box.height || box.bottom < 0 || box.top > innerHeight) return;
    const overlay = el.matches('.mobile-drawer, .ddrawer, .toast, dialog');
    // 09/11/2026: KHÔNG làm mờ nội dung khi nó đổi (người dùng: "fade-in khiến
    // mắt bị lâng"). Vùng nội dung, panel, nút bấm thay số tại chỗ, đứng yên;
    // chỉ lớp phủ (ngăn kéo, toast, hộp thoại) còn trượt vào — không mờ.
    if (!overlay || feedback) return;
    const content = el.matches('.workspace-view, .dworkspace, [data-motion="content"]');
    const moving = overlay || content;
    const properties = moving ? ['opacity', 'transform'] : ['opacity'];
    const original = properties.map((name) => ({ name, value: el.style.getPropertyValue(name), priority: el.style.getPropertyPriority(name) }));
    const restore = () => {
      for (const { name, value, priority } of original) {
        if (value) el.style.setProperty(name, value, priority);
        else el.style.removeProperty(name);
      }
    };
    const transform = moving ? getComputedStyle(el).transform : 'none';
    const animation = animate(el, {
      // Default markup is fully visible; data never counts up or waits to render.
      opacity: [1, 1],
      ...(moving ? { transform: [`translateY(${content ? 5 : 8}px)${transform === 'none' ? '' : ` ${transform}`}`, transform] } : {}),
    }, {
      duration: feedback ? 0.12 : moving ? 0.2 : 0.18,
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
      else if (record.target instanceof HTMLElement) {
        if (record.target.matches(surfaces)) queue(record.target);
        else if (record.target.matches('.muc-tab.is-active, .muc-tab-con.is-active, [role="tab"][aria-selected="true"]')) {
          // Đổi tab: chỉ phần SAU hàng tab chuyển động. Cả vùng xem cùng mờ rồi
          // trượt thì hàng tab, thanh phạm vi cũng nhún theo — chỗ người dùng
          // vừa bấm lại là chỗ rung. Không tìm được phần sau thì vẫn như cũ.
          const view = record.target.closest<HTMLElement>('.workspace-view, .dworkspace')
            ?? root.querySelector<HTMLElement>('.workspace-view, .dworkspace');
          const after: HTMLElement[] = [];
          for (let n: Element | null = record.target.closest('nav, [role="tablist"]') ?? record.target; n && n !== view; n = n.parentElement) {
            for (let s = n.nextElementSibling; s; s = s.nextElementSibling) if (s instanceof HTMLElement) after.push(s);
          }
          if (after.length) after.forEach(queue);
          else if (view) queue(view);
        }
      }
    }
  });
  observer.observe(root, { subtree: true, childList: true, attributes: true, attributeFilter: ['data-motion-key', 'open', 'aria-selected', 'class'] });
  const click = (event: MouseEvent) => {
    if (!(event.target instanceof Element)) return;
    const button = event.target.closest<HTMLButtonElement>('button');
    // Tab có dấu "đang mở" trượt làm phản hồi rồi; nháy mờ thêm chính tab là thừa.
    if (button?.matches('.muc-tab, .muc-tab-con')) return;
    if (button && root.contains(button) && !button.disabled && button.getAttribute('aria-disabled') !== 'true') play(button, true);
  };
  const visibility = () => { if (document.hidden) reset(); };
  root.addEventListener('click', click);
  reduced.addEventListener('change', reset);
  document.addEventListener('visibilitychange', visibility);
  discover(root);
  return () => {
    disposed = true;
    uninstallArrival();
    observer.disconnect();
    root.removeEventListener('click', click);
    reduced.removeEventListener('change', reset);
    document.removeEventListener('visibilitychange', visibility);
    reset();
  };
}
