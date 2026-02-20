import { shaderMaterial } from '@react-three/drei'
import * as THREE from 'three'

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
  uniform vec2 uMouse;
  uniform vec2 uResolution;
  #define MAX_WAVES 8
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

    // Cursor displacement
    vec2 delta = cellWorld - mScaled;
    float dist = length(delta);
    float influence = 0.3;
    float strength = 0.4;
    float falloff = smoothstep(influence, 0.0, dist);
    vec2 offset = normalize(delta + 0.0001) * falloff * strength;

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
      offset += sDir * waveStrength * 0.25;
      shockColor += waveStrength;
    }

    float d = length(cell - offset);

    float mInfl = smoothstep(0.24, 0.0, dist);
    float baseRadius = 0.032 + mInfl * 0.04;
    float soft = 0.024;
    float dot = smoothstep(baseRadius + soft, baseRadius - soft, d);

    float bright = 0.10 + mInfl * 0.12;

    vec3 baseBrightness = vec3(dot * bright);
    vec3 grey = baseBrightness;
    vec3 warmTint = baseBrightness * vec3(1.4, 0.7, 0.4);
    float cursorNearGradient = 1.0 - smoothstep(0.12, 0.5, uMouse.y);
    vec3 col = mix(grey, warmTint, cursorNearGradient);

    // Shockwave color pulse
    vec3 shockTint = vec3(0.6, 0.3, 0.15);
    col += shockTint * shockColor * dot * 1.5;

    // Soft radial gradient peeking from bottom — warm amber glow
    vec2 gradientCenter = vec2(0.5, -0.25);
    float r = length(uv - gradientCenter);
    float gradient = smoothstep(0.85, 0.2, r) * smoothstep(0.5, 0.0, uv.y);
    vec3 gradientTint = vec3(0.14, 0.07, 0.04);
    col += gradientTint * gradient;

    // Analog film grain over whole background
    float grain = (hash21(uv * 1200.0 + uTime * 4.0) - 0.5) * 0.035;

    gl_FragColor = vec4(col + grain, 1.0);
  }
`

const DotGridMaterial = shaderMaterial(
  {
    uTime: 0,
    uMouse: new THREE.Vector2(0.5, 0.5),
    uResolution: new THREE.Vector2(1, 1),
    uShockOrigins: Array.from({ length: 8 }, () => new THREE.Vector2(0, 0)),
    uShockTimes: new Float32Array(8).fill(-10),
  },
  vertexShader,
  fragmentShader,
)

export { DotGridMaterial }
