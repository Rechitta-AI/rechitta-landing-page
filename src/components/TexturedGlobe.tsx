'use client';
import { useRef, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { TextureLoader, Group, AdditiveBlending, BackSide, Vector3, ShaderMaterial, Quaternion, MeshStandardMaterial, SRGBColorSpace, MathUtils } from 'three';
import gsap from 'gsap';

interface City {
  name: string;
  lat: number;
  lng: number;
}

const cities: City[] = [
  { name: 'Mumbai', lat: 19.0760, lng: 72.8777 },
  { name: 'Moscow', lat: 55.7558, lng: 37.6173 },
  { name: 'London', lat: 51.5072, lng: -0.1276 },
  { name: 'Shanghai', lat: 31.2304, lng: 121.4737 },
  { name: 'Riyadh', lat: 24.7136, lng: 46.6753 },
  { name: 'Paris', lat: 48.8566, lng: 2.3522 }
];

// Standard Three.js SphereGeometry UV mapping to Cartesian Coordinates
const getCartesianForCity = (lat: number, lng: number, radius = 2.05) => {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  
  return new Vector3(
    -radius * Math.cos(theta) * Math.sin(phi),
    radius * Math.cos(phi),
    radius * Math.sin(theta) * Math.sin(phi)
  );
};

const getQuaternionForCity = (lat: number, lng: number) => {
  // Use radius 1 to get a unit vector for the city's position on the globe
  const cityVec = getCartesianForCity(lat, lng, 1).normalize();
  
  // We want to rotate the globe such that the city moves to face the camera (+Z)
  const targetVec = new Vector3(0, 0, 1);
  return new Quaternion().setFromUnitVectors(cityVec, targetVec);
};

const atmosphereVertexShader = `
  varying vec3 vNormal;
  varying vec3 vWorldPosition;

  void main() {
    vNormal = normalize(mat3(modelMatrix) * normal);
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPos.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const atmosphereFragmentShader = `
  uniform vec3 uSunPosition;

  varying vec3 vNormal;
  varying vec3 vWorldPosition;

  void main() {
    vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
    vec3 normal = normalize(vNormal);
    vec3 sunDir = normalize(uSunPosition);
    
    float sunOrientation = dot(normal, sunDir);
    float fresnel = 1.0 - abs(dot(viewDirection, normal));
    
    vec3 atmosphereDayColor = vec3(0.30, 0.70, 1.0);
    vec3 atmosphereTwilightColor = vec3(0.74, 0.29, 0.04);
    vec3 atmosphereColor = mix(atmosphereTwilightColor, atmosphereDayColor, smoothstep(-0.25, 0.75, sunOrientation));
    
    float fresnelRemap = clamp((fresnel - 0.73) / (1.0 - 0.73), 0.0, 1.0);
    float alpha = pow(1.0 - fresnelRemap, 3.0);
    alpha *= smoothstep(-0.5, 1.0, sunOrientation);
    
    gl_FragColor = vec4(atmosphereColor, alpha * 0.8);
  }
`;

const markerVertexShader = `
  varying vec3 vNormal;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const markerFragmentShader = `
  varying vec3 vNormal;
  void main() {
    // Create a soft glowing dot by mapping the view angle to intensity
    float intensity = pow(max(0.0, dot(vNormal, vec3(0.0, 0.0, 1.0))), 1.5);
    gl_FragColor = vec4(1.0, 0.5, 0.1, intensity);
  }
`;

function BackgroundStars() {
  const points = useMemo(() => {
    const count = 3000;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      // Generate stars on a massive sphere far away from the Earth
      const r = 40 + Math.random() * 20;
      const theta = 2 * Math.PI * Math.random();
      const phi = Math.acos(2 * Math.random() - 1);
      
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
    }
    return positions;
  }, []);

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[points, 3]}
        />
      </bufferGeometry>
      <pointsMaterial 
        size={0.05} 
        color="#ffffff" 
        transparent 
        opacity={0.4} 
        sizeAttenuation={true} 
      />
    </points>
  );
}

