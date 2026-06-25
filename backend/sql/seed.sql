-- Chat Room: Seed data for organization-centered MVP
-- Run after schema.sql
-- Login test accounts all use password: 123456

SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;

USE chat_room;

INSERT INTO app_user (id, username, display_name, password_hash, role) VALUES
('u-admin',    'admin',   '平台管理员', '$2a$10$nB76XJURPpL5.5riCS3Ud.gVmOvH4Tjg6/BrPdqxSWJQdQvDWHUX6', 'ADMIN'),
('u-test-001', 'test001', '测试用户001', '$2a$10$47hZm96l.ZHx2Qc90/F.FeZHuzwBeQufrGwDK4/VNpI6qFdSQbT6K', 'MEMBER'),
('u-test-002', 'test002', '测试用户002', '$2a$10$BtdVDLEfinJknjf.c2o0d.wxK7bI3mXWjgD66Bw7pywahCrFAiAu2', 'MEMBER');

INSERT INTO organization (id, name, description, visibility, join_policy, created_by, created_at) VALUES
('org-public-square', 'Public Square', '平台维护的公共广场。新用户默认加入，用于开放交流、组织发现、活动推广和新手试用。', 'PUBLIC', 'OPEN', 'u-admin', NOW(3)),
('org-go-club', '围棋社', '围棋爱好者组织，定期组织对局、复盘和新手教学。测试用户001是组织者，测试用户002已加入。', 'PUBLIC', 'OPEN', 'u-test-001', NOW(3)),
('org-anime-club', '二次元同好会', '围绕番剧、同人创作和线下观影活动形成的兴趣组织。测试用户002是组织者，测试用户001未加入，可用于验证非成员访问边界。', 'PUBLIC', 'OPEN', 'u-test-002', NOW(3)),
('org-indie-game-lab', '独立游戏实验室', '一起做小型游戏原型、试玩反馈和线上 Game Jam 的创作组织。管理员维护，普通测试用户默认未加入。', 'PUBLIC', 'OPEN', 'u-admin', NOW(3));

INSERT INTO organization_member (organization_id, user_id, role, joined_at) VALUES
('org-public-square', 'u-admin', 'ORGANIZER', NOW(3)),
('org-public-square', 'u-test-001', 'MEMBER', NOW(3)),
('org-public-square', 'u-test-002', 'MEMBER', NOW(3)),
('org-go-club', 'u-test-001', 'ORGANIZER', NOW(3)),
('org-go-club', 'u-test-002', 'MEMBER', NOW(3)),
('org-anime-club', 'u-test-002', 'ORGANIZER', NOW(3)),
('org-indie-game-lab', 'u-admin', 'ORGANIZER', NOW(3));

INSERT INTO organization_tag (organization_id, tag) VALUES
('org-public-square', '平台官方'),
('org-public-square', '公共交流'),
('org-public-square', '新手入口'),
('org-go-club', '围棋'),
('org-go-club', '棋类'),
('org-go-club', '新手教学'),
('org-anime-club', '动漫'),
('org-anime-club', '同人'),
('org-anime-club', '观影'),
('org-indie-game-lab', '游戏开发'),
('org-indie-game-lab', 'Game Jam'),
('org-indie-game-lab', '创作');

INSERT INTO organization_channel (id, name, type, organization_id, description, is_readonly) VALUES
('ch-public-square', 'Public Square', 'ORGANIZATION', 'org-public-square', '公共广场默认频道：闲聊、组织宣传和活动预告。', 0),
('ch-go-club', '围棋社默认频道', 'ORGANIZATION', 'org-go-club', '围棋社成员交流、约棋和复盘讨论。', 0),
('ch-anime-club', '二次元同好会默认频道', 'ORGANIZATION', 'org-anime-club', '番剧讨论、观影活动和创作分享。', 0),
('ch-indie-game-lab', '独立游戏实验室默认频道', 'ORGANIZATION', 'org-indie-game-lab', '游戏原型开发、试玩反馈和 Game Jam 组队。', 0);

INSERT INTO activity (id, organization_id, title, description, location, start_time, end_time, visibility, created_by) VALUES
('act-public-square-1', 'org-public-square', '公共广场欢迎会', '欢迎新成员加入 Public Square，了解平台功能、组织发现和频道聊天。', '线上', '2026-07-01 19:00:00', '2026-07-01 20:30:00', 'PUBLIC', 'u-admin'),
('act-go-club-1', 'org-go-club', '围棋社季度友谊赛', '季度友谊赛，欢迎围棋社成员参加。', '围棋社活动室', '2026-07-05 14:00:00', '2026-07-05 18:00:00', 'PUBLIC', 'u-test-001'),
('act-go-club-2', 'org-go-club', '新手入门教学', '零基础入门围棋，从规则到基础定式。', '线上', '2026-07-10 15:00:00', '2026-07-10 17:00:00', 'PUBLIC', 'u-test-001'),
('act-anime-club-1', 'org-anime-club', '七月新番推荐会', '一起看七月新番导视，推荐当季佳作。', '二次元同好会频道', '2026-07-03 20:00:00', '2026-07-03 22:00:00', 'PUBLIC', 'u-test-002'),
('act-indie-game-lab-1', 'org-indie-game-lab', 'Game Jam 组队会', '寻找队友，组队参加 upcoming Game Jam。', '线上', '2026-07-08 19:00:00', '2026-07-08 21:00:00', 'PUBLIC', 'u-admin');

INSERT INTO chat_message (message_id, channel_id, user_id, display_name, content, type, sent_at) VALUES
('msg-public-001', 'ch-public-square', 'u-admin', '平台管理员', '欢迎来到 Public Square，这里可以交流想法、发现组织和发布活动。', 'USER_CHAT', '2026-06-25 09:00:00.000'),
('msg-public-002', 'ch-public-square', 'u-test-001', '测试用户001', '我准备用 test001 验证普通成员的聊天和组织加入流程。', 'USER_CHAT', '2026-06-25 09:02:00.000'),
('msg-public-003', 'ch-public-square', 'u-test-002', '测试用户002', '我会用 test002 验证另一个用户窗口里的实时消息和未读提醒。', 'USER_CHAT', '2026-06-25 09:04:00.000'),
('msg-go-001', 'ch-go-club', 'u-test-001', '测试用户001', '本周六下午有围棋复盘，欢迎社员带棋谱来讨论。', 'USER_CHAT', '2026-06-25 10:00:00.000'),
('msg-go-002', 'ch-go-club', 'u-test-002', '测试用户002', '收到，我想参加新手教学，也可以帮忙测试频道实时消息。', 'USER_CHAT', '2026-06-25 10:05:00.000'),
('msg-anime-001', 'ch-anime-club', 'u-test-002', '测试用户002', '今晚整理七月新番片单，主页活动里也会同步一份公开信息。', 'USER_CHAT', '2026-06-25 11:00:00.000'),
('msg-indie-001', 'ch-indie-game-lab', 'u-admin', '平台管理员', '独立游戏实验室用于验证非成员只能看公开主页，加入后才能进入频道。', 'USER_CHAT', '2026-06-25 12:00:00.000');
