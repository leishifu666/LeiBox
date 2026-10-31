import assert from 'node:assert/strict';
import {expect} from 'playwright/test';
export async function verifyAiBrandCovers(page){
 const scene=page.locator('#demo .bp-scene'),cards=page.locator('#demo .bp-card');
 await expect(scene).toHaveAttribute('data-ready','true');assert.equal(await cards.count(),3);
 assert.deepEqual(await cards.locator('.bp-logo').evaluateAll(nodes=>nodes.map(node=>node.alt)),['Claude','Codex','Cursor']);
 assert(await cards.locator('.bp-photo').evaluateAll(nodes=>nodes.every(node=>node.complete&&node.naturalWidth===600)));
 const logo=cards.first().locator('.bp-logo'),before=await logo.boundingBox();await cards.first().hover();await page.waitForTimeout(700);
 assert.deepEqual(await logo.boundingBox(),before,'Brand mark stays fixed while the photograph responds');
 await cards.nth(1).click();await expect(scene).toHaveAttribute('data-selected','1');
 await cards.nth(1).press('ArrowRight');await expect(cards.nth(2)).toBeFocused();await cards.nth(2).press(' ');await expect(scene).toHaveAttribute('data-selected','2');
 await cards.nth(2).press('Escape');await expect(scene).toHaveAttribute('data-selected','-1');
 await page.evaluate(()=>window.__update({description:'Custom brand caption'}));await expect(cards.first().locator('.bp-copy')).toHaveText('Custom brand caption');
}
