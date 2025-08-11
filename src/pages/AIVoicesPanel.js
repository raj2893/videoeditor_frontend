// import React, { useState, useEffect } from 'react';
// import { API_BASE_URL } from '../Config.js';
// import '../CSS/AIVoicesPanel.css';

// const AIVoicesPanel = ({
//   voices,
//   setVoices,
//   selectedVoice,
//   setSelectedVoice,
//   aiVoiceText,
//   setAiVoiceText,
//   handleGenerateAiAudio,
//   isAddingToTimeline,
// }) => {
//   const [filterLanguage, setFilterLanguage] = useState('');
//   const [filterGender, setFilterGender] = useState('');
//   const [uniqueLanguages, setUniqueLanguages] = useState([]);
//   const [uniqueGenders, setUniqueGenders] = useState([]);

//   // Fetch unique languages and genders for dropdowns
//   useEffect(() => {
//     const fetchMetadata = async () => {
//       try {
//         // Assuming you have an endpoint to get all voices for populating dropdowns
//         const response = await fetch(`${API_BASE_URL}/api/ai-voices/get-all-voices`, {
//           headers: {
//             Authorization: `Bearer ${localStorage.getItem('token')}`,
//           },
//         });
//         if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
//         const data = await response.json();
//         setUniqueLanguages([...new Set(data.map((v) => v.language))]);
//         setUniqueGenders([...new Set(data.map((v) => v.gender))]);
//       } catch (error) {
//         console.error('Error fetching metadata:', error);
//         setUniqueLanguages([]);
//         setUniqueGenders([]);
//       }
//     };
//     fetchMetadata();
//   }, []);

//   // Fetch filtered voices based on language and gender
//   useEffect(() => {
//     const fetchFilteredVoices = async () => {
//       try {
//         let url = `${API_BASE_URL}/api/ai-voices/get-all-voices`;
//         if (filterLanguage && filterGender) {
//           url = `${API_BASE_URL}/api/ai-voices/voices-by-language-and-gender?language=${encodeURIComponent(filterLanguage)}&gender=${encodeURIComponent(filterGender)}`;
//         } else if (filterLanguage) {
//           url = `${API_BASE_URL}/api/ai-voices/voices-by-language?language=${encodeURIComponent(filterLanguage)}`;
//         } else if (filterGender) {
//           url = `${API_BASE_URL}/api/ai-voices/voices-by-gender?gender=${encodeURIComponent(filterGender)}`;
//         }

//         const response = await fetch(url, {
//           headers: {
//             Authorization: `Bearer ${localStorage.getItem('token')}`,
//           },
//         });
//         if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
//         const data = await response.json();
//         setVoices(data);
//       } catch (error) {
//         console.error('Error fetching filtered voices:', error);
//         setVoices([]);
//       }
//     };
//     fetchFilteredVoices();
//   }, [filterLanguage, filterGender, setVoices]);

//   return (
//     <div className="section-content ai-voices-panel">
//       <div className="fixed-header">
//         <h3>AI Voice</h3>
//         <textarea
//           value={aiVoiceText}
//           onChange={(e) => setAiVoiceText(e.target.value)}
//           placeholder="Enter text for text-to-speech..."
//           className="ai-voice-textarea"
//         />
//         <button
//           className="generate-voice-button"
//           onClick={handleGenerateAiAudio}
//           disabled={!aiVoiceText.trim() || !selectedVoice || isAddingToTimeline}
//         >
//           Generate AI Voice
//         </button>

//         <div className="filter-section">
//           <select
//             value={filterLanguage}
//             onChange={(e) => setFilterLanguage(e.target.value)}
//             className="filter-select"
//           >
//             <option value="">All Languages</option>
//             {uniqueLanguages.map((lang) => (
//               <option key={lang} value={lang}>
//                 {lang}
//               </option>
//             ))}
//           </select>

//           <select
//             value={filterGender}
//             onChange={(e) => setFilterGender(e.target.value)}
//             className="filter-select"
//           >
//             <option value="">All Genders</option>
//             {uniqueGenders.map((gen) => (
//               <option key={gen} value={gen}>
//                 {gen}
//               </option>
//             ))}
//           </select>
//         </div>
//       </div>

