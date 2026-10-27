import { useEffect, useState } from 'react';
import { Brain, Feather, Lightbulb } from 'lucide-react';
import { Composer } from 'deep-agent-original:components/Composer.tsx';
import { EffortSlider } from 'deep-agent-original:components/ui/EffortSlider.tsx';
export { disposeMessages } from 'deep-agent-original:components/message.tsx';

const stops = [
  { value: 'simple', label: '简单', icon: Feather },
  { value: 'medium', label: '中度', icon: Lightbulb },
  { value: 'deep', label: '深度', icon: Brain },
];

/** Presentation container only; both controls below are the original React UI. */
export function OriginalDemo({ bridge, variant }) {
  const [text, setText] = useState('');
  const [value, setValue] = useState(bridge.settings.thinking_depth);
  useEffect(() => bridge.subscribe(() => setValue(bridge.settings.thinking_depth)), [bridge]);
  return <main className="original-deep-agent-stage font-sans text-text-base" data-original-ready="true">
    {variant === 'slider' ? <div className="original-effort-section px-3 pb-1 pt-0.5">
      <div className="mb-2.5 flex items-center text-[12px]"><span className="font-medium text-text-base">推理强度</span></div>
      <EffortSlider stops={stops} value={value} onChange={next => { setValue(next); void bridge.api.setThinkingDepth(next); }} ariaLabel="推理强度" disabled={bridge.options.disabled} />
    </div> : <div className="original-composer-container">
      <Composer value={text} onChange={setText}
        busy={bridge.options.busy ?? false} stopping={bridge.options.stopping ?? false}
        onStop={bridge.options.onStop}
        onSubmit={(attachments = [], skills = [], mentions = [], displayText) => { bridge.submit(displayText ?? text, attachments, skills, mentions); setText(''); }} />
    </div>}
  </main>;
}
