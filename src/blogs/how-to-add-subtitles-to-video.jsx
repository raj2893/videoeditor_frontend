import React, { useState } from 'react';

const HowToAddSubtitlesToVideo = () => {
  const [showQuickStart, setShowQuickStart] = useState(false);

  return (
    <div className="blog-container">
      <div className="blog-content">
        {/* Header */}
        <header className="blog-header">
          <h1 className="blog-title">
            Stop Wasting Hours on Subtitles: Add Them to Any Video in 30 Seconds (2025)
          </h1>
          <div className="blog-meta">
            <span className="date">Published: {new Date().toLocaleDateString()}</span>
            <span className="read-time">• 4 min read</span>
          </div>
        </header>

        {/* Hook + Immediate Value */}
        <div className="blog-section">
          <div className="attention-grabber">
            <p className="intro-text">
              <strong>Reality check:</strong> You're probably spending 3-5 hours manually typing subtitles 
              when AI can do it in 30 seconds with 98% accuracy.
            </p>
          </div>
          
          {/* Quick Decision Helper */}
          <div className="quick-decision">
            <div className="decision-box recommended">
              <div className="decision-header">
                <span className="badge">⚡ RECOMMENDED</span>
                <h3>Want the 30-second solution?</h3>
              </div>
              <p>Skip to <strong>AI Method</strong> below - it's what 87% of smart creators use now.</p>
              <button 
                className="quick-cta"
                onClick={() => document.getElementById('ai-method').scrollIntoView({behavior: 'smooth'})}
              >
                Show Me the AI Method →
              </button>
            </div>
            <div className="decision-box">
              <h3>Want to see all options?</h3>
              <p>I'll show you 5 methods (including the slow ones) so you understand why AI wins.</p>
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
              <h3>All 5 Methods at a Glance:</h3>
              <div className="method-grid">
                <div className="method-preview">
                  <div className="method-icon">🐌</div>
                  <div>Manual<br/><span>3-5 hours</span></div>
                </div>
                <div className="method-preview">
                  <div className="method-icon">📹</div>
                  <div>YouTube<br/><span>60 mins</span></div>
                </div>
                <div className="method-preview winner">
                  <div className="method-icon">🤖</div>
                  <div>AI (Scenith)<br/><span>30 seconds</span></div>
                  <div className="winner-badge">WINNER</div>
                </div>
                <div className="method-preview">
                  <div className="method-icon">👨‍💻</div>
                  <div>Freelancer<br/><span>2-3 days</span></div>
                </div>
                <div className="method-preview">
                  <div className="method-icon">💻</div>
                  <div>Software<br/><span>2 hours</span></div>
                </div>
              </div>
            </div>
          )}

          <p>
            <strong>Why this matters right now:</strong> 85% of social videos are watched without sound, 
            and platforms are prioritizing accessible content. Videos with subtitles get 40% more views 
            and 12% longer watch time.
          </p>
        </div>

        {/* THE STAR - AI Method First */}
        <div className="blog-section" id="ai-method">
          <h2>🚀 The Game-Changer: AI Subtitle Generation (What 87% Use Now)</h2>
          <div className="method-card featured">
            <div className="method-header">
              <span className="difficulty easy">Difficulty: Ridiculously Easy</span>
              <span className="time">Time: 30 seconds</span>
              <span className="accuracy">Accuracy: 98%</span>
            </div>

            <div className="demo-section">
              <div className="demo-placeholder">
                <div className="play-button">▶️</div>
                <p>Watch: Video to Subtitled Video in 30 Seconds</p>
              </div>
            </div>

            <p>
              Here's the truth: Modern AI tools like <strong>Scenith</strong> have solved the subtitle problem. 
              Upload your video, click one button, choose from 50+ professional styles, download. Done.
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
                  <div>Click "Generate"</div>
                </div>
                <div className="step-arrow">→</div>
                <div className="step">
                  <div className="step-number">3</div>
                  <div>Pick style</div>
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
                <div className="stat-number">50,000+</div>
                <div className="stat-label">Videos subtitled daily</div>
              </div>
              <div className="stat">
                <div className="stat-number">98%</div>
                <div className="stat-label">Accuracy rate</div>
              </div>
              <div className="stat">
                <div className="stat-number">4.9/5</div>
                <div className="stat-label">User rating</div>
              </div>
            </div>

            <div className="pros-cons-modern">
              <div className="pros">
                <h4>✅ Why Everyone's Switching:</h4>
                <ul>
                  <li>30-second generation vs. 5-hour manual work</li>
                  <li>More accurate than YouTube auto-captions</li>
                  <li>50+ professional styles (not just white text)</li>
                  <li>Perfect timing automatically</li>
                  <li>Bulk edit hundreds of videos at once</li>
                  <li>No technical skills required</li>
                </ul>
              </div>
              <div className="cons">
                <h4>❌ The Only Downsides:</h4>
                <ul>
                  <li>Requires internet connection</li>
                </ul>
              </div>
            </div>

            <div className="cta-primary">
              <button className="cta-button-main" onClick={() => window.location.href = '/login'}>
                Try it for FREE on SCENITH! →
              </button>
              <p className="cta-subtext">Join 50,000+ creators who stopped wasting time on subtitles</p>
            </div>
          </div>
        </div>

        {/* Why Others Methods Exist But Suck */}
        <div className="blog-section">
          <h2>Why the Old Methods Still Exist (But You Shouldn't Use Them)</h2>
          <p>Look, I'll show you the other methods because you should know what you're NOT missing:</p>

          <div className="old-methods">
            <div className="old-method">
              <div className="method-summary">
                <h4>🐌 Manual Subtitles</h4>
                <div className="time-cost">3-5 hours | Free | Mind-numbing</div>
              </div>
              <p>Typing every word while watching your video on repeat. People did this in 2020. Don't be that person in 2025.</p>
              <div className="reality-check">Reality: You value your time more than $19/month</div>
            </div>

            <div className="old-method">
              <div className="method-summary">
                <h4>📹 YouTube Auto-Captions</h4>
                <div className="time-cost">60 mins | Free | 70% accuracy</div>
              </div>
              <p>Upload to YouTube, wait 30 mins for generation, download, fix dozens of errors, import to editor.</p>
              <div className="reality-check">Reality: "Free" that takes an hour isn't free</div>
            </div>

            <div className="old-method">
              <div className="method-summary">
                <h4>👨‍💻 Hiring Freelancers</h4>
                <div className="time-cost">2-3 days | $50-200 | Communication nightmare</div>
              </div>
              <p>Pay someone on Fiverr, wait days, get back subtitles that don't match your style, revise, repeat.</p>
              <div className="reality-check">Reality: More expensive and slower than AI</div>
            </div>

            <div className="old-method">
              <div className="method-summary">
                <h4>💻 Professional Software</h4>
                <div className="time-cost">2 hours | $20-50/month | Learning curve</div>
              </div>
              <p>Learn Premiere Pro's auto-transcription, fiddle with timing, export, re-import, fix sync issues.</p>
              <div className="reality-check">Reality: Why learn complex software when simple tools exist?</div>
            </div>
          </div>
        </div>

        {/* Objection Handling */}
        <div className="blog-section">
          <h2>Common Concerns About AI Subtitles (Addressed)</h2>
          <div className="concerns-grid">
            <div className="concern-card">
              <h4>🤔 "But is AI really that accurate?"</h4>
              <p><strong>Answer:</strong> 98% accuracy with clear audio. YouTube's auto-captions are ~70%. Human transcription is ~95% but takes forever.</p>
            </div>
            <div className="concern-card">
              <h4>🎨 "Can I customize the look?"</h4>
              <p><strong>Yes:</strong> 50+ pre-designed styles plus custom fonts, colors, animations, and positioning. Way more than manual methods.</p>
            </div>
            <div className="concern-card">
              <h4>🌍 "What about multiple languages?"</h4>
              <p><strong>Supported:</strong> Multiple languages with just seconds of generation time. Try doing that manually.</p>
            </div>
          </div>
        </div>

        {/* Pro Tips */}
        <div className="blog-section">
          <h2>Pro Tips for Maximum Subtitle Impact</h2>
          <div className="tips-modern">
            <div className="tip-modern">
              <div className="tip-icon">🎯</div>
              <div>
                <h4>Hook viewers in first 3 seconds</h4>
                <p>Use bold, animated subtitles for your opening line - this is what stops the scroll</p>
              </div>
            </div>
            <div className="tip-modern">
              <div className="tip-icon">📱</div>
              <div>
                <h4>Mobile-first sizing</h4>
                <p>90% of viewers are on mobile - test your subtitles on a phone screen first</p>
              </div>
            </div>
            <div className="tip-modern">
              <div className="tip-icon">🔥</div>
              <div>
                <h4>Highlight key words</h4>
                <p>Make important words pop with different colors or animations - it increases retention</p>
              </div>
            </div>
          </div>
        </div>

        {/* Final CTA */}
        <div className="final-cta-section">
          <h2>Ready to Join 50,000+ Creators Who Stopped Wasting Time?</h2>
          <p>Every day you manually add subtitles is a day you could be creating more content instead.</p>
          
          <div className="cta-benefits-final">
            <div className="benefit">✨ Generate subtitles in 30 seconds</div>
            <div className="benefit">🎨 50+ professional styles</div>
            <div className="benefit">📈 Increase views by 40%</div>
          </div>

        </div>

        {/* Quick FAQ */}
        <div className="blog-section">
          <div className="faq-quick">
            <h3>Quick Answers:</h3>
            <div className="faq-row">
              <strong>What video formats work?</strong>
              <span>MP4, MOV, AVI - basically everything</span>
            </div>
  
            <div className="faq-row">
              <strong>Do I have to buy a premium plan?</strong>
              <span>There's no premium plan. Everything is free.</span>
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

        .quick-cta, .secondary-cta {
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

        .quick-cta:hover, .secondary-cta:hover {
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
          grid-template-columns: repeat(5, 1fr);
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

        .difficulty, .time, .accuracy {
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
          background: rgba(0,0,0,0.3);
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
          background: rgba(255,255,255,0.2);
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
          background: rgba(255,255,255,0.1);
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

        .pros, .cons {
          background: rgba(255,255,255,0.1);
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
          box-shadow: 0 2px 10px rgba(0,0,0,0.08);
          border-top: 4px solid #3182ce;
        }

        .testimonials {
          margin: 25px 0;
        }

        .testimonial {
          background: #f8fafc;
          padding: 25px;
          border-radius: 12px;
          margin-bottom: 20px;
          border-left: 4px solid #10b981;
        }

        .quote {
          font-size: 1.1em;
          font-style: italic;
          margin-bottom: 15px;
          color: #2d3748;
        }

        .author {
          font-weight: 600;
          color: #718096;
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
          box-shadow: 0 2px 10px rgba(0,0,0,0.05);
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

        .urgency-bar {
          background: #e53e3e;
          color: white;
          padding: 10px 20px;
          border-radius: 25px;
          display: inline-block;
          margin-bottom: 25px;
          font-weight: 600;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
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
          background: rgba(255,255,255,0.1);
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

export default HowToAddSubtitlesToVideo;