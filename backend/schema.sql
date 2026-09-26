CREATE DATABASE IF NOT EXISTS edu_od;
USE edu_od;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('student', 'faculty', 'hod') NOT NULL,
  department VARCHAR(100) NOT NULL,
  reg_no VARCHAR(50),
  attendance INT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS od_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  student_name VARCHAR(100) NOT NULL,
  reg_no VARCHAR(50) NOT NULL,
  department VARCHAR(100) NOT NULL,
  faculty_id INT DEFAULT NULL,
  event_name VARCHAR(255) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT NOT NULL,
  attachment VARCHAR(255) NOT NULL,
  status ENUM('Pending', 'Faculty_Approved', 'Approved', 'Rejected') DEFAULT 'Pending',
  priority ENUM('HIGH', 'MEDIUM', 'NORMAL', 'EXPIRED') DEFAULT 'NORMAL',
  comments JSON DEFAULT NULL,
  qr_code_data LONGTEXT DEFAULT NULL,
  ai_analysis JSON DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (faculty_id) REFERENCES users(id) ON DELETE SET NULL
);

ALTER TABLE od_requests ADD COLUMN IF NOT EXISTS priority ENUM('HIGH', 'MEDIUM', 'NORMAL', 'EXPIRED') DEFAULT 'NORMAL';

CREATE TABLE IF NOT EXISTS attendance_records (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  date DATE NOT NULL,
  status ENUM('present', 'absent', 'od', 'holiday') DEFAULT 'present',
  marked_by INT NOT NULL,
  UNIQUE KEY unique_student_date (student_id, date),
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (marked_by) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS announcements (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  department VARCHAR(100) NOT NULL,
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);