//       <div className="scrollable-voices">
//         {voices.length === 0 ? (
//           <div className="empty-state">No voices available!</div>
//         ) : (
//           <div className="voice-list">
//             {voices.map((voice) => (
//               <div
//                 key={voice.voiceName}
//                 className={`voice-item ${selectedVoice?.voiceName === voice.voiceName ? 'selected' : ''}`}
//                 onClick={() => setSelectedVoice(voice)}
//               >
//                 <img
//                   src={voice.profileUrl}
//                   alt={`${voice.humanName || voice.voiceName} profile`}
//                   className="voice-profile-image"
//                 />
//                 <div className="voice-details">
//                   <div className="voice-title">{voice.humanName || voice.voiceName}</div>
//                   <div className="voice-info">{`${voice.language} (${voice.gender})`}</div>
//                 </div>
//               </div>
//             ))}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default AIVoicesPanel;

// import React, { useState, useEffect, useRef } from 'react';
// import '../CSS/AIVoicesPanel.css';

// const AIVoicesPanel = () => {
//   const canvasRef = useRef(null);
//   const [glitchText, setGlitchText] = useState('AI VOICE GENERATION');
//   const [particles, setParticles] = useState([]);
//   const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
//   const animationRef = useRef(null);

//   // Glitch text effect
//   useEffect(() => {
//     const originalText = 'AI VOICE GENERATION';
//     const glitchChars = '!@#$%^&*()_+-=[]{}|;:,.<>?~`';
    
//     const glitchInterval = setInterval(() => {
//       let glitched = '';
//       for (let i = 0; i < originalText.length; i++) {
//         if (Math.random() < 0.1 && originalText[i] !== ' ') {
//           glitched += glitchChars[Math.floor(Math.random() * glitchChars.length)];
//         } else {
//           glitched += originalText[i];
//         }
//       }
//       setGlitchText(glitched);
      
//       setTimeout(() => setGlitchText(originalText), 100);
//     }, 2000 + Math.random() * 3000);

//     return () => clearInterval(glitchInterval);
//   }, []);

//   // Neural network animation
//   useEffect(() => {
//     const canvas = canvasRef.current;
//     if (!canvas) return;

//     const ctx = canvas.getContext('2d');
//     canvas.width = canvas.offsetWidth;
//     canvas.height = canvas.offsetHeight;

//     // Neural network nodes
//     const nodes = [];
//     const connections = [];
//     const nodeCount = 50;

//     // Initialize nodes
//     for (let i = 0; i < nodeCount; i++) {
//       nodes.push({
//         x: Math.random() * canvas.width,
//         y: Math.random() * canvas.height,
//         vx: (Math.random() - 0.5) * 2,
//         vy: (Math.random() - 0.5) * 2,
//         size: Math.random() * 4 + 2,
//         opacity: Math.random() * 0.8 + 0.2,
//         pulsePhase: Math.random() * Math.PI * 2,
//       });
//     }

//     // Create connections
//     for (let i = 0; i < nodes.length; i++) {
//       for (let j = i + 1; j < nodes.length; j++) {
//         const distance = Math.sqrt(
//           Math.pow(nodes[i].x - nodes[j].x, 2) + Math.pow(nodes[i].y - nodes[j].y, 2)
//         );
//         if (distance < 150) {
//           connections.push({
//             from: i,
//             to: j,
//             opacity: Math.max(0, 1 - distance / 150),
//           });
//         }
//       }
//     }

//     const animate = () => {
//       ctx.clearRect(0, 0, canvas.width, canvas.height);

//       // Update and draw nodes
//       nodes.forEach((node, index) => {
//         // Move nodes
//         node.x += node.vx;
//         node.y += node.vy;

//         // Bounce off edges
//         if (node.x < 0 || node.x > canvas.width) node.vx *= -1;
//         if (node.y < 0 || node.y > canvas.height) node.vy *= -1;

//         // Mouse interaction
//         const mouseDistance = Math.sqrt(
//           Math.pow(mousePos.x - node.x, 2) + Math.pow(mousePos.y - node.y, 2)
//         );
//         if (mouseDistance < 100) {
//           const force = (100 - mouseDistance) / 100;
//           node.vx += (node.x - mousePos.x) * force * 0.01;
//           node.vy += (node.y - mousePos.y) * force * 0.01;
//         }

//         // Pulsing effect
//         node.pulsePhase += 0.05;
//         const pulseSize = node.size + Math.sin(node.pulsePhase) * 2;

