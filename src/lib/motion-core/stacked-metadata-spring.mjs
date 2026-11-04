// Fitted to measured pill edges, not the original author's implementation.
export const METADATA_SPRING = { mass: 1, stiffness: 175, damping: 20 };
const decay = METADATA_SPRING.damping / (2 * METADATA_SPRING.mass);
const frequency = Math.sqrt(METADATA_SPRING.stiffness / METADATA_SPRING.mass - decay * decay);

export function advanceMetadataSpring(state, seconds) {
  const offset = state.value - state.target;
  const envelope = Math.exp(-decay * seconds);
  const cos = Math.cos(frequency * seconds), sin = Math.sin(frequency * seconds);
  const velocity = state.velocity;
  // Exact damped motion preserves velocity when the target reverses between frames.
  state.value = state.target + envelope * (offset * cos + (velocity + decay * offset) / frequency * sin);
  state.velocity = envelope * (velocity * cos - (decay * velocity + METADATA_SPRING.stiffness * offset) / frequency * sin);
  if (Math.abs(state.value - state.target) < .0001 && Math.abs(state.velocity) < .001) {
    state.value = state.target;
    state.velocity = 0;
  }
}
