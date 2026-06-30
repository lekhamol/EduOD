import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import StudentDashboard from './pages/StudentDashboard';
import FacultyDashboard from './pages/FacultyDashboard';
import HodDashboard from './pages/HodDashboard';
import VerifyOD from './pages/VerifyOD';
import Chatbot from './components/Chatbot';

const StudentRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');
  return token && role === 'student' ? children : <Navigate to="/login" replace />;
};

const FacultyRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');
  return token && role === 'faculty' ? children : <Navigate to="/login" replace />;
};

const HodRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');
  return token && role === 'hod' ? children : <Navigate to="/login" replace />;
};

function App() {
  const role = localStorage.getItem('role');

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-od/:id" element={<VerifyOD />} />

        <Route 
          path="/student" 
          element={
            <StudentRoute>
              <StudentDashboard />
            </StudentRoute>
          } 
        />
        <Route 
          path="/faculty" 
          element={
            <FacultyRoute>
              <FacultyDashboard />
            </StudentRoute>
          } 
        />
        <Route 
          path="/hod" 
          element={
            <HodRoute>
              <HodDashboard />
            </HodRoute>
          } 
        />

        <Route path="*" element={<Navigate to={role ? `/${role}` : "/"} replace />} />
      </Routes>
      <Chatbot />
    </Router>
  );
}

export default App;
