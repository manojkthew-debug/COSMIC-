import React, { useRef, useLayoutEffect, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, PerspectiveCamera, Stars, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// ── Components ───────────────────────────────────────────────────────────────

function F1Car() {
  const group = useRef();
  const body = useRef();
  const frontWing = useRef();
  const backWing = useRef();
  const wheelFL = useRef();
  const wheelFR = useRef();
  const wheelBL = useRef();
  const wheelBR = useRef();

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (group.current) {
      // Gentle floating animation
      group.current.position.y = Math.sin(t * 1.5) * 0.05;
      group.current.rotation.y = Math.sin(t * 0.5) * 0.1;
    }
  });

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: ".scroll-container",
          start: "top top",
          end: "bottom bottom",
          scrub: 1,
        },
      });

      // Rotation of the car
      tl.to(group.current.rotation, { y: Math.PI * 2, ease: "none" }, 0);

      // Dismantle animation (middle of scroll)
      tl.to(body.current.position, { y: 2, ease: "power1.inOut" }, 0.2)
        .to(frontWing.current.position, { z: 4, y: 1, ease: "power1.inOut" }, 0.2)
        .to(backWing.current.position, { z: -4, y: 1, ease: "power1.inOut" }, 0.2)
        .to(wheelFL.current.position, { x: 3, y: 1, z: 2, ease: "power1.inOut" }, 0.2)
        .to(wheelFR.current.position, { x: -3, y: 1, z: 2, ease: "power1.inOut" }, 0.2)
        .to(wheelBL.current.position, { x: 3, y: 1, z: -2, ease: "power1.inOut" }, 0.2)
        .to(wheelBR.current.position, { x: -3, y: 1, z: -2, ease: "power1.inOut" }, 0.2);

      // Reconnect animation (towards the end)
      tl.to(body.current.position, { y: 0, ease: "power1.inOut" }, 0.7)
        .to(frontWing.current.position, { z: 2.2, y: -0.2, ease: "power1.inOut" }, 0.7)
        .to(backWing.current.position, { z: -2.2, y: 0.5, ease: "power1.inOut" }, 0.7)
        .to(wheelFL.current.position, { x: 1.2, y: -0.3, z: 1.5, ease: "power1.inOut" }, 0.7)
        .to(wheelFR.current.position, { x: -1.2, y: -0.3, z: 1.5, ease: "power1.inOut" }, 0.7)
        .to(wheelBL.current.position, { x: 1.2, y: -0.3, z: -1.5, ease: "power1.inOut" }, 0.7)
        .to(wheelBR.current.position, { x: -1.2, y: -0.3, z: -1.5, ease: "power1.inOut" }, 0.7);
    });

    return () => ctx.revert(); // Cleanup GSAP
  }, []);

  return (
    <group ref={group}>
      {/* Main Body */}
      <mesh ref={body} position={[0, 0, 0]} castShadow>
        <boxGeometry args={[1.2, 0.6, 4]} />
        <meshStandardMaterial color="#e10600" roughness={0.1} metalness={0.8} />
      </mesh>

      {/* Front Wing */}
      <mesh ref={frontWing} position={[0, -0.2, 2.2]} castShadow>
        <boxGeometry args={[2.5, 0.1, 0.8]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>

      {/* Back Wing */}
      <mesh ref={backWing} position={[0, 0.5, -2.2]} castShadow>
        <boxGeometry args={[1.8, 0.4, 0.1]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>

      {/* Wheels */}
      <group ref={wheelFL} position={[1.2, -0.3, 1.5]}>
        <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.5, 0.5, 0.4, 32]} />
          <meshStandardMaterial color="#111" roughness={0.5} />
        </mesh>
      </group>
      <group ref={wheelFR} position={[-1.2, -0.3, 1.5]}>
        <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.5, 0.5, 0.4, 32]} />
          <meshStandardMaterial color="#111" roughness={0.5} />
        </mesh>
      </group>
      <group ref={wheelBL} position={[1.2, -0.3, -1.5]}>
        <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.5, 0.5, 0.4, 32]} />
          <meshStandardMaterial color="#111" roughness={0.5} />
        </mesh>
      </group>
      <group ref={wheelBR} position={[-1.2, -0.3, -1.5]}>
        <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.5, 0.5, 0.4, 32]} />
          <meshStandardMaterial color="#111" roughness={0.5} />
        </mesh>
      </group>
    </group>
  );
}

