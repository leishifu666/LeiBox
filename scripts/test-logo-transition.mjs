// Run against a running site: node scripts/test-logo-transition.mjs
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';

const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:3001';
const output = path.resolve('work/logo-transition-01-20261027');
const results = [];
let browser;

async function recordFrames(page) {
  await page.addInitScript(() => {
    window.__logoFrames = [];
    const sample = () => {
      const carrier = document.querySelector('[data-logo-motion]');
      const r = carrier?.getBoundingClientRect();
      const visible = [...document.querySelectorAll('[data-site-logo="navigation"]')].filter(image => {
        const r = image.getBoundingClientRect();
        return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight && getComputedStyle(image).opacity !== '0';
      });
      window.__logoFrames.push({time:performance.now(), pathname:location.pathname, state:carrier?.dataset.logoMotion, x:r?.left, y:r?.top, width:r?.width, height:r?.height, primaryVisible:visible.length});
      if (window.__logoFrames.length > 4000) window.__logoFrames.shift();
      requestAnimationFrame(sample);
    };
    requestAnimationFrame(sample);
  });
}

async function transition(page, action, destination, region, {motion=true}={}) {
  const origin = await page.locator('[data-site-logo="navigation"]:visible').boundingBox();
  await page.evaluate(() => { window.__logoFrames = []; });
  await action();
  await page.waitForURL(url => url.pathname === destination);
  await page.locator(region).waitFor({state:'attached'});
  await page.waitForFunction(() => document.querySelector('[data-logo-motion]')?.dataset.logoMotion === 'idle');
  const target = await page.locator('[data-site-logo="navigation"]:visible').boundingBox();
  const frames = await page.evaluate(() => window.__logoFrames);
  const moving = frames.filter(frame => frame.state === 'moving');
  if (motion) {
    assert(moving.length > 0, `Missing movement to ${destination}`);
    assert(moving.every(frame => frame.y >= Math.min(origin.y,target.y)-2 && frame.y <= Math.max(origin.y,target.y)+2), `Logo came from outside the header on ${destination}`);
    assert(moving.every(frame => frame.x >= Math.min(origin.x,target.x)-2 && frame.x <= Math.max(origin.x,target.x)+2), 'Nonlinear/unexpected route');
    assert(moving.every(frame => frame.width >= Math.min(origin.width,target.width)-.2 && frame.width <= Math.max(origin.width,target.width)+.2), 'Logo width snapped or overshot');
    assert(moving.every(frame => frame.height >= Math.min(origin.height,target.height)-.2 && frame.height <= Math.max(origin.height,target.height)+.2), 'Logo height snapped or overshot');
    assert(moving.every(frame => frame.primaryVisible === 0), 'Two primary Logos painted during the move');
  } else assert.equal(moving.length,0,'Reduced-motion navigation animated');
  assert.equal(await page.locator('[data-logo-transition-hidden]').count(),0,'Target did not reappear');
  assert.equal(await page.locator('[data-site-logo="navigation"]:visible').count(),1);
  results.push({destination,origin,target,movingFrames:moving.length,status:'passed'});
  return frames;
}

