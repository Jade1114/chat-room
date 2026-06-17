-- Chat Room: Campus Identity & Channel Schema
-- Run this first, then seed.sql

CREATE DATABASE IF NOT EXISTS chat_room
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE chat_room;

-- campus_user stores user identity and organization membership.
CREATE TABLE campus_user (
    id              VARCHAR(32)     PRIMARY KEY,
    display_name    VARCHAR(64)     NOT NULL,
    role            VARCHAR(16)     NOT NULL COMMENT 'STUDENT | TEACHER | ADMIN',
    school_id       VARCHAR(32)     NULL,
    department_id   VARCHAR(32)     NULL,
    class_id        VARCHAR(32)     NULL
) ENGINE=InnoDB;

-- user_course links a user to courses they are enrolled in or teach.
CREATE TABLE user_course (
    user_id     VARCHAR(32) NOT NULL,
    course_id   VARCHAR(32) NOT NULL,
    PRIMARY KEY (user_id, course_id),
    CONSTRAINT fk_user_course_user
        FOREIGN KEY (user_id) REFERENCES campus_user(id)
) ENGINE=InnoDB;

-- campus_channel stores system-preset channels.
CREATE TABLE campus_channel (
    id              VARCHAR(32)     PRIMARY KEY,
    name            VARCHAR(64)     NOT NULL,
    type            VARCHAR(16)     NOT NULL COMMENT 'SCHOOL | DEPARTMENT | CLASS | COURSE',
    scope_id        VARCHAR(32)     NOT NULL COMMENT 'organization id this channel belongs to',
    description     VARCHAR(256)    NULL,
    is_readonly     TINYINT(1)      NOT NULL DEFAULT 0
) ENGINE=InnoDB;
