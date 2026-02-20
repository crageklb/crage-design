import { shaderMaterial } from '@react-three/drei'
import * as THREE from 'three'

const TRAIL_LEN = 32

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const fragmentShader = /* glsl */ `
  precision highp float;

  uniform float uTime;
  uniform float uTheme;
  uniform float uTouchActive;
  uniform float uSpeed;
  uniform vec2 uMouse;
  uniform vec2 uResolution;

  #define TRAIL_LEN 32
  uniform vec2 uTrail[TRAIL_LEN];
  uniform float uTrailTimes[TRAIL_LEN];
  uniform float uTrailHead;

  #define MAX_WAVES 16
  uniform vec2 uShockOrigins[MAX_WAVES];
  uniform float uShockTimes[MAX_WAVES];

  varying vec2 vUv;

  float hash21(vec2 p) {
    p = fract(p * vec2(234.34, 435.345));
    p += dot(p, p + 34.23);
    return fract(p.x * p.y);
  }

  void main() {
    vec2 uv = vUv;
    float aspect = uResolution.x / uResolution.y;
    vec2 scaled = vec2(uv.x * aspect, uv.y);
    vec2 mScaled = vec2(uMouse.x * aspect, uMouse.y);

    float density = 90.0;
    vec2 grid = scaled * density;
    vec2 id = floor(grid);
    vec2 cell = fract(grid) - 0.5;

    vec2 cellWorld = (id + 0.5) / density;

    // Radial cursor displacement — radius and glow scale with speed
    vec2 delta = cellWorld - mScaled;
    float dist = length(delta);
    float speedInflation = min(uSpeed * 0.8, 1.0);
    float influence = 0.3 + speedInflation * 0.32;
    float strength = 0.4;
    float t = clamp(dist / influence, 0.0, 1.0);
    float falloff = 0.5 + 0.5 * cos(t * 3.14159265);
    vec2 offset = normalize(delta + 0.0001) * falloff * strength;

    // Fluid trail: displacement + illumination (continuous segments, not just circles)
    float trailGlow = 0.0;
    float radius = 0.08;
    float glowRadius = 0.12;

    for (int i = 0; i < TRAIL_LEN; i++) {
      float age = uTime - uTrailTimes[i];
      if (uTrailTimes[i] <= 0.0 || age > 1.8) continue;

      vec2 tPos = vec2(uTrail[i].x * aspect, uTrail[i].y);
      vec2 tDelta = cellWorld - tPos;
      float tDist = length(tDelta);

      float tDecay = exp(-age * 2.5);

      // Point contribution (circle at sample)
      float tFall = smoothstep(radius, 0.0, tDist);
      offset += normalize(tDelta + 0.0001) * tFall * tDecay * 0.32;

      float gFall = smoothstep(glowRadius, 0.0, tDist);
      trailGlow += gFall * tDecay;

      // Segment: bridge to next point in path (older = i-1, wrap). Skip wrap from oldest→newest.
      int head = int(uTrailHead);
      int prev = i == 0 ? TRAIL_LEN - 1 : i - 1;
      bool isOldest = (head + 1) % TRAIL_LEN == i;
      if (!isOldest) {
        float nextAge = uTime - uTrailTimes[prev];
        if (uTrailTimes[prev] > 0.0 && nextAge <= 1.8 && nextAge >= 0.0) {
          vec2 tNext = vec2(uTrail[prev].x * aspect, uTrail[prev].y);
          vec2 seg = tNext - tPos;
          float segLen = length(seg) + 0.0001;

          float t = clamp(dot(cellWorld - tPos, seg) / (segLen * segLen), 0.0, 1.0);
          vec2 closest = tPos + t * seg;
          float segDist = length(cellWorld - closest);

          float segDecay = exp(-mix(age, nextAge, t) * 2.5);
          float segFall = smoothstep(radius, 0.0, segDist);
          offset += normalize(cellWorld - closest + 0.0001) * segFall * segDecay * 0.32;

          float segGlow = smoothstep(glowRadius, 0.0, segDist);
          trailGlow += segGlow * segDecay;
        }
      }
    }
    trailGlow = min(trailGlow, 1.0);

    // Stacking shockwaves
    float shockColor = 0.0;
    for (int i = 0; i < MAX_WAVES; i++) {
      float age = uTime - uShockTimes[i];
      if (uShockTimes[i] <= 0.0 || age > 3.5) continue;

      vec2 origin = vec2(uShockOrigins[i].x * aspect, uShockOrigins[i].y);
      float sDist = length(scaled - origin);

      float waveSpeed = 0.5;
      float waveRadius = age * waveSpeed;
      float waveWidth = 0.06 + age * 0.025;
      float waveFront = exp(-pow((sDist - waveRadius) / waveWidth, 2.0));
      float decay = exp(-age * 0.8);
      float waveStrength = waveFront * decay;

      vec2 sDir = normalize(cellWorld - origin + 0.0001);
      offset += sDir * waveStrength * 0.45;
      shockColor += waveStrength;
    }

    offset = clamp(offset, vec2(-0.38), vec2(0.38));
    float d = length(cell - offset);

    float mInfl = smoothstep(0.24 + speedInflation * 0.26, 0.0, dist);
    float baseRadius = 0.032 + mInfl * 0.04;
    float soft = 0.024;
    float dotMask = smoothstep(baseRadius + soft, baseRadius - soft, d);

    // In light mode, fade dot visibility based on cursor/trail/shock proximity
    float visibility = mix(1.0, mInfl + trailGlow * 0.8 + shockColor * 1.0, uTheme);
    visibility = clamp(visibility, 0.0, 1.0);
    float visMask = dotMask * visibility;

    // Theme-aware colors
    float bright = 0.10 + mInfl * (0.50 + speedInflation * 0.4) + trailGlow * 0.35;

    vec3 bg = mix(vec3(0.0), vec3(1.0), uTheme);
    vec3 dotBase = mix(vec3(1.0), vec3(0.25), uTheme);

    vec3 dotColor = dotBase * bright;
    vec3 warmTint = dotColor * mix(vec3(1.4, 0.7, 0.4), vec3(0.5, 0.7, 1.2), uTheme);
    float cursorNearGradient = 1.0 - smoothstep(0.12, 0.5, uMouse.y);
    vec3 litDot = mix(dotColor, warmTint, max(cursorNearGradient, trailGlow * 0.6));

    vec3 col = mix(bg, litDot, visMask);

    // Trail illumination — bright but fades with trail decay
    vec3 trailTintDark = vec3(0.85, 0.5, 0.25) * trailGlow * visMask * 5.0;
    vec3 trailTintLight = vec3(0.15, 0.35, 0.7) * trailGlow * visMask * 3.0;
    col += trailTintDark * (1.0 - uTheme);
    col -= trailTintLight * uTheme;

    // Shockwave color pulse
    // Dark mode: peak blows out to white. Light mode: peak crushes to black.
    float shockIntensity = shockColor * dotMask;
    vec3 darkEffect = mix(vec3(0.9, 0.5, 0.2), vec3(1.0), min(shockIntensity, 1.0)) * shockIntensity * 6.0;
    col += darkEffect * (1.0 - uTheme);
    col -= vec3(shockIntensity * 6.0) * uTheme;

    // Analog film grain
    float grain = (hash21(uv * 1200.0 + uTime * 4.0) - 0.5) * 0.012;

    col = mix(bg, col, uTouchActive);

    // Soft radial gradient peeking from bottom — slides up on load
    float gradAnim = smoothstep(0.0, 1.2, uTime);
    float centerY = mix(-1.4, -0.25, gradAnim);
    vec2 gradientCenter = vec2(0.5, centerY);
    float r = length(uv - gradientCenter);
    float gradient = smoothstep(0.85, 0.2, r) * smoothstep(0.5, 0.0, uv.y) * gradAnim;
    vec3 darkGrad = vec3(0.14, 0.07, 0.04) * gradient;
    vec3 lightGrad = vec3(0.07, 0.04, 0.0) * gradient;
    col += darkGrad * (1.0 - uTheme);
    col -= lightGrad * uTheme;

    gl_FragColor = vec4(col + grain, 1.0);
  }
`

const DotGridMaterial = shaderMaterial(
  {
    uTime: 0,
    uTheme: 0,
    uTouchActive: 1,
    uSpeed: 0,
    uMouse: new THREE.Vector2(0.5, 0.5),
    uResolution: new THREE.Vector2(1, 1),
    uTrail: Array.from({ length: TRAIL_LEN }, () => new THREE.Vector2(0, 0)),
    uTrailTimes: new Float32Array(TRAIL_LEN).fill(-10),
    uTrailHead: 0,
    uShockOrigins: Array.from({ length: 16 }, () => new THREE.Vector2(0, 0)),
    uShockTimes: new Float32Array(16).fill(-10),
  },
  vertexShader,
  fragmentShader,
)

export { DotGridMaterial, TRAIL_LEN }
