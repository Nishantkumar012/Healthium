CREATE TABLE IF NOT EXISTS doctors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    license_number VARCHAR(100) UNIQUE NOT NULL,
    specialization VARCHAR(100)[] NOT NULL,
    qualification VARCHAR(500) NOT NULL,
    experience_years INTEGER,
    languages VARCHAR(50)[] DEFAULT ARRAY['English'],
    consultation_fee DECIMAL(10, 2) NOT NULL,
    rating DECIMAL(3, 2) DEFAULT 0.00,
    total_consultations INTEGER DEFAULT 0,
    bio TEXT,
    certifications JSONB,
    is_verified BOOLEAN DEFAULT FALSE,
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_doctors_user_id ON doctors(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_doctors_license ON doctors(license_number);
CREATE INDEX IF NOT EXISTS idx_doctors_specialization ON doctors USING GIN(specialization);
CREATE INDEX IF NOT EXISTS idx_doctors_is_available ON doctors(is_available) WHERE is_available = TRUE;
CREATE INDEX IF NOT EXISTS idx_doctors_rating ON doctors(rating DESC);
