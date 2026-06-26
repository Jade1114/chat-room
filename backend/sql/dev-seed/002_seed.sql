-- Docker Compose init: Activity-first MVP seed data
-- Login test accounts all use password: 123456

SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;

USE chat_room;

INSERT INTO app_user (id, username, display_name, password_hash, role) VALUES
('u-admin',    'admin',   '平台管理员', '$2a$10$nB76XJURPpL5.5riCS3Ud.gVmOvH4Tjg6/BrPdqxSWJQdQvDWHUX6', 'ADMIN'),
('u-public',   NULL,      '匿名发布者', NULL, 'MEMBER'),
('u-test-001', 'test001', '测试用户001', '$2a$10$47hZm96l.ZHx2Qc90/F.FeZHuzwBeQufrGwDK4/VNpI6qFdSQbT6K', 'MEMBER'),
('u-test-002', 'test002', '测试用户002', '$2a$10$BtdVDLEfinJknjf.c2o0d.wxK7bI3mXWjgD66Bw7pywahCrFAiAu2', 'MEMBER');

-- Legacy organization/chat seed remains only for optional post-MVP routes.
INSERT INTO organization (id, name, description, visibility, join_policy, created_by, created_at) VALUES
('org-public-square', 'Public Square', '平台维护的公共广场。Activity-first MVP 不以组织为主线。', 'PUBLIC', 'OPEN', 'u-admin', NOW(3)),
('org-go-club', '围棋社', '围棋爱好者组织，保留为旧组织能力示例。', 'PUBLIC', 'OPEN', 'u-test-001', NOW(3));

INSERT INTO organization_member (organization_id, user_id, role, joined_at) VALUES
('org-public-square', 'u-admin', 'ORGANIZER', NOW(3)),
('org-public-square', 'u-test-001', 'MEMBER', NOW(3)),
('org-public-square', 'u-test-002', 'MEMBER', NOW(3)),
('org-go-club', 'u-test-001', 'ORGANIZER', NOW(3));

INSERT INTO organization_tag (organization_id, tag) VALUES
('org-public-square', '平台官方'),
('org-public-square', '公共交流'),
('org-go-club', '围棋');

INSERT INTO organization_channel (id, name, type, organization_id, description, is_readonly) VALUES
('ch-public-square', 'Public Square', 'ORGANIZATION', 'org-public-square', '旧公共频道，非当前 MVP 验收主线。', 0),
('ch-go-club', '围棋社默认频道', 'ORGANIZATION', 'org-go-club', '围棋社成员交流。', 0);

INSERT INTO activity (id, title, description, category, tags, time_mode, start_time, end_time, expires_at, location, participation_method, status, created_by, created_at, updated_at) VALUES
('act-study-001', '周末 Redis 学习小组', '一起把 Redis 缓存、过期策略和项目里的使用场景讲清楚，适合正在做后端项目的同学。', 'STUDY', '后端,Redis,学习小组', 'SCHEDULED', '2026-07-04 14:00:00', '2026-07-04 17:00:00', '2026-07-04 17:00:00', '图书馆三楼讨论室', '加微信 redis-study-2026，备注“Redis学习”。', 'PUBLISHED', 'u-test-001', NOW(3), NOW(3)),
('act-sports-001', '今晚操场慢跑搭子', '配速 6-7 分钟，跑 5 公里左右，主要是找人一起坚持。', 'SPORTS', '跑步,搭子,运动', 'SCHEDULED', '2026-07-01 20:00:00', '2026-07-01 21:00:00', '2026-07-01 21:00:00', '东操场入口', '直接到东操场入口集合，或 QQ 123456789 提前说一声。', 'PUBLISHED', 'u-test-002', NOW(3), NOW(3)),
('act-project-001', '找 2 位同学一起做校园活动发现产品', '想做一个把校园里值得参与的事情持续展示出来的小产品，适合想练全栈/产品工程的同学。', 'PROJECT', '全栈,产品,找队友', 'ONGOING', NULL, NULL, '2026-07-25 23:59:00', '线上 + 咖啡厅讨论', '发邮件到 campus-build@example.com，附一句你想练什么。', 'PUBLISHED', 'u-admin', NOW(3), NOW(3)),
('act-game-001', '独立游戏 Jam 临时组队', '48 小时做一个小原型，美术、程序、策划都欢迎。', 'GAME', 'GameJam,游戏开发,找队友', 'ONGOING', NULL, NULL, '2026-07-20 23:59:00', '线上 Discord', '填写飞书表单：https://example.com/game-jam-team', 'PUBLISHED', 'u-test-001', NOW(3), NOW(3));

INSERT INTO chat_message (message_id, channel_id, user_id, display_name, content, type, sent_at) VALUES
('msg-public-001', 'ch-public-square', 'u-admin', '平台管理员', '旧频道能力保留，但当前 MVP 请从活动发现开始验收。', 'USER_CHAT', '2026-06-25 09:00:00.000');
