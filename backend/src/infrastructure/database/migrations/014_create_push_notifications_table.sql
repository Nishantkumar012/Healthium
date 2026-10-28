-- Create push_notifications table for tracking push notification history
CREATE TABLE IF NOT EXISTS push_notifications (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  data JSONB,
  read_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes for efficient queries
CREATE INDEX idx_push_notifications_user_id ON push_notifications(user_id);
CREATE INDEX idx_push_notifications_created_at ON push_notifications(created_at);
CREATE INDEX idx_push_notifications_read_at ON push_notifications(read_at);
CREATE INDEX idx_push_notifications_user_created ON push_notifications(user_id, created_at);