//         // Draw node
//         const gradient = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, pulseSize);
//         gradient.addColorStop(0, `rgba(0, 255, 255, ${node.opacity})`);
//         gradient.addColorStop(0.5, `rgba(138, 43, 226, ${node.opacity * 0.6})`);
//         gradient.addColorStop(1, 'rgba(0, 255, 255, 0)');

//         ctx.beginPath();
//         ctx.arc(node.x, node.y, pulseSize, 0, Math.PI * 2);
//         ctx.fillStyle = gradient;
//         ctx.fill();

//         // Core glow
//         ctx.beginPath();
//         ctx.arc(node.x, node.y, pulseSize * 0.3, 0, Math.PI * 2);
//         ctx.fillStyle = `rgba(255, 255, 255, ${node.opacity})`;
//         ctx.fill();
//       });

//       // Draw connections
//       connections.forEach((conn) => {
//         const nodeA = nodes[conn.from];
//         const nodeB = nodes[conn.to];
        
//         const distance = Math.sqrt(
//           Math.pow(nodeA.x - nodeB.x, 2) + Math.pow(nodeA.y - nodeB.y, 2)
//         );
        
//         if (distance < 150) {
//           const opacity = Math.max(0, 1 - distance / 150) * 0.3;
          
//           // Animated flowing effect
//           const time = Date.now() * 0.001;
//           const flow = Math.sin(time + conn.from * 0.1) * 0.5 + 0.5;
          
//           const gradient = ctx.createLinearGradient(nodeA.x, nodeA.y, nodeB.x, nodeB.y);
//           gradient.addColorStop(0, `rgba(0, 255, 255, ${opacity * flow})`);
//           gradient.addColorStop(0.5, `rgba(138, 43, 226, ${opacity})`);
//           gradient.addColorStop(1, `rgba(255, 0, 255, ${opacity * (1 - flow)})`);
          
//           ctx.beginPath();
//           ctx.moveTo(nodeA.x, nodeA.y);
//           ctx.lineTo(nodeB.x, nodeB.y);
//           ctx.strokeStyle = gradient;
//           ctx.lineWidth = 2;
//           ctx.stroke();
//         }
//       });

//       animationRef.current = requestAnimationFrame(animate);
//     };

//     animate();

//     return () => {
//       if (animationRef.current) {
//         cancelAnimationFrame(animationRef.current);
//       }
//     };
//   }, [mousePos]);

//   // Mouse tracking
//   const handleMouseMove = (e) => {
//     const rect = canvasRef.current?.getBoundingClientRect();
//     if (rect) {
//       setMousePos({
//         x: e.clientX - rect.left,
//         y: e.clientY - rect.top,
//       });
//     }
//   };

//   // Particle system for floating elements
//   useEffect(() => {
//     const particleInterval = setInterval(() => {
//       setParticles(prev => [
//         ...prev.slice(-20), // Keep only last 20 particles
//         {
//           id: Date.now(),
//           x: Math.random() * 100,
//           y: Math.random() * 100,
//           delay: Math.random() * 2,
//         }
//       ]);
//     }, 500);

//     return () => clearInterval(particleInterval);
//   }, []);

//   return (
//     <div className="ai-voices-coming-soon">
//       {/* Animated background canvas */}
//       <canvas
//         ref={canvasRef}
//         className="neural-network-canvas"
//         onMouseMove={handleMouseMove}
//       />
      
//       {/* Floating particles */}
//       <div className="floating-particles">
//         {particles.map((particle) => (
//           <div
//             key={particle.id}
//             className="particle"
//             style={{
//               left: `${particle.x}%`,
//               top: `${particle.y}%`,
//               animationDelay: `${particle.delay}s`,
//             }}
//           />
//         ))}
//       </div>

//       {/* Grid overlay */}
//       <div className="cyber-grid" />

//       {/* Main content */}
//       <div className="coming-soon-content">
//         {/* Holographic frame */}
//         <div className="holographic-frame">
//           <div className="frame-corner frame-corner-tl" />
//           <div className="frame-corner frame-corner-tr" />
//           <div className="frame-corner frame-corner-bl" />
//           <div className="frame-corner frame-corner-br" />
          
//           {/* Central AI logo */}
//           <div className="ai-logo-container">
//             <div className="ai-logo">
//               <div className="logo-ring ring-1" />
//               <div className="logo-ring ring-2" />
//               <div className="logo-ring ring-3" />
//               <div className="logo-core">
//                 <span className="ai-text">AI</span>
//               </div>
//             </div>
//           </div>

