-- V1__init_schema.sql: Initial database schema for HospitalManagement

CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NULL,
    provider_type VARCHAR(50) NULL,
    provider_id VARCHAR(255) NULL,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    failed_login_attempts INT NOT NULL DEFAULT 0,
    locked_until DATETIME NULL,
    created_at DATETIME NULL,
    updated_at DATETIME NULL
);

CREATE TABLE IF NOT EXISTS user_roles (
    user_id BIGINT NOT NULL,
    role VARCHAR(50) NOT NULL,
    PRIMARY KEY (user_id, role),
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS refresh_token (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    expires_at DATETIME NOT NULL,
    revoked BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS department (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    head_doctor_id BIGINT NULL
);

CREATE TABLE IF NOT EXISTS doctor (
    id BIGINT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    specialization VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    phone VARCHAR(20) NULL,
    consultation_fee DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    department_id BIGINT NULL,
    created_at DATETIME NULL,
    updated_at DATETIME NULL,
    FOREIGN KEY (id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (department_id) REFERENCES department (id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS insurance (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    policy_number VARCHAR(50) NOT NULL UNIQUE,
    provider VARCHAR(100) NOT NULL,
    valid_until DATE NOT NULL,
    coverage_percent INT NOT NULL DEFAULT 70,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at DATETIME NOT NULL
);

CREATE TABLE IF NOT EXISTS patient (
    id BIGINT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    phone VARCHAR(20) NULL,
    birth_date DATE NOT NULL,
    blood_group VARCHAR(10) NOT NULL,
    allergies VARCHAR(500) NULL,
    emergency_contact VARCHAR(20) NULL,
    insurance_id BIGINT NULL UNIQUE,
    created_at DATETIME NULL,
    updated_at DATETIME NULL,
    FOREIGN KEY (id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (insurance_id) REFERENCES insurance (id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS doctor_availability (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    doctor_id BIGINT NOT NULL,
    day_of_week VARCHAR(20) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    slot_duration_minutes INT NOT NULL DEFAULT 30,
    CONSTRAINT uk_doctor_day_time UNIQUE (doctor_id, day_of_week, start_time),
    FOREIGN KEY (doctor_id) REFERENCES doctor (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS doctor_leave (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    doctor_id BIGINT NOT NULL,
    leave_date DATE NOT NULL,
    reason VARCHAR(300) NULL,
    CONSTRAINT uk_doctor_leave_date UNIQUE (doctor_id, leave_date),
    FOREIGN KEY (doctor_id) REFERENCES doctor (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS appointment (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    appointment_time DATETIME NOT NULL,
    reason VARCHAR(500) NULL,
    patient_id BIGINT NOT NULL,
    doctor_id BIGINT NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'BOOKED',
    cancelled_by BIGINT NULL,
    cancel_reason VARCHAR(300) NULL,
    FOREIGN KEY (patient_id) REFERENCES patient (id) ON DELETE CASCADE,
    FOREIGN KEY (doctor_id) REFERENCES doctor (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS medical_record (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    appointment_id BIGINT NOT NULL UNIQUE,
    diagnosis VARCHAR(1000) NOT NULL,
    notes VARCHAR(2000) NULL,
    follow_up_date DATE NULL,
    attachment_name VARCHAR(255) NULL,
    attachment_type VARCHAR(100) NULL,
    attachment_size VARCHAR(50) NULL,
    attachment_data LONGTEXT NULL,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NULL,
    FOREIGN KEY (appointment_id) REFERENCES appointment (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS prescription (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    medical_record_id BIGINT NOT NULL,
    medicine_name VARCHAR(100) NOT NULL,
    dosage VARCHAR(100) NOT NULL,
    frequency VARCHAR(100) NOT NULL,
    duration_days INT NOT NULL,
    instructions VARCHAR(300) NULL,
    FOREIGN KEY (medical_record_id) REFERENCES medical_record (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS bill (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    appointment_id BIGINT NOT NULL UNIQUE,
    consultation_fee DECIMAL(10, 2) NOT NULL,
    medicine_charges DECIMAL(10, 2) NOT NULL,
    other_charges DECIMAL(10, 2) NOT NULL,
    insurance_covered DECIMAL(10, 2) NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    patient_payable DECIMAL(10, 2) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    created_at DATETIME NOT NULL,
    FOREIGN KEY (appointment_id) REFERENCES appointment (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS payment (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    bill_id BIGINT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    method VARCHAR(30) NOT NULL,
    transaction_ref VARCHAR(100) NULL,
    idempotency_key VARCHAR(100) NOT NULL UNIQUE,
    paid_at DATETIME NOT NULL,
    FOREIGN KEY (bill_id) REFERENCES bill (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS audit_log (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    action VARCHAR(100) NOT NULL,
    performed_by VARCHAR(100) NOT NULL,
    timestamp DATETIME NOT NULL,
    details VARCHAR(2000) NULL
);
