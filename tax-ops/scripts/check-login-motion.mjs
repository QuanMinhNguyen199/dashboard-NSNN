import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import puppeteer from 'puppeteer-core';
import { fileURLToPath } from 'node:url';

const base = (process.argv[2] ?? 'http://localhost:5174').replace(/\/$/, '');
const artifacts = new URL('../.impeccable/review/login-motion/', import.meta.url);
await mkdir(artifacts, { recursive: true });
const browser = await puppeteer.launch({ channel: 'chrome', headless: true });
try {
  for (const width of [1440, 375]) {
    for (const reduce of [false, true]) {
      for (const nsnn of [false, true]) {
        const page = await browser.newPage();
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        await page.setViewport({ width, height: 900 });
        await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: reduce ? 'reduce' : 'no-preference' }]);
        await page.goto(`${base}/${nsnn ? 'nsnn/dang-nhap' : 'quan-ly'}/`);
        if (!nsnn && width === 1440) await page.addStyleTag({ content: 'html { scrollbar-gutter: stable; }' });
        await page.waitForSelector('.demo-accounts-list button');
        const suffix = `${nsnn ? 'nsnn' : 'tax'}-${width}-${reduce ? 'reduced' : 'motion'}`;
        if (!reduce) await page.screenshot({ path: fileURLToPath(new URL(`${suffix}-login.png`, artifacts)) });
        // Keyboard activation, then a repeated click, must produce just one flight.
        if (!nsnn && width === 1440) {
          await page.evaluate(() => [...document.querySelectorAll('.demo-accounts-list button')]
            .find(button => button.querySelector('code')?.textContent === 'tp.ql1').focus());
        } else await page.focus('.demo-accounts-list button');
        await page.keyboard.press('Enter');
        await page.waitForSelector('.portal-flight');
        assert.equal(await page.$$eval('.portal-flight', els => els.length), 1);
        assert.equal(await page.$eval('#root', el => el.inert), true);
        await page.evaluate(() => document.querySelector('.demo-accounts-list button')?.click());
        await page.waitForSelector('.portal-flight.is-loading');
        const loadingStarted = Date.now();
        // NSNN restores the same loading group in a new document. Read its
        // elements only after that navigation, rather than across JS worlds.
        await page.waitForSelector(nsnn ? '.dworkspace' : '.workspace');
        const loading = await page.$eval('.portal-flight-mark', el => {
          const r = el.getBoundingClientRect();
          return { x: r.x + r.width / 2, y: r.y + r.height / 2, width: innerWidth, height: innerHeight,
            clip: getComputedStyle(el.querySelector('img')).clipPath,
            wave: getComputedStyle(document.querySelector('.portal-loading-dot')).animationName,
            delays: [...document.querySelectorAll('.portal-loading-dot')].map(el => parseFloat(getComputedStyle(el).animationDelay)),
            title: document.querySelector('.portal-flight-title').textContent };
        });
        const cover = await page.$eval('.portal-flight', el => { const r = el.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; });
        assert.ok(Math.abs(loading.x - cover.x) < 1 && Math.abs(loading.y - cover.y) < 1, 'Loading logo is centered within the actual cover');
        assert.match(loading.clip, /circle/, 'Preserve the source logo crop');
        assert.equal(loading.wave, reduce ? 'none' : 'portal-dot-wave');
        assert.equal(loading.delays.length, 3, 'Loading uses three dots');
        if (!reduce) assert.ok(loading.delays.every((delay, i, delays) => i === 0 || delay > delays[i - 1]), 'Loading dots move in order from left to right');
        assert.equal(loading.title, nsnn ? 'Dashboard Thu NSNN' : 'Quản lý nghiệp vụ Thuế');
        assert.equal(await page.$('.portal-flight-ring'), null, 'Letter wave replaces the spinner');
        if (!reduce) await page.screenshot({ path: fileURLToPath(new URL(`${suffix}-loading.png`, artifacts)) });
        await page.waitForSelector(nsnn ? '.dworkspace' : '.workspace');
        let fixedDuringReveal = null;
        let canvasDuringReveal = null;
        let handoffPixels = null;
        if (!reduce) {
          await page.waitForSelector('.portal-flight[data-phase="reveal"]');
          const landing = await page.evaluate(() => {
            const target = [...document.querySelectorAll('.brand .tax-logo, .dheader-mark i')].find(el => getComputedStyle(el).visibility === 'visible' && el.getBoundingClientRect().width > 0);
            if (!target) return null;
            const a = document.querySelector('.portal-flight-mark').getBoundingClientRect(), b = target.getBoundingClientRect();
            return ['x', 'y', 'width', 'height'].map(key => Math.abs(a[key] - b[key]));
          });
          if (landing) assert.ok(landing.every(delta => delta < 0.1), `Flying logo must exactly match its destination: ${landing}`);
          assert.ok(Date.now() - loadingStarted >= 1400, 'Loading pauses before the logo returns home');
          const reveal = await page.evaluate(() => {
            const root = document.querySelector('#root');
            const animation = document.querySelector('.portal-reveal-hole').getAnimations()[0];
            if (!animation) return null;
            animation.pause();
            const frames = animation.effect.getKeyframes();
            animation.currentTime = 490;
            const nav = document.querySelector('.mobile-nav, .dtabs');
            const rect = nav?.getBoundingClientRect();
            return { frames: frames.map(f => f.r), transform: getComputedStyle(root).transform,
              clipPath: getComputedStyle(root).clipPath, canvas: getComputedStyle(document.body).backgroundColor,
              fixed: rect ? { x: rect.x, y: rect.y, width: rect.width, height: rect.height } : null };
          });
          assert.ok(reveal, 'Dashboard uses an expanding aperture');
          if (nsnn) assert.equal(await page.$('.dskeleton'), null, 'Initial data settles before the aperture opens');
          assert.equal(reveal.transform, 'none', 'Root never moves fixed navigation');
          assert.equal(reveal.clipPath, 'none', 'Dashboard compositing never changes during reveal');
          assert.notEqual(reveal.canvas, 'rgba(0, 0, 0, 0)', 'Expanded dashboard has an opaque canvas');
          assert.notEqual(reveal.canvas, 'rgb(14, 42, 71)', 'Navy backing never bleeds inside the dashboard');
          canvasDuringReveal = reveal.canvas;
          assert.ok(parseFloat(reveal.frames[1]) > parseFloat(reveal.frames[0]));
          fixedDuringReveal = reveal.fixed;
          await page.screenshot({ path: fileURLToPath(new URL(`${suffix}-expand.png`, artifacts)) });
          if (!nsnn && width === 1440) {
            await page.evaluate(async () => {
              document.querySelector('.portal-reveal-hole').getAnimations()[0].currentTime = 980;
              await Promise.all([...document.querySelectorAll('.portal-flight-mark, .portal-flight-title')].flatMap(el => el.getAnimations().map(a => a.finished)));
            });
            handoffPixels = await page.screenshot({ clip: { x: 252, y: 0, width: 1188, height: 900 } });
          }
          await page.evaluate(() => document.querySelector('.portal-reveal-hole').getAnimations().forEach(a => a.play()));
        }
        await page.waitForSelector('.portal-flight', { hidden: true });
        if (handoffPixels) assert.equal(Buffer.compare(handoffPixels, await page.screenshot({ clip: { x: 252, y: 0, width: 1188, height: 900 } })), 0,
          'Dashboard content stays pixel-identical when the cover is removed and reading focus is assigned');
        if (canvasDuringReveal) assert.equal(await page.evaluate(() => getComputedStyle(document.body).backgroundColor), canvasDuringReveal,
          'Canvas color stays identical when the reveal finishes');
        assert.equal(await page.evaluate(() => document.documentElement.hasAttribute('data-portal-revealing')), false);
        if (fixedDuringReveal) {
          const after = await page.$eval('.mobile-nav, .dtabs', nav => {
            const r = nav.getBoundingClientRect();
            return { x: r.x, y: r.y, width: r.width, height: r.height };
          });
          assert.deepEqual(after, fixedDuringReveal, 'Navigation does not jump when reveal ends');
        }
        assert.equal(await page.$eval('#root', el => el.style.clipPath), '');
        assert.equal(await page.$eval('#root', el => el.inert), false);
        assert.equal(await page.evaluate(() => document.documentElement.hasAttribute('data-portal-entering')), false);
        assert.equal(await page.evaluate(() => sessionStorage.getItem('portal-login-motion-v1')), null);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, suffix);
        const tab = nsnn ? '.dtabs button:nth-child(2)' : width > 900 ? '.side-nav .nav-item:nth-of-type(2)' : '.mobile-nav button:nth-child(2)';
        if (await page.$(tab)) {
          await page.click(tab);
          await page.waitForFunction(() => document.getAnimations().every(a => a.playState !== 'running'), { timeout: 5000 });
        }
        if (!reduce) await page.screenshot({ path: fileURLToPath(new URL(`${suffix}-home.png`, artifacts)), fullPage: false });
        await page.reload();
        await page.waitForSelector(nsnn ? '.dworkspace' : '.workspace');
        assert.equal(await page.$('.portal-flight'), null, 'Reload must not replay login');
        assert.deepEqual(errors, []);
        console.log(`PASS ${suffix}: keyboard, double activation, loading, arrival, tabs, overflow, reload`);
        await page.close();
      }
    }
  }
} finally { await browser.close(); }


