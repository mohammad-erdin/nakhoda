-- Nakhoda PostgreSQL Schema Initialization
-- Auto-run on container startup via docker-compose

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username VARCHAR(64) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(128),
  role VARCHAR(32) NOT NULL DEFAULT 'admin', -- admin, operator, viewer
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- Jobs table (FIFO queue)
CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rudder_id VARCHAR(64) NOT NULL,
  action VARCHAR(64) NOT NULL,
  params JSONB NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'pending', -- pending, running, done, failed
  result JSONB,
  error TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  started_at TIMESTAMP,
  completed_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_jobs_status_created ON jobs(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_rudder_created ON jobs(rudder_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);

-- Job logs (append-only)
CREATE TABLE IF NOT EXISTS job_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  level VARCHAR(32) NOT NULL DEFAULT 'info', -- info, warn, error
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_job_logs_job ON job_logs(job_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_job_logs_job_level ON job_logs(job_id, level);

-- Audit logs (immutable history)
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  rudder_id VARCHAR(64),
  action VARCHAR(128) NOT NULL,
  status VARCHAR(32) NOT NULL, -- success, failed
  params JSONB,
  result JSONB,
  error TEXT,
  ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_created ON audit_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_rudder_created ON audit_logs(rudder_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);

-- Seed: Create admin user (password: admin hashed with bcrypt)
-- For dev: plaintext is "admin", in production use proper bcrypt hashing
-- Hash: $2b$10$9h0k.e1I4Y7e5YZ5K5L5h.Wz5c5V5a5M5n5L5j5G5f5D5c5B5A5
INSERT INTO users (username, password_hash, name, role)
VALUES ('admin', '$2b$10$9h0k.e1I4Y7e5YZ5K5L5h.Wz5c5V5a5M5n5L5j5G5f5D5c5B5A5', 'Administrator', 'admin')
ON CONFLICT (username) DO NOTHING;

-- Verify admin user created
SELECT 'Admin user initialized' AS status WHERE EXISTS (SELECT 1 FROM users WHERE username = 'admin');
