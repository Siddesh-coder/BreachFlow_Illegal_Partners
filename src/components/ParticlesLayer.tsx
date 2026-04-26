import { useEffect, useRef } from "react";

declare global {
  interface Window {
    THREE: any;
  }
}

const THREE_CDN = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js";

function loadThree(): Promise<any> {
  if (typeof window === "undefined") return Promise.reject();
  if (window.THREE) return Promise.resolve(window.THREE);
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(
      `script[src="${THREE_CDN}"]`,
    ) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", () => resolve(window.THREE));
      existing.addEventListener("error", reject);
      return;
    }
    const s = document.createElement("script");
    s.src = THREE_CDN;
    s.async = true;
    s.onload = () => resolve(window.THREE);
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

export function ParticlesLayer({ className = "" }: { className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    let disposed = false;
    let renderer: any;
    let scene: any;
    let camera: any;
    let points: any;
    let onResize: (() => void) | null = null;

    loadThree()
      .then((THREE) => {
        if (disposed || !containerRef.current) return;
        const container = containerRef.current;
        const width = container.clientWidth;
        const height = container.clientHeight;

        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
        camera.position.z = 50;

        renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setSize(width, height);
        renderer.setClearColor(0x000000, 0);
        container.appendChild(renderer.domElement);

        const COUNT = 60;
        const positions = new Float32Array(COUNT * 3);
        const velocities = new Float32Array(COUNT * 3);
        for (let i = 0; i < COUNT; i++) {
          positions[i * 3] = (Math.random() - 0.5) * 80;
          positions[i * 3 + 1] = (Math.random() - 0.5) * 50;
          positions[i * 3 + 2] = (Math.random() - 0.5) * 30;
          velocities[i * 3] = (Math.random() - 0.5) * 0.01;
          velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.008 + 0.002;
          velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.005;
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

        const material = new THREE.PointsMaterial({
          color: 0x9a91fc,
          size: 0.18,
          transparent: true,
          opacity: 0.2,
          sizeAttenuation: true,
        });

        points = new THREE.Points(geometry, material);
        scene.add(points);

        const animate = () => {
          if (disposed) return;
          const pos = geometry.attributes.position.array as Float32Array;
          for (let i = 0; i < COUNT; i++) {
            pos[i * 3] += velocities[i * 3];
            pos[i * 3 + 1] += velocities[i * 3 + 1];
            pos[i * 3 + 2] += velocities[i * 3 + 2];
            // wrap around
            if (pos[i * 3 + 1] > 25) pos[i * 3 + 1] = -25;
            if (pos[i * 3 + 1] < -25) pos[i * 3 + 1] = 25;
            if (pos[i * 3] > 40) pos[i * 3] = -40;
            if (pos[i * 3] < -40) pos[i * 3] = 40;
          }
          geometry.attributes.position.needsUpdate = true;
          renderer.render(scene, camera);
          rafRef.current = requestAnimationFrame(animate);
        };
        animate();

        onResize = () => {
          if (!container || !renderer || !camera) return;
          const w = container.clientWidth;
          const h = container.clientHeight;
          renderer.setSize(w, h);
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
        };
        window.addEventListener("resize", onResize);
      })
      .catch(() => {
        // silently fail — particles are decorative
      });

    return () => {
      disposed = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (onResize) window.removeEventListener("resize", onResize);
      if (renderer) {
        renderer.dispose?.();
        if (renderer.domElement?.parentNode) {
          renderer.domElement.parentNode.removeChild(renderer.domElement);
        }
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`pointer-events-none ${className}`}
      aria-hidden="true"
    />
  );
}
