-- Docker Compose init: organization platform seed data
-- Keep this file in sync with backend/sql/seed.sql.

SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;

USE chat_room;

INSERT INTO app_user (id, display_name, role) VALUES
('u-yuy',      'Yuy',        'MEMBER'),
('u-mina',     'Mina',       'MEMBER'),
('u-luna',     'Luna',       'MEMBER'),
('u-admin',    'Platform Admin', 'ADMIN');

INSERT INTO organization (id, name, description, visibility, join_policy, created_by, created_at) VALUES
('org-public-square', 'Public Square', '平台维护的公共广场，用于开放交流、组织发现和活动推广。', 'PUBLIC', 'OPEN', NULL, NOW(3)),
('org-go-club', '围棋社', '围棋爱好者组织，定期组织对局、复盘和新手教学。', 'PUBLIC', 'OPEN', 'u-yuy', NOW(3)),
('org-anime-club', '二次元同好会', '围绕番剧、同人创作和线下观影活动形成的兴趣组织。', 'PUBLIC', 'OPEN', 'u-luna', NOW(3)),
('org-indie-game-lab', '独立游戏实验室', '一起做小型游戏原型、试玩反馈和线上 Game Jam 的创作组织。', 'PUBLIC', 'OPEN', 'u-mina', NOW(3));

INSERT INTO organization_member (organization_id, user_id, role, joined_at) VALUES
('org-public-square', 'u-yuy', 'MEMBER', NOW(3)),
('org-public-square', 'u-mina', 'MEMBER', NOW(3)),
('org-public-square', 'u-luna', 'MEMBER', NOW(3)),
('org-public-square', 'u-admin', 'ORGANIZER', NOW(3)),
('org-go-club', 'u-yuy', 'ORGANIZER', NOW(3)),
('org-anime-club', 'u-luna', 'ORGANIZER', NOW(3)),
('org-indie-game-lab', 'u-mina', 'ORGANIZER', NOW(3));

INSERT INTO organization_channel (id, name, type, organization_id, description, is_readonly) VALUES
('ch-public-square', 'Public Square', 'ORGANIZATION', 'org-public-square', '公共广场默认频道：闲聊、组织宣传和活动预告。', 0),
('ch-go-club', '围棋社默认频道', 'ORGANIZATION', 'org-go-club', '围棋社成员交流、约棋和复盘讨论。', 0),
('ch-anime-club', '二次元同好会默认频道', 'ORGANIZATION', 'org-anime-club', '番剧讨论、观影活动和创作分享。', 0),
('ch-indie-game-lab', '独立游戏实验室默认频道', 'ORGANIZATION', 'org-indie-game-lab', '游戏原型开发、试玩反馈和 Game Jam 组队。', 0);
