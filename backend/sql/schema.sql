-- Hive Ballot — Office/College Edition
-- Run: mysql -u root -p < schema.sql

CREATE DATABASE IF NOT EXISTS voting_system;
USE voting_system;

-- Pre-loaded eligible voters. There is no self-registration — the
-- admin adds the roster (e.g. from the company/college directory),
-- and a voter logs in by matching company_id + company_email.
CREATE TABLE IF NOT EXISTS voters (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(100) NOT NULL,
  company_id VARCHAR(50) UNIQUE NOT NULL,
  company_email VARCHAR(100) UNIQUE NOT NULL,
  has_voted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Candidates standing for election
CREATE TABLE IF NOT EXISTS candidates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  department VARCHAR(100),
  slogan VARCHAR(255),
  photo_path VARCHAR(255),
  vote_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Anonymous ballot box: deliberately has NO voter reference.
-- A vote is just "candidate X got a vote at time Y" — once cast,
-- it cannot be traced back to who cast it, even by an admin.
CREATE TABLE IF NOT EXISTS votes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  candidate_id INT NOT NULL,
  voted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (candidate_id) REFERENCES candidates(id)
);

-- Election administrators
CREATE TABLE IF NOT EXISTS admins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL
);

-- Single-row table holding the active election's title + voting window.
-- Voting is only allowed between start_time and end_time.
CREATE TABLE IF NOT EXISTS election_settings (
  id INT PRIMARY KEY DEFAULT 1,
  title VARCHAR(150) DEFAULT 'Office Election',
  start_time DATETIME NULL,
  end_time DATETIME NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
INSERT INTO election_settings (id, title) VALUES (1, 'Office Election')
  ON DUPLICATE KEY UPDATE id = id;

-- Sample roster — replace with your real employee/student list via the admin panel
INSERT INTO voters (full_name, company_id, company_email) VALUES
('Priya Sharma', 'EMP1001', 'priya.sharma@company.com'),
('Rahul Verma', 'EMP1002', 'rahul.verma@company.com'),
('Ananya Iyer', 'EMP1003', 'ananya.iyer@company.com');

-- Sample candidates
INSERT INTO candidates (name, department, slogan) VALUES
('Aiden Cole', 'Engineering', 'Building tomorrow, today'),
('Maria Chen', 'Operations', 'Together we rise');
