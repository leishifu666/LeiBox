import { useId, useRef } from "react";
import { Select } from "@base-ui/react/select";
import { Check, ChevronDown } from "lucide-react";

export function SelectChoice({ label, value, items, onChange, disabled = false }) {
  const id = useId();
  const container = useRef(null);
  const current = items.find(([key]) => key === value)?.[1];
  return (
    <div className="library-field" ref={container}>
      <span id={id}>{label}</span>
      <Select.Root value={value} onValueChange={next => { if (next != null) onChange(next); }} disabled={disabled}>
        <Select.Trigger className="library-select-trigger" aria-labelledby={id}>
          <span>{current}</span>
          <Select.Icon><ChevronDown aria-hidden="true" size={14} /></Select.Icon>
        </Select.Trigger>
        <Select.Portal container={container}>
          <Select.Positioner className="library-select-positioner" align="start" side="top" sideOffset={6} alignItemWithTrigger={false}>
            <Select.Popup className="library-select-popup">
              <Select.List>
                {items.map(([key, text]) => (
                  <Select.Item key={key} value={key} className="library-select-item">
                    <Select.ItemText>{text}</Select.ItemText>
                    <Select.ItemIndicator><Check aria-hidden="true" size={14} /></Select.ItemIndicator>
                  </Select.Item>
                ))}
              </Select.List>
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>
    </div>
  );
}
