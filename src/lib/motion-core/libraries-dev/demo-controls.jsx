import { useId } from "react";

export function SegmentedChoice({ label, value, items, onChange, disabled = false }) {
  const name = useId();
  return (
    <fieldset className="library-field" disabled={disabled}>
      <legend>{label}</legend>
      <div className="library-segments">
        {items.map(([key, text]) => (
          <label key={key}>
            <input type="radio" name={name} value={key} checked={key === value} onChange={() => onChange(key)} />
            <span>{text}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function RangeControl({ label, value, min = 0, max = 100, step = 1, display = value, onChange, disabled = false }) {
  return (
    <label className="library-field library-range">
      <span>{label}</span>
      <span className="library-range-row">
        <input aria-label={label} type="range" {...{ value, min, max, step, disabled }} onChange={event => onChange(event.target.valueAsNumber)} />
        <span className="library-range-value" aria-hidden="true">{display}</span>
      </span>
    </label>
  );
}