function Scene() {
  const { scene } = useThree();

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      // Background climate transition
      const bgColor = { color: '#000000' };
      scene.background = new THREE.Color(bgColor.color);

      gsap.to(bgColor, {
        color: '#1a2a6c', // Deep blue
        scrollTrigger: {
          trigger: ".scroll-container",
          start: "20% top",
          end: "50% top",
          scrub: true,
          onUpdate: (self) => {
            scene.background.set(bgColor.color);
          }
        }
      });

      gsap.to(bgColor, {
        color: '#b21f1f', // Sunset red
        scrollTrigger: {
          trigger: ".scroll-container",
          start: "50% top",
          end: "80% top",
          scrub: true,
          onUpdate: (self) => {
            scene.background.set(bgColor.color);
          }
        }
      });
    });

    return () => ctx.revert();
  }, [scene]);

  return (
    <>
      <ambientLight intensity={0.5} />
      <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
      <pointLight position={[-10, -10, -10]} intensity={0.5} />
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

      <F1Car />

      <ContactShadows position={[0, -0.8, 0]} opacity={0.4} scale={10} blur={2} far={1} />

      <Environment preset="city" />
    </>
  );
}

export default function F1Landing({ onGetStarted }) {
  const containerRef = useRef();

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      // Reveal text animations
      gsap.from(".reveal", {
        y: 100,
        opacity: 0,
        duration: 1,
        stagger: 0.2,
        ease: "power4.out",
      });
    });
    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="scroll-container" style={{
      height: '500vh',
      background: '#000',
      color: '#fff',
      fontFamily: "'Space Grotesk', sans-serif",
      overflowX: 'hidden'
    }}>
      {/* 3D Background */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100vh',
        zIndex: 0
      }}>
        <Canvas shadows>
          <PerspectiveCamera makeDefault position={[0, 2, 10]} fov={50} />
          <Suspense fallback={null}>
            <Scene />
          </Suspense>
        </Canvas>
      </div>

      {/* Overlays */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Section 1: Hero */}
        <section style={{ height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 10% ' }}>
          <h1 className="reveal" style={{ fontSize: 'clamp(3rem, 10vw, 8rem)', fontWeight: 800, margin: 0, letterSpacing: '-0.02em', lineHeight: 0.9 }}>
            COSMIC <br /> <span style={{ color: '#e10600' }}>F1 EDITION</span>
          </h1>
          <p className="reveal" style={{ fontSize: '1.2rem', maxWidth: '500px', marginTop: '2rem', color: '#888' }}>
            Experience the pinnacle of speed and security. Our encrypted social platform now moves as fast as you do.
          </p>
          <div className="reveal" style={{ marginTop: '3rem' }}>
            <button
              onClick={onGetStarted}
              style={{
                background: '#fff',
                color: '#000',
                border: 'none',
                padding: '1.2rem 2.5rem',
                fontSize: '1rem',
                fontWeight: 600,
                cursor: 'pointer',
                borderRadius: '4px',
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}
            >
              Enter the Paddock
            </button>
          </div>
        </section>

        {/* Section 2: The Machine */}
        <section style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '0 10%' }}>
          <div style={{ maxWidth: '400px', textAlign: 'right' }}>
            <h2 style={{ fontSize: '3rem', fontWeight: 700 }}>THE MACHINE</h2>
            <p style={{ color: '#888', lineHeight: 1.6 }}>
              Dismantled to perfection. Every component of our architecture is built with precision, just like an F1 car.
              Pure engineering, no compromises.
            </p>
          </div>
        </section>

        {/* Section 3: Environment */}
        <section style={{ height: '100vh', display: 'flex', alignItems: 'center', padding: '0 10%' }}>
          <div style={{ maxWidth: '400px' }}>
            <h2 style={{ fontSize: '3rem', fontWeight: 700 }}>ADAPTIVE</h2>
            <p style={{ color: '#888', lineHeight: 1.6 }}>
              From Monaco to Singapore. Our platform adapts to any environment, ensuring your data remains yours, no matter where you are in the galaxy.
            </p>
          </div>
        </section>

        {/* Section 4: Final */}
        <section style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
          <h2 style={{ fontSize: '4rem', fontWeight: 800 }}>READY TO DRIVE?</h2>
          <button
            onClick={onGetStarted}
            style={{
              background: '#e10600',
              color: '#fff',
              border: 'none',
              padding: '1.5rem 4rem',
              fontSize: '1.2rem',
              fontWeight: 700,
              cursor: 'pointer',
              borderRadius: '4px',
              marginTop: '2rem'
            }}
          >
            START NOW
          </button>

          <div style={{
            marginTop: '5rem',
            fontSize: '0.8rem',
            letterSpacing: '2px',
            color: '#444',
            textTransform: 'uppercase'
          }}>
            Created by Manoj Krishna
          </div>
        </section>
      </div>

      <style>{`
        body { margin: 0; background: #000; }
        .scroll-container section {
          position: relative;
          pointer-events: none;
        }
        .scroll-container section button {
          pointer-events: all;
        }
      `}</style>
    </div>
  );
}
