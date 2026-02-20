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
  uniform vec2 uMouse;
  uniform vec2 uResolution;

  #define TRAIL_LEN 32
  uniform vec2 uTrail[TRAIL_LEN];
  uniform float uTrailTimes[TRAIL_LEN];

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

    // Radial cursor displacement
    vec2 delta = cellWorld - mScaled;
    float dist = length(delta);
    float influence = 0.3;
    float strength = 0.4;
    float falloff = smoothstep(influence, 0.0, dist);
    vec2 offset = normalize(delta + 0.0001) * falloff * strength;

    // Fluid trail: displacement + illumination
    float trailGlow = 0.0;
    for (int i = 0; i < TRAIL_LEN; i++) {
      float age = uTime - uTrailTimes[i];
      if (uTrailTimes[i] <= 0.0 || age > 1.8) continue;

      vec2 tPos = vec2(uTrail[i].x * aspect, uTrail[i].y);
      vec2 tDelta = cellWorld - tPos;
      float tDist = length(tDelta);

      float radius = 0.08;
      float tFall = smoothstep(radius, 0.0, tDist);
      float tDecay = exp(-age * 2.5);

      offset += normalize(tDelta + 0.0001) * tFall * tDecay * 0.32;

      float glowRadius = 0.12;
      float gFall = smoothstep(glowRadius, 0.0, tDist);
      trailGlow += gFall * tDecay;
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
      float decay = exp(-age * 1.2);
      float waveStrength = waveFront * decay;

      vec2 sDir = normalize(cellWorld - origin + 0.0001);
      offset += sDir * waveStrength * 0.4;
      shockColor += waveStrength;
    }

    offset = clamp(offset, vec2(-0.38), vec2(0.38));
    float d = length(cell - offset);

    float mInfl = smoothstep(0.24, 0.0, dist);
    float baseRadius = 0.032 + mInfl * 0.04;
    float soft = 0.024;
    float dotMask = smoothstep(baseRadius + soft, baseRadius - soft, d);

    // In light mode, fade dot visibility based on cursor/trail proximity
    float visibility = mix(1.0, mInfl + trailGlow * 0.8 + shockColor * 0.6, uTheme);
    visibility = clamp(visibility, 0.0, 1.0);
    float visMask = dotMask * visibility;

    // Theme-aware colors
    float bright = 0.10 + mInfl * 0.50 + trailGlow * 0.35;

    vec3 bg = mix(vec3(0.0), vec3(1.0), uTheme);
    vec3 dotBase = mix(vec3(1.0), vec3(0.25), uTheme);

    vec3 dotColor = dotBase * bright;
    vec3 warmTint = dotColor * mix(vec3(1.4, 0.7, 0.4), vec3(0.5, 0.7, 1.2), uTheme);
    float cursorNearGradient = 1.0 - smoothstep(0.12, 0.5, uMouse.y);
    vec3 litDot = mix(dotColor, warmTint, max(cursorNearGradient, trailGlow * 0.6));

    vec3 col = mix(bg, litDot, visMask);

    // Trail illumination
    vec3 trailTint = mix(vec3(0.5, 0.25, 0.12), vec3(0.1, 0.2, 0.45), uTheme);
    col += trailTint * trailGlow * visMask * 2.0;

    // Shockwave color pulse
    vec3 shockTint = mix(vec3(0.6, 0.3, 0.15), vec3(0.15, 0.3, 0.6), uTheme);
    col += shockTint * shockColor * visMask * 2.2;

    // Soft radial gradient peeking from bottom
    vec2 gradientCenter = vec2(0.5, -0.25);
    float r = length(uv - gradientCenter);
    float gradient = smoothstep(0.85, 0.2, r) * smoothstep(0.5, 0.0, uv.y);
    vec3 darkGrad = vec3(0.14, 0.07, 0.04) * gradient;
    vec3 lightGrad = vec3(0.07, 0.04, 0.0) * gradient;
    col += darkGrad * (1.0 - uTheme);
    col -= lightGrad * uTheme;

    // Analog film grain
    float grain = (hash21(uv * 1200.0 + uTime * 4.0) - 0.5) * 0.012;

    gl_FragColor = vec4(col + grain, 1.0);
  }
`

const DotGridMaterial = shaderMaterial(
  {
    uTime: 0,
    uTheme: 0,
    uMouse: new THREE.Vector2(0.5, 0.5),
    uResolution: new THREE.Vector2(1, 1),
    uTrail: Array.from({ length: TRAIL_LEN }, () => new THREE.Vector2(0, 0)),
    uTrailTimes: new Float32Array(TRAIL_LEN).fill(-10),
    uShockOrigins: Array.from({ length: 16 }, () => new THREE.Vector2(0, 0)),
    uShockTimes: new Float32Array(16).fill(-10),
  },
  vertexShader,
  fragmentShader,
)

export { DotGridMaterial, TRAIL_LEN }
