/** Replay the real HTML controls only inside gallery previews. Downloaded files stay intact. */
const PLAYER = String.raw`
(() => {
  const slug = __SLUG__;
  const click = selector => document.querySelector(selector)?.click();
  const later = (fn, delay) => window.setTimeout(fn, delay);
  const repeat = (fn, interval) => { fn(); window.setInterval(fn, interval); };
  const start = () => {
    document.documentElement.setAttribute('translate', 'no');
    if (slug === 'spider-music-player') {
      const ready=()=>{
        const root=document.querySelector('#spider-player [data-motion-surface]')?.shadowRoot;
        if(!root||document.body.dataset.motionReady!=='true')return;
        observer.disconnect();
        const style=document.createElement('style');style.textContent='.sm-scene{background:#f4f4f4!important;height:100vh!important}.motion-frame,.motion-body{min-height:100vh!important;background:#f4f4f4!important}';root.append(style);
        requestAnimationFrame(()=>requestAnimationFrame(()=>parent.postMessage({type:'leibox-preview-ready',slug},'*')));
        later(()=>repeat(()=>{
          root.querySelector('[data-action="next"]')?.click();
          later(()=>root.querySelector('[data-action="previous"]')?.click(),3500);
        },7000),600);
      };
      const observer=new MutationObserver(ready);observer.observe(document.body,{attributes:true,attributeFilter:['data-motion-ready']});ready();return;
    }
    if (slug === 'brand-poster-cards') {
      const ready=()=>{
        const root=document.querySelector('#brand-posters [data-motion-surface]')?.shadowRoot;
        if(!root||document.body.dataset.motionReady!=='true')return;
        observer.disconnect();const style=document.createElement('style');style.textContent='.bp-scene{background:#f4f4f4!important}';root.append(style);
        requestAnimationFrame(()=>requestAnimationFrame(()=>parent.postMessage({type:'leibox-preview-ready',slug},'*')));
        const cards=[...root.querySelectorAll('.bp-card')];let current=-1;
        later(()=>repeat(()=>{if(current>=0)cards[current].dispatchEvent(new PointerEvent('pointerleave',{pointerType:'mouse'}));current=(current+1)%3;cards[current].dispatchEvent(new PointerEvent('pointerenter',{pointerType:'mouse'}));},1500),350);
      };
      const observer=new MutationObserver(ready);observer.observe(document.body,{attributes:true,attributeFilter:['data-motion-ready']});ready();return;
    }
    if (slug === 'dot-matrix-trio') {
      const ready = () => {
        if (document.body.dataset.motionReady !== 'true') return;
        observer.disconnect();
        requestAnimationFrame(() => requestAnimationFrame(() => parent.postMessage({type:'leibox-preview-ready',slug},'*')));
      };
      const observer = new MutationObserver(ready);
      observer.observe(document.body, {attributes:true,attributeFilter:['data-motion-ready']});
      ready(); return;
    }
    if (slug === 'selection-flower') {
      const ready=()=>{
        const root=document.querySelector('#selection-flower-demo [data-motion-surface]')?.shadowRoot;
        if (!root || document.body.dataset.motionReady !== 'true') return;
        observer.disconnect();
        const style=document.createElement('style');style.textContent='.sf-scene{background:#f4f4f4!important}';root.append(style);
        requestAnimationFrame(()=>requestAnimationFrame(()=>parent.postMessage({type:'leibox-preview-ready',slug},'*')));
        let index=0;
        const replay=()=>{
          const p=root.querySelectorAll('.sf-article p')[index++%3],text=p.firstChild.nodeType===3?p.firstChild:p.firstChild.firstChild;
          const start=Math.min(9,text.length-1),end=Math.min(text.length,start+48);
          p.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,button:0,pointerId:95,pointerType:'mouse'}));
          const began=performance.now();
          const grow=now=>{
            const t=Math.min(1,(now-began)/1050),range=document.createRange();
            range.setStart(text,start);range.setEnd(text,start+Math.max(1,Math.round((end-start)*t)));
            const selection=root.getSelection();selection.removeAllRanges();selection.addRange(range);document.dispatchEvent(new Event('selectionchange'));
            if(t<1)requestAnimationFrame(grow);else later(()=>window.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,pointerId:95,pointerType:'mouse'})),400);
          };
          requestAnimationFrame(grow);
        };
        later(()=>repeat(replay,2700),350);
      };
      const observer=new MutationObserver(ready);observer.observe(document.body,{attributes:true,attributeFilter:['data-motion-ready']});ready();return;
    }
    if (slug === 'collection-layout-morph') {
      const ready=()=>{
        const root=document.querySelector('#collection-layout [data-motion-surface]')?.shadowRoot;
        if(!root||document.body.dataset.motionReady!=='true')return;
        observer.disconnect();
        const style=document.createElement('style');style.textContent='.clm-scene{height:100vh;background:#f4f4f4!important}.motion-frame,.motion-body{min-height:100vh!important;background:#f4f4f4!important}';root.append(style);
        requestAnimationFrame(()=>requestAnimationFrame(()=>parent.postMessage({type:'leibox-preview-ready',slug},'*')));
        later(()=>repeat(()=>{
          root.querySelector('[data-view="card"]')?.click();
          later(()=>root.querySelector('[data-view="pack"]')?.click(),1400);
          later(()=>root.querySelector('[data-view="list"]')?.click(),2800);
        },4200),550);
      };
      const observer=new MutationObserver(ready);observer.observe(document.body,{attributes:true,attributeFilter:['data-motion-ready']});ready();return;
    }
    if (slug === 'inline-text-morph') {
      const ready=()=>{
        if(document.body.dataset.motionReady!=='true')return;
        observer.disconnect();
        requestAnimationFrame(()=>requestAnimationFrame(()=>parent.postMessage({type:'leibox-preview-ready',slug},'*')));
        later(()=>repeat(()=>{
          const sequence=[[0,'agent'],[650,'agent'],[1250,'agent'],[1950,'customize'],[2500,'language'],[3100,'customize'],[3600,'language'],[4100,'language'],[4700,'language'],[5200,'customize'],[5700,'customize'],[6200,'customize'],[6700,'customize'],[7200,'customize'],[7700,'customize']];
          sequence.forEach(([delay,group])=>later(()=>click('[data-group="'+group+'"]'),delay));
        },9500),500);
      };
      const observer=new MutationObserver(ready);observer.observe(document.body,{attributes:true,attributeFilter:['data-motion-ready']});ready();return;
    }
    if (slug === 'notes-text-color') {
      const ready = () => {
        const root=document.querySelector('#notes-demo [data-motion-surface]')?.shadowRoot;
        if (!root || document.body.dataset.motionReady !== 'true') return;
        observer.disconnect();
        const style=document.createElement('style');style.textContent='.nc-scene{background:#f4f4f4!important}';root.append(style);
        requestAnimationFrame(() => requestAnimationFrame(() => parent.postMessage({type:'leibox-preview-ready',slug},'*')));
        const select=(whole=false)=>{
          const p=root.querySelectorAll('.nc-article p')[3];
          if(whole){p.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true}));return;}
          const walk=document.createTreeWalker(p,NodeFilter.SHOW_TEXT),wanted='nobody reads the case study',start=p.textContent.indexOf(wanted);
          let total=0,node,a,b;while((node=walk.nextNode())){if(!a&&start<total+node.length)a=[node,start-total];if(start+wanted.length<=total+node.length){b=[node,start+wanted.length-total];break;}total+=node.length;}
          if(!a||!b)return;const range=document.createRange();range.setStart(...a);range.setEnd(...b);const selection=root.getSelection();selection.removeAllRanges();selection.addRange(range);document.dispatchEvent(new Event('selectionchange'));
        };
        later(()=>repeat(()=>{
          select();
          later(()=>root.querySelector('[data-color="cyan"]')?.click(),650);
          later(()=>root.querySelector('[data-color="pink"]')?.click(),1350);
          later(()=>root.querySelector('.nc-done')?.click(),2150);
          later(()=>select(true),2850);
          later(()=>root.querySelector('[data-color="green"]')?.click(),3500);
          later(()=>root.querySelector('.nc-back')?.click(),4450);
        },5300),450);
      };
      const observer=new MutationObserver(ready);observer.observe(document.body,{attributes:true,attributeFilter:['data-motion-ready']});ready();return;
    }
    if (slug === 'elastic-panel-resize') {
      const handle = document.querySelector('.er-handle');
      const scene = document.querySelector('.er-scene');
      if (!handle || !scene) return;
      // This isolated, noninteractive iframe replays actual pointer handlers.
      // Synthetic pointers have no browser capture to acquire.
      handle.setPointerCapture = () => {};
      later(() => repeat(() => {
        const rect=scene.getBoundingClientRect(),start=parseFloat(scene.dataset.position)*rect.width;
        const pointer=(type,x,target=window)=>target.dispatchEvent(new PointerEvent(type,{bubbles:true,button:0,buttons:type==='pointerup'?0:1,pointerId:91,pointerType:'mouse',clientX:rect.left+x,clientY:rect.top+rect.height*.6}));
        pointer('pointerenter',start,handle);
        later(() => {
          pointer('pointerdown',start,handle);
          const began=performance.now();
          const move=now=>{
            const t=Math.max(0,(now-began)/1000);
            const stops=[[0,start],[.7,rect.width*.31],[1.4,rect.width*.46],[2.1,rect.width*.12],[2.6,rect.width*.12]];
            const index=stops.findIndex((stop,i)=>i<stops.length-1&&t>=stop[0]&&t<stops[i+1][0]);
            if(index<0){pointer('pointerup',rect.width*.12);pointer('pointerleave',rect.width*.12,handle);return;}
            const a=stops[index],b=stops[index+1],p=(t-a[0])/(b[0]-a[0]);
            pointer('pointermove',a[1]+(b[1]-a[1])*(p*p*(3-2*p)));requestAnimationFrame(move);
          };
          requestAnimationFrame(move);
        },350);
      },4700),500);
      return;
    }
    if (slug === 'reasoning-effort-slider' || slug === 'deep-agent-composer') {
      const root = document.querySelector('#deep-agent-demo [data-motion-surface]')?.shadowRoot;
      if (!root) return;
      let step = 0;
      if (slug === 'deep-agent-composer') later(() => root.querySelector('.composer-model-tools .morph-menu-compact button')?.click(), 350);
      later(() => repeat(() => {
        root.querySelectorAll('.reasoning-effort-stops button')[[2,0,1][step++ % 3]]?.click();
      }, 1800), 500);
      return;
    }
    if (slug === 'galaxy-effort-slider' || slug === 'glass-folder' || slug === 'cosmic-panels' || slug === 'sailing-toc' || slug === 'crumpled-paper' || slug === 'glass-tab-menu' || slug === 'hammerhead-chart' || slug === 'blue-fluted-glass' || slug === 'staggered-radial-menu' || slug === 'soft-action-wheel' || slug === 'bounding-box-resize') {
      const ready = () => {
        if (document.body.dataset.motionReady !== 'true') return;
        observer.disconnect();
        requestAnimationFrame(() => requestAnimationFrame(() => parent.postMessage({ type: 'leibox-preview-ready', slug }, '*')));
        if (slug === 'galaxy-effort-slider') later(() => repeat(() => {
          const slider = document.querySelector('.ge-control');
          const key = value => slider?.dispatchEvent(new KeyboardEvent('keydown', { key: value, bubbles: true }));
          key('Home');
          for (let i = 1; i <= 5; i++) later(() => key('ArrowRight'), i * 480);
          later(() => key('Home'), 5300);
        }, 6500), 450);
        if (slug === 'bounding-box-resize') {
          // Replaying a control must not take keyboard focus from the host's
          // sidebar link and dismiss its floating preview.
          document.querySelectorAll('.bb-workspace button,.bb-chip input').forEach(node => { node.focus = () => {}; if (node.tagName === 'INPUT') node.select = () => {}; });
          const handle = key => document.querySelector('.bb-handle[data-handle="' + key + '"]');
          const pointer = (type, node, x, y) => node.dispatchEvent(new PointerEvent(type, { bubbles: true, pointerId: 92, pointerType: 'mouse', button: 0, buttons: type === 'pointerup' ? 0 : 1, clientX: x, clientY: y }));
          const drag = (key, dx, dy, duration) => {
            const node = handle(key), rect = node.getBoundingClientRect();
            const scale = document.querySelector('.bb-workspace').getBoundingClientRect().width / 624;
            const x = rect.left + rect.width / 2, y = rect.top + rect.height / 2;
            pointer('pointerenter', node, x, y);
            pointer('pointerdown', node, x, y);
            const began = performance.now();
            const move = now => {
              const t = Math.min(1, (now - began) / duration), ease = t * t * (3 - 2 * t);
              const px = x + dx * scale * ease, py = y + dy * scale * ease;
              pointer('pointermove', window, px, py);
              if (t < 1) requestAnimationFrame(move);
              else { pointer('pointerup', window, px, py); later(() => { pointer('pointerleave', node, px, py); node.blur(); }, 220); }
            };
            requestAnimationFrame(move);
          };
          later(() => repeat(() => {
            drag('se', 93, 61, 1200);
            later(() => {
              const input = document.querySelector('.bb-chip[data-axis="height"] input');
              input.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, button: 0, pointerId: 93 }));
              input.value = '200'; input.dispatchEvent(new Event('input', { bubbles: true }));
              input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
              handle('se').blur();
            }, 1900);
            later(() => drag('e', -93, 0, 1000), 3400);
            later(() => handle('se').dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })), 5700);
          }, 6500), 650);
        }
        if (slug === 'soft-action-wheel') later(() => repeat(() => {
          click('.rm-toggle');
          later(() => click('.rm-toggle'), 1500);
        }, 3000), 450);
        if (slug === 'staggered-radial-menu') later(() => repeat(() => {
          click('.rm-toggle');
          later(() => click('.rm-toggle'), 1800);
        }, 3600), 450);
        if (slug === 'glass-tab-menu') later(() => repeat(() => {
          click('.gt-tab:nth-of-type(2)');
          later(() => click('.gt-tab:nth-of-type(3)'), 700);
          later(() => click('.gt-toggle'), 1500);
          later(() => click('.gt-toggle'), 3100);
          later(() => click('.gt-tab:nth-of-type(1)'), 3900);
        }, 4700), 500);
        if (slug === 'glass-folder') later(() => repeat(() => {
          click('.gf-root .gf-hit');
          later(() => click('.gf-root .gf-key--add'), 1100);
          later(() => click('.gf-root .gf-hit'), 2600);
        }, 4800), 900);
        if (slug === 'sailing-toc') {
          let step=0;
          later(() => repeat(() => click('.st-link[data-index="'+[10,12,4,8,3][step++%5]+'"]'), 2400), 900);
        }
        if (slug === 'crumpled-paper') {
          let current = 0;
          later(() => repeat(() => {
            const paper = document.querySelectorAll('.cp-hit')[current++ % 3];
            paper?.dispatchEvent(new PointerEvent('pointerenter', { pointerType: 'mouse' }));
            later(() => paper?.dispatchEvent(new PointerEvent('pointerleave', { pointerType: 'mouse' })), 1500);
          }, 2300), 400);
        }
      };
      const observer = new MutationObserver(ready);
      observer.observe(document.body, { attributes: true, attributeFilter: ['data-motion-ready'] });
      ready();
      return;
    }
    if (slug === 'thinking-particles') {
      window.setInterval(() => { if (document.querySelector('.thinking-demo')?.dataset.state === 'complete') click('.tp-stop'); }, 25500);
    } else if (slug === 'bouncy-access') {
      later(() => repeat(() => click('#toggle-btn'), 2200), 600);
    } else if (slug === 'morphing-timer') {
      later(() => repeat(() => {
        click('#btn-toggle');
        later(() => click('.card-h .ctrl-btn:last-child'), 900);
        later(() => click('.card-m .ctrl-btn:last-child'), 1600);
        later(() => click('#btn-toggle'), 2700);
      }, 4400), 500);
    } else if (slug === 'velocity-drag') {
      let cycle = 0;
      later(() => repeat(() => {
        const card = document.querySelector('.event-card');
        const calendar = document.querySelector('#calendar-body');
        if (!card || !calendar) return;
        const from = card.getBoundingClientRect(), bounds = calendar.getBoundingClientRect();
        const x = from.left + from.width * .45, y = from.top + Math.min(35, from.height / 2);
        const tx = bounds.left + bounds.width * (cycle++ % 2 ? .35 : .73);
        const ty = bounds.top + bounds.height * .58;
        card.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, button: 0, clientX: x, clientY: y }));
        const began = performance.now();
        const drag = now => {
          const progress = Math.min(1, (now - began) / 1850);
          const ease = progress * progress * (3 - 2 * progress);
          window.dispatchEvent(new MouseEvent('mousemove', {
            clientX: x + (tx - x) * ease,
            clientY: y + (ty - y) * ease - Math.sin(progress * Math.PI) * 100
          }));
          if (progress < 1) requestAnimationFrame(drag);
          else window.dispatchEvent(new MouseEvent('mouseup', { button: 0 }));
        };
        requestAnimationFrame(drag);
      }, 4200), 500);
    } else if (slug === 'brand-line-cards') {
      const cards = [...document.querySelectorAll('.card')];
      let previous = null;
      const began = performance.now();
      const move = now => {
        const time = (now - began) / 1000;
        const card = cards[Math.floor(time / 3.6) % cards.length];
        if (!card) return;
        const rect = card.getBoundingClientRect();
        const point = {
          bubbles: true, pointerId: 1, pointerType: 'mouse',
          clientX: rect.left + rect.width * (.5 + Math.sin(time * 1.3) * .28),
          clientY: rect.top + rect.height * (.42 + Math.cos(time * 1.1) * .19)
        };
        if (previous !== card) {
          previous?.dispatchEvent(new PointerEvent('pointerleave', point));
          card.dispatchEvent(new PointerEvent('pointerenter', point));
          previous = card;
        }
        card.dispatchEvent(new PointerEvent('pointermove', point));
        requestAnimationFrame(move);
      };
      requestAnimationFrame(move);
    }
    // AI Generating already animates through its own requestAnimationFrame loop.
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();`;

