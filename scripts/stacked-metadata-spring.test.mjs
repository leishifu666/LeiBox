import test from 'node:test';
import assert from 'node:assert/strict';
import { advanceMetadataSpring } from '../src/lib/motion-core/stacked-metadata-spring.mjs';

// First grey pill edge, source video frames 14–52, in source pixels.
const observed = [1007,999,985,967,947,926,905,885,867,851,837,824,814,806,799,793,789,786,784,783,782,782,782,782,783,783,784,785,785,785,786,786,787,787,788,788,788,788,788];
test('spring matches independently measured acceleration, overshoot and return', () => {
  const state = { value: 0, velocity: 0, target: 1 };
  const errors = []; let last = 0, peak = 0;
  observed.forEach((edge, frame) => {
    const seconds = (frame + .333) / 60;
    advanceMetadataSpring(state, seconds - last); last = seconds;
    errors.push((1008 - state.value * 220 - edge) / 2);
    peak = Math.max(peak, state.value);
  });
  const rms = Math.sqrt(errors.reduce((sum, v) => sum + v * v, 0) / errors.length);
  assert(rms < .25, `measured edge RMS ${rms.toFixed(3)} design pixels`);
  assert(peak > 1.025 && peak < 1.029, 'roughly 2.7% overshoot');
  assert(state.value < peak && state.value > .999, 'the tail returns toward the destination');
});

test('reversing the target keeps position and velocity continuous', () => {
  const state = { value: 0, velocity: 0, target: 1 };
  advanceMetadataSpring(state, .08);
  const position = state.value, velocity = state.velocity;
  state.target = 0; advanceMetadataSpring(state, 0);
  assert.equal(state.value, position); assert.equal(state.velocity, velocity);
  advanceMetadataSpring(state, .001);
  assert(state.value > position, 'outward momentum briefly continues after reversing');
  for (let i = 0; i < 100; i++) advanceMetadataSpring(state, 1 / 60);
  assert.equal(state.value, 0); assert.equal(state.velocity, 0);
});

test('motion agrees across frame rates and settles exactly', () => {
  const a={value:0,velocity:0,target:1},b={...a};
  for(let i=0;i<18;i++)advanceMetadataSpring(a,1/60);
  for(let i=0;i<72;i++)advanceMetadataSpring(b,1/240);
  assert(Math.abs(a.value-b.value)<1e-12);assert(Math.abs(a.velocity-b.velocity)<1e-12);
  for(let i=0;i<60;i++)advanceMetadataSpring(a,1/60);
  assert.equal(a.value,1);assert.equal(a.velocity,0);
});
