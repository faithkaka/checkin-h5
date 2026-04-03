-- ============================================
-- 修复后的 Supabase 数据库结构
-- 简化版本 - 确保能正常创建
-- ============================================

-- 1. 先删除已存在的表（如果有的话）
DROP TABLE IF EXISTS user_photos CASCADE;
DROP TABLE IF EXISTS user_achievements CASCADE;
DROP TABLE IF EXISTS checkins CASCADE;
DROP TABLE IF EXISTS achievements CASCADE;
DROP TABLE IF EXISTS checkpoints CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ============================================
-- 2. 创建用户表
-- ============================================
CREATE TABLE users (
  id BIGSERIAL PRIMARY KEY,
  alipay_user_id TEXT,
  points INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 添加索引
CREATE INDEX idx_users_points ON users(points DESC);
CREATE INDEX idx_users_created ON users(created_at);

-- ============================================
-- 3. 创建打卡点配置表
-- ============================================
CREATE TABLE checkpoints (
  checkpoint_id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT,
  points INTEGER DEFAULT 0,
  address TEXT,
  time_range TEXT,
  description TEXT
);

-- 插入默认打卡点
INSERT INTO checkpoints (checkpoint_id, name, icon, points, address, time_range, description) VALUES
  (1, '解放碑步行街', '🏢', 15, '重庆市渝中区解放碑商业步行街', '8:00-9:30', '重庆地标，繁华商业中心'),
  (2, '李子坝轻轨站', '🚝', 15, '重庆市渝中区李子坝正站', '9:30-10:30', '轻轨穿楼奇观'),
  (3, '鹅岭二厂文创园', '🎨', 15, '重庆市渝中区鹅岭正街 1 号', '11:00-12:30', '文艺青年聚集地'),
  (4, '南山一棵树观景台', '🌳', 20, '重庆市南岸区南山植物园旁', '14:30-16:00', '俯瞰重庆全景'),
  (5, '洪崖洞 + 千厮门大桥', '🌉', 25, '重庆市渝中区嘉陵江滨江路 88 号', '18:30-21:00', '夜景打卡胜地');

-- ============================================
-- 4. 创建打卡记录表
-- ============================================
CREATE TABLE checkins (
  id BIGSERIAL PRIMARY KEY,
  alipay_user_id TEXT NOT NULL,
  checkpoint_id INTEGER NOT NULL,
  points INTEGER DEFAULT 0,
  checked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(alipay_user_id, checkpoint_id)
);

-- 添加索引
CREATE INDEX idx_checkins_user ON checkins(alipay_user_id);
CREATE INDEX idx_checkins_checkpoint ON checkins(checkpoint_id);

-- ============================================
-- 5. 创建成就表
-- ============================================
CREATE TABLE achievements (
  achievement_id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  required_points INTEGER NOT NULL,
  description TEXT,
  icon TEXT
);

-- 插入成就数据
INSERT INTO achievements (achievement_id, name, required_points, description, icon) VALUES
  (1, '山城萌新', 30, '初入山城，开启美食之旅', '🌶️'),
  (2, '雾都探索者', 50, '穿梭雾都，体验轻轨穿楼', '🚝'),
  (3, '巴渝达人', 70, '深度游玩，打卡网红景点', '🌉'),
  (4, '重庆通', 90, '完美一日游', '🏆');

-- ============================================
-- 6. 创建用户成就表
-- ============================================
CREATE TABLE user_achievements (
  id BIGSERIAL PRIMARY KEY,
  alipay_user_id TEXT NOT NULL,
  achievement_id INTEGER NOT NULL,
  achieved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  redeemed BOOLEAN DEFAULT FALSE,
  UNIQUE(alipay_user_id, achievement_id)
);

-- 添加索引
CREATE INDEX idx_user_achievements_user ON user_achievements(alipay_user_id);

-- ============================================
-- 7. 创建视图 - 用户排行榜
-- ============================================
CREATE OR REPLACE VIEW user_leaderboard AS
SELECT 
  u.alipay_user_id,
  u.points,
  COUNT(c.checkpoint_id) as checked_count,
  u.created_at,
  RANK() OVER (ORDER BY u.points DESC) as rank
FROM users u
LEFT JOIN checkins c ON u.alipay_user_id = c.alipay_user_id
GROUP BY u.id, u.alipay_user_id, u.points, u.created_at
ORDER BY u.points DESC;

-- ============================================
-- 8. 测试数据
-- ============================================
-- 可选：插入一个测试用户
-- INSERT INTO users (alipay_user_id, points) VALUES ('test_user', 0);

-- ============================================
-- 验证查询
-- ============================================
-- 运行以下查询验证表是否正确创建：
-- SELECT * FROM users;
-- SELECT * FROM checkpoints;
-- SELECT * FROM achievements;
-- SELECT * FROM user_leaderboard;