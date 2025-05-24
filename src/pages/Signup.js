import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import "../CSS/Auth.css";

const API_BASE_URL = 'https://videoeditor-app.onrender.com';
// const API_BASE_URL = "http://localhost:8080";

const Signup = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState(""); // Add name state
  const [errors, setErrors] = useState({});
  const [showVerificationMessage, setShowVerificationMessage] = useState(false);
  const [serverError, setServerError] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.state?.error) {
      setServerError(location.state.error);
      const timer = setTimeout(() => setServerError(""), 8000);
      return () => clearTimeout(timer);
    }
  }, [location.state]);

  const validate = () => {
    const newErrors = {};

    if (!name) {
      newErrors.name = "Name is required";
    } else if (name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    }

    if (!email) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    } else if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
      newErrors.password = "Password must contain both letters and numbers";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setServerError("");
    if (!validate()) return;

    try {
      const response = await axios.post(`${API_BASE_URL}/auth/register`, {
        email,
        password,
        name,
      });

      if (response.status === 200 && response.data.message) {
        setShowVerificationMessage(true);
        localStorage.setItem('email', email); // Store email for resend
      }
    } catch (error) {
      if (error.response && error.response.status === 400) {
        setServerError(error.response.data.message || "Invalid email address. Please try again.");
        setTimeout(() => {
          setServerError("");
          navigate("/signup", { replace: true });
        }, 5000);
      } else if (error.response && error.response.status === 500) {
        setServerError("Failed to send verification email. Please try again.");
      } else {
        setServerError("Network error. Please try again.");
      }
    }
  };

  const resendVerification = async () => {
    try {
      await axios.post(`${API_BASE_URL}/auth/resend-verification`, null, {
        params: { email },
      });
      setServerError("Verification email resent successfully!");
      setTimeout(() => setServerError(""), 5000);
    } catch (error) {
      setServerError(
        error.response?.data || "Failed to resend verification email. Please try again."
      );
      setTimeout(() => setServerError(""), 8000);
    }
  };

  const handleGoogleSignup = useCallback(async (credentialResponse) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/google`, {
        token: credentialResponse.credential,
      });
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("userProfile", JSON.stringify({
        email: response.data.email,
        name: response.data.name,
        picture: null,
        googleAuth: true,
      }));
      navigate("/dashboard");
    } catch (error) {
      setServerError(error.response?.data?.message || "Google signup failed. Please try again.");
    }
  }, [navigate]);

  useEffect(() => {
    const initializeGoogleSignIn = () => {
      if (window.google && window.google.accounts) {
        window.google.accounts.id.initialize({
          client_id: "475177334034-ufjdi8pebqvbgf9ogv0gs85nq9588a8m.apps.googleusercontent.com",
          callback: handleGoogleSignup,
        });
        window.google.accounts.id.renderButton(
          document.getElementById("googleSignUpButton"),
          { theme: "outline", size: "large", width: 400 }
        );
      } else {
        setTimeout(initializeGoogleSignIn, 100);
      }
    };
    initializeGoogleSignIn();
  }, [handleGoogleSignup]);

  const particles = Array.from({ length: 40 }).map((_, i) => (
    <div
      key={i}
      className={`particle ${i % 2 === 0 ? "square" : ""}`}
      style={{
        left: `${Math.random() * 100}%`,
        width: `${3 + Math.random() * 5}px`,
        height: `${3 + Math.random() * 5}px`,
        animationDelay: `${Math.random() * 5}s`,
        animationDuration: `${5 + Math.random() * 5}s`,
      }}
    />
  ));

  return (
    <div className="auth-page">
      {particles}
      <svg className="waveform-bg" viewBox="0 0 1440 900" preserveAspectRatio="none">
        <path
          d="M0,900 C180,750 360,900 540,750 C720,600 900,750 1080,600 C1260,450 1350,600 1440,0 L1440,0 H0 Z"
          fill="rgba(63, 142, 252, 0.15)"
        />
      </svg>
      <div className="rotating-text-container">
        <div className="rotating-text-wrapper">
          <div className="rotating-text">Transform ideas into stunning visuals with Scenith.</div>
          <div className="rotating-text">Professional editing made simple for everyone.</div>
          <div className="rotating-text">Intuitive timeline for frame-perfect edits.</div>
          <div className="rotating-text">Dynamic effects, filters, and stickers await!</div>
          <div className="rotating-text">Join a community of creators at Scenith.</div>
        </div>
      </div>
      <div className="auth-container">
        <div className="auth-header">
          <h1>
            <span className="letter">S</span>
            <span className="letter">c</span>
            <span className="letter">e</span>
            <span className="letter">n</span>
            <span className="letter">i</span>
            <span className="letter">t</span>
            <span className="letter">h</span>
          </h1>
          <p>The Peak of Visual Storytelling</p>
          <div className="logo-element" />
        </div>
        <h2>Create Your Story</h2>
        {showVerificationMessage ? (
          <div className="verification-message">
            <p>
              We've sent a verification email to <strong>{email}</strong>
            </p>
            <p>Please check your inbox and verify your email before logging in.</p>
            {serverError && (
              <div
                className={
                  serverError.includes("successfully") ? "success-message" : "error-message"
                }
              >
                {serverError}
              </div>
            )}
            <button onClick={resendVerification} className="auth-button">
              Resend Verification Email
            </button>
            <p className="auth-link">
              Already verified? <Link to="/">Login</Link>
            </p>
          </div>
        ) : (
          <>
            <form onSubmit={handleSignup} className="auth-form">
              {serverError && <div className="error-message">{serverError}</div>}
              <div className="auth-input-label">
                <input
                  type="text"
                  placeholder=" "
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`auth-input ${errors.name ? "error" : ""}`}
                  aria-label="Full name"
                />
                <span>Full Name</span>
                {errors.name && <div className="error-message">{errors.name}</div>}
              </div>
              <div className="auth-input-label">
                <input
                  type="email"
                  placeholder=" "
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`auth-input ${errors.email ? "error" : ""}`}
                  aria-label="Email address"
                />
                <span>Email</span>
                {errors.email && <div className="error-message">{errors.email}</div>}
              </div>
              <div className="auth-input-label">
                <input
                  type="password"
                  placeholder=" "
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`auth-input ${errors.password ? "error" : ""}`}
                  aria-label="Password"
                />
                <span>Password</span>
                {errors.password && <div className="error-message">{errors.password}</div>}
              </div>
              <button type="submit" className="auth-button">Sign Up</button>
            </form>
            <div className="divider">OR</div>
            <div id="googleSignUpButton" className="google-button"></div>
            <p className="auth-link">
              Already have an account? <Link to="/login">Login</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default Signup;