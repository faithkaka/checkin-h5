-- ========================================
-- 清空所有兑奖数据和用户
-- ⚠️ 危险操作！执行前请备份
-- ========================================

-- 1. 清空兑奖记录表
DELETE FROM redemptions;
SELECT '✅ 已清空兑奖记录';

-- 2. 重置用户的兑奖状态
UPDATE users SET has_redeemed = FALSE;
SELECT '✅ 已重置用户兑奖状态';

-- 3. （可选）清空所有用户数据 - 谨慎使用！
-- DELETE FROM users;
-- SELECT '✅ 已清空所有用户';

-- 4. （可选）清空所有打卡记录 - 谨慎使用！
-- DELETE FROM checkins;
-- SELECT '✅ 已清空打卡记录';

-- 5. 验证清空结果
SELECT '📊 兑奖记录数：' || COUNT(*) FROM redemptions;
SELECT '📊 已兑奖用户数：' || COUNT(*) FROM users WHERE has_redeemed = TRUE;

-- ========================================
-- 执行方法
-- ========================================
-- 1. 打开 Supabase Dashboard
-- 2. 进入 SQL Editor
-- 3. 复制并执行上述 SQL
-- 4. 验证结果

-- ========================================
-- 单项查询
-- ========================================
-- 查询所有兑奖记录
-- SELECT * FROM redemptions ORDER BY redeemed_at DESC;

-- 查询已兑奖用户
-- SELECT alipay_user_id, points, has_redeemed FROM users WHERE has_redeemed = TRUE;

-- 查询兑奖统计
-- SELECT COUNT(*) as total FROM redemptions;