export function interactionPreviewCss(slug: string) {
  return `
    html, body { width: 100%; height: 100%; min-height: 100%; margin: 0; overflow: hidden; }
    html, body { background: #f4f4f4 !important; }
    ${slug === 'dot-matrix-trio' ? '.dm-scene { background:#f4f4f4!important; }' : ''}
    ${slug === 'glass-folder' || slug === 'cosmic-panels' ? '.glass-folder-demo,.cosmos-demo { min-height:100%;background:#f4f4f4!important; }' : ''}
    ${slug === 'brand-line-cards' ? '.gallery { width: 94%; min-height: 100%; padding: 0; gap: 16px; }' : ''}
    ${slug === 'gradient-cover-wall' ? '.cover-wall { width: 88%; gap: 20px; }' : ''}
    ${slug === 'thinking-particles' ? '.thinking-demo { min-height:100%;background:#f4f4f4!important; }' : ''}
    ${slug === 'crumpled-paper' ? '.crumple-demo { height:100%;min-height:100%;background:#f4f4f4!important; }' : ''}
    ${slug === 'glass-tab-menu' ? '.glass-tab-demo { height:100%;min-height:100%;background:#f4f4f4!important; }' : ''}
    ${slug === 'staggered-radial-menu' || slug === 'soft-action-wheel' ? '.radial-menu-demo { height:100%;min-height:100%;background:#f4f4f4!important; }' : ''}
    ${slug === 'galaxy-effort-slider' ? '.galaxy-effort-demo { height:100%;min-height:100%;background:#f4f4f4!important; }' : ''}
    ${slug === 'sailing-toc' ? '.st-demo { --st-surface:#f4f4f4; }' : ''}
    ${slug === 'elastic-panel-resize' ? '.er-scene { background:#f4f4f4!important; }.er-scene::before { display:none; }' : ''}
    ${slug === 'inline-text-morph' ? '.itm-scene { background:#f4f4f4!important; }' : ''}
    ${slug === 'hammerhead-chart' ? 'html, body { min-height:100%; background:#f4f4f4!important; }' : ''}
    .dot { will-change: auto; backface-visibility: visible; }
  `;
}

