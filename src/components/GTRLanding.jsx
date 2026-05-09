import React, { Suspense, useRef, useLayoutEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, Float, ContactShadows, Text, MeshDistortMaterial } from '@react-three/drei';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './GTRLanding.css';

gsap.registerPlugin(ScrollTrigger);

const Model = ({ modelRef }) => {
  return (
    <group ref={modelRef} position={[0, -0.5, 0]}>
      {/* Body */}
      <mesh position={[0, 0.4, 0]}>
        <boxGeometry args={[4, 0.8, 1.8]} />
        <meshStandardMaterial color="#c1121f" roughness={0.1} metalness={0.8} />
      </mesh>
      {/* Cabin */}
      <mesh position={[-0.2, 1, 0]}>
        <boxGeometry args={[2, 0.6, 1.4]} />
        <meshStandardMaterial color="#111" roughness={0} metalness={1} />
      </mesh>
      {/* Wheels */}
      {[[-1.2, 0, 0.8], [1.2, 0, 0.8], [-1.2, 0, -0.8], [1.2, 0, -0.8]].map((pos, i) => (
        <mesh key={i} position={pos} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.4, 0.4, 0.3, 32]} />
          <meshStandardMaterial color="#222" />
        </mesh>
      ))}
    </group>
  );
};

const GTRLanding = ({ setPage }) => {
  const modelRef = useRef();
  const containerRef = useRef();

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      // Model animations
      if (modelRef.current) {
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: ".gtr-main",
            start: "top top",
            end: "bottom bottom",
            scrub: 1,
          }
        });

        tl.to(modelRef.current.rotation, { y: Math.PI / 2 }, "step1")
          .to(modelRef.current.position, { x: 2, z: -2 }, "step1")

          .to(modelRef.current.rotation, { y: Math.PI, x: 0.2 }, "step2")
          .to(modelRef.current.position, { x: -2, z: -1 }, "step2")

          .to(modelRef.current.rotation, { y: Math.PI * 1.5, x: 0 }, "step3")
          .to(modelRef.current.position, { x: 0, z: 0 }, "step3");
      }

      // Text animations
      gsap.utils.toArray('.content').forEach((content) => {
        gsap.fromTo(content,
          { opacity: 0, y: 50 },
          {
            opacity: 1,
            y: 0,
            scrollTrigger: {
              trigger: content,
              start: "top 80%",
              end: "top 50%",
              scrub: true,
            }
          }
        );
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div className="gtr-container" ref={containerRef}>
      <div className="canvas-container">
        <Canvas camera={{ position: [0, 0, 6], fov: 45 }}>
          <color attach="background" args={['#000000']} />
          <Suspense fallback={null}>
            <Float rotationIntensity={0.3} floatIntensity={0.3}>
              <Model modelRef={modelRef} />
            </Float>

            <ContactShadows
              position={[0, -0.1, 0]}
              opacity={0.8}
              scale={15}
              blur={2}
              far={1.5}
            />

            <Environment preset="night" />
            <ambientLight intensity={0.2} />
            <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} />
            <pointLight position={[-10, -10, -10]} intensity={0.5} color="#c1121f" />
          </Suspense>
        </Canvas>
      </div>

      <header className="gtr-header">
        <div className="logo">NISSAN</div>
        <nav>
          <ul>
            <li onClick={() => setPage('landing')}>Home</li>
            <li>Heritage</li>
            <li>Performance</li>
            <li>Design</li>
          </ul>
        </nav>
      </header>

      <main className="gtr-main">
        <section className="section hero">
          <div className="content">
            <h1>NISSAN GT-R</h1>
            <p>THE ULTIMATE SUPERCAR.</p>
          </div>
        </section>

        <section className="section heritage">
          <div className="content">
            <h2>Heritage</h2>
            <p>From the legendary Skyline to the modern-day R35, the GT-R has always been about pushing limits.</p>
          </div>
        </section>

        <section className="section performance">
          <div className="content">
            <h2>Performance</h2>
            <p>Twin-turbo V6, ATTESA E-TS All-Wheel Drive, and a legacy of dominance on the track.</p>
          </div>
        </section>

        <section className="section design">
          <div className="content">
            <h2>Design</h2>
            <p>Form follows function. Every curve is engineered for aerodynamic efficiency.</p>
          </div>
        </section>
      </main>

      <footer className="gtr-footer">
        <p>© 2025 Nissan GT-R Fan Project. Built with React & Three.js</p>
      </footer>
    </div>
  );
};

export default GTRLanding;
