import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import axios from 'axios';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import BackgroundRemoval from '../components/BackgroundRemoval';
import Footer from '../components/Footer';
import { API_BASE_URL } from '../Config';
import '../CSS/RemoveBackground.css';

const RemoveBackground = () => {
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userProfile, setUserProfile] = useState({
    email: '',
    firstName: '',
    lastName: '',
    picture: null,
    googleAuth: false,
    role: '',
  });

  // Handle scroll for navbar styling
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch user profile if token exists (for navbar), no redirect
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios
        .get(`${API_BASE_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => {
          const fullName = res.data.name || '';
          const nameParts = fullName.trim().split(' ');
          const firstName = nameParts[0] || '';
          const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
          setUserProfile({
            email: res.data.email || '',
            firstName: firstName,
            lastName: lastName,
            picture: res.data.picture || null,
            googleAuth: res.data.googleAuth || false,
            role: res.data.role || 'BASIC',
          });
          setIsLoggedIn(true);
        })
        .catch((error) => {
          console.error('Error fetching user profile:', error);
          if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('userProfile');
            setIsLoggedIn(false);
          }
        });
    } else {
      setIsLoggedIn(false);
    }
  }, []);

  // Smooth scrolling for section links
  const scrollToSection = (sectionId) => {
    const section = document.getElementById(sectionId);
    if (!section) {
      console.error(`Section with ID ${sectionId} not found.`);
      if (sectionId === 'footer-section') {
        window.scrollTo({
          top: document.documentElement.scrollHeight,
          behavior: 'smooth',
        });
      }
      return;
    }
    const navBar = document.querySelector('.nav-bar');
    const navHeight = navBar ? navBar.offsetHeight : 80;
    const offsetPosition = section.offsetTop - navHeight - 20;
    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth',
    });
  };

  // Current date for SEO freshness
  const currentYear = new Date().getFullYear();

  return (
    <div className="remove-background-page">
      {/* Enhanced SEO Helmet with comprehensive optimization */}
      <Helmet>
        <title>{`Free AI Background Remover ${currentYear} - Remove Photo Backgrounds Online | PhotoCutAI`}</title>
        <meta
          name="description"
          content="Remove image backgrounds instantly with AI for free. Perfect for e-commerce product photos, social media posts & professional designs. Upload JPG/PNG, get transparent backgrounds - no signup required!"
        />
        <meta
          name="keywords"
          content="AI background remover, free background remover, remove image background, photo editor online, transparent background, product photos, e-commerce images, social media graphics, PNG maker, cutout tool, photo editing"
        />
        
        {/* Enhanced Open Graph tags */}
        <meta property="og:title" content="Free AI Background Remover - Instant Transparent Images" />
        <meta
          property="og:description"
          content="Remove backgrounds from photos in seconds with our AI tool. Perfect for product images, social posts & design. Free, no watermarks!"
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={window.location.href} />
        <meta property="og:image" content="https://yourappcdn.com/og-background-remover-hero.jpg" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:site_name" content="PhotoCutAI" />
        
        {/* Enhanced Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@YourAppName" />
        <meta name="twitter:title" content="Free AI Background Remover - Remove Photo Backgrounds Instantly" />
        <meta name="twitter:description" content="AI-powered background removal for e-commerce, social media & design. Free tool with transparent PNG downloads." />
        <meta name="twitter:image" content="https://yourappcdn.com/twitter-card-bg-remover.jpg" />
        
        {/* Additional SEO meta tags */}
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
        <meta name="googlebot" content="index, follow" />
        <meta name="author" content="PhotoCutAI Team" />
        <meta name="generator" content="React.js" />
        <meta name="language" content="English" />
        <meta name="geo.region" content="US" />
        <meta name="geo.country" content="US" />
        <meta name="distribution" content="global" />
        <meta name="rating" content="general" />
        <meta name="revisit-after" content="7 days" />
        
        {/* Canonical URL */}
        <link rel="canonical" href={window.location.href} />
        
        {/* Alternate language versions if applicable */}
        <link rel="alternate" hrefLang="en" href={window.location.href} />
        
        {/* Preconnect for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://yourappcdn.com" />
        
        {/* Enhanced JSON-LD structured data */}
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'SoftwareApplication',
            name: 'PhotoCutAI Background Remover',
            description: 'Free AI-powered background removal tool for creating transparent images from JPG and PNG files.',
            url: window.location.href,
            applicationCategory: 'PhotoEditingApplication',
            operatingSystem: 'Web Browser',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'USD'
            },
            aggregateRating: {
              '@type': 'AggregateRating',
              ratingValue: '4.8',
              reviewCount: '12847'
            },
            author: {
              '@type': 'Organization',
              name: 'PhotoCutAI'
            }
          })}
        </script>
        
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: [
              {
                '@type': 'Question',
                name: 'How do I remove the background from an image for free?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'Upload your JPG or PNG image to our AI background remover tool. Our advanced AI will automatically detect the subject and remove the background in under 5 seconds, providing you with a high-quality transparent PNG file ready for download.'
                }
              },
              {
                '@type': 'Question',
                name: 'Is the AI background remover completely free to use?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'Yes! Our background removal tool is 100% free with no watermarks, no signup required, and no usage limits. Perfect for personal projects, e-commerce product photos, and commercial use.'
                }
              },
              {
                '@type': 'Question',
                name: 'What image formats are supported for background removal?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'We support JPG, JPEG, and PNG image formats up to 30MB in size. The output is always a high-quality transparent PNG file that you can use in any design software or platform.'
                }
              },
              {
                '@type': 'Question',
                name: 'Can I use this for e-commerce product photos?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'Absolutely! Our AI background remover is perfect for creating clean, professional product images for Amazon, Shopify, eBay, and other e-commerce platforms. The transparent backgrounds help your products stand out and load faster.'
                }
              },
              {
                '@type': 'Question',
                name: 'How accurate is the AI for complex images like hair and fur?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'Our advanced AI excels at handling complex edges including hair, fur, and intricate details. The machine learning model has been trained on millions of images to provide precise cutouts even for challenging subjects.'
                }
              }
            ]
          })}
        </script>
        
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              {
                '@type': 'ListItem',
                position: 1,
                name: 'Home',
                item: 'https://yourapp.com'
              },
              {
                '@type': 'ListItem',
                position: 2,
                name: 'Tools',
                item: 'https://yourapp.com/tools'
              },
              {
                '@type': 'ListItem',
                position: 3,
                name: 'Background Remover',
                item: window.location.href
              }
            ]
          })}
        </script>
        
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'HowTo',
            name: 'How to Remove Background from Image with AI',
            description: 'Step-by-step guide to remove backgrounds from photos using AI technology',
            image: 'https://yourappcdn.com/how-to-remove-background.jpg',
            estimatedCost: {
              '@type': 'MonetaryAmount',
              currency: 'USD',
              value: '0'
            },
            supply: [
              {
                '@type': 'HowToSupply',
                name: 'Digital image file (JPG or PNG)'
              }
            ],
            tool: [
              {
                '@type': 'HowToTool',
                name: 'PhotoCutAI Background Remover'
              }
            ],
            totalTime: 'PT30S',
            step: [
              {
                '@type': 'HowToStep',
                name: 'Upload Your Image',
                text: 'Click the upload button and select your JPG or PNG image file from your device.',
                image: 'https://yourappcdn.com/step1-upload.jpg'
              },
              {
                '@type': 'HowToStep',
                name: 'AI Processing',
                text: 'Our AI automatically detects the subject and removes the background with precision in under 5 seconds.',
                image: 'https://yourappcdn.com/step2-processing.jpg'
              },
              {
                '@type': 'HowToStep',
                name: 'Download Result',
                text: 'Download your transparent PNG image, ready for use in your projects, social media, or e-commerce listings.',
                image: 'https://yourappcdn.com/step3-download.jpg'
              }
            ]
          })}
        </script>
      </Helmet>

      <div className="particle-background">
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
      </div>
      
      <Navbar
        isScrolled={isScrolled}
        userProfile={userProfile}
        isLoggedIn={isLoggedIn}
        handleLogout={() => {
          localStorage.removeItem('token');
          localStorage.removeItem('userProfile');
          setUserProfile({
            email: '',
            firstName: '',
            lastName: '',
            picture: null,
            googleAuth: false,
            role: '',
          });
          setIsLoggedIn(false);
          navigate('/');
        }}
        scrollToSection={scrollToSection}
        pageType="background-removal"
      />

      {/* Enhanced Hero Section with better semantic HTML */}
      <section className="hero-section" id="hero" role="main">
        <motion.div
          className="hero-content"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1>Free AI Background Remover - Remove Photo Backgrounds Online in Seconds</h1>
          <p className="hero-description">
            Transform your images instantly with our advanced AI background remover. Upload any JPG or PNG photo and get a professional transparent background in under 5 seconds. Perfect for e-commerce product photos, social media graphics, and professional designs. No signup required, completely free, no watermarks!
          </p>
          
          {/* Enhanced CTA section */}
          <div className="hero-cta-section">
            <BackgroundRemoval />
            <div className="trust-indicators">
              <span className="trust-item">✅ 100% Free</span>
              <span className="trust-item">⚡ 5-Second Processing</span>
              <span className="trust-item">🔒 Secure & Private</span>
              <span className="trust-item">📱 Works on All Devices</span>
            </div>
          </div>
          
          <figure className="hero-image-container">
            <img
              src="/images/REMOVEBGSS.png"
              alt="Before and after example showing AI background removal from product photo - original image with cluttered background transformed to clean transparent background"
              className="hero-image"
              loading="eager"
              width="800"
              height="400"
            />
            <figcaption className="sr-only">Example of AI-powered background removal showing professional results</figcaption>
          </figure>
        </motion.div>
      </section>

      {/* Enhanced How It Works Section */}
      <section className="how-section" id="how-it-works" role="region" aria-labelledby="how-it-works-title">
        <motion.div
          className="container"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h2 id="how-it-works-title">How to Remove Image Backgrounds with AI in 3 Simple Steps</h2>
          <p className="section-description">
            Our cutting-edge AI technology makes background removal effortless and lightning-fast. No design experience needed - just upload, process, and download your professional transparent image.
          </p>
          <div className="steps-grid" role="list">
            <motion.article className="step-card" whileHover={{ scale: 1.05 }} role="listitem">
              <div className="step-number" aria-label="Step 1">1</div>
              <h3>Upload Your Photo</h3>
              <p>Drag and drop or click to select your JPG, PNG, or JPEG image. Files up to 30MB supported for high-quality processing.</p>
            </motion.article>
            <motion.article className="step-card" whileHover={{ scale: 1.05 }} role="listitem">
              <div className="step-number" aria-label="Step 2">2</div>
              <h3>AI Magic Happens</h3>
              <p>Our advanced machine learning algorithm analyzes your image and precisely removes the background while preserving fine details like hair and complex edges.</p>
            </motion.article>
            <motion.article className="step-card" whileHover={{ scale: 1.05 }} role="listitem">
              <div className="step-number" aria-label="Step 3">3</div>
              <h3>Download & Use</h3>
              <p>Get your professional transparent PNG instantly. Perfect for e-commerce listings, social media posts, presentations, or any creative project.</p>
            </motion.article>
          </div>
        </motion.div>
      </section>

      {/* Enhanced Features Section with better semantic structure */}
      <section className="features-section" id="features" role="region" aria-labelledby="features-title">
        <motion.div
          className="container"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h2 id="features-title">Why Choose Our AI Background Remover?</h2>
          <p className="section-description">
            Experience the power of cutting-edge artificial intelligence combined with user-friendly design. Get professional results without the learning curve of complex photo editing software.
          </p>
          <div className="features-grid" role="list">
            <motion.article className="feature-card" whileHover={{ scale: 1.05 }} role="listitem">
              <span className="feature-icon" aria-hidden="true">⚡</span>
              <h3>Lightning-Fast Processing</h3>
              <p>Advanced AI algorithms process images in under 5 seconds. No more waiting hours for manual editing - get instant professional results that save time and boost productivity.</p>
            </motion.article>
            <motion.article className="feature-card" whileHover={{ scale: 1.05 }} role="listitem">
              <span className="feature-icon" aria-hidden="true">🎯</span>
              <h3>Pixel-Perfect Precision</h3>
              <p>Our AI excels at complex subjects including hair, fur, transparency, and intricate details. Machine learning trained on millions of images ensures accuracy that rivals professional photo editors.</p>
            </motion.article>
            <motion.article className="feature-card" whileHover={{ scale: 1.05 }} role="listitem">
              <span className="feature-icon" aria-hidden="true">🆓</span>
              <h3>100% Free Forever</h3>
              <p>No hidden costs, no watermarks, no usage limits. Perfect for individuals, small businesses, and enterprises. Commercial use allowed with full rights to your edited images.</p>
            </motion.article>
            <motion.article className="feature-card" whileHover={{ scale: 1.05 }} role="listitem">
              <span className="feature-icon" aria-hidden="true">🔒</span>
              <h3>Privacy & Security First</h3>
              <p>Your images are processed securely and automatically deleted after processing. We never store, share, or use your photos. GDPR compliant with enterprise-grade security.</p>
            </motion.article>
            <motion.article className="feature-card" whileHover={{ scale: 1.05 }} role="listitem">
              <span className="feature-icon" aria-hidden="true">📱</span>
              <h3>Works Everywhere</h3>
              <p>Fully responsive design works perfectly on desktop, tablet, and mobile devices. Edit photos on-the-go with the same professional quality across all platforms.</p>
            </motion.article>
            <motion.article className="feature-card" whileHover={{ scale: 1.05 }} role="listitem">
              <span className="feature-icon" aria-hidden="true">🚀</span>
              <h3>E-commerce Optimized</h3>
              <p>Create marketplace-ready product photos that increase conversions. Compatible with Amazon, Shopify, eBay, and all major platforms. Boost your sales with professional imagery.</p>
            </motion.article>
          </div>
        </motion.div>
      </section>

      {/* Use Cases Section - NEW for better SEO */}
      <section className="use-cases-section" id="use-cases" role="region" aria-labelledby="use-cases-title">
        <motion.div
          className="container"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h2 id="use-cases-title">Perfect for Every Project</h2>
          <p className="section-description">
            Discover how professionals and businesses use our AI background remover to create stunning visuals across industries.
          </p>
          <div className="use-cases-grid" role="list">
            <motion.article className="use-case-card" whileHover={{ scale: 1.03 }} role="listitem">
              <h3>🛍️ E-commerce & Online Selling</h3>
              <p>Create professional product photos for Amazon, Shopify, eBay, and Etsy. Clean backgrounds increase click-through rates and boost sales conversions.</p>
            </motion.article>
            <motion.article className="use-case-card" whileHover={{ scale: 1.03 }} role="listitem">
              <h3>📱 Social Media Content</h3>
              <p>Design eye-catching Instagram posts, TikTok videos, and LinkedIn graphics. Stand out with professional visuals that increase engagement and followers.</p>
            </motion.article>
            <motion.article className="use-case-card" whileHover={{ scale: 1.03 }} role="listitem">
              <h3>💼 Professional Presentations</h3>
              <p>Create polished business presentations, proposals, and marketing materials. Remove distracting backgrounds to focus attention on key content.</p>
            </motion.article>
            <motion.article className="use-case-card" whileHover={{ scale: 1.03 }} role="listitem">
              <h3>🎨 Creative Projects</h3>
              <p>Perfect for graphic design, digital art, and creative compositions. Combine subjects seamlessly with new backgrounds for unlimited creative possibilities.</p>
            </motion.article>
          </div>
        </motion.div>
      </section>

      {/* Enhanced Testimonials Section */}
      <section className="testimonials-section" id="testimonials" role="region" aria-labelledby="testimonials-title">
        <motion.div
          className="container"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h2 id="testimonials-title">Trusted by Over 50,000+ Users Worldwide</h2>
          <p className="section-description">
            Join thousands of satisfied users who rely on our AI background remover for their professional and personal projects.
          </p>
          <div className="testimonials-grid" role="list">
            <motion.blockquote className="testimonial-card" whileHover={{ scale: 1.05 }} role="listitem">
              <p>"This AI tool revolutionized my Shopify store! Product photos look incredibly professional now, and my conversion rate increased by 40%. The results are consistently perfect."</p>
              <cite>– Sarah Chen, E-commerce Store Owner</cite>
              <div className="rating" aria-label="5 out of 5 stars">⭐⭐⭐⭐⭐</div>
            </motion.blockquote>
            <motion.blockquote className="testimonial-card" whileHover={{ scale: 1.05 }} role="listitem">
              <p>"As a social media manager, I process hundreds of images monthly. This free tool saves me 20+ hours per week compared to manual editing. The quality is outstanding!"</p>
              <cite>– Marcus Rodriguez, Social Media Manager</cite>
              <div className="rating" aria-label="5 out of 5 stars">⭐⭐⭐⭐⭐</div>
            </motion.blockquote>
            <motion.blockquote className="testimonial-card" whileHover={{ scale: 1.05 }} role="listitem">
              <p>"The AI handles complex hair details better than expensive software I've used. It's become an essential tool for my graphic design workflow. Highly recommended!"</p>
              <cite>– Emily Foster, Graphic Designer</cite>
              <div className="rating" aria-label="5 out of 5 stars">⭐⭐⭐⭐⭐</div>
            </motion.blockquote>
          </div>
        </motion.div>
      </section>

      {/* Enhanced FAQ Section */}
      <section className="faq-section" id="faq" role="region" aria-labelledby="faq-title">
        <motion.div
          className="container"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h2 id="faq-title">Frequently Asked Questions</h2>
          <div className="faq-grid" role="list">
            <article className="faq-item" role="listitem">
              <h3>What image formats and sizes are supported?</h3>
              <p>We support JPG, JPEG, and PNG formats up to 30MB. The AI works best with images between 500x500 and 4000x4000 pixels for optimal processing speed and quality.</p>
            </article>
            <article className="faq-item" role="listitem">
              <h3>Is this tool suitable for professional e-commerce use?</h3>
              <p>Absolutely! Our AI background remover is designed for commercial use. Create marketplace-compliant product images for Amazon, Shopify, eBay, and other platforms. The transparent backgrounds meet all major platform requirements.</p>
            </article>
            <article className="faq-item" role="listitem">
              <h3>How does the AI handle complex subjects like hair and fur?</h3>
              <p>Our advanced machine learning model has been trained on millions of images specifically to handle complex edges, fine hair, fur, and transparent objects. The AI achieves professional-quality results that rival manual editing.</p>
            </article>
            <article className="faq-item" role="listitem">
              <h3>Can I use this tool on mobile devices?</h3>
              <p>Yes! Our background remover is fully responsive and works seamlessly on smartphones, tablets, and desktop computers. The same powerful AI processing is available across all devices.</p>
            </article>
          </div>
        </motion.div>
      </section>

      {/* Enhanced Call to Action */}
      <section className="cta-section" id="get-started" role="region" aria-labelledby="cta-title">
        <motion.div
          className="container"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h2 id="cta-title">Ready to Create Professional Images?</h2>
          <p>Join over 50,000+ users who trust our AI background remover. Start creating stunning visuals for your e-commerce, social media, and design projects today - completely free!</p>
          <button 
            className="cta-button" 
            onClick={() => scrollToSection('hero')}
            aria-label="Start using the free AI background remover tool"
          >
            Remove Backgrounds Now - Free!
          </button>
          <div className="cta-features">
            <span>✅ No signup required</span>
            <span>⚡ 5-second processing</span>
            <span>🔒 100% secure & private</span>
          </div>
        </motion.div>
      </section>

      <Footer />
    </div>
  );
};

export default RemoveBackground;