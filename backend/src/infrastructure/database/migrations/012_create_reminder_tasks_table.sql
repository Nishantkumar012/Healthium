-- Create reminder_tasks table for appointment reminders
CREATE TABLE IF NOT EXISTS reminder_tasks (
  id UUID PRIMARY KEY,
  consultation_id UUID NOT NULL REFERENCES consultations(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  scheduled_at TIMESTAMP NOT NULL,
  reminder_type VARCHAR(50) NOT NULL CHECK (reminder_type IN ('reminder_24h', 'reminder_1h', 'reminder_15m')),
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'failed')),
  processed_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes for efficient queries
CREATE INDEX idx_reminder_tasks_consultation_id ON reminder_tasks(consultation_id);
CREATE INDEX idx_reminder_tasks_patient_id ON reminder_tasks(patient_id);
CREATE INDEX idx_reminder_tasks_doctor_id ON reminder_tasks(doctor_id);
CREATE INDEX idx_reminder_tasks_status ON reminder_tasks(status);
CREATE INDEX idx_reminder_tasks_scheduled_at ON reminder_tasks(scheduled_at);
CREATE INDEX idx_reminder_tasks_reminder_type ON reminder_tasks(reminder_type);
CREATE INDEX idx_reminder_tasks_pending_scheduled ON reminder_tasks(status, scheduled_at) WHERE status = 'pending';
