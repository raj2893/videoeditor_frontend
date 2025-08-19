import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import '../CSS/blogs/how-to-add-subtitles-to-video.css'; // Your provided CSS path

const HowToAddSubtitlesToVideo = () => {
  const [showQuickStart, setShowQuickStart] = useState(false);

  return (
    <>
      <Navbar pageType="landing" /> {/* Adjust pageType as needed */}
      <Helmet>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Stop Wasting Hours on Subtitles: Add Them to Any Video in 30 Seconds (2025)</title>
        <meta
          name="description"
          content="Learn how to add subtitles to videos in 30 seconds using AI tools like Scenith. Compare 5 methods, see why AI wins, and boost your video views by 40%."
        />
        <meta name="keywords" content="add subtitles to video, AI subtitles, video accessibility, Scenith, subtitle generation" />
        <meta name="author" content="Scenith" />
        <meta name="robots" content="index, follow" />
        <meta property="og:title" content="Stop Wasting Hours on Subtitles: Add Them to Any Video in 30 Seconds (2025)" />
        <meta
          property="og:description"
          content="Discover the fastest way to add subtitles to your videos with AI. Save hours and increase views by 40%. Try Scenith for free!"
        />
        <meta property="og:type" content="article" />
        <meta property="og:url" content="https://yourwebsite.com/blog/add-subtitles-to-video" />
        <meta property="og:image" content="https://yourwebsite.com/images/subtitle-guide-og.jpg" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Stop Wasting Hours on Subtitles: Add Them to Any Video in 30 Seconds (2025)" />
        <meta
          name="twitter:description"
          content="Discover the fastest way to add subtitles to your videos with AI. Save hours and increase views by 40%. Try Scenith for free!"
        />
        <meta name="twitter:image" content="https://yourwebsite.com/images/subtitle-guide-og.jpg" />
        <link rel="canonical" href="https://yourwebsite.com/blog/add-subtitles-to-video" />
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Article',
            headline: 'Stop Wasting Hours on Subtitles: Add Them to Any Video in 30 Seconds (2025)',
            description:
              'Learn how to add subtitles to videos in 30 seconds using AI tools like Scenith. Compare 5 methods, see why AI wins, and boost your video views by 40%.',
            author: {
              '@type': 'Organization',
              name: 'Scenith',
            },
            publisher: {
              '@type': 'Organization',
              name: 'Scenith',
              logo: {
                '@type': 'ImageObject',
                url: 'https://yourwebsite.com/images/logo.png',
              },
            },
            datePublished: '2025-08-19',
            mainEntityOfPage: {
              '@type': 'WebPage',
              '@id': 'https://yourwebsite.com/blog/add-subtitles-to-video',
            },
          })}
        </script>
      </Helmet>
      <article className="blog-container">
        <header className="blog-header">
          <h1 className="blog-title">
            Stop Wasting Hours on Subtitles: Add Them to Any Video in 30 Seconds (2025)
          </h1>
          <div className="blog-meta">
            <span className="date">Published: August 19, 2025</span>
            <span className="read-time">• 4 min read</span>
          </div>
        </header>

        <section className="blog-section">
          <div className="attention-grabber">
            <p className="intro-text">
              <strong>Reality check:</strong> You're probably spending 3-5 hours manually typing subtitles
              when AI can do it in 30 seconds with 98% accuracy.
            </p>
          </div>

          <div className="quick-decision">
            <div className="decision-box recommended">
              <div className="decision-header">
                <span className="badge">⚡ RECOMMENDED</span>
                <h3>Want the 30-second solution?</h3>
              </div>
              <p>Skip to <strong>AI Method</strong> below - it's what 87% of smart creators use now.</p>
              <button
                className="quick-cta"
                onClick={() => document.getElementById('ai-method').scrollIntoView({ behavior: 'smooth' })}
              >
                Show Me the AI Method →
              </button>
            </div>
            <div className="decision-box">
              <h3>Want to see all options?</h3>
              <p>I'll show you 5 methods (including the slow ones) so you understand why AI wins.</p>
              <button className="secondary-cta" onClick={() => setShowQuickStart(!showQuickStart)}>
                Compare All Methods
              </button>
            </div>
          </div>

          {showQuickStart && (
            <div className="method-overview">
              <h3>All 5 Methods at a Glance:</h3>
              <div className="method-grid">
                <div className="method-preview">
                  <div className="method-icon">🐌</div>
                  <div>Manual<br /><span>3-5 hours</span></div>
                </div>
                <div className="method-preview">
                  <div className="method-icon">📹</div>
                  <div>YouTube<br /><span>60 mins</span></div>
                </div>
                <div className="method-preview winner">
                  <div className="method-icon">🤖</div>
                  <div>AI (Scenith)<br /><span>30 seconds</span></div>
                  <div className="winner-badge">WINNER</div>
                </div>
                <div className="method-preview">
                  <div className="method-icon">👨‍💻</div>
                  <div>Freelancer<br /><span>2-3 days</span></div>
                </div>
                <div className="method-preview">
                  <div className="method-icon">💻</div>
                  <div>Software<br /><span>2 hours</span></div>
                </div>
              </div>
            </div>
          )}

          <p>
            <strong>Why this matters right now:</strong> 85% of social videos are watched without sound,
            and platforms are prioritizing accessible content. Videos with subtitles get 40% more views
            and 12% longer watch time.
          </p>
        </section>

        <section className="blog-section" id="ai-method">
          <h2>🚀 The Game-Changer: AI Subtitle Generation (What 87% Use Now)</h2>
          <div className="method-card featured">
            <div className="method-header">
              <span className="difficulty easy">Difficulty: Ridiculously Easy</span>
              <span className="time">Time: 30 seconds</span>
              <span className="accuracy">Accuracy: 98%</span>
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
        </section>

        <section className="blog-section">
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
        </section>

        <section className="blog-section">
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
        </section>

        <section className="blog-section">
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
        </section>

        <section className="final-cta-section">
          <h2>Ready to Join 50,000+ Creators Who Stopped Wasting Time?</h2>
          <p>Every day you manually add subtitles is a day you could be creating more content instead.</p>

          <div className="cta-benefits-final">
            <div className="benefit">✨ Generate subtitles in 30 seconds</div>
            <div className="benefit">🎨 50+ professional styles</div>
            <div className="benefit">📈 Increase views by 40%</div>
          </div>

          <button className="cta-button-final" onClick={() => window.location.href = '/login'}>
            Try it for FREE on SCENITH! →
          </button>
          <p className="cta-subtext">No credit card needed - start now!</p>
        </section>

        <section className="blog-section">
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
        </section>
      </article>
      <Footer />
    </>
  );
};

export default HowToAddSubtitlesToVideo;