export function interactionPreviewDocument(source: string, slug: string) {
  const script = PLAYER.replace('__SLUG__', JSON.stringify(slug));
  const style = `<style>${interactionPreviewCss(slug)}</style>`;
  // Gallery-sized scenes need at most 30 draws per second. One scheduler shares
  // the frame between the original animation and the pointer replay driver.
  const scheduler = `<script>(() => {
    const request = window.requestAnimationFrame.bind(window);
    const cancel = window.cancelAnimationFrame.bind(window);
    const queue = new Map(); let next = 0, frame = 0, last = 0;
    const tick = now => {
      frame = 0;
      if (now - last >= 1000 / 30 - .5) {
        last = now; const batch = [...queue.values()]; queue.clear();
        batch.forEach(callback => callback(now));
      }
      if (queue.size && !frame) frame = request(tick);
    };
    window.requestAnimationFrame = callback => {
      const id = ++next; queue.set(id, callback);
      if (!frame) frame = request(tick);
      return id;
    };
    window.cancelAnimationFrame = id => {
      queue.delete(id); if (!queue.size && frame) { cancel(frame); frame = 0; }
    };
  })();</script>`;
  return source
    .replace(/@import\s+url\(['"]?https:\/\/fonts\.googleapis\.com[^)]*\)\s*;/gi, '')
    .replace(/<\/head>/i, `${style}${scheduler}</head>`)
    .replace(/<\/body>/i, `<script>${script}</script></body>`);
}
