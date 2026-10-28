-- Create notification_logs table for tracking all notifications
CREATE TABLE IF NOT EXISTS notification_logs (
  id UUID PRIMARY KEY,
  type VARCHAR(50) NOT NULL CHECK (type IN ('sms', 'email', 'push', 'in_app')),
  recipient TEXT NOT NULL,
  content TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'sent', 'failed', 'delivered')),
  attempts INTEGER DEFAULT 0,
  last_error TEXT,
  sent_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes for efficient queries
CREATE INDEX idx_notification_logs_type ON notification_logs(type);
CREATE INDEX idx_notification_logs_status ON notification_logs(status);
CREATE INDEX idx_notification_logs_recipient ON notification_logs(recipient);
CREATE INDEX idx_notification_logs_created_at ON notification_logs(created_at);
CREATE INDEX idx_notification_logs_sent_at ON notification_logs(sent_at);
CREATE INDEX idx_notification_logs_status_created ON notification_logs(status, created_at);