(async () => {
  await fs.mkdir(output,{recursive:true});
  browser = await chromium.launch({channel:'chrome',headless:true});
  for (const width of [1440,768,375]) {
    const page = await browser.newPage({viewport:{width,height:960},colorScheme:'light'});
    const errors = [];
    page.on('pageerror',error=>errors.push(error.message));
    await recordFrames(page);
    await page.goto(base+'/');
    await page.waitForLoadState('networkidle');
    assert.equal(await page.locator('[data-logo-motion]').getAttribute('data-logo-motion'),'idle');
    assert.equal((await page.evaluate(()=>window.__logoFrames)).filter(frame=>frame.state==='moving').length,0,'Initial visit flew in');
    const footer = page.locator('footer img[src*="leibox-logo"]').first();
    assert.equal(await footer.getAttribute('data-site-logo'),null,'Footer registered as navigation');
    const goComponents = width >= 640
      ? () => page.locator('header nav[aria-label="Main"] > ul a[href="/components"]').click()
      : async () => {
        await page.getByRole('button',{name:'打开菜单',exact:true}).click();
        await page.locator('header [aria-hidden="false"] a[href="/components"]').click();
      };
    await transition(page,goComponents,'/components','aside [data-site-logo="navigation"]');
    await page.screenshot({path:path.join(output,`components-${width}.png`),fullPage:false});
    const frames = await transition(page,()=>page.locator('[data-site-logo="navigation"]:visible').click(),'/','header nav[aria-label="Main"]');
    await fs.writeFile(path.join(output,`return-${width}-frames.json`),JSON.stringify(frames));
    await page.reload();
    await page.waitForLoadState('networkidle');
    assert.equal((await page.evaluate(()=>window.__logoFrames)).filter(frame=>frame.state==='moving').length,0,'Reload flew in');
    await page.goto(base+'/404-preview-check');
    await page.waitForLoadState('networkidle');
    assert.equal(await page.locator('[data-site-logo="navigation"]').count(),1,'404 uses a separate Logo');
    await transition(page,()=>page.locator('main a[href="/"]').click(),'/','header nav[aria-label="Main"]');
    await page.emulateMedia({reducedMotion:'reduce'});
    await transition(page,goComponents,'/components','aside [data-site-logo="navigation"]',{motion:false});
    await page.emulateMedia({reducedMotion:'no-preference'});
    assert.deepEqual(errors,[]);
    console.log(`Navigation, 404, reload and reduced motion: ${width}px passed`);
    await page.close();
  }

  const page = await browser.newPage({viewport:{width:1440,height:960}});
  await recordFrames(page);
  await page.goto(base+'/');
  await page.waitForLoadState('networkidle');
  await page.evaluate(()=>{window.__logoFrames=[];});
  await page.locator('header nav[aria-label="Main"] > ul a[href="/components"]').click();
  await page.waitForURL('**/components');
  await page.locator('aside [data-site-logo="navigation"]').waitFor({state:'attached'});
  await page.locator('aside a[href="/docs"]').first().click();
  await page.waitForURL('**/docs');
  await page.waitForFunction(()=>document.querySelector('[data-logo-motion]')?.dataset.logoMotion==='idle');
  const fast = await page.evaluate(()=>window.__logoFrames.filter(frame=>frame.state==='moving'));
  assert(fast.length>0);
  assert(fast.every(frame=>frame.y<80&&frame.y>=0&&frame.x>=35&&frame.x<=178),'Interrupted transition jumped');
  assert.equal(await page.locator('[data-logo-transition-hidden]').count(),0);
  await page.goBack();
  await page.waitForURL('**/components');
  await page.waitForFunction(()=>document.querySelector('[data-logo-motion]')?.dataset.logoMotion==='idle');
  await page.locator('[data-theme-toggle]:visible').first().click();
  await page.waitForFunction(()=>!document.documentElement.dataset.themeTransition);
  await page.screenshot({path:path.join(output,'components-theme-1440.png')});
  await transition(page,()=>page.locator('[data-site-logo="navigation"]:visible').click(),'/','header nav[aria-label="Main"]');
  await page.goto(base+'/logo-transition-preview');
  await page.waitForLoadState('networkidle');
  assert.equal(await page.locator('[data-logo-motion]').getAttribute('data-logo-motion'),'idle','Logo remained on a route without a main Logo');
  results.push({rapidNavigation:'passed',history:'passed',theme:'passed',routeWithoutLogo:'passed'});
  await fs.writeFile(path.join(output,'results.json'),JSON.stringify(results,null,2));
  console.log(JSON.stringify({checks:results.length,status:'passed'}));
  await browser.close();
})().catch(async error=>{console.error(error);await browser?.close();process.exitCode=1;});
