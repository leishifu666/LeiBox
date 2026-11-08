const vertexShader = `#version 300 es
void main() {
  vec2 corner = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2);
  gl_Position = vec4(corner * 2.0 - 1.0, 0.0, 1.0);
}`;

const fragmentShader = `#version 300 es
precision highp float;
out vec4 color;
uniform vec2 resolution, sceneSize, trackHalf, knobCenter, knobHalf;
uniform float switchScale, theme, angle, impulse, gallery;
uniform sampler2D glyph;

float roundedDistance(vec2 p, vec2 halfSize, float radius) {
  vec2 q = abs(p) - halfSize + radius;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - radius;
}

vec2 roundedNormal(vec2 p, vec2 halfSize, float radius) {
  vec2 q = abs(p) - halfSize + radius;
  vec2 n = max(q, 0.0);
  if (n.x + n.y < 0.001) n = q.x > q.y ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  return normalize(n) * sign(p);
}

float ledDistance(vec2 p, float radius) {
  vec2 q = p - knobCenter;
  float offset = atan(q.y, q.x) - angle;
  float around = abs(atan(sin(offset), cos(offset)));
  float beyondTip = max(0.0, around - 0.92) * 122.0;
  float across = roundedDistance(q, knobHalf, radius) - 7.8;
  return length(vec2(beyondTip, across)) - 1.8;
}

vec3 illuminate(vec3 base, vec3 hue, float light) {
  vec3 add = base + hue * light;
  vec3 tint = mix(base, hue + 0.035, 1.0 - exp(-light * 1.18));
  return mix(add, tint, theme);
}

float mask(vec2 relative) {
  return texture(glyph, relative / 256.0 + 0.5).a;
}

float frostedMask(vec2 p, float haze) {
  float soft = (mask(p + vec2(4.0, 0.0)) + mask(p - vec2(4.0, 0.0))
              + mask(p + vec2(0.0, 4.0)) + mask(p - vec2(0.0, 4.0))) * 0.25;
  return mix(mask(p), soft, haze);
}

void main() {
  vec2 uv = vec2(gl_FragCoord.x, resolution.y - gl_FragCoord.y) / resolution;
  vec2 p = (uv - 0.5) * sceneSize / switchScale + trackHalf;
  vec2 onTrack = p - trackHalf;
  vec2 onKnob = p - knobCenter;
  float radius = min(69.0, min(knobHalf.x, knobHalf.y) - 1.0);
  vec3 hue = mix(vec3(0.435, 0.525, 1.0), vec3(1.0, 0.659, 0.180), theme);
  float strength = 1.0 + 0.38 * impulse;
  float led = ledDistance(p, radius);
  float distanceToLight = max(led, 0.0);
  float spill = (0.43 * exp(-distanceToLight / 21.0) + 0.33 * exp(-distanceToLight / 85.0)) * strength;
  float track = roundedDistance(onTrack, trackHalf, 86.0);
  float shadow = 1.0 - smoothstep(-10.0, 42.0, roundedDistance(onTrack - vec2(0.0, 17.0), trackHalf, 86.0));
  shadow *= mix(0.48, 0.17, theme);
  vec2 fromSky = (uv - vec2(0.92, -0.08)) / vec2(1.40, 1.55);
  float gradient = smoothstep(0.0, 0.84, length(fromSky));
  vec3 sky = mix(vec3(0.129, 0.129, 0.137), vec3(0.925, 0.925, 0.918), theme);
  vec3 base = mix(vec3(0.051, 0.051, 0.055), vec3(0.804, 0.804, 0.800), theme);
  vec3 background = mix(mix(sky, base, gradient), vec3(0.957), gallery);
  float sceneLight = max(0.0, spill - 0.016) * mix(0.94, 0.66, max(theme, gallery));
  background *= 1.0 - shadow;
  vec3 outside = gallery > 0.5
    ? mix(background, hue, 1.0 - exp(-sceneLight))
    : illuminate(background, hue, sceneLight);

  vec3 surface = outside;
  if (track < 0.65) {
    float floorY = onTrack.y / trackHalf.y;
    float trackWall = smoothstep(-19.0, 0.0, roundedDistance(onTrack - vec2(0.0, 8.0), trackHalf, 86.0));
    vec3 floorColor = vec3(mix(0.035, 0.903, theme) + floorY * mix(0.009, 0.005, theme) - trackWall * mix(0.025, 0.11, theme));
    floorColor = illuminate(floorColor, hue, spill * 0.56);
    float knobShadow = 1.0 - smoothstep(-8.0, 25.0, roundedDistance(onKnob - vec2(0.0, 11.0), knobHalf, radius));
    floorColor *= 1.0 - knobShadow * mix(0.52, 0.14, theme);
    float rim = 1.0 - smoothstep(0.0, 1.5, abs(track + 0.8));
    floorColor += rim * mix(0.047 + floorY * 0.022, floorY * 0.06, theme);
    surface = mix(outside, floorColor, 1.0 - smoothstep(-0.65, 0.65, track));
  }

  float knob = roundedDistance(onKnob, knobHalf, radius);
  if (knob < 1.0) {
    float depth = max(-knob, 0.0);
    vec2 normal = roundedNormal(onKnob, knobHalf, radius);
    float bevel = pow(1.0 - clamp(depth / 31.0, 0.0, 1.0), 2.6);
    vec2 throughGlass = onKnob * 0.945 - normal * bevel * 47.0;
    vec2 fringe = normal * bevel * 3.8 + onKnob * 0.004;
    float haze = 0.06 + 0.74 * bevel;
    vec3 pixels = vec3(frostedMask(throughGlass - fringe, haze),
                       frostedMask(throughGlass, haze),
                       frostedMask(throughGlass + fringe, haze));

    float height = onKnob.y / knobHalf.y * 0.5 + 0.5;
    vec3 glass = mix(vec3(0.17 - height * 0.065), vec3(0.956 - height * 0.014), theme);
    vec3 ink = mix(vec3(1.0, 0.956, 0.906), vec3(0.145, 0.134, 0.123), theme);
    glass = mix(glass, ink, pixels);
    glass += vec3(1.0, 0.80, 0.58) * frostedMask(throughGlass, 1.0) * 0.13 * (1.0 - theme);
    float internal = (exp(-distanceToLight / 28.0) * 0.79 + exp(-distanceToLight / 73.0) * 0.22) * strength;
    float bevelLight = exp(-depth / 2.8) * exp(-distanceToLight / 47.0);
    glass = illuminate(glass, hue, internal * mix(1.25, 1.08, theme) + bevelLight * mix(0.94, 0.62, theme));
    float topReflection = max(0.0, dot(normal, normalize(vec2(-0.35, -1.0))));
    glass += topReflection * topReflection * exp(-depth / 1.55) * mix(0.48, 0.66, theme);
    glass += topReflection * bevel * mix(0.06, 0.12, theme);
    glass -= max(0.0, -normal.y) * bevel * mix(0.035, 0.016, theme);
    surface = mix(surface, glass, 1.0 - smoothstep(-0.7, 0.7, knob));
  }

  float nearLed = exp(-distanceToLight / 5.5) * 0.36;
  surface = illuminate(surface, hue, nearLed * strength);
  surface = mix(surface, mix(hue, vec3(1.0), mix(0.68, 0.4, theme)), 1.0 - smoothstep(-0.6, 0.6, led));
  float grain = fract(sin(dot(floor(gl_FragCoord.xy), vec2(12.9898, 78.233))) * 43758.5453) - 0.5;
  surface += grain * 0.021 * mix(1.0, 0.0, gallery * smoothstep(130.0, 240.0, max(track, distanceToLight)));
  color = vec4(clamp(surface, 0.0, 1.0), 1.0);
}`;

