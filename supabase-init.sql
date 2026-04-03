-- =====================================================
-- 重庆打卡 - Supabase 数据库初始化
-- 版本：2026-04-03 修复版（只使用 alipay_user_id）
-- =====================================================

-- 第 1 步：清理旧表
DROP TABLE IF EXISTS user_photos CASCADE;
DROP TABLE IF EXISTS user_achievements CASCADE;
DROP TABLE IF EXISTS checkins CASCADE;
DROP TABLE IF EXISTS achievements CASCADE;
DROP TABLE IF EXISTS checkpoints CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 第 2 步：创建用户表（只有 alipay_user_id，没有 user_id）
CREATE TABLE users (
  id BIGSERIAL PRIMARY KEY,
  alipay_user_id TEXT UNIQUE NOT NULL,
  points INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 第 3 步：创建打卡点表
CREATE TABLE checkpoints (
  checkpoint_id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT,
  points INTEGER DEFAULT 0,
  address TEXT,
  time_range TEXT,
  description TEXT
);

INSERT INTO checkpoints (checkpoint_id, name, icon, points, address, time_range, description) VALUES
  (1, '解放碑步行街', '🏢', 15, '重庆市渝中区解放碑商业步行街', '8:00-9:30', '重庆地标'),
  (2, '李子坝轻轨站', '🚝', 15, '重庆市渝中区李子坝正站', '9:30-10:30', '轻轨穿楼'),
  (3, '鹅岭二厂文创园', '🎨', 15, '重庆市渝中区鹅岭正街 1 号', '11:00-12:30', '文艺打卡地'),
  (4, '南山一棵树观景台', '🌳', 20, '重庆市南岸区南山植物园旁', '14:30-16:00', '俯瞰全景'),
  (5, '洪崖洞 + 千厮门大桥', '🌉', 25, '重庆市渝中区嘉陵江滨江路 88 号', '18:30-21:00', '夜景胜地');

-- 第 4 步：创建打卡记录表（只有 alipay_user_id，没有 user_id）
CREATE TABLE checkins (
  id BIGSERIAL PRIMARY KEY,
  alipay_user_id TEXT NOT NULL,
  checkpoint_id INTEGER NOT NULL REFERENCES checkpoints(checkpoint_id),
  points INTEGER DEFAULT 0,
  checked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(alipay_user_id, checkpoint_id)
);

-- 第 5 步：创建成就表
CREATE TABLE achievements (
  achievement_id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  required_points INTEGER NOT NULL,
  description TEXT,
  icon TEXT
);

INSERT INTO achievements (achievement_id, name, required_points, description, icon) VALUES
  (1, '山城萌新', 30, '初入山城', '🌶️'),
  (2, '雾都探索者', 50, '穿梭雾都', '🚝'),
  (3, '巴渝达人', 70, '深度游玩', '🌉'),
  (4, '重庆通', 90, '完美一日游', '🏆');

-- 第 6 步：创建用户成就表（只有 alipay_user_id，没有 user_id）
CREATE TABLE user_achievements (
  id BIGSERIAL PRIMARY KEY,
  alipay_user_id TEXT NOT NULL,
  achievement_id INTEGER NOT NULL REFERENCES achievements(achievement_id),
  achieved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  redeemed BOOLEAN DEFAULT FALSE,
  UNIQUE(alipay_user_id, achievement_id)
);

-- 第 7 步：创建索引
CREATE INDEX idx_users_alipay ON users(alipay_user_id);
CREATE INDEX idx_users_points ON users(points DESC);
CREATE INDEX idx_checkins_alipay ON checkins(alipay_user_id);
CREATE INDEX idx_user_achievements_alipay ON user_achievements(alipay_user_id);

-- =====================================================
-- 验证查询（执行后运行这些检查）
-- =====================================================
-- SELECT COUNT(*) FROM users;
-- SELECT COUNT(*) FROM checkpoints;  -- 应该返回 5
-- SELECT COUNT(*) FROM achievements; -- 应该返回 4
-- SELECT * FROM checkpoints;