import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

export default function AudioVisualizer() {
  const mountRef = useRef(null);
  const [analyser, setAnalyser] = useState(null);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const arrayBuffer = await file.arrayBuffer();
    const context = new (window.AudioContext || window.webkitAudioContext)();
    const audioBuffer = await context.decodeAudioData(arrayBuffer);

    const source = context.createBufferSource();
    source.buffer = audioBuffer;

    const analyserNode = context.createAnalyser();
    analyserNode.fftSize = 512;
    source.connect(analyserNode);
    analyserNode.connect(context.destination);

    source.start();
    setAnalyser(analyserNode);
  };

  useEffect(() => {
    if (!analyser || !mountRef.current) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    mountRef.current.appendChild(renderer.domElement);

    const geometry = new THREE.PlaneGeometry(10, 10, 64, 64);
    const material = new THREE.ShaderMaterial({
      vertexShader: \`
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      \`,
      fragmentShader: \`
        uniform float bass;
        uniform float time;
        varying vec2 vUv;

        float rand(vec2 co){
          return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
        }

        void main() {
          float intensity = bass * 2.5;
          float glitch = rand(vUv + time) * intensity;
          vec3 color = vec3(
            vUv.x + sin(time * 0.5 + glitch) * 0.2,
            vUv.y + glitch * 0.3,
            0.5 + 0.5 * sin(time + intensity * 10.0)
          );
          gl_FragColor = vec4(color, 1.0);
        }
      \`,
      uniforms: {
        bass: { value: 0.0 },
        time: { value: 0.0 },
      },
    });

    const plane = new THREE.Mesh(geometry, material);
    scene.add(plane);

    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    const clock = new THREE.Clock();

    const animate = () => {
      requestAnimationFrame(animate);
      analyser.getByteFrequencyData(dataArray);
      const bassValue = dataArray.slice(0, 15).reduce((a, b) => a + b, 0) / 15 / 255;
      material.uniforms.bass.value = bassValue;
      material.uniforms.time.value = clock.getElapsedTime();
      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
      mountRef.current.removeChild(renderer.domElement);
    };
  }, [analyser]);

  return (
    <div className="w-full h-screen relative overflow-hidden">
      <input
        type="file"
        accept="audio/*"
        onChange={handleFileUpload}
        className="absolute z-10 top-4 left-4 bg-white p-2 rounded shadow text-sm"
      />
      <div ref={mountRef} className="w-full h-full" />
    </div>
  );
}
