-- Progress Lens Tracker Database Schema
-- Run this on your NeonDB instance

-- Users table
CREATE TABLE users (
  id               BIGSERIAL PRIMARY KEY,
  username         TEXT NOT NULL UNIQUE,
  name             TEXT NOT NULL,
  password_hash    TEXT NOT NULL,
  role             TEXT NOT NULL CHECK (role IN ('admin','student')),
  is_deleted       BOOLEAN NOT NULL DEFAULT FALSE,
  created_at       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Videos table
CREATE TABLE videos (
  id               BIGSERIAL PRIMARY KEY,
  title            TEXT NOT NULL,
  description      TEXT,
  folder           TEXT NOT NULL,
  url              TEXT, -- video url or storage key
  position         INT DEFAULT 0, -- ordering
  is_deleted       BOOLEAN NOT NULL DEFAULT FALSE,
  created_at       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Progress table (one row per user+video)
CREATE TABLE progress (
  id               BIGSERIAL PRIMARY KEY,
  user_id          BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  video_id         BIGINT NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  completed        BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, video_id)
);

-- Sessions table for server-side sessions
CREATE TABLE sessions (
  id               BIGSERIAL PRIMARY KEY,
  session_token    TEXT NOT NULL UNIQUE,
  user_id          BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  expires_at       TIMESTAMP WITH TIME ZONE NOT NULL,
  last_accessed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Optional audit table for progress changes
CREATE TABLE progress_audit (
  id               BIGSERIAL PRIMARY KEY,
  progress_id      BIGINT REFERENCES progress(id),
  user_id          BIGINT, -- who performed the change (could be admin)
  target_user_id   BIGINT, -- whose progress changed
  video_id         BIGINT,
  completed_before BOOLEAN,
  completed_after  BOOLEAN,
  changed_at       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for efficiency
CREATE INDEX idx_progress_user ON progress(user_id);
CREATE INDEX idx_progress_video ON progress(video_id);
CREATE INDEX idx_videos_folder ON videos(folder);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_sessions_token ON sessions(session_token);
CREATE INDEX idx_progress_updated_at ON progress(updated_at);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to automatically update updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_videos_updated_at BEFORE UPDATE ON videos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
