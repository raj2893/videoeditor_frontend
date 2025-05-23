import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { useEffect } from 'react';
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import VerifyEmail from "./pages/VerifyEmail";
import ProjectEditor from "./pages/ProjectEditor";
import DeveloperLogin from "./pages/DeveloperLogin";
import DeveloperDashboard from "./pages/DeveloperDashboard";

function TitleAndFaviconManager() {
  const location = useLocation();

  useEffect(() => {
    const setTitleAndFavicon = () => {
      const favicon = document.getElementById('favicon');
      if (favicon) favicon.href = '/scenith.ico';

      switch (location.pathname) {
        case '/login':
          document.title = 'Scenith | Login';
          break;
        case '/signup':
          document.title = 'Scenith | Signup';
          break;
        case '/':
        case '/dashboard':
          document.title = 'Scenith';
          break;
        case '/verify-email':
          document.title = 'Scenith | Verify Email';
          break;
        case '/developer-login':
          document.title = 'Scenith | Developer Login';
          break;
        case '/developer-dashboard':
          document.title = 'Scenith | Developer Dashboard';
          break;
        default:
          if (location.pathname.startsWith('/projecteditor/')) {
            document.title = 'Scenith | Project Editor';
          } else {
            document.title = 'Scenith';
          }
      }
    };

    setTitleAndFavicon();
  }, [location]);

  return null; // This component doesn't render anything
}

function App() {
  return (
    <Router>
      <TitleAndFaviconManager />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/projecteditor/:projectId" element={<ProjectEditor />} />
        <Route path="/developer-login" element={<DeveloperLogin />} />
        <Route path="/developer-dashboard" element={<DeveloperDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;