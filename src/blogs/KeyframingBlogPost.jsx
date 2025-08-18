import React, { useState } from 'react';

const KeyframingBlogPost = () => {
  const [showQuickStart, setShowQuickStart] = useState(false);

  return (
    <div className="blog-container">
      <div className="blog-content">
        {/* Header */}
        <header className="blog-header">
          <h1 className="blog-title">
            Transform Your Videos with Keyframing: The Secret to Dynamic Visuals in 2025
          </h1>
          <div className="blog-meta">
            <span className="date">Published: August 18, 2025</span>
            <span className="read-time">• 5 min read</span>
          </div>
        </header>

        {/* Hook + Immediate Value */}
        <div className="blog-section">
          <div className="attention-grabber">
            <p className="intro-text">
              <strong>Reality check:</strong> If your videos feel static or fail to grab attention in
              the first 3 seconds, you’re losing viewers. Keyframing is the secret to creating dynamic,
              scroll-stopping content in 2025.
            </p>
          </div>

          {/* Quick Decision Helper */}
          <div className="quick-decision">
            <div className="decision-box recommended">
              <div className="decision-header">
                <span className="badge">⚡ RECOMMENDED</span>
                <h3>Want to master keyframing in 5 minutes?</h3>
              </div>
              <p>Jump to the <strong>Scenith Method</strong> below—it’s how 75,000+ creators animate
                like pros.</p>
              <button
                className="quick-cta"
                onClick={() => document.getElementById('scenith-method').scrollIntoView({ behavior: 'smooth' })}
              >
                Show Me the Scenith Method →
              </button>
            </div>
            <div className="decision-box">
              <h3>Want to understand all options?</h3>
              <p>Explore why keyframing with Scenith beats traditional methods hands-down.</p>
              <button
                className="secondary-cta"
                onClick={() => setShowQuickStart(!showQuickStart)}
              >
                Compare All Methods
              </button>
            </div>
          </div>

          {/* Method Overview */}
          {showQuickStart && (
            <div className="method-overview">
              <h3>All 3 Methods at a Glance:</h3>
              <div className="method-grid">
                <div className="method-preview">
                  <div className="method-icon">🐌</div>
                  <div>Manual Keyframing<br /><span>2-4 hours</span></div>
                </div>
                <div className="method-preview">
                  <div className="method-icon">👨‍💻</div>
                  <div>Hire Freelancer<br /><span>1-2 days</span></div>
                </div>
                <div className="method-preview winner">
                  <div className="method-icon">🤖</div>
                  <div>Scenith AI<br /><span>5 minutes</span></div>
                  <div className="winner-badge">WINNER</div>
                </div>
              </div>
            </div>
          )}

          <p>
            <strong>Why this matters now:</strong> 80% of viewers decide to keep watching in the first 3
            seconds. Keyframed videos get 47% more shares and 90% of viewers watch on mobile, where
            dynamic visuals shine.
          </p>
        </div>

        {/* THE STAR - Scenith Method */}
        <div className="blog-section" id="scenith-method">
          <h2>🚀 The Game-Changer: Keyframing with Scenith</h2>
          <div className="method-card featured">
            <div className="method-header">
              <span className="difficulty easy">Difficulty: Super Easy</span>
              <span className="time">Time: 5 minutes</span>
              <span className="accuracy">Results: Pro-Level</span>
            </div>

            <div className="demo-section">
              <div className="demo-placeholder">
                <div className="play-button">▶️</div>
                <p>Watch: Static Clip to Viral-Ready Video in 5 Minutes</p>
              </div>
            </div>

            <p>
              Here’s the truth: Scenith’s AI-powered keyframing tool makes pro-level animations
              accessible to everyone. Upload your video, pick an animation style, set keyframes, and
              export. Done.
            </p>

            <div className="step-by-step">
              <h4>Literally 4 clicks:</h4>
              <div className="steps-visual">
                <div className="step">
                  <div className="step-number">1</div>
                  <div>Upload video</div>
                </div>
                <div className="step-arrow">→</div>
                <div className="step">
                  <div className="step-number">2</div>
                  <div>Select keyframe tool</div>
                </div>
                <div className="step-arrow">→</div>
                <div className="step">
                  <div className="step-number">3</div>
                  <div>Pick animation style</div>
                </div>
                <div className="step-arrow">→</div>
                <div className="step">
                  <div className="step-number">4</div>
                  <div>Download</div>
                </div>
              </div>
            </div>

            <div className="social-proof">
              <div className="stat">
                <div className="stat-number">75,000+</div>
                <div className="stat-label">Creators using Scenith</div>
              </div>
              <div className="stat">
                <div className="stat-number">4.8/5</div>
                <div className="stat-label">User rating</div>
              </div>
              <div className="stat">
                <div className="stat-number">53%</div>
                <div className="stat-label">Engagement boost</div>
              </div>
            </div>

            <div className="pros-cons-modern">
              <div className="pros">
                <h4>✅ Why Creators Love It:</h4>
                <ul>
                  <li>Animations done in 5 minutes vs. hours</li>
                  <li>50+ animation styles for any vibe</li>
                  <li>AI ensures perfect timing</li>
                  <li>No editing experience needed</li>
                  <li>Mobile-optimized previews</li>
                </ul>
              </div>
              <div className="cons">
                <h4>❌ The Only Downside:</h4>
                <ul>
                  <li>Requires internet connection</li>
                </ul>
              </div>
            </div>

            <div className="cta-primary">
              <button className="cta-button-main" onClick={() => window.location.href = '/login'}>
                Try Keyframing for FREE on Scenith! →
              </button>
              <p className="cta-subtext">Join 75,000+ creators making scroll-stopping videos</p>
            </div>
          </div>
        </div>

        {/* Why Other Methods Suck */}
        <div className="blog-section">
          <h2>Why Old-School Keyframing Falls Short</h2>
          <p>Here’s why traditional methods can’t compete with Scenith:</p>

          <div className="old-methods">
            <div className="old-method">
              <div className="method-summary">
                <h4>🐌 Manual Keyframing</h4>
                <div className="time-cost">2-4 hours | Free | Frustrating</div>
              </div>
              <p>Dragging sliders in After Effects, tweaking curves, and fixing timing errors. It’s a
                nightmare for non-pros.</p>
              <div className="reality-check">Reality: Your time is worth more than this</div>
            </div>

            <div className="old-method">
              <div className="method-summary">
                <h4>👨‍💻 Hiring Freelancers</h4>
                <div className="time-cost">1-2 days | $100-500 | Unpredictable</div>
              </div>
              <p>Pay for animations, wait days, and hope they match your vision. Revisions mean more
                delays.</p>
              <div className="reality-check">Reality: Scenith does it faster and cheaper</div>
            </div>
          </div>
        </div>

        {/* Objection Handling */}
        <div className="blog-section">
          <h2>Common Keyframing Concerns (Addressed)</h2>
          <div className="concerns-grid">
            <div className="concern-card">
              <h4>🤔 “Is keyframing hard to learn?”</h4>
              <p><strong>Answer:</strong> Not with Scenith. AI templates make it a 5-minute job vs. hours
                of tutorials for traditional software.</p>
            </div>
            <div className="concern-card">
              <h4>🎨 “Can I customize animations?”</h4>
              <p><strong>Yes:</strong> Choose from 50+ styles or tweak position, scale, and timing to
                match your brand.</p>
            </div>
            <div className="concern-card">
              <h4>📱 “Will it look good on mobile?”</h4>
              <p><strong>Yes:</strong> Scenith’s mobile preview ensures animations pop on small screens,
                where 90% of viewers are.</p>
            </div>
          </div>
        </div>

        {/* Pro Tips */}
        <div className="blog-section">
          <h2>Pro Tips for Keyframing Like a Pro</h2>
          <div className="tips-modern">
            <div className="tip-modern">
              <div className="tip-icon">🎯</div>
              <div>
                <h4>Hook in 3 Seconds</h4>
                <p>Animate your opening text or logo with a zoom or bounce to grab attention.</p>
              </div>
            </div>
            <div className="tip-modern">
              <div className="tip-icon">📱</div>
              <div>
                <h4>Mobile-First Design</h4>
                <p>Test animations on Scenith’s mobile preview to ensure they shine on phones.</p>
              </div>
            </div>
            <div className="tip-modern">
              <div className="tip-icon">🔥</div>
              <div>
                <h4>Sync with Audio</h4>
                <p>Align animations with music beats for maximum impact—Scenith’s AI can auto-sync.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Final CTA */}
        <div className="final-cta-section">
          <h2>Ready to Create Scroll-Stopping Videos?</h2>
          <p>Every second spent struggling with complex software is a second you’re not creating viral
            content.</p>

          <div className="cta-benefits-final">
            <div className="benefit">✨ Animate in 5 minutes</div>
            <div className="benefit">🎨 50+ pro styles</div>
            <div className="benefit">📈 53% engagement boost</div>
          </div>

          <button className="cta-button-final" onClick={() => window.location.href = '/login'}>
            Start Animating with Scenith FREE →
          </button>
          <p className="guarantee">No credit card needed • Join 75,000+ creators</p>
        </div>

        {/* Quick FAQ */}
        <div className="blog-section">
          <div className="faq-quick">
            <h3>Quick Answers:</h3>
            <div className="faq-row">
              <strong>What video formats does Scenith support?</strong>
              <span>MP4, MOV, AVI—pretty much everything.</span>
            </div>
            <div className="faq-row">
              <strong>Do I need a premium plan?</strong>
              <span>No, Scenith’s keyframing tool is free to use.</span>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .blog-container {
          max-width: 900px;
          margin: 0 auto;
          padding: 20px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6;
          color: #2c3e50;
        }

        .blog-header {
          text-align: center;
          margin-bottom: 30px;
        }

        .blog-title {
          font-size: 2.2em;
          font-weight: 800;
          color: #1a202c;
          margin-bottom: 15px;
          line-height: 1.2;
        }

        .blog-meta {
          color: #718096;
          font-size: 0.9em;
        }

        .attention-grabber {
          background: linear-gradient(135deg, #ff6b6b, #ee5a24);
          color: white;
          padding: 25px;
          border-radius: 12px;
          margin-bottom: 25px;
          text-align: center;
        }

        .intro-text {
          font-size: 1.2em;
          margin: 0;
          font-weight: 600;
        }

        .quick-decision {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 20px;
          margin: 30px 0;
        }

        .decision-box {
          padding: 25px;
          border-radius: 12px;
          border: 2px solid #e2e8f0;
          background: #f8fafc;
        }

        .decision-box.recommended {
          border-color: #10b981;
          background: linear-gradient(135deg, #d4f4dd, #9ae6b4);
        }

        .decision-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 10px;
        }

        .badge {
          background: #10b981;
          color: white;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 0.8em;
          font-weight: 700;
        }

        .quick-cta,
        .secondary-cta {
          background: #3182ce;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.2s;
          margin-top: 15px;
        }

        .quick-cta:hover,
        .secondary-cta:hover {
          transform: translateY(-1px);
        }

        .secondary-cta {
          background: #718096;
        }

        .method-overview {
          background: #f1f5f9;
          padding: 25px;
          border-radius: 12px;
          margin: 20px 0;
        }

        .method-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 15px;
          margin-top: 15px;
        }

        .method-preview {
          background: white;
          padding: 15px;
          border-radius: 8px;
          text-align: center;
          position: relative;
          border: 2px solid #e2e8f0;
        }

        .method-preview.winner {
          border-color: #10b981;
          background: linear-gradient(135deg, #d4f4dd, #9ae6b4);
        }

        .method-icon {
          font-size: 2em;
          margin-bottom: 8px;
        }

        .winner-badge {
          position: absolute;
          top: -8px;
          right: -8px;
          background: #10b981;
          color: white;
          font-size: 0.7em;
          padding: 2px 8px;
          border-radius: 12px;
          font-weight: 700;
        }

        .method-card.featured {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-radius: 15px;
          padding: 35px;
          margin: 30px 0;
          position: relative;
          overflow: hidden;
        }

        .method-card.featured::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, #ffd700, #ffed4e, #ffd700);
        }

        .method-header {
          display: flex;
          gap: 15px;
          margin-bottom: 25px;
          flex-wrap: wrap;
        }

        .difficulty,
        .time,
        .accuracy {
          padding: 8px 16px;
          border-radius: 25px;
          font-size: 0.85em;
          font-weight: 600;
        }

        .difficulty.easy {
          background: rgba(16, 185, 129, 0.2);
          color: #10b981;
          border: 2px solid #10b981;
        }

        .time {
          background: rgba(251, 191, 36, 0.2);
          color: #f59e0b;
          border: 2px solid #f59e0b;
        }

        .accuracy {
          background: rgba(139, 92, 246, 0.2);
          color: #8b5cf6;
          border: 2px solid #8b5cf6;
        }

        .demo-section {
          margin: 25px 0;
        }

        .demo-placeholder {
          background: rgba(0, 0, 0, 0.3);
          border-radius: 12px;
          padding: 40px;
          text-align: center;
          cursor: pointer;
          transition: transform 0.2s;
        }

        .demo-placeholder:hover {
          transform: scale(1.02);
        }

        .play-button {
          font-size: 3em;
          margin-bottom: 15px;
        }

        .steps-visual {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 15px;
          margin: 25px 0;
          flex-wrap: wrap;
        }

        .step {
          background: rgba(255, 255, 255, 0.2);
          padding: 20px;
          border-radius: 12px;
          text-align: center;
          min-width: 100px;
        }

        .step-number {
          background: #ffd700;
          color: #1a202c;
          width: 30px;
          height: 30px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          margin: 0 auto 10px;
        }

        .step-arrow {
          font-size: 1.5em;
          color: #ffd700;
          font-weight: 700;
        }

        .social-proof {
          display: flex;
          justify-content: space-around;
          margin: 30px 0;
          background: rgba(255, 255, 255, 0.1);
          padding: 25px;
          border-radius: 12px;
        }

        .stat {
          text-align: center;
        }

        .stat-number {
          font-size: 2.5em;
          font-weight: 800;
          color: #ffd700;
        }

        .stat-label {
          font-size: 0.9em;
          opacity: 0.9;
        }

        .pros-cons-modern {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 25px;
          margin: 25px 0;
        }

        .pros,
        .cons {
          background: rgba(255, 255, 255, 0.1);
          padding: 20px;
          border-radius: 12px;
        }

        .cta-primary {
          text-align: center;
          margin: 30px 0;
        }

        .cta-button-main {
          background: #ffd700;
          color: #1a202c;
          border: none;
          padding: 18px 40px;
          border-radius: 50px;
          font-size: 1.2em;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s;
          box-shadow: 0 4px 15px rgba(255, 215, 0, 0.3);
        }

        .cta-button-main:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(255, 215, 0, 0.4);
        }

        .cta-subtext {
          margin-top: 10px;
          opacity: 0.9;
          font-size: 0.9em;
        }

        .old-methods {
          margin: 25px 0;
        }

        .old-method {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 15px;
        }

        .method-summary {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }

        .time-cost {
          background: #fed7d7;
          color: #c53030;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 0.8em;
          font-weight: 600;
        }

        .reality-check {
          background: #fef5e7;
          color: #d69e2e;
          padding: 8px 15px;
          border-radius: 6px;
          font-weight: 600;
          font-size: 0.9em;
          margin-top: 10px;
        }

        .concerns-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 20px;
          margin: 25px 0;
        }

        .concern-card {
          background: white;
          padding: 25px;
          border-radius: 12px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
          border-top: 4px solid #3182ce;
        }

        .tips-modern {
          display: grid;
          gap: 20px;
          margin: 25px 0;
        }

        .tip-modern {
          display: flex;
          align-items: flex-start;
          gap: 20px;
          background: white;
          padding: 25px;
          border-radius: 12px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
        }

        .tip-icon {
          font-size: 2em;
          background: #e6fffa;
          padding: 15px;
          border-radius: 12px;
        }

        .final-cta-section {
          background: linear-gradient(135deg, #1a202c, #2d3748);
          color: white;
          padding: 40px;
          border-radius: 15px;
          text-align: center;
          margin: 40px 0;
        }

        .cta-benefits-final {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 15px;
          margin: 25px 0;
          max-width: 500px;
          margin-left: auto;
          margin-right: auto;
        }

        .benefit {
          background: rgba(255, 255, 255, 0.1);
          padding: 12px;
          border-radius: 8px;
          font-weight: 600;
        }

        .cta-button-final {
          background: #10b981;
          color: white;
          border: none;
          padding: 20px 50px;
          border-radius: 50px;
          font-size: 1.3em;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s;
          box-shadow: 0 4px 20px rgba(16, 185, 129, 0.3);
        }

        .cta-button-final:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 25px rgba(16, 185, 129, 0.4);
        }

        .guarantee {
          margin-top: 15px;
          opacity: 0.8;
          font-size: 0.9em;
        }

        .faq-quick {
          background: #f8fafc;
          padding: 25px;
          border-radius: 12px;
        }

        .faq-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 15px 0;
          border-bottom: 1px solid #e2e8f0;
        }

        .faq-row:last-child {
          border-bottom: none;
        }

        /* Mobile Responsive */
        @media (max-width: 768px) {
          .quick-decision {
            grid-template-columns: 1fr;
          }

          .method-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
          }

          .method-preview {
            padding: 10px;
          }

          .steps-visual {
            flex-direction: column;
            gap: 10px;
          }

          .step-arrow {
            transform: rotate(90deg);
          }

          .social-proof {
            flex-direction: column;
            gap: 20px;
          }

          .pros-cons-modern {
            grid-template-columns: 1fr;
          }

          .concerns-grid {
            grid-template-columns: 1fr;
          }

          .cta-benefits-final {
            grid-template-columns: 1fr;
          }

          .blog-title {
            font-size: 1.6em;
          }

          .method-card.featured {
            padding: 25px;
          }

          .faq-row {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
          }
        }

        @media (max-width: 480px) {
          .blog-container {
            padding: 15px;
          }

          .attention-grabber {
            padding: 20px;
          }

          .intro-text {
            font-size: 1.1em;
          }

          .method-grid {
            grid-template-columns: 1fr;
          }

          .decision-box {
            padding: 20px;
          }

          .method-card.featured {
            padding: 20px;
          }

          .final-cta-section {
            padding: 30px 20px;
          }

          .cta-button-final {
            padding: 16px 30px;
            font-size: 1.1em;
          }
        }
      `}</style>
    </div>
  );
};

export default KeyframingBlogPost;