//           {/* Main title */}
//           <div className="main-title">
//             <h1 className="glitch-text" data-text={glitchText}>
//               {glitchText}
//             </h1>
//             <div className="subtitle">
//               <span className="typing-text">Initializing neural pathways...</span>
//             </div>
//           </div>

//           {/* Status indicators */}
//           <div className="status-indicators">
//             <div className="status-item">
//               <div className="status-dot status-active" />
//               <span>Neural Networks: ONLINE</span>
//             </div>
//             <div className="status-item">
//               <div className="status-dot status-loading" />
//               <span>Voice Synthesis: CALIBRATING</span>
//             </div>
//             <div className="status-item">
//               <div className="status-dot status-pending" />
//               <span>AI Models: TRAINING</span>
//             </div>
//           </div>

//           {/* Progress bar */}
//           <div className="progress-container">
//             <div className="progress-label">SYSTEM INITIALIZATION</div>
//             <div className="progress-bar">
//               <div className="progress-fill" />
//               <div className="progress-glow" />
//             </div>
//             <div className="progress-percent">87.3%</div>
//           </div>

//           {/* Coming soon message */}
//           <div className="coming-soon-message">
//             <p>The future of AI voice generation is almost here.</p>
//             <p>Prepare for an experience beyond imagination.</p>
//           </div>

//           {/* Notification signup */}
//           <div className="notify-section">
//             <div className="notify-input-container">
//               <input
//                 type="email"
//                 placeholder="Enter your email for early access..."
//                 className="notify-input"
//               />
//               <button className="notify-button">
//                 <span>NOTIFY ME</span>
//                 <div className="button-glow" />
//               </button>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Scanning lines */}
//       <div className="scan-lines" />
      
//       {/* Ambient audio visualizer */}
//       <div className="audio-visualizer">
//         {Array.from({ length: 12 }).map((_, i) => (
//           <div
//             key={i}
//             className="visualizer-bar"
//             style={{ animationDelay: `${i * 0.1}s` }}
//           />
//         ))}
//       </div>
//     </div>
//   );
// };

// export default AIVoicesPanel;

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import '../CSS/AIVoicesPanel.css';

const AIVoicesPanel = () => {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    // Three.js setup for 3D AI orb
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, 280 / 200, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ alpha: true });
    renderer.setSize(280, 200);
    mount.appendChild(renderer.domElement);

    // Create a glowing orb with particles
    const geometry = new THREE.SphereGeometry(0.8, 24, 24);
    const material = new THREE.MeshBasicMaterial({
      color: 0x39c0ed,
      wireframe: true,
      transparent: true,
      opacity: 0.6,
    });
    const orb = new THREE.Mesh(geometry, material);
    scene.add(orb);

    // Add particle system for AI effect
    const particleCount = 100;
    const particles = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i++) {
      positions[i] = (Math.random() - 0.5) * 5;
    }
    particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particleMaterial = new THREE.PointsMaterial({
      color: 0x39c0ed,
      size: 0.03,
      transparent: true,
      opacity: 0.7,
    });
    const particleSystem = new THREE.Points(particles, particleMaterial);
    scene.add(particleSystem);

    camera.position.z = 3;

    // Animation loop
    let animationFrameId;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      orb.rotation.x += 0.01;
      orb.rotation.y += 0.01;
      particleSystem.rotation.y += 0.005;
      renderer.render(scene, camera);
    };
    animate();

    // Handle window resize
    const handleResize = () => {
      camera.aspect = 280 / 200;
      camera.updateProjectionMatrix();
      renderer.setSize(280, 200);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      if (mount && renderer.domElement && mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return (
    <div className="section-content ai-voices-panel">
      <div className="coming-soon-container">
        <div className="cyberpunk-bg">
          <div className="neon-grid"></div>
          <div className="glitch-overlay"></div>
        </div>
        <div className="content-wrapper">
          <h1 className="neon-text">AI VOICES</h1>
          <h2 className="neon-subtext">COMING SOON</h2>
          <p className="description">
            Get ready for next-level AI voice synthesis!
          </p>
          <div className="orb-container" ref={mountRef}></div>
          <button className="neon-button">Notify Me</button>
        </div>
      </div>
    </div>
  );
};

export default AIVoicesPanel;