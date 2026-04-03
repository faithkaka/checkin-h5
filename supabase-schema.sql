-- ============================================
-- 趣玩重庆打卡 - Supabase 数据库结构
-- ============================================

-- 1. 用户表
CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  user_id VARCHAR(100) UNIQUE NOT NULL,
  alipay_user_id VARCHAR(100),
  points INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引加速查询
CREATE INDEX IF NOT EXISTS idx_users_user_id ON users(user_id);
CREATE INDEX IF NOT EXISTS idx_users_points ON users(points DESC);

-- 2. 打卡记录表
CREATE TABLE IF NOT EXISTS checkins (
  id BIGSERIAL PRIMARY KEY,
  user_id VARCHAR(100) NOT NULL,
  checkpoint_id INTEGER NOT NULL,
  checked BOOLEAN DEFAULT TRUE,
  points INTEGER DEFAULT 0,
  checked_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, checkpoint_id)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_checkins_user_id ON checkins(user_id);
CREATE INDEX IF NOT EXISTS idx_checkins_checkpoint ON checkins(checkpoint_id);

-- 3. 打卡点配置表
CREATE TABLE IF NOT EXISTS checkpoints (
  id INTEGER PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  icon VARCHAR(50),
  points INTEGER DEFAULT 0,
  address TEXT,
  time_range VARCHAR(50),
  period VARCHAR(50),
  description TEXT,
  position_left NUMERIC(5,2),
  position_top NUMERIC(5,2),
  is_mandatory BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 插入默认打卡点数据
INSERT INTO checkpoints (id, name, icon, points, address, time_range, period, description, position_left, position_top, is_mandatory)
VALUES 
  (1, '解放碑步行街', '🏢', 15, '重庆市渝中区解放碑商业步行街', '8:00-9:30', '上午', '重庆地标，繁华商业中心', 18.00, 32.00, TRUE),
  (2, '李子坝轻轨站', '🚝', 15, '重庆市渝中区李子坝正站', '9:30-10:30', '上午', '轻轨 2 号线穿楼而过的奇观', 78.00, 38.00, TRUE),
  (3, '鹅岭二厂文创园', '🎨', 15, '重庆市渝中区鹅岭正街 1 号', '11:00-12:30', '上午', '文艺青年聚集地，电影取景地', 72.00, 52.00, TRUE),
  (4, '南山一棵树观景台', '🌳', 20, '重庆市南岸区南山植物园旁', '14:30-16:00', '下午晚上', '俯瞰重庆夜景的最佳观景台', 20.00, 72.00, TRUE),
  (5, '洪崖洞 + 千厮门大桥', '🌉', 25, '重庆市渝中区嘉陵江滨江路 88 号', '18:30-21:00', '下午晚上', '重庆夜景地标，千与千寻现实版', 80.00, 85.00, TRUE)
ON CONFLICT (id) DO NOTHING;

-- 4. 成就表
CREATE TABLE IF NOT EXISTS achievements (
  id INTEGER PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  required_points INTEGER NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 插入成就数据
INSERT INTO achievements (id, name, required_points, description, icon)
VALUES 
  (1, '山城萌新', 30, '初入山城，开启美食之旅', '🌶️'),
  (2, '雾都探索者', 50, '穿梭雾都，体验轻轨穿楼', '🚝'),
  (3, '巴渝达人', 70, '深度游玩，打卡网红景点', '🌉'),
  (4, '重庆通', 90, '完美一日游，征服所有景点', '🏆')
ON CONFLICT (id) DO NOTHING;

-- 5. 用户成就表
CREATE TABLE IF NOT EXISTS user_achievements (
  id BIGSERIAL PRIMARY KEY,
  user_id VARCHAR(100) NOT NULL,
  achievement_id INTEGER NOT NULL,
  achieved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  redeemed BOOLEAN DEFAULT FALSE,
  redeemed_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id, achievement_id)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement ON user_achievements(achievement_id);

-- 6. 用户照片表（可选，用于存储分享照片）
CREATE TABLE IF NOT EXISTS user_photos (
  id BIGSERIAL PRIMARY KEY,
  user_id VARCHAR(100) NOT NULL,
  photo_url TEXT NOT NULL,
  caption TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_user_photos_user ON user_photos(user_id);

-- 7. 行级安全策略（RLS）- 保护用户数据
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_photos ENABLE ROW LEVEL SECURITY;

-- 用户只能查看自己的数据
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid()::text = user_id OR user_id LIKE 'guest_%' OR user_id LIKE 'anonymous_%');

CREATE POLICY "Users can insert own data" ON users
  FOR INSERT WITH CHECK (auth.uid()::text = user_id OR user_id LIKE 'guest_%' OR user_id LIKE 'anonymous_%');

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid()::text = user_id OR user_id LIKE 'guest_%' OR user_id LIKE 'anonymous_%');

-- 打卡记录策略
CREATE POLICY "Users can view own checkins" ON checkins
  FOR SELECT USING (auth.uid()::text = user_id OR user_id LIKE 'guest_%' OR user_id LIKE 'anonymous_%');

CREATE POLICY "Users can insert own checkins" ON checkins
  FOR INSERT WITH CHECK (auth.uid()::text = user_id OR user_id LIKE 'guest_%' OR user_id LIKE 'anonymous_%');

CREATE POLICY "Users can update own checkins" ON checkins
  FOR UPDATE USING (auth.uid()::text = user_id OR user_id LIKE 'guest_%' OR user_id LIKE 'anonymous_%');

-- 公开表（所有人都可以读取）
ALTER TABLE checkpoints DISABLE ROW LEVEL SECURITY;
ALTER TABLE achievements DISABLE ROW LEVEL SECURITY;

-- 8. 创建视图 - 用户排行榜
CREATE OR REPLACE VIEW user_leaderboard AS
SELECT 
  u.user_id,
  u.alipay_user_id,
  u.points,
  COUNT(DISTINCT c.checkpoint_id) as checked_count,
  u.created_at,
  RANK() OVER (ORDER BY u.points DESC) as rank
FROM users u
LEFT JOIN checkins c ON u.user_id = c.user_id AND c.checked = TRUE
GROUP BY u.id, u.user_id, u.alipay_user_id, u.points, u.created_at
ORDER BY u.points DESC;

-- 9. 触发器 - 自动更新用户积分
CREATE OR REPLACE FUNCTION update_user_points()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.checked = TRUE THEN
    UPDATE users 
    SET points = (
      SELECT COALESCE(SUM(points), 0) 
      FROM checkins 
      WHERE user_id = NEW.user_id AND checked = TRUE
    ),
    updated_at = NOW()
    WHERE user_id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器
DROP TRIGGER IF EXISTS trg_update_user_points ON checkins;
CREATE TRIGGER trg_update_user_points
AFTER INSERT OR UPDATE ON checkins
FOR EACH ROW
EXECUTE FUNCTION update_user_points();

-- 10. 创建函数 - 获取用户完整信息
CREATE OR REPLACE FUNCTION get_user_profile(p_user_id VARCHAR)
RETURNS TABLE (
  user_id VARCHAR,
  alipay_user_id VARCHAR,
  points INTEGER,
  checked_count BIGINT,
  rank BIGINT,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ul.user_id,
    ul.alipay_user_id,
    ul.points,
    ul.checked_count,
    ul.rank,
    ul.created_at
  FROM user_leaderboard ul
  WHERE ul.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 使用示例
-- ============================================

-- 查询用户信息
-- SELECT * FROM get_user_profile('u_ALIPAY_123');

-- 查询排行榜前 10 名
-- SELECT * FROM user_leaderboard LIMIT 10;

-- 查询用户打卡记录
-- SELECT c.*, cp.name, cp.icon 
-- FROM checkins c
-- JOIN checkpoints cp ON c.checkpoint_id = cp.id
-- WHERE c.user_id = 'u_ALIPAY_123';

-- 查询用户获得的成就
-- SELECT ua.*, a.name, a.icon
-- FROM user_achievements ua
-- JOIN achievements a ON ua.achievement_id = a.id
-- WHERE ua.user_id = 'u_ALIPAY_123';