function Earth({ scrollData }: { scrollData: React.MutableRefObject<{ progress: number }> }) {
  const earthRef = useRef<Group>(null);
  
  // Interactive mouse rotation trackers
  const targetQuaternion = useRef(new Quaternion());
  const currentMouseQuaternion = useRef(new Quaternion());
  
  // Dampened animation states to eliminate scroll jitter
  const smoothedScale = useRef(3.5);
  const smoothedRotationP = useRef(0);
  
  const [dayMap, nightMap, cloudsMap] = useLoader(TextureLoader, [
    'https://threejs.org/examples/textures/planets/earth_day_4096.jpg',
    'https://threejs.org/examples/textures/planets/earth_night_4096.jpg',
    'https://threejs.org/examples/textures/planets/earth_bump_roughness_clouds_4096.jpg'
  ]);

  useEffect(() => {
    // Match WebGPU texture settings perfectly (Anisotropy for sharpness at grazing angles, SRGB for correct color)
    dayMap.colorSpace = SRGBColorSpace;
    dayMap.anisotropy = 8;
    dayMap.needsUpdate = true;

    nightMap.colorSpace = SRGBColorSpace;
    nightMap.anisotropy = 8;
    nightMap.needsUpdate = true;

    cloudsMap.anisotropy = 8;
    cloudsMap.needsUpdate = true;
  }, [dayMap, nightMap, cloudsMap]);

  const localSunDirection = useMemo(() => {
    // Lock the Sun exactly over Dubai (Peak Daylight)
    return getCartesianForCity(25.2048, 55.2708, 1).normalize();
  }, []);

  const uniformsRef = useRef({
    tNight: { value: nightMap },
    tClouds: { value: cloudsMap },
    uSunDirection: { value: localSunDirection.clone() }
  });

  const earthMaterial = useMemo(() => {
    // We use a real MeshStandardMaterial to get native PBR lighting from Three.js
    const mat = new MeshStandardMaterial({
      map: dayMap,
      roughnessMap: cloudsMap, // We will override how this is read
      bumpMap: cloudsMap       // We will override the bump logic
    });

    // We inject our WebGPU realism formulas into the native PBR shader
    mat.onBeforeCompile = (shader) => {
      shader.uniforms.tNight = uniformsRef.current.tNight;
      shader.uniforms.tClouds = uniformsRef.current.tClouds;
      shader.uniforms.uSunDirection = uniformsRef.current.uSunDirection;

      // 1. Add vWorldPosition varying
      shader.vertexShader = shader.vertexShader.replace(
        '#include <common>',
        `
        #include <common>
        varying vec3 vWorldPosition;
        `
      );
      shader.vertexShader = shader.vertexShader.replace(
        '#include <worldpos_vertex>',
        `
        #include <worldpos_vertex>
        vWorldPosition = (modelMatrix * vec4(transformed, 1.0)).xyz;
        `
      );

      // 2. Inject uniforms into fragment shader
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <common>',
        `
        #include <common>
        uniform sampler2D tNight;
        uniform sampler2D tClouds;
        uniform vec3 uSunDirection;
        varying vec3 vWorldPosition;
        `
      );

      // 3. Mix clouds into base color BEFORE lighting
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <map_fragment>',
        `
        #include <map_fragment>
        #ifdef USE_MAP
          vec4 cloudsData = texture2D(tClouds, vMapUv);
          float cloudsStrength = smoothstep(0.2, 1.0, cloudsData.b);
          diffuseColor.rgb = mix(diffuseColor.rgb, vec3(1.0), cloudsStrength * 2.0);
        #endif
        `
      );

      // 4. Override roughness logic (Oceans shiny, land/clouds matte)
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <roughnessmap_fragment>',
        `
        float roughnessFactor = roughness;
        #ifdef USE_ROUGHNESSMAP
          vec4 cloudsDataR = texture2D(tClouds, vRoughnessMapUv);
          float cStrength = smoothstep(0.2, 1.0, cloudsDataR.b);
          float rMap = max(cloudsDataR.g, step(0.01, cStrength));
          roughnessFactor = mix(0.25, 0.35, rMap);
        #endif
        `
      );

      // 5. Override bump mapping to include clouds as elevation
      // We must include PerturbNormal2Arb so we don't break the native shader
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <bumpmap_pars_fragment>',
        `
        #ifdef USE_BUMPMAP
          uniform sampler2D bumpMap;
          uniform float bumpScale;
          
          vec2 dHdxy_fwd() {
            vec2 dSTdx = dFdx( vBumpMapUv );
            vec2 dSTdy = dFdy( vBumpMapUv );

            vec4 cData = texture2D( tClouds, vBumpMapUv );
            float cStrength = smoothstep(0.2, 1.0, cData.b);
            float Hll = bumpScale * max(cData.r, cStrength);
            
            vec4 cDataX = texture2D( tClouds, vBumpMapUv + dSTdx );
            float cStrengthX = smoothstep(0.2, 1.0, cDataX.b);
            float dBx = bumpScale * max(cDataX.r, cStrengthX) - Hll;
            
            vec4 cDataY = texture2D( tClouds, vBumpMapUv + dSTdy );
            float cStrengthY = smoothstep(0.2, 1.0, cDataY.b);
            float dBy = bumpScale * max(cDataY.r, cStrengthY) - Hll;

            return vec2( dBx, dBy );
          }

          vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection ) {
            vec3 vSigmaX = normalize( dFdx( surf_pos.xyz ) );
            vec3 vSigmaY = normalize( dFdy( surf_pos.xyz ) );
            vec3 vN = surf_norm;
            vec3 R1 = cross( vSigmaY, vN );
            vec3 R2 = cross( vN, vSigmaX );
            float fDet = dot( vSigmaX, R1 ) * faceDirection;
            vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
            return normalize( abs( fDet ) * surf_norm - vGrad );
          }
        #endif
        `
      );

      // 6. Inject night texture and atmosphere directly into the final PBR color
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <tonemapping_fragment>',
        `
        vec3 viewDir = normalize(cameraPosition - vWorldPosition);
        vec3 geoNormal = normalize(vNormal); 
        
        float sunOrientation = dot(geoNormal, uSunDirection);
        float fresnel = 1.0 - abs(dot(viewDir, geoNormal));
        
        // Convert nightMap from sRGB to Linear because outgoingLight is in Linear space
        vec4 nightTex = texture2D(tNight, vMapUv);
        vec3 nightColor = pow(nightTex.rgb, vec3(2.2));
        
        float dayStrength = smoothstep(-0.25, 0.5, sunOrientation);
        
        // gl_FragColor.rgb currently contains the pure PBR day lighting
        gl_FragColor.rgb = mix(nightColor, gl_FragColor.rgb, dayStrength);
        
        // Add Atmosphere Glow
        vec3 atmosphereDayColor = vec3(0.30, 0.70, 1.0);
        vec3 atmosphereTwilightColor = vec3(0.74, 0.29, 0.04);
        vec3 atmosphereColor = mix(atmosphereTwilightColor, atmosphereDayColor, smoothstep(-0.25, 0.75, sunOrientation));
        
        float atmosphereDayStrength = smoothstep(-0.5, 1.0, sunOrientation);
        float atmosphereMix = clamp(atmosphereDayStrength * pow(fresnel, 2.0), 0.0, 1.0);
        
        gl_FragColor.rgb = mix(gl_FragColor.rgb, atmosphereColor, atmosphereMix);
        
        #include <tonemapping_fragment>
        `
      );
    };

    return mat;
  }, [dayMap, nightMap, cloudsMap]);

  const atmosphereMaterial = useMemo(() => new ShaderMaterial({
    vertexShader: atmosphereVertexShader,
    fragmentShader: atmosphereFragmentShader,
    uniforms: {
      uSunPosition: uniformsRef.current.uSunDirection // Share the dynamic direction uniform
    },
    transparent: true,
    blending: AdditiveBlending,
    side: BackSide,
    depthWrite: false
  }), []);

  const markerMaterial = useMemo(() => new ShaderMaterial({
    vertexShader: markerVertexShader,
    fragmentShader: markerFragmentShader,
    transparent: true,
    blending: AdditiveBlending,
    depthWrite: false
  }), []);

  useEffect(() => {
    const obj = { p: 0 };
    const tween = gsap.quickTo(obj, "p", { duration: 1, ease: "power3.out" });

    const updateRotation = () => {
      const p = scrollData.current.progress;
      let localP = 0;
      if (p < 0.6) localP = 0;
      else if (p > 0.8) localP = 1;
      else localP = (p - 0.6) / 0.2;

      const segments = cities.length - 1;
      const index = Math.min(Math.floor(localP * segments), segments - 1);
      const segmentProgress = (localP * segments) - index;

      const currentCity = cities[index];
      const nextCity = cities[index + 1];

      const qCurrent = getQuaternionForCity(currentCity.lat, currentCity.lng);
      const qNext = getQuaternionForCity(nextCity.lat, nextCity.lng);

      const qTarget = qCurrent.clone().slerp(qNext, segmentProgress);
      targetQuaternion.current.copy(qTarget);
    };

    const interval = setInterval(updateRotation, 16);
    return () => clearInterval(interval);
  }, [scrollData]);

  useFrame((state, delta) => {
    if (earthRef.current) {
      // --- SCROLL ANIMATION SYNC ---
      const rawProgress = scrollData.current.progress;
      const globeProgress = Math.max(0, Math.min((rawProgress - 0.5) / 0.35, 1));
      
      // Dubai Coordinates (Matches exact math used for the glowing cities)
      const latRad = 25.2048 * (Math.PI / 180);
      const lngRad = -55.2708 * (Math.PI / 180); // Negative matches city formula!
      const dx = Math.cos(latRad) * Math.cos(lngRad);
      const dy = Math.sin(latRad);
      const dz = Math.cos(latRad) * Math.sin(lngRad);
      const dubaiPos = new Vector3(dx, dy, dz).normalize();
      
      // We want this position to squarely face the camera (which looks down -Z)
      const dubaiQuat = new Quaternion().setFromUnitVectors(dubaiPos, new Vector3(0, 0, 1));

      // PHASE CHOREOGRAPHY:
      // 0.0 -> 0.3: Zoom out
      // 0.3 -> 0.4: Cinematic Pause
      // 0.4 -> 0.7: Smooth Pan to Dubai
      // 0.7 -> 0.8: Cinematic Pause
      // 0.8 -> 1.0: Crash Zoom into Dubai

      // 1. Calculate Target Scale
      let targetScale = 0.95; 
      if (globeProgress <= 0.3) {
         const p = globeProgress / 0.3;
         const easeOut = 1 - (1 - p) * (1 - p);
         targetScale = 3.5 - (3.5 - 0.95) * easeOut;
      } else if (globeProgress >= 0.8) {
         const p = (globeProgress - 0.8) / 0.2;
         const easeExpo = p === 0 ? 0 : Math.pow(2, 10 * p - 10);
         targetScale = 0.95 + (3.5 - 0.95) * easeExpo;
      }

      // 2. Calculate Target Rotation Phase
      let targetRotP = 0;
      if (globeProgress > 0.4 && globeProgress <= 0.7) {
         const p = (globeProgress - 0.4) / 0.3;
         targetRotP = p * p * (3 - 2 * p); // smoothstep
      } else if (globeProgress > 0.7) {
         targetRotP = 1;
      }

      // 3. Apply Dampening to eliminate ALL scroll jitter!
      smoothedScale.current = MathUtils.damp(smoothedScale.current, targetScale, 4, delta);
      smoothedRotationP.current = MathUtils.damp(smoothedRotationP.current, targetRotP, 3, delta);

      earthRef.current.scale.setScalar(smoothedScale.current);
      
      // 4. Smooth out raw hardware mouse inputs (The Rubber Band / Shock Absorber)
      currentMouseQuaternion.current.slerp(targetQuaternion.current, 5 * delta);

      // 5. Combine interactive mouse rotation with the cinematic Dubai dive
      earthRef.current.quaternion.slerpQuaternions(
        currentMouseQuaternion.current, // Start at the *smoothed* interactive mouse rotation
        dubaiQuat,                      // End completely locked onto Dubai
        smoothedRotationP.current
      );

      // Keep the shader's world-space sun direction synchronized with the rotating globe!
      const worldSun = localSunDirection.clone().applyQuaternion(earthRef.current.quaternion).normalize();
      uniformsRef.current.uSunDirection.value.copy(worldSun);
    }
  });

  return (
    <group ref={earthRef}>
      {/* The Sun is now locked to the globe and rotates with it! */}
      <directionalLight 
        position={localSunDirection.clone().multiplyScalar(5)} 
        intensity={2.5} 
        color="#ffffff" 
      />
      
      {/* Main Earth Sphere */}
      <mesh material={earthMaterial}>
        <sphereGeometry args={[2, 64, 64]} />
      </mesh>
    
      <mesh material={atmosphereMaterial}>
        <sphereGeometry args={[2.08, 64, 64]} />
      </mesh>

      {cities.map((city, i) => {
        const pos = getCartesianForCity(city.lat, city.lng);
        return (
          <group key={i} position={pos}>
            <mesh material={markerMaterial}>
              <sphereGeometry args={[0.05, 16, 16]} />
            </mesh>
            <mesh>
              <sphereGeometry args={[0.012, 16, 16]} />
              <meshBasicMaterial color="#ffffff" />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

export default function TexturedGlobe({ scrollData }: { scrollData: React.MutableRefObject<{ progress: number }> }) {
  return (
    <div className="w-full h-full absolute inset-0 pointer-events-none">
      <Canvas camera={{ position: [0, 0, 7.5], fov: 45 }}>
        <ambientLight intensity={0.05} />
        <BackgroundStars />
        <Earth scrollData={scrollData} />
      </Canvas>
    </div>
  );
}
