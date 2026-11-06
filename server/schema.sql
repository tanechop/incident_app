-- ============================================================
-- GLOBAL SERVICE Incident & IT Support Request System
-- Database Schema & Initial Seed Data
-- ============================================================

CREATE DATABASE IF NOT EXISTS `incident_db` 
  CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;

USE `incident_db`;

-- Drop tables in reverse order of dependencies if rebuilding
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS `notification`;
DROP TABLE IF EXISTS `ticket`;
DROP TABLE IF EXISTS `category`;
DROP TABLE IF EXISTS `users`;
SET FOREIGN_KEY_CHECKS = 1;

-- 1. Users Table
CREATE TABLE `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `role` ENUM('staff', 'it_user', 'admin') NOT NULL DEFAULT 'staff',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Categories Table
CREATE TABLE `category` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Tickets Table
CREATE TABLE `ticket` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT NOT NULL,
  `category_id` INT NULL,
  `priority` ENUM('low', 'medium', 'high') NOT NULL DEFAULT 'medium',
  `status` ENUM('open', 'in_progress', 'resolved', 'closed') NOT NULL DEFAULT 'open',
  `created_by` INT NOT NULL,
  `assigned_to` INT NULL,
  `resolution` TEXT NULL,
  `resolved_at` TIMESTAMP NULL,
  `closed_at` TIMESTAMP NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_ticket_category` FOREIGN KEY (`category_id`) REFERENCES `category` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_ticket_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ticket_assigned_to` FOREIGN KEY (`assigned_to`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Notification Table
CREATE TABLE `notification` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `ticket_id` INT NULL,
  `message` TEXT NOT NULL,
  `is_read` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_notification_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_notification_ticket` FOREIGN KEY (`ticket_id`) REFERENCES `ticket` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Default Seed Data
-- ============================================================

-- Default Categories (Common IT Support Categories inspired by Jira/Freshservice)
INSERT INTO `category` (`name`) VALUES
  ('Hardware & Peripherals'),
  ('Software & Applications'),
  ('Network & Wi-Fi'),
  ('Email & Communication'),
  ('Security & Access Control'),
  ('Printer & Scanner Issues');

-- Default Demo Users (Password for all three is: password123)
INSERT INTO `users` (`name`, `email`, `password`, `role`) VALUES
  ('Sarah Admin', 'admin@globalservice.com', '$2b$10$78EWu0Eiw7s7JphtHpvEUubkf0XWAbru6tFzu6hSUZED1Unf5AVaa', 'admin'),
  ('Emma Technician', 'it@globalservice.com', '$2b$10$78EWu0Eiw7s7JphtHpvEUubkf0XWAbru6tFzu6hSUZED1Unf5AVaa', 'it_user'),
  ('Chloe Staff', 'staff@globalservice.com', '$2b$10$78EWu0Eiw7s7JphtHpvEUubkf0XWAbru6tFzu6hSUZED1Unf5AVaa', 'staff');
