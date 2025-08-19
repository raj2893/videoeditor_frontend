import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const Blog = () => {
  const [hoveredCard, setHoveredCard] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Blog posts data
  const blogPosts = [
    {
      id: 1,
      title: "Stop Wasting Hours on Subtitles: Add Them to Any Video in 30 Seconds (2025)",
      excerpt: "Reality check: You're probably spending 3-5 hours manually typing subtitles when AI can do it in 30 seconds with 98% accuracy.",
      category: "AI Tools",
      readTime: "4 min read",
      publishDate: "2025-01-15",
      author: "Scenith Team",
      image: "🚀",
      gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      tags: ["AI", "Subtitles", "Video Editing", "Productivity"],
      featured: true,
      views: "12.5K",
      slug: "how-to-add-subtitles-to-video",
    },
    {
      id: 2,
      title: "Transform Your Videos with Keyframing: The Secret to Dynamic Visuals in 2025",
      excerpt: "Reality check: If your videos feel static, you’re losing viewers. Keyframing with Scenith creates dynamic, scroll-stopping content in minutes.",
      category: "Video Editing",
      readTime: "5 min read",
      publishDate: "2025-08-18",
      author: "Scenith Team",
      image: "🎥",
      gradient: "linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)",
      tags: ["Keyframing", "Video Editing", "Animation", "Productivity"],
      featured: false,
      views: "8.7K",
      slug: "transform-videos-with-keyframing",
    },
    {
      id: 3,
      title: "How to Reach 4000 Hours of YouTube Watch Time Fast in 2025",
      excerpt: "Discover how to hit 4000 hours of YouTube watch time fast using AI-powered subtitles with Scenith. Boost viewer retention and skyrocket your channel’s growth.",
      category: "YouTube Growth",
      readTime: "5 min read",
      publishDate: "2025-08-19",
      author: "Scenith Team",
      image: "📈",
      gradient: "linear-gradient(135deg, #00b894 0%, #38a169 100%)",
      tags: ["YouTube", "Subtitles", "AI Tools", "Watch Time"],
      featured: false,
      views: "10.2K",
      slug: "how-to-reach-4000-hours-watchtime",
    },
  ];

  const categories = ['all', 'AI Tools', 'Video Editing', 'YouTube Growth', 'Productivity', 'Tutorials'];

  const filteredPosts = blogPosts.filter((post) => {
    const matchesSearch =
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || post.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleCardClick = (slug) => {
    window.location.href = `/blogs/${slug}`;
  };

  const scrollToSection = (sectionId) => {
    const section = document.getElementById(sectionId);
    if (section) {
      const navHeight = document.querySelector('.nav-bar').offsetHeight || 80;
      window.scrollTo({
        top: section.offsetTop - navHeight - 20,
        behavior: 'smooth',
      });
    }
  };

  return (
    <>
      <Helmet>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Scenith | Video Editing & AI Tools Blog</title>
        <meta
          name="description"
          content="Explore Scenith’s blog for expert tips on video editing, AI tools, YouTube growth, and productivity hacks to elevate your content creation in 2025."
        />
        <meta
          name="keywords"
          content="video editing, AI tools, YouTube growth, subtitles, keyframing, productivity, Scenith"
        />
        <meta name="author" content="Scenith" />
        <meta name="robots" content="index, follow" />
        <meta property="og:title" content="Scenith | Video Editing & AI Tools Blog" />
        <meta
          property="og:description"
          content="Discover cutting-edge techniques, AI-powered tools, and tutorials to transform your video content creation with Scenith’s blog."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://yourwebsite.com/blogs" />
        <meta property="og:image" content="https://yourwebsite.com/images/blog-og.jpg" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Scenith | Video Editing & AI Tools Blog" />
        <meta
          name="twitter:description"
          content="Discover cutting-edge techniques, AI-powered tools, and tutorials to transform your video content creation with Scenith’s blog."
        />
        <meta name="twitter:image" content="https://yourwebsite.com/images/blog-og.jpg" />
        <link rel="canonical" href="https://yourwebsite.com/blogs" />
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Blog',
            headline: 'Scenith Video Editing & AI Tools Blog',
            description:
              'Explore Scenith’s blog for expert tips on video editing, AI tools, YouTube growth, and productivity hacks to elevate your content creation in 2025.',
            publisher: {
              '@type': 'Organization',
              name: 'Scenith',
              logo: {
                '@type': 'ImageObject',
                url: 'https://yourwebsite.com/images/logo.png',
              },
            },
            datePublished: '2025-08-19',
            url: 'https://yourwebsite.com/blogs',
          })}
        </script>
      </Helmet>
      <Navbar pageType="blogs" scrollToSection={scrollToSection} />
      <div className="blog-container">
        {/* Hero Section */}
        <div className="hero-section-blog">
          <div className="hero-content-blog">
            <div className="hero-badge-blog">
              <span className="badge-text">📚 Knowledge Hub</span>
            </div>
            <h1 className="hero-title-blog">
              Master Video Creation with
              <span className="gradient-text"> AI-Powered Insights</span>
            </h1>
            <p className="hero-description-blog">
              Discover cutting-edge techniques, insider tips, and game-changing tools that will
              transform your video content creation process forever.
            </p>

            {/* Search Bar */}
            <div className="search-container">
              <div className="search-box">
                <div className="search-icon">🔍</div>
                <input
                  type="text"
                  placeholder="Search for AI tools, tutorials, productivity hacks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
              </div>
            </div>
          </div>

          {/* Floating Elements */}
          <div className="floating-elements">
            <div className="floating-card card1">🎬</div>
            <div className="floating-card card2">⚡</div>
            <div className="floating-card card3">🚀</div>
            <div className="floating-card card4">🤖</div>
          </div>
        </div>

        {/* Category Filter */}
        <div className="filter-section">
          <div className="filter-container">
            <h3 className="filter-title">Browse by Category</h3>
            <div className="category-filters">
              {categories.map((category) => (
                <button
                  key={category}
                  className={`category-btn ${selectedCategory === category ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(category)}
                >
                  {category === 'all' ? 'All Posts' : category}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Blog Posts Grid */}
        <div className="posts-section">
          <div className="posts-container">
            {/* Featured Post */}
            {filteredPosts.find((post) => post.featured) && (
              <div className="featured-section">
                <h2 className="section-title">🔥 Featured Article</h2>
                {filteredPosts
                  .filter((post) => post.featured)
                  .map((post) => (
                    <div
                      key={post.id}
                      className="featured-card"
                      onClick={() => handleCardClick(post.slug)}
                      onMouseEnter={() => setHoveredCard(`featured-${post.id}`)}
                      onMouseLeave={() => setHoveredCard(null)}
                    >
                      <div className="featured-content">
                        <div className="featured-left">
                          <div className="featured-meta">
                            <span className="featured-badge">⭐ FEATURED</span>
                            <span className="post-category">{post.category}</span>
                          </div>
                          <h3 className="featured-title">{post.title}</h3>
                          <p className="featured-excerpt">{post.excerpt}</p>
                          <div className="featured-stats">
                            <span className="stat">👁️ {post.views} views</span>
                            <span className="stat">⏱️ {post.readTime}</span>
                            <span className="stat">
                              📅 {new Date(post.publishDate).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="featured-tags">
                            {post.tags.slice(0, 3).map((tag) => (
                              <span key={tag} className="tag">
                                {tag}
                              </span>
                            ))}
                          </div>
                          <button className="read-more-btn">Read Full Article →</button>
                        </div>
                        <div className="featured-right">
                          <div className="featured-visual" style={{ background: post.gradient }}>
                            <div className="featured-icon">{post.image}</div>
                            <div className="visual-overlay"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}

            {/* Regular Posts */}
            <div className="regular-posts">
              <h2 className="section-title">📖 Latest Articles</h2>
              <div className="posts-grid">
                {filteredPosts.filter((post) => !post.featured).length === 0 ? (
                  <div className="no-posts">
                    <div className="no-posts-icon">📝</div>
                    <h3>More Amazing Content Coming Soon!</h3>
                    <p>We're working on more game-changing articles. Check back soon!</p>
                  </div>
                ) : (
                  filteredPosts
                    .filter((post) => !post.featured)
                    .map((post) => (
                      <div
                        key={post.id}
                        className={`post-card ${hoveredCard === post.id ? 'hovered' : ''}`}
                        onClick={() => handleCardClick(post.slug)}
                        onMouseEnter={() => setHoveredCard(post.id)}
                        onMouseLeave={() => setHoveredCard(null)}
                      >
                        <div className="post-visual" style={{ background: post.gradient }}>
                          <div className="post-icon">{post.image}</div>
                          <div className="post-overlay"></div>
                        </div>
                        <div className="post-content">
                          <div className="post-header">
                            <span className="post-category">{post.category}</span>
                            <span className="post-views">👁️ {post.views}</span>
                          </div>
                          <h3 className="post-title">{post.title}</h3>
                          <p className="post-excerpt">{post.excerpt}</p>
                          <div className="post-tags">
                            {post.tags.slice(0, 2).map((tag) => (
                              <span key={tag} className="tag">
                                {tag}
                              </span>
                            ))}
                          </div>
                          <div className="post-footer">
                            <div className="post-meta">
                              <span className="read-time">⏱️ {post.readTime}</span>
                              <span className="post-date">
                                📅 {new Date(post.publishDate).toLocaleDateString()}
                              </span>
                            </div>
                            <button className="read-btn">Read →</button>
                          </div>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Newsletter Section */}
        <div className="newsletter-section">
          <div className="newsletter-container">
            <div className="newsletter-content">
              <div className="newsletter-icon">📧</div>
              <h2>Never Miss a Game-Changing Tip</h2>
              <p>
                Get the latest AI tools, video creation hacks, and productivity secrets delivered to
                your inbox every week.
              </p>
              <div className="newsletter-form">
                <input
                  type="email"
                  placeholder="Enter your email address..."
                  className="newsletter-input"
                />
                <button className="newsletter-btn">Subscribe Free →</button>
              </div>
              <p className="newsletter-disclaimer">
                ✨ Join 25,000+ creators • Unsubscribe anytime • Zero spam
              </p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
      <style jsx>{`
        :root {
          --navbar-height: 80px; /* Adjust based on Navbar.js height */
        }

        .blog-container {
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          padding-top: calc(var(--navbar-height) + 20px); /* Prevent navbar overlap */
          max-width: 1200px; /* Ensure wide layout */
          margin: 0 auto; /* Center content */
          width: 100%; /* Full width within max-width */
        }

        /* Hero Section */
        .hero-section-blog {
          position: relative;
          padding: 80px 20px 60px;
          text-align: center;
          overflow: hidden;
        }

        .hero-content-blog {
          max-width: 900px;
          margin: 0 auto;
          position: relative;
          z-index: 2;
        }

        .hero-badge-blog {
          display: inline-block;
          margin-bottom: 25px;
        }

        .badge-text {
          background: rgba(255, 255, 255, 0.2);
          color: white;
          padding: 8px 20px;
          border-radius: 25px;
          font-weight: 600;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .hero-title-blog {
          font-size: 4em;
          font-weight: 900;
          color: white;
          margin-bottom: 25px;
          line-height: 1.1;
        }

        .gradient-text {
          background: linear-gradient(45deg, #ffd700, #ffed4e);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .hero-description-blog {
          font-size: 1.3em;
          color: rgba(255, 255, 255, 0.9);
          margin-bottom: 40px;
          line-height: 1.6;
          max-width: 700px;
          margin-left: auto;
          margin-right: auto;
        }

        .search-container {
          margin-top: 40px;
        }

        .search-box {
          display: flex;
          align-items: center;
          max-width: 600px;
          margin: 0 auto;
          background: white;
          border-radius: 50px;
          padding: 8px 8px 8px 25px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
        }

        .search-icon {
          font-size: 1.2em;
          margin-right: 15px;
          color: #666;
        }

        .search-input {
          flex: 1;
          border: none;
          outline: none;
          font-size: 1.1em;
          padding: 15px 0;
          color: #333;
        }

        .search-input::placeholder {
          color: #999;
        }

        /* Floating Elements */
        .floating-elements {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          pointer-events: none;
        }

        .floating-card {
          position: absolute;
          width: 80px;
          height: 80px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2em;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          animation: float 6s ease-in-out infinite;
        }

        .card1 {
          top: 10%;
          left: 10%;
          animation-delay: 0s;
        }

        .card2 {
          top: 20%;
          right: 15%;
          animation-delay: 1.5s;
        }

        .card3 {
          bottom: 30%;
          left: 8%;
          animation-delay: 3s;
        }

        .card4 {
          bottom: 40%;
          right: 12%;
          animation-delay: 4.5s;
        }

        @keyframes float {
          0%,
          100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-20px) rotate(5deg);
          }
        }

        /* Filter Section */
        .filter-section {
          background: white;
          padding: 40px 20px;
          border-top-left-radius: 50px;
          border-top-right-radius: 50px;
          margin-top: -50px;
          position: relative;
          z-index: 3;
        }

        .filter-container {
          max-width: 1200px;
          margin: 0 auto;
        }

        .filter-title {
          font-size: 1.5em;
          font-weight: 700;
          color: #2d3748;
          margin-bottom: 20px;
        }

        .category-filters {
          display: flex;
          gap: 15px;
          flex-wrap: wrap;
        }

        .category-btn {
          padding: 12px 24px;
          border: 2px solid #e2e8f0;
          background: white;
          color: #4a5568;
          border-radius: 25px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .category-btn:hover {
          border-color: #667eea;
          color: #667eea;
          transform: translateY(-2px);
        }

        .category-btn.active {
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: white;
          border-color: transparent;
          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
        }

        /* Posts Section */
        .posts-section {
          background: white;
          padding: 0 20px 80px;
        }

        .posts-container {
          max-width: 1200px;
          margin: 0 auto;
        }

        .section-title {
          font-size: 2.5em;
          font-weight: 800;
          color: #2d3748;
          margin-bottom: 40px;
          text-align: center;
        }

        /* Featured Post */
        .featured-section {
          margin-bottom: 80px;
        }

        .featured-card {
          background: white;
          border-radius: 25px;
          overflow: hidden;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
          cursor: pointer;
          transition: all 0.4s ease;
          border: 1px solid #f0f0f0;
        }

        .featured-card:hover {
          transform: translateY(-10px);
          box-shadow: 0 30px 80px rgba(0, 0, 0, 0.15);
        }

        .featured-content {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 0;
          min-height: 400px;
        }

        .featured-left {
          padding: 50px;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .featured-meta {
          display: flex;
          gap: 15px;
          margin-bottom: 20px;
        }

        .featured-badge {
          background: linear-gradient(135deg, #ff6b6b, #ee5a24);
          color: white;
          padding: 6px 15px;
          border-radius: 20px;
          font-size: 0.8em;
          font-weight: 700;
          text-transform: uppercase;
        }

        .post-category {
          background: #e6fffa;
          color: #00b894;
          padding: 6px 15px;
          border-radius: 20px;
          font-size: 0.8em;
          font-weight: 600;
        }

        .featured-title {
          font-size: 2.2em;
          font-weight: 800;
          color: #2d3748;
          margin-bottom: 20px;
          line-height: 1.2;
        }

        .featured-excerpt {
          font-size: 1.1em;
          color: #4a5568;
          line-height: 1.6;
          margin-bottom: 25px;
        }

        .featured-stats {
          display: flex;
          gap: 25px;
          margin-bottom: 25px;
        }

        .stat {
          color: #718096;
          font-size: 0.9em;
          font-weight: 500;
        }

        .featured-tags {
          display: flex;
          gap: 10px;
          margin-bottom: 30px;
          flex-wrap: wrap;
        }

        .tag {
          background: #f7fafc;
          color: #4a5568;
          padding: 5px 12px;
          border-radius: 15px;
          font-size: 0.8em;
          font-weight: 500;
          border: 1px solid #e2e8f0;
        }

        .read-more-btn {
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: white;
          border: none;
          padding: 15px 30px;
          border-radius: 25px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          align-self: flex-start;
          font-size: 1em;
        }

        .read-more-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(102, 126, 234, 0.3);
        }

        .featured-right {
          position: relative;
          overflow: hidden;
        }

        .featured-visual {
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }

        .featured-icon {
          font-size: 8em;
          opacity: 0.9;
        }

        .visual-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.1);
        }

        /* Regular Posts */
        .regular-posts {
          margin-top: 80px;
        }

        .posts-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(380px, 1fr));
          gap: 30px;
        }

        .post-card {
          background: white;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
          cursor: pointer;
          transition: all 0.3s ease;
          border: 1px solid #f0f0f0;
        }

        .post-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.12);
        }

        .post-visual {
          height: 200px;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }

        .post-icon {
          font-size: 4em;
          opacity: 0.9;
        }

        .post-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.1);
        }

        .post-content {
          padding: 30px;
        }

        .post-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
        }

        .post-views {
          color: #718096;
          font-size: 0.8em;
          font-weight: 500;
        }

        .post-title {
          font-size: 1.3em;
          font-weight: 700;
          color: #2d3748;
          margin-bottom: 15px;
          line-height: 1.3;
        }

        .post-excerpt {
          color: #4a5568;
          line-height: 1.5;
          margin-bottom: 20px;
          font-size: 0.95em;
        }

        .post-tags {
          display: flex;
          gap: 8px;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }

        .post-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .post-meta {
          display: flex;
          gap: 15px;
        }

        .read-time,
        .post-date {
          color: #718096;
          font-size: 0.8em;
          font-weight: 500;
        }

        .read-btn {
          background: #667eea;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 20px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 0.9em;
        }

        .read-btn:hover {
          background: #5a6fd8;
          transform: translateX(3px);
        }

        /* No Posts State */
        .no-posts {
          text-align: center;
          padding: 80px 20px;
          grid-column: 1 / -1;
        }

        .no-posts-icon {
          font-size: 4em;
          margin-bottom: 20px;
        }

        .no-posts h3 {
          font-size: 1.8em;
          color: #2d3748;
          margin-bottom: 15px;
          font-weight: 700;
        }

        .no-posts p {
          color: #718096;
          font-size: 1.1em;
        }

        /* Newsletter Section */
        .newsletter-section {
          background: linear-gradient(135deg, #2d3748, #4a5568);
          padding: 80px 20px;
        }

        .newsletter-container {
          max-width: 800px;
          margin: 0 auto;
          text-align: center;
        }

        .newsletter-content {
          color: white;
        }

        .newsletter-icon {
          font-size: 4em;
          margin-bottom: 25px;
        }

        .newsletter-content h2 {
          font-size: 2.5em;
          font-weight: 800;
          margin-bottom: 20px;
        }

        .newsletter-content p {
          font-size: 1.2em;
          opacity: 0.9;
          margin-bottom: 40px;
          line-height: 1.6;
        }

        .newsletter-form {
          display: flex;
          gap: 15px;
          max-width: 500px;
          margin: 0 auto 20px;
        }

        .newsletter-input {
          flex: 1;
          padding: 15px 20px;
          border: none;
          border-radius: 25px;
          font-size: 1em;
          outline: none;
        }

        .newsletter-btn {
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: white;
          border: none;
          padding: 15px 30px;
          border-radius: 25px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .newsletter-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(102, 126, 234, 0.3);
        }

        .newsletter-disclaimer {
          font-size: 0.9em;
          opacity: 0.7;
          margin-top: 20px;
        }

        /* Mobile Responsive */
        @media (max-width: 768px) {
          :root {
            --navbar-height: 60px; /* Adjust for smaller screens */
          }

          .blog-container {
            padding-top: calc(var(--navbar-height) + 20px);
          }

          .hero-title-blog {
            font-size: 2.5em;
          }

          .hero-description-blog {
            font-size: 1.1em;
          }

          .featured-content {
            grid-template-columns: 1fr;
          }

          .featured-left {
            padding: 30px;
          }

          .featured-visual {
            min-height: 200px;
          }

          .posts-grid {
            grid-template-columns: 1fr;
          }

          .category-filters {
            justify-content: center;
          }

          .newsletter-form {
            flex-direction: column;
          }

          .search-box {
            padding: 8px 15px;
          }
        }

        @media (max-width: 480px) {
          :root {
            --navbar-height: 50px; /* Adjust for very small screens */
          }

          .blog-container {
            padding-top: calc(var(--navbar-height) + 15px);
          }

          .hero-section-blog {
            padding: 60px 15px 40px;
          }

          .hero-title-blog {
            font-size: 2em;
          }

          .filter-section,
          .posts-section {
            padding-left: 15px;
            padding-right: 15px;
          }

          .featured-left {
            padding: 25px;
          }

          .featured-title {
            font-size: 1.6em;
          }

          .section-title {
            font-size: 2em;
          }

          .post-content {
            padding: 25px;
          }
        }
      `}</style>
    </>
  );
};

export default Blog;