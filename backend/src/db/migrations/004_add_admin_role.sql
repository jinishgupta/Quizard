-- Add admin role to users table
-- Migration: 004_add_admin_role
-- Description: Adds is_admin field to users table for admin authorization

ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT false;

CREATE INDEX idx_users_is_admin ON users(is_admin);

-- Set first user as admin (optional - for development)
-- UPDATE users SET is_admin = true WHERE email = 'admin@example.com';
