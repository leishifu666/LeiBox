/* Procedural shader fields preserved from the supplied HTML; source license not supplied or verified. */
export const fragAI = `
        uniform vec2 u_res;
        uniform float u_time;

        vec2 rot2(vec2 v, float a) {
          float c = cos(a), s = sin(a);
          return vec2(c * v.x - s * v.y, s * v.x + c * v.y);
        }

        float smin(float a, float b, float k) {
          float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
          return mix(b, a, h) - k * h * (1.0 - h);
        }

        float sdSegment2D(vec2 p, vec2 a, vec2 b) {
          vec2 pa = p - a, ba = b - a;
          float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
          return length(pa - ba * h);
        }

        float sdWLogo2D(vec2 p) {
          vec2 n0 = vec2(-0.34,  0.14);
          vec2 n1 = vec2(-0.18, -0.15);
          vec2 n2 = vec2( 0.00,  0.12);
          vec2 n3 = vec2( 0.17, -0.15);
          vec2 n4 = vec2( 0.35,  0.14);

          float d = length(p - n0) - 0.112;
          d = smin(d, length(p - n1) - 0.104, 0.055);
          d = smin(d, length(p - n2) - 0.104, 0.055);
          d = smin(d, length(p - n3) - 0.104, 0.055);
          d = smin(d, length(p - n4) - 0.108, 0.055);

          d = smin(d, sdSegment2D(p, n0, n1) - 0.038, 0.060);
          d = smin(d, sdSegment2D(p, n1, n2) - 0.038, 0.060);
          d = smin(d, sdSegment2D(p, n2, n3) - 0.038, 0.060);
          d = smin(d, sdSegment2D(p, n3, n4) - 0.038, 0.060);
          return d;
        }

        vec2 intersectSphere(vec3 ro, vec3 rd, float r) {
          float b = dot(ro, rd);
          float c = dot(ro, ro) - r * r;
          float h = b * b - c;
          if (h < 0.0) return vec2(-1.0);
          h = sqrt(h);
          return vec2(-b - h, -b + h);
        }

        vec3 toCoinSpace(vec3 p, float t) {
          p.y -= sin(t * 1.15) * 0.022;
          float phase = t * 0.88;
          float pitch = -0.62 + 0.18 * sin(phase);
          float yaw   =  0.34 + 0.24 * cos(phase);
          float roll  =  0.22 + 0.14 * sin(phase * 0.5);

          p.xy = rot2(p.xy, -roll);
          p.xz = rot2(p.xz, -yaw);
          p.yz = rot2(p.yz, -pitch);
          return p;
        }

        float mapCoin(vec3 p, float t) {
          vec3 q = toCoinSpace(p, t);

          float R = 0.86;
          float H = 0.135;
          float bevel = 0.075;
          vec2 dCyl = abs(vec2(length(q.xy), q.z)) - vec2(R, H);
          float coin = min(max(dCyl.x, dCyl.y), 0.0) + length(max(dCyl, 0.0)) - bevel;

          float rimRing = abs(length(q.xy) - (R + 0.006)) - 0.018;
          float frontMask = smoothstep(0.05, 0.18, q.z);
          coin -= exp(-max(rimRing, 0.0) * 20.0) * 0.010 * frontMask;

          if (q.z > 0.0) {
            vec2 wp = q.xy * 1.15;
            float dw = sdWLogo2D(wp);
            float carve = smoothstep(0.032, -0.022, dw);
            float ridge = exp(-abs(dw - 0.016) * 38.0);
            float faceMask = smoothstep(0.10, 0.20, q.z);
            coin += carve * 0.038 * faceMask;
            coin -= ridge * 0.014 * faceMask;
          }

          return coin;
        }

        vec3 calcNormal(vec3 p, float t) {
          vec2 e = vec2(0.0020, -0.0020);
          return normalize(
            e.xyy * mapCoin(p + e.xyy, t) +
            e.yyx * mapCoin(p + e.yyx, t) +
            e.yxy * mapCoin(p + e.yxy, t) +
            e.xxx * mapCoin(p + e.xxx, t)
          );
        }

        void main() {
          vec2 uv = v_uv;
          float aspect = u_res.x / u_res.y;
          float rBg = length((uv - vec2(0.5, 0.50)) * vec2(aspect, 1.0));

          vec3 bgOuter = vec3(0.976, 0.892, 0.812);
          vec3 bgInner = vec3(0.996, 0.946, 0.896);
          vec3 bg = mix(bgInner, bgOuter, smoothstep(0.12, 0.78, rBg));
          float halo = exp(-rBg * rBg * 6.0);
          bg = mix(bg, vec3(0.992, 0.882, 0.790), halo * 0.42);

          vec2 p = (uv - 0.5) * 2.0;
          p.x *= aspect;
          vec3 ro = vec3(0.0, 0.0, 4.30);
          vec3 rd = normalize(vec3(p, -2.55));

          vec2 bounds = intersectSphere(ro, rd, 1.18);
          if (bounds.y < 0.0) {
            fragColor = vec4(bg, 1.0);
            return;
          }

          float dist = max(0.0, bounds.x);
          float maxDist = bounds.y;
          bool hit = false;

          for (int i = 0; i < 46; i++) {
            vec3 pos = ro + rd * dist;
            float d = mapCoin(pos, u_time);
            if (d < 0.0012) {
              hit = true;
              break;
            }
            dist += d * 0.86;
            if (dist > maxDist) break;
          }

          if (!hit) {
            float glowDist = length(p - vec2(0.02, -0.06));
            float softShadow = exp(-glowDist * glowDist * 4.2);
            bg = mix(bg, vec3(0.978, 0.835, 0.728), softShadow * 0.36);
            fragColor = vec4(bg, 1.0);
            return;
          }

          vec3 pos = ro + rd * dist;
          vec3 n = calcNormal(pos, u_time);
          vec3 v = -rd;
          vec3 q = toCoinSpace(pos, u_time);

          float ndv = clamp(dot(n, v), 0.0, 1.0);
          float fresnel = pow(1.0 - ndv, 3.0);
          float rDisc = length(q.xy);

          vec3 coralDeep  = vec3(0.905, 0.425, 0.210);
          vec3 coralCore  = vec3(0.946, 0.515, 0.288);
          vec3 peachSkirt = vec3(0.985, 0.760, 0.635);

          vec3 baseCol = mix(coralCore, coralDeep, smoothstep(0.15, 0.88, rDisc));

          vec3 lKey = normalize(vec3(-0.28, 0.56, 0.78));
          vec3 lRim = normalize(vec3(0.84, 0.16, 0.52));
          float diff = clamp(dot(n, lKey) * 0.42 + 0.58, 0.0, 1.0);
          vec3 col = baseCol * (0.86 + 0.18 * diff);

          // Translucent lighter coral-peach glass side skirt + crisp bottom glass rim
          float isSide = 1.0 - smoothstep(0.11, 0.19, q.z);
          float bottomEdge = smoothstep(-0.21, -0.12, q.z) * (1.0 - smoothstep(-0.08, 0.04, q.z));
          col = mix(col, peachSkirt, isSide * 0.55);
          col = mix(col, vec3(0.998, 0.925, 0.885), bottomEdge * 0.55);

          // 1. Crisp studio softbox pool on upper-left of top face (partially grazing W)
          vec3 hKey = normalize(lKey + v);
          vec3 hRim = normalize(lRim + v);
          float specPool = pow(clamp(dot(n, hKey), 0.0, 1.0), 18.0);
          float specCore = pow(clamp(dot(n, hKey), 0.0, 1.0), 68.0);
          float upperLeftSpot = exp(-dot(q.xy - vec2(-0.14, 0.30), q.xy - vec2(-0.14, 0.30)) * 7.5) * smoothstep(0.10, 0.20, q.z);
          col = mix(col, vec3(1.0, 0.975, 0.955), clamp(specPool * 0.38 + specCore * 0.55 + upperLeftSpot * 0.48, 0.0, 0.92));

          // 2. Curved glossy reflection ribbon along right inner bevel
          float bevelBand = smoothstep(0.64, 0.84, rDisc) * smoothstep(0.96, 0.84, rDisc);
          float rightSide = smoothstep(-0.05, 0.72, q.x) * smoothstep(-0.65, 0.55, q.y);
          float specRibbon = pow(clamp(dot(n, hRim), 0.0, 1.0), 16.0) * 0.52 + bevelBand * rightSide * 0.68;
          col = mix(col, vec3(1.0, 0.97, 0.945), clamp(specRibbon, 0.0, 0.88));

          // 3. Recessed liquid metaball W emblem with crisp white glass rim
          if (q.z > 0.06) {
            vec2 wp = q.xy * 1.15;
            float dw = sdWLogo2D(wp);
            float wOutline = exp(-abs(dw) * 44.0);
            float wInner   = smoothstep(0.015, -0.025, dw);
            vec3 wFill = mix(vec3(0.955, 0.550, 0.340), vec3(1.0, 0.965, 0.94), clamp(specPool * 0.95 + upperLeftSpot * 0.85 + 0.12, 0.0, 0.95));
            col = mix(col, wFill, wInner * 0.68);
            col = mix(col, vec3(1.0, 0.975, 0.955), wOutline * 0.90);
          }

          // 4. Razor-crisp pearlescent outer bevel Fresnel rim
          float crispRim = smoothstep(0.55, 0.92, 1.0 - ndv);
          col = mix(col, vec3(1.0, 0.965, 0.94), fresnel * 0.78 + crispRim * 0.28);

          col = mix(col, bg, pow(1.0 - ndv, 5.5) * 0.22);
          fragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
        }
      `;
