import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {chromium,expect} from 'playwright/test';

const base=process.env.TEST_BASE_URL||'http://127.0.0.1:3311';
const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000}}),requests=[],errors=[];
page.on('request',request=>{if(/\/assets\/(?:components|optimized)\/original-/.test(request.url()))requests.push(request.url());});
page.on('pageerror',error=>errors.push(error.message));
try{
 await page.goto(base+'/components',{waitUntil:'networkidle'});
 const before=requests.length;
 await page.locator('[data-component-card="/docs/animations/folded-emoji-scroll"] h2').click();
 await expect(page).toHaveURL(/\/docs\/animations\/folded-emoji-scroll/);
 await expect(page.locator('main')).toHaveAttribute('data-component-entry-state','idle');
 const extra=requests.slice(before);
 assert.deepEqual(extra,[],'Clicking a visible card must not fetch off-screen original-component posters');
 await page.goBack({waitUntil:'networkidle'});
 const image=page.locator('[data-component-card="/docs/components/ascii-object"] img');
 await image.scrollIntoViewIfNeeded();
 await expect.poll(()=>image.evaluate(node=>node.complete&&node.naturalWidth>0)).toBe(true);
 const src=await image.evaluate(node=>node.currentSrc);
 assert(src.includes('/assets/optimized/')&&src.endsWith('.webp'),'Existing responsive thumbnails must be used for image previews');
 assert.deepEqual(errors,[]);
 const report={base,unrelatedPosterRequests:extra.length,responsiveOriginalPoster:src,pageErrors:errors};
 await fs.mkdir('outputs/gallery-loading',{recursive:true});await fs.writeFile('outputs/gallery-loading/results.json',JSON.stringify(report,null,2));
 console.log(report);
}finally{await browser.close();}
