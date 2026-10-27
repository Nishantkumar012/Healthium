CREATE TABLE IF NOT EXISTS availability_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doctor_id UUID REFERENCES doctors(id) ON DELETE CASCADE NOT NULL,
    slot_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'booked', 'blocked')),
    max_bookings INTEGER DEFAULT 1,
    current_bookings INTEGER DEFAULT 0,
    version INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_time_range CHECK (start_time < end_time),
    CONSTRAINT check_booking_limit CHECK (current_bookings <= max_bookings)
);

CREATE INDEX IF NOT EXISTS idx_availability_doctor_date ON availability_slots(doctor_id, slot_date);
CREATE INDEX IF NOT EXISTS idx_availability_status ON availability_slots(status) WHERE status = 'available';
CREATE INDEX IF NOT EXISTS idx_availability_slot_date ON availability_slots(slot_date);
CREATE UNIQUE INDEX IF NOT EXISTS idx_availability_unique ON availability_slots(doctor_id, slot_date, start_time);