export const fragOptical = `
        uniform vec2 u_res;
        uniform float u_time;

        const float TWO_PI = 6.28318530718;

        vec2 intersectSphere(vec3 ro, vec3 rd, float r) {
          float b = dot(ro, rd);
          float c = dot(ro, ro) - r * r;
          float h = b * b - c;
          if (h < 0.0) return vec2(-1.0);
          h = sqrt(h);
          return vec2(-b - h, -b + h);
        }

        // Crisp flat-faced thin circular disc with subtle beveled rim (normal along local X)
        float sdDiscX(vec3 p, float radius, float halfThick, float bevel) {
          vec2 d = abs(vec2(length(p.yz), p.x)) - vec2(radius, halfThick);
          return min(max(d.x, d.y), 0.0) + length(max(d, 0.0)) - bevel;
        }

        float mapRing(vec3 p, float t, out vec3 outLocal) {
          // 1. Tilt ring clockwise ('/') around Z by ~18 deg (0.315 rad)
          float cz = 0.9508, sz = 0.3098;
          vec3 q = vec3(cz * p.x - sz * p.y, sz * p.x + cz * p.y, p.z);

          // 2. Tilt ring around X by ~16 deg so front & back discs separate vertically cleanly
          float cx = 0.9613, sx = 0.2756;
          q = vec3(q.x, cx * q.y - sx * q.z, sx * q.y + cx * q.z);

          // 8.0s seamless rotation loop
          float spin = -t * (TWO_PI / 8.0);

          float ringR = 1.96;
          float discR = 0.67;
          float discH = 0.056;
          float bevel = 0.012;

          float dMin = 1e5;
          vec3 bestLoc = vec3(0.0);

          for (int i = 0; i < 8; i++) {
            float a = float(i) * 0.78539816 + spin;
            float sa = sin(a), ca = cos(a);

            vec3 c = vec3(ringR * sa, 0.0, ringR * ca);
            vec3 dPos = q - c;

            vec3 tAxis = vec3(ca, 0.0, -sa);
            vec3 rAxis = vec3(sa, 0.0,  ca);
            vec3 loc = vec3(dot(dPos, tAxis), dPos.y, dot(dPos, rAxis));

            float d = sdDiscX(loc, discR, discH, bevel);
            if (d < dMin) {
              dMin = d;
              bestLoc = loc;
            }
          }

          outLocal = bestLoc;
          return dMin;
        }

        float mapScene(vec3 p, float t) {
          vec3 loc;
          return mapRing(p, t, loc);
        }

        vec3 calcNormal(vec3 p, float t) {
          vec2 e = vec2(0.0022, -0.0022);
          return normalize(
            e.xyy * mapScene(p + e.xyy, t) +
            e.yyx * mapScene(p + e.yyx, t) +
            e.yxy * mapScene(p + e.yxy, t) +
            e.xxx * mapScene(p + e.xxx, t)
          );
        }

        // Crisp optical depth-of-field background bokeh arcs (top-right & bottom-left)
        vec3 backgroundWithBokeh(vec2 uv, float t) {
          vec3 bg = vec3(0.988, 0.896, 0.822); // #fce4d1
          float aspect = u_res.x / u_res.y;
          vec2 p = (uv - 0.5) * vec2(aspect, 1.0);

          float spin = -t * (TWO_PI / 8.0);
          vec3 bokehCol = vec3(0.955, 0.525, 0.220);

          // Top-right blurred out-of-focus discs
          for (int i = 0; i < 4; i++) {
            float fi = float(i);
            float ph = spin + fi * 1.35;
            vec2 center = vec2(
              0.08 + fi * 0.19 + 0.06 * sin(ph),
              0.44 + 0.05 * cos(ph + fi)
            );
            vec2 diff = (p - center) * vec2(1.45, 0.72);
            float blob = exp(-dot(diff, diff) * 52.0);
            bg = mix(bg, bokehCol, blob * 0.44);
          }

          // Bottom-left subtle blurred discs
          for (int j = 0; j < 3; j++) {
            float fj = float(j);
            float ph = -spin + fj * 1.9;
            vec2 center = vec2(
              -0.56 + fj * 0.20 + 0.06 * cos(ph),
              -0.50 + 0.03 * sin(ph)
            );
            vec2 diff = (p - center) * vec2(1.25, 0.95);
            float blob = exp(-dot(diff, diff) * 44.0);
            bg = mix(bg, bokehCol, blob * 0.26);
          }

          return bg;
        }

        void main() {
          vec2 uv = v_uv;
          vec3 bg = backgroundWithBokeh(uv, u_time);

          vec2 p = (uv - 0.5) * 2.0;
          p.x *= u_res.x / u_res.y;

          // Telephoto camera matching the reference's balanced perspective
          vec3 ro = vec3(0.0, 0.0, 11.50);
          vec3 rd = normalize(vec3(p, -5.65));

          vec2 bounds = intersectSphere(ro, rd, 2.80);
          if (bounds.y < 0.0) {
            fragColor = vec4(bg, 1.0);
            return;
          }

          float dist = max(0.0, bounds.x);
          float maxDist = bounds.y;
          bool hit = false;

          for (int i = 0; i < 54; i++) {
            vec3 pos = ro + rd * dist;
            float d = mapScene(pos, u_time);
            if (d < 0.0014) {
              hit = true;
              break;
            }
            dist += d * 0.90;
            if (dist > maxDist) break;
          }

          if (!hit) {
            fragColor = vec4(bg, 1.0);
            return;
          }

          vec3 pos = ro + rd * dist;
          vec3 n = calcNormal(pos, u_time);
          vec3 loc;
          mapRing(pos, u_time, loc);

          // Velvety matte-satin warm orange-to-cream lighting
          vec3 lKey  = normalize(vec3(-0.46, 0.48, 0.74));
          vec3 lWarm = normalize(vec3( 0.68, -0.42, 0.60));

          float ndl = clamp(dot(n, lKey) * 0.50 + 0.50, 0.0, 1.0);
          float ndw = clamp(dot(n, lWarm) * 0.50 + 0.50, 0.0, 1.0);

          // Smooth creamy directional gradient across each circular face
          vec2 faceDir = loc.yz / 0.67;
          float faceGrad = clamp(0.48 + 0.54 * dot(faceDir, vec2(0.50, -0.86)), 0.0, 1.0);

          vec3 orangeRich  = vec3(0.962, 0.510, 0.130); // Deep tangerine #f58221
          vec3 orangeApric = vec3(0.985, 0.688, 0.400); // Apricot midtone #fbaf66
          vec3 creamGlow   = vec3(0.996, 0.908, 0.822); // Luminous peach-cream #fee8d2

          float shade = clamp(faceGrad * 0.60 + ndl * 0.48 - 0.05, 0.0, 1.0);
          vec3 col = mix(orangeRich, orangeApric, smoothstep(0.05, 0.54, shade));
          col = mix(col, creamGlow, smoothstep(0.48, 0.95, shade));

          // Crisp thin cylinder rim / edge shading
          float isEdge = smoothstep(0.625, 0.675, length(loc.yz));
          vec3 rimCol = mix(orangeRich, vec3(0.994, 0.785, 0.565), clamp(ndw * 0.78, 0.0, 1.0));
          col = mix(col, rimCol, isEdge * 0.84);

          // Soft contact ambient occlusion where overlapping discs meet
          float ao = clamp(mapScene(pos + n * 0.14, u_time) / 0.14, 0.0, 1.0);
          col *= (0.87 + 0.13 * ao);

          // Subtle depth separation between front and back halves of the ring
          float depthFade = smoothstep(10.2, 13.8, dist);
          col = mix(col, bg, depthFade * 0.14);

          fragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
        }
      `;
