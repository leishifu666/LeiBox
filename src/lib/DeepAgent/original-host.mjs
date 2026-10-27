import { createElement } from 'react';
import { createRoot } from 'react-dom/client';

/** Platform boundary for the unmodified desktop UI. No Tauri or model requests. */
export function mountOriginalDeepAgent(target, initial, variant, css, tokens, dictionary, loadOriginal) {
  let options = { ...initial }, destroyed = false;
  const owner = target.ownerDocument, browser = owner.defaultView;
  const element = owner.createElement('div');
  element.dataset.motionSurface = '';
  element.dataset.deepAgentOriginal = variant;
  element.style.cssText = 'display:block;position:relative;min-width:0;width:100%;';
  const root = element.attachShadow({ mode: 'open' });
  const style = owner.createElement('style'); style.textContent = css;
  const appHost = owner.createElement('div'), portals = owner.createElement('div');
  portals.dataset.originalPortals = '';
  root.append(style, appHost, portals); target.append(element);
  for (const [key, value] of Object.entries(tokens)) element.style.setProperty(key, value);
  const timers = new Set(), mediaListeners = new Set(), listeners = [];
  const timeout = (callback, delay, ...args) => { const id = browser.setTimeout(() => { timers.delete(id); if (!destroyed) callback(...args); }, delay); timers.add(id); return id; };
  const clear = id => { browser.clearTimeout(id); timers.delete(id); };
  const reduced = () => options.reducedMotion ?? browser.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const eventFor = event => new Proxy(event, { get(original, key) {
    if (key === 'target') return original.composedPath()[0] ?? original.target;
    const value = Reflect.get(original, key, original);
    return typeof value === 'function' ? value.bind(original) : value;
  } });
  function trackedEventTarget(original) {
    return new Proxy(original, { get(object, key) {
      if (key === 'addEventListener') return (type, listener, settings) => {
        const wrapped = event => typeof listener === 'function' ? listener.call(original, eventFor(event)) : listener.handleEvent(eventFor(event));
        original.addEventListener(type, wrapped, settings); listeners.push({ original, type, listener, wrapped, settings });
      };
      if (key === 'removeEventListener') return (type, listener, settings) => {
        const capture = typeof settings === 'boolean' ? settings : Boolean(settings?.capture);
        for (let index = listeners.length - 1; index >= 0; index--) {
          const record = listeners[index], registeredCapture = typeof record.settings === 'boolean' ? record.settings : Boolean(record.settings?.capture);
          if (record.original !== original || record.type !== type || record.listener !== listener || registeredCapture !== capture) continue;
          original.removeEventListener(type, record.wrapped, record.settings); listeners.splice(index, 1);
        }
      };
      if (original === owner && key === 'body') return portals;
      if (original === owner && key === 'activeElement') {
        let focused = owner.activeElement;
        while (focused?.shadowRoot?.activeElement) focused = focused.shadowRoot.activeElement;
        return focused === element || !focused || focused === owner.body ? portals : focused;
      }
      if (original === browser && key === 'document') return document;
      if (original === browser && key === 'setTimeout') return timeout;
      if (original === browser && key === 'clearTimeout') return clear;
      if (original === browser && key === 'matchMedia') return query => {
        const media = browser.matchMedia(query);
        if (!query.includes('prefers-reduced-motion')) return media;
        return new Proxy(media, { get(mediaObject, mediaKey) {
          if (mediaKey === 'matches') return reduced();
          if (mediaKey === 'addEventListener') return (type, listener) => { if (type === 'change') mediaListeners.add(listener); };
          if (mediaKey === 'removeEventListener') return (_type, listener) => mediaListeners.delete(listener);
          const value = Reflect.get(mediaObject, mediaKey, mediaObject);
          return typeof value === 'function' ? value.bind(mediaObject) : value;
        } });
      };
      const value = Reflect.get(object, key, object);
      if (original === browser && typeof key === 'string' && /^[A-Z]/.test(key)) return value;
      return typeof value === 'function' ? value.bind(object) : value;
    } });
  }
  const document = trackedEventTarget(owner), window = trackedEventTarget(browser);
  const subscribers = new Set();
  const settings = { available_models: options.models ?? ['deepseek-chat', 'deepseek-reasoner'], chat_model: options.selectedModel ?? options.models?.[0] ?? 'deepseek-chat', thinking_depth: options.value ?? 'medium', model_capabilities: [] };
  let permission = 'default';
  const dispatch = (name, detail) => element.dispatchEvent(new CustomEvent(name, { detail, bubbles: true, composed: true }));
  const notify = () => { subscribers.forEach(listener => listener()); browser.dispatchEvent(new Event(bridge.event)); };
  const bridge = {
    event: 'deep-agent-component:' + crypto.randomUUID(), portals, settings,
    get options() { return options; },
    get permission() { return permission; },
    subscribe(listener) { subscribers.add(listener); return () => subscribers.delete(listener); },
    t(key, parameters = {}) {
      let value = dictionary;
      for (const part of key.split('.')) value = value?.[part];
      return String(value ?? parameters.defaultValue ?? key).replace(/\{\{(\w+)\}\}/g, (_match, name) => String(parameters[name] ?? ''));
    },
    api: {
      async getSettings() { return { ...settings }; },
      async setChatModel(model) { settings.chat_model = model; options.onModelChange?.(model); dispatch('model-change', { model }); return { ...settings }; },
      async setThinkingDepth(value) { settings.thinking_depth = value; options.onValueChange?.(value); dispatch('thinking-change', { value }); subscribers.forEach(listener => listener()); return { ...settings }; },
      async getActivePermissionPreset() { return permission; },
      async setActivePermissionPreset(value) { permission = value; options.onPermissionChange?.(value); dispatch('permission-change', { value }); },
      async getPermissionPresetVisibility() { return { default_enabled: true, auto_review_enabled: true, full_access_enabled: true }; },
      async getCommands() { return []; }, async listSkills() { return []; },
      async searchProjectFiles() { return { entries: [] }; },
      async attachmentIngest(value) { return { id: value.id, size_bytes: value.text ? new Blob([value.text]).size : 0, extracted_text: value.text ?? null, storage_dir: '', original_path: null, sha256: null, message: null }; },
      async attachmentRemove() {},
    },
    submit(text, attachments, skills, mentions) {
      const message = { text, model: settings.chat_model, thinking: settings.thinking_depth, attachments, skills, mentions, permission };
      options.onSubmit?.(message); dispatch('agent-submit', message);
    },
  };
  const original = loadOriginal(window, document, timeout, clear, bridge);
  const app = createRoot(appHost);
  const systemMedia = browser.matchMedia('(prefers-reduced-motion: reduce)');
  const syncMedia = () => {
    element.dataset.reducedMotion = String(reduced());
    const event = new browser.MediaQueryListEvent('change', { matches: reduced(), media: systemMedia.media });
    mediaListeners.forEach(listener => typeof listener === 'function' ? listener(event) : listener.handleEvent(event));
  };
  systemMedia.addEventListener('change', syncMedia);
  function render() {
    element.style.setProperty('--motion-height', `${options.height ?? (variant === 'slider' ? 420 : 600)}px`);
    element.inert = Boolean(options.disabled);
    app.render(createElement(original.OriginalDemo, { bridge, variant })); syncMedia();
  }
  render();
  return { element, root,
    update(next) {
      if (destroyed) return;
      options = { ...options, ...next };
      if (next.models) settings.available_models = next.models;
      if (next.selectedModel !== undefined) settings.chat_model = next.selectedModel;
      if (next.value !== undefined) settings.thinking_depth = next.value;
      notify(); render();
    },
    destroy() {
      if (destroyed) return;
      destroyed = true; element.remove();
      systemMedia.removeEventListener('change', syncMedia);
      // An outer React tree may be in its own cleanup commit.
      queueMicrotask(() => {
        app.unmount(); original.disposeMessages?.();
        timers.forEach(id => browser.clearTimeout(id)); timers.clear();
        listeners.forEach(record => record.original.removeEventListener(record.type, record.wrapped, record.settings));
        mediaListeners.clear(); subscribers.clear();
      });
    },
  };
}
