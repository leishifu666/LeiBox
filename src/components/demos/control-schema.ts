export type ControlValue = string | number | boolean;

export type When = (values: Record<string, ControlValue>) => boolean;

export interface ScrubControl {
  kind: "scrub";
  label: string;
  defaultValue: number;
  min: number;
  max: number;
  step: number;
  decimals: number;
  when?: When;
}

export interface ToggleControl {
  kind: "toggle";
  label: string;
  defaultValue: boolean;
  when?: When;
}

export interface ColorControl {
  kind: "color";
  label: string;
  defaultValue: string;
  /**
   * Sentinel for "no explicit color" (theme-derived, clear, …). The
   * sentinel is the default value; while active the row shows `label`
   * over the `swatch` color instead of a hex value.
   */
  auto?: { label: string; swatch: string };
  when?: When;
}

export interface RadioControl<V extends string = string> {
  kind: "radio";
  label: string;
  defaultValue: V;
  options: readonly { value: V; label: string }[];
  when?: When;
}

export interface CustomControl<V extends ControlValue = ControlValue> {
  kind: "custom";
  defaultValue: V;
  when?: When;
}

export type Control =
  | ScrubControl
  | ToggleControl
  | ColorControl
  | RadioControl
  | CustomControl;

export type ControlSchema = Record<string, Control>;

type Widen<V> = V extends string
  ? string
  : V extends number
    ? number
    : V extends boolean
      ? boolean
      : never;

export type ValueOf<C extends Control> = C extends ScrubControl
  ? number
  : C extends ToggleControl
    ? boolean
    : C extends RadioControl<infer V>
      ? V
      : C extends CustomControl<infer V>
        ? V
        : C extends ColorControl
          ? string
          : never;

export type SchemaValues<S extends ControlSchema> = {
  [K in keyof S]: ValueOf<S[K]>;
};

export function scrub(
  label: string,
  defaultValue: number,
  range: {
    min: number;
    max: number;
    step: number;
    decimals?: number;
    when?: When;
  },
): ScrubControl {
  return {
    kind: "scrub",
    label,
    defaultValue,
    min: range.min,
    max: range.max,
    step: range.step,
    decimals: range.decimals ?? 2,
    when: range.when,
  };
}

export function toggle(
  label: string,
  defaultValue: boolean,
  opts?: { when?: When },
): ToggleControl {
  return { kind: "toggle", label, defaultValue, when: opts?.when };
}

export function color(
  label: string,
  defaultValue: string,
  opts?: { auto?: { label: string; swatch?: string }; when?: When },
): ColorControl {
  return {
    kind: "color",
    label,
    defaultValue,
    auto: opts?.auto && {
      label: opts.auto.label,
      swatch: opts.auto.swatch ?? "#ffffff",
    },
    when: opts?.when,
  };
}

export function radio<const V extends string>(
  label: string,
  defaultValue: NoInfer<V>,
  options: readonly { value: V; label: string }[],
  opts?: { when?: When },
): RadioControl<V> {
  return { kind: "radio", label, defaultValue, options, when: opts?.when };
}

export function custom<V extends ControlValue>(
  defaultValue: V,
): CustomControl<Widen<V>> {
  return { kind: "custom", defaultValue: defaultValue as ControlValue as Widen<V> };
}
