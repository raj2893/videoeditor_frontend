import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../Config.js';
import '../CSS/AIVoicesPanel.css';

const AIVoicesPanel = ({
  voices,
  setVoices,
  selectedVoice,
  setSelectedVoice,
  aiVoiceText,
  setAiVoiceText,
  handleGenerateAiAudio,
  isAddingToTimeline,
}) => {
  const [filterLanguage, setFilterLanguage] = useState('');
  const [filterGender, setFilterGender] = useState('');
  const [uniqueLanguages, setUniqueLanguages] = useState([]);
  const [uniqueGenders, setUniqueGenders] = useState([]);

  // Fetch unique languages and genders for dropdowns
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        // Assuming you have an endpoint to get all voices for populating dropdowns
        const response = await fetch(`${API_BASE_URL}/api/ai-voices/get-all-voices`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        setUniqueLanguages([...new Set(data.map((v) => v.language))]);
        setUniqueGenders([...new Set(data.map((v) => v.gender))]);
      } catch (error) {
        console.error('Error fetching metadata:', error);
        setUniqueLanguages([]);
        setUniqueGenders([]);
      }
    };
    fetchMetadata();
  }, []);

  // Fetch filtered voices based on language and gender
  useEffect(() => {
    const fetchFilteredVoices = async () => {
      try {
        let url = `${API_BASE_URL}/api/ai-voices/get-all-voices`;
        if (filterLanguage && filterGender) {
          url = `${API_BASE_URL}/api/ai-voices/voices-by-language-and-gender?language=${encodeURIComponent(filterLanguage)}&gender=${encodeURIComponent(filterGender)}`;
        } else if (filterLanguage) {
          url = `${API_BASE_URL}/api/ai-voices/voices-by-language?language=${encodeURIComponent(filterLanguage)}`;
        } else if (filterGender) {
          url = `${API_BASE_URL}/api/ai-voices/voices-by-gender?gender=${encodeURIComponent(filterGender)}`;
        }

        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        setVoices(data);
      } catch (error) {
        console.error('Error fetching filtered voices:', error);
        setVoices([]);
      }
    };
    fetchFilteredVoices();
  }, [filterLanguage, filterGender, setVoices]);

  return (
    <div className="section-content ai-voices-panel">
      <div className="fixed-header">
        <h3>AI Voice</h3>
        <textarea
          value={aiVoiceText}
          onChange={(e) => setAiVoiceText(e.target.value)}
          placeholder="Enter text for text-to-speech..."
          className="ai-voice-textarea"
        />
        <button
          className="generate-voice-button"
          onClick={handleGenerateAiAudio}
          disabled={!aiVoiceText.trim() || !selectedVoice || isAddingToTimeline}
        >
          Generate AI Voice
        </button>

        <div className="filter-section">
          <select
            value={filterLanguage}
            onChange={(e) => setFilterLanguage(e.target.value)}
            className="filter-select"
          >
            <option value="">All Languages</option>
            {uniqueLanguages.map((lang) => (
              <option key={lang} value={lang}>
                {lang}
              </option>
            ))}
          </select>

          <select
            value={filterGender}
            onChange={(e) => setFilterGender(e.target.value)}
            className="filter-select"
          >
            <option value="">All Genders</option>
            {uniqueGenders.map((gen) => (
              <option key={gen} value={gen}>
                {gen}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="scrollable-voices">
        {voices.length === 0 ? (
          <div className="empty-state">No voices available!</div>
        ) : (
          <div className="voice-list">
            {voices.map((voice) => (
              <div
                key={voice.voiceName}
                className={`voice-item ${selectedVoice?.voiceName === voice.voiceName ? 'selected' : ''}`}
                onClick={() => setSelectedVoice(voice)}
              >
                <img
                  src={voice.profileUrl}
                  alt={`${voice.humanName || voice.voiceName} profile`}
                  className="voice-profile-image"
                />
                <div className="voice-details">
                  <div className="voice-title">{voice.humanName || voice.voiceName}</div>
                  <div className="voice-info">{`${voice.language} (${voice.gender})`}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AIVoicesPanel;

// import React, { useEffect, useRef } from 'react';
// import * as THREE from 'three';
// import '../CSS/AIVoicesPanel.css';

// const AIVoicesPanel = () => {
//   const mountRef = useRef(null);

//   useEffect(() => {
//     const mount = mountRef.current;
//     if (!mount) return;

//     // Three.js setup for 3D AI orb
//     const scene = new THREE.Scene();
//     const camera = new THREE.PerspectiveCamera(75, 280 / 200, 0.1, 1000);
//     const renderer = new THREE.WebGLRenderer({ alpha: true });
//     renderer.setSize(280, 200);
//     mount.appendChild(renderer.domElement);

//     // Create a glowing orb with particles
//     const geometry = new THREE.SphereGeometry(0.8, 24, 24);
//     const material = new THREE.MeshBasicMaterial({
//       color: 0x39c0ed,
//       wireframe: true,
//       transparent: true,
//       opacity: 0.6,
//     });
//     const orb = new THREE.Mesh(geometry, material);
//     scene.add(orb);

//     // Add particle system for AI effect
//     const particleCount = 100;
//     const particles = new THREE.BufferGeometry();
//     const positions = new Float32Array(particleCount * 3);
//     for (let i = 0; i < particleCount * 3; i++) {
//       positions[i] = (Math.random() - 0.5) * 5;
//     }
//     particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
//     const particleMaterial = new THREE.PointsMaterial({
//       color: 0x39c0ed,
//       size: 0.03,
//       transparent: true,
//       opacity: 0.7,
//     });
//     const particleSystem = new THREE.Points(particles, particleMaterial);
//     scene.add(particleSystem);

//     camera.position.z = 3;

//     // Animation loop
//     let animationFrameId;
//     const animate = () => {
//       animationFrameId = requestAnimationFrame(animate);
//       orb.rotation.x += 0.01;
//       orb.rotation.y += 0.01;
//       particleSystem.rotation.y += 0.005;
//       renderer.render(scene, camera);
//     };
//     animate();

//     // Handle window resize
//     const handleResize = () => {
//       camera.aspect = 280 / 200;
//       camera.updateProjectionMatrix();
//       renderer.setSize(280, 200);
//     };
//     window.addEventListener('resize', handleResize);

//     // Cleanup
//     return () => {
//       window.removeEventListener('resize', handleResize);
//       cancelAnimationFrame(animationFrameId);
//       if (mount && renderer.domElement && mount.contains(renderer.domElement)) {
//         mount.removeChild(renderer.domElement);
//       }
//       renderer.dispose();
//     };
//   }, []);

//   return (
//     <div className="section-content ai-voices-panel">
//       <div className="coming-soon-container">
//         <div className="cyberpunk-bg">
//           <div className="neon-grid"></div>
//           <div className="glitch-overlay"></div>
//         </div>
//         <div className="content-wrapper">
//           <h1 className="neon-text">AI VOICES</h1>
//           <h2 className="neon-subtext">COMING SOON</h2>
//           <p className="description">
//             Get ready for next-level AI voice synthesis!
//           </p>
//           <div className="orb-container" ref={mountRef}></div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default AIVoicesPanel;