import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import VerifyEmail from "./pages/VerifyEmail";
import ProjectEditor from "./pages/ProjectEditor";
import DeveloperLogin from "./pages/DeveloperLogin"; // Import DeveloperLogin
import DeveloperDashboard from "./pages/DeveloperDashboard"; // Import DeveloperDashboard


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/projecteditor/:projectId" element={<ProjectEditor />} />
        <Route path="/developer-login" element={<DeveloperLogin />} /> {/* New route */}
        <Route path="/developer-dashboard" element={<DeveloperDashboard />} /> {/* New route */}
      </Routes>
    </Router>
  );
}

export default App;