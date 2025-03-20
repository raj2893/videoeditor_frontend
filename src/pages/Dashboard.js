import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../CSS/Dashboard.css';

const API_BASE_URL = 'http://localhost:8080';

const Dashboard = () => {
  const [projects, setProjects] = useState([]);
  const [newProjectName, setNewProjectName] = useState('');
  const [width, setWidth] = useState(1920); // Default width
  const [height, setHeight] = useState(1080); // Default height
  const navigate = useNavigate();

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/projects`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProjects(response.data);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const createNewProject = async () => {
    if (!newProjectName) {
      alert('Please enter a project name.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_BASE_URL}/projects`,
        { 
          name: newProjectName,
          width: width,
          height: height
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setProjects([...projects, response.data]);
      setNewProjectName('');
      navigate(`/projecteditor/${response.data.id}`); // Navigate to the new project
    } catch (error) {
      console.error('Error creating project:', error);
    }
  };

  const loadProject = async (projectId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API_BASE_URL}/projects/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const projectData = response.data;
      navigate(`/projecteditor/${projectId}`);

    } catch (error) {
      console.error("Error loading project details:", error);
    }
  };

  return (
    <div className="dashboard">
      <h2>My Projects</h2>
      <div className="new-project">
        <input
          type="text"
          placeholder="New project name"
          value={newProjectName}
          onChange={(e) => setNewProjectName(e.target.value)}
        />
        <input
          type="number"
          placeholder="Width"
          value={width}
          onChange={(e) => setWidth(parseInt(e.target.value, 10))}
        />
        <input
          type="number"
          placeholder="Height"
          value={height}
          onChange={(e) => setHeight(parseInt(e.target.value, 10))}
        />
        <button onClick={createNewProject}>Create Project</button>
      </div>
      <div className="project-list">
        {projects.map((project) => (
          <div
            key={project.id}
            className="project-item"
            onClick={() => loadProject(project.id)}
          >
            {project.name}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;