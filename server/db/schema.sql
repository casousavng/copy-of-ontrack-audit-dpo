-- OnTrack Database Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User Roles Enum
CREATE TYPE user_role AS ENUM ('ADMIN', 'AMONT', 'DOT', 'ADERENTE');

-- Audit Status Enum
CREATE TYPE audit_status AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- Visit Type Enum
CREATE TYPE visit_type AS ENUM ('AUDITORIA', 'FORMACAO', 'ACOMPANHAMENTO', 'OUTROS');

-- Action Status Enum
CREATE TYPE action_status AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- Action Responsible Enum
CREATE TYPE action_responsible AS ENUM ('DOT', 'ADERENTE', 'BOTH');

-- Users Table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    fullname VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255),
    roles user_role[] NOT NULL,
    amont_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    assigned_stores INTEGER[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Stores Table
CREATE TABLE stores (
    id SERIAL PRIMARY KEY,
    codehex VARCHAR(50) UNIQUE NOT NULL,
    brand VARCHAR(100) NOT NULL,
    size VARCHAR(50) NOT NULL,
    city VARCHAR(100) NOT NULL,
    gpslat DECIMAL(10, 7),
    gpslong DECIMAL(10, 7),
    dot_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    aderente_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Checklists Table
CREATE TABLE checklists (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    target_role user_role NOT NULL,
    sections JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Audits Table
CREATE TABLE audits (
    id SERIAL PRIMARY KEY,
    store_id INTEGER NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    dot_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    checklist_id INTEGER REFERENCES checklists(id) ON DELETE SET NULL,
    dtstart TIMESTAMP NOT NULL,
    dtend TIMESTAMP,
    status audit_status DEFAULT 'SCHEDULED',
    final_score DECIMAL(5, 2),
    created_by INTEGER NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Visits Table (non-audit visits)
CREATE TABLE visits (
    id SERIAL PRIMARY KEY,
    store_id INTEGER NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type visit_type NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    dtstart TIMESTAMP NOT NULL,
    dtend TIMESTAMP,
    status audit_status DEFAULT 'SCHEDULED',
    created_by INTEGER NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Audit Scores Table
CREATE TABLE audit_scores (
    id SERIAL PRIMARY KEY,
    audit_id INTEGER NOT NULL REFERENCES audits(id) ON DELETE CASCADE,
    criteria_id INTEGER NOT NULL,
    score INTEGER CHECK (score >= 0 AND score <= 4),
    comment TEXT,
    photo_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(audit_id, criteria_id)
);

-- Action Plans Table
CREATE TABLE action_plans (
    id SERIAL PRIMARY KEY,
    audit_id INTEGER NOT NULL REFERENCES audits(id) ON DELETE CASCADE,
    criteria_id INTEGER,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    responsible action_responsible NOT NULL,
    due_date TIMESTAMP NOT NULL,
    status action_status DEFAULT 'PENDING',
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    completed_date TIMESTAMP,
    created_by INTEGER NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Audit Comments Table
CREATE TABLE audit_comments (
    id SERIAL PRIMARY KEY,
    audit_id INTEGER NOT NULL REFERENCES audits(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_roles ON users USING GIN(roles);
CREATE INDEX idx_stores_dot_user_id ON stores(dot_user_id);
CREATE INDEX idx_stores_aderente_id ON stores(aderente_id);
CREATE INDEX idx_audits_store_id ON audits(store_id);
CREATE INDEX idx_audits_dot_user_id ON audits(dot_user_id);
CREATE INDEX idx_audits_status ON audits(status);
CREATE INDEX idx_audits_dtstart ON audits(dtstart);
CREATE INDEX idx_visits_store_id ON visits(store_id);
CREATE INDEX idx_visits_user_id ON visits(user_id);
CREATE INDEX idx_visits_type ON visits(type);
CREATE INDEX idx_visits_dtstart ON visits(dtstart);
CREATE INDEX idx_audit_scores_audit_id ON audit_scores(audit_id);
CREATE INDEX idx_action_plans_audit_id ON action_plans(audit_id);
CREATE INDEX idx_action_plans_status ON action_plans(status);
CREATE INDEX idx_audit_comments_audit_id ON audit_comments(audit_id);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stores_updated_at BEFORE UPDATE ON stores
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_audits_updated_at BEFORE UPDATE ON audits
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_visits_updated_at BEFORE UPDATE ON visits
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_action_plans_updated_at BEFORE UPDATE ON action_plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
