-- Docker Compose init: seed data
-- Keep this file in sync with backend/sql/seed.sql.

SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;

USE chat_room;

INSERT INTO campus_user (id, display_name, role, school_id, department_id, class_id) VALUES
('u-stu-1',      'Yuy',   'STUDENT',  'school-1', 'dept-cs',  'class-cs-2401'),
('u-stu-2',      'Mina',  'STUDENT',  'school-1', 'dept-cs',  'class-cs-2402'),
('u-teacher-1',  'Chen',  'TEACHER',  'school-1', 'dept-cs',  NULL),
('u-admin-1',    'Admin', 'ADMIN',    'school-1', NULL,       NULL);

INSERT INTO user_course (user_id, course_id) VALUES
('u-stu-1',      'course-java'),
('u-stu-2',      'course-java'),
('u-teacher-1',  'course-java'),
('u-teacher-1',  'course-websocket');

INSERT INTO campus_channel (id, name, type, scope_id, description, is_readonly) VALUES
('ch-school',        '全校大厅',          'SCHOOL',      'school-1',        '星河大学公共频道',                      0),
('ch-cs',            '计算机学院',        'DEPARTMENT',  'dept-cs',         '计算机学院公共频道',                    0),
('ch-math',          '数学学院',          'DEPARTMENT',  'dept-math',       '数学学院公共频道',                      0),
('ch-cs-2401',       '计科 2401 班',      'CLASS',       'class-cs-2401',   '计科 2401 班级频道',                    0),
('ch-cs-2402',       '计科 2402 班',      'CLASS',       'class-cs-2402',   '计科 2402 班级频道',                    0),
('ch-math-2401',     '数学 2401 班',      'CLASS',       'class-math-2401', '数学 2401 班级频道',                    0),
('ch-java',          'Java 后端开发',     'COURSE',      'course-java',     '课程讨论与通知',                        0),
('ch-websocket',     '分布式实时通信',    'COURSE',      'course-websocket', 'WebSocket、Redis、RabbitMQ 实战频道',   0),
('ch-linear-algebra','线性代数',          'COURSE',      'course-linear-algebra', '线性代数课程频道',                  0);