function compile(gl, kind, source) {
  const shader = gl.createShader(kind);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return shader;
  gl.deleteShader(shader);
  return null;
}

export function createGlassRenderer(canvas, { width, height, scale, dpr, gallery }) {
  const document = canvas.ownerDocument;
  const mask = document.createElement('canvas');
  mask.width = mask.height = 256;
  const ctx = mask.getContext('2d');
  // The scene owns its background so embedded browsers never have to composite a floating transparent GL surface.
  const gl = ctx && canvas.getContext('webgl2', { alpha: false, antialias: false, depth: false, stencil: false });
  if (!gl) return null;

  const vertex = compile(gl, gl.VERTEX_SHADER, vertexShader);
  const fragment = compile(gl, gl.FRAGMENT_SHADER, fragmentShader);
  const program = gl.createProgram();
  if (program && vertex && fragment) {
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
  }
  if (vertex) gl.deleteShader(vertex);
  if (fragment) gl.deleteShader(fragment);
  if (!program || !gl.getProgramParameter(program, gl.LINK_STATUS)) {
    if (program) gl.deleteProgram(program);
    return null;
  }
  const glyph = gl.createTexture();
  if (!glyph) {
    gl.deleteProgram(program);
    return null;
  }
  const names = ['resolution', 'sceneSize', 'trackHalf', 'knobCenter', 'knobHalf', 'switchScale', 'theme', 'angle', 'impulse', 'gallery', 'glyph'];
  const uniform = Object.fromEntries(names.map(name => [name, gl.getUniformLocation(program, name)]));
  gl.useProgram(program);
  gl.uniform2f(uniform.trackHalf, width / 2, height / 2);
  gl.uniform1f(uniform.switchScale, scale);
  gl.uniform1f(uniform.gallery, Number(gallery));
  gl.uniform1i(uniform.glyph, 0);
  gl.bindTexture(gl.TEXTURE_2D, glyph);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 256, 256, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

  return {
    resize(sceneWidth, sceneHeight) {
      const ratio = Math.min(dpr, Math.sqrt(1_200_000 / (sceneWidth * sceneHeight)));
      canvas.width = Math.max(1, Math.round(sceneWidth * ratio));
      canvas.height = Math.max(1, Math.round(sceneHeight * ratio));
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(uniform.resolution, canvas.width, canvas.height);
      gl.uniform2f(uniform.sceneSize, sceneWidth, sceneHeight);
    },
    draw(box, theme, phase, impulse, particles, scatter) {
      ctx.clearRect(0, 0, 256, 256);
      particles.draw(ctx, { x: 128, y: 128 }, theme, scatter, true);
      gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, gl.RGBA, gl.UNSIGNED_BYTE, mask);
      gl.uniform2f(uniform.knobCenter, box.x + box.width / 2, box.y + box.height / 2);
      gl.uniform2f(uniform.knobHalf, box.width / 2, box.height / 2);
      gl.uniform1f(uniform.theme, theme);
      gl.uniform1f(uniform.angle, Math.PI / 2 - (phase % 1) * Math.PI * 2);
      gl.uniform1f(uniform.impulse, impulse);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    },
    destroy() {
      gl.deleteTexture(glyph);
      gl.deleteProgram(program);
      if (!gl.isContextLost()) gl.getExtension('WEBGL_lose_context')?.loseContext();
    },
  };
}
