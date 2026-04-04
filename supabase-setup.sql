-- ============================================
-- Supabase 数据库设置脚本
-- 用于重庆打卡活动项目
-- ============================================

-- 1. 插入默认分享资源数据（表已存在则直接插入）
INSERT INTO public.share_resources (type, data) VALUES ('share', '{
  "images": [
    {"id": "jfbei_1", "checkpointId": 1, "url": "https://images.unsplash.com/photo-1599689018248-b3e9e089e8c2?w=600", "desc": "🏢 解放碑"},
    {"id": "jfbei_2", "checkpointId": 1, "url": "https://images.unsplash.com/photo-1478131333081-31f9a7e96847?w=600", "desc": "🏙️ 商业中心"},
    {"id": "jfbei_3", "checkpointId": 1, "url": "https://images.unsplash.com/photo-1519508235410-4e1a9881c138?w=600", "desc": "🌃 夜景"},
    {"id": "liziba_1", "checkpointId": 2, "url": "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=600", "desc": "🚝 轻轨穿楼"},
    {"id": "liziba_2", "checkpointId": 2, "url": "https://images.unsplash.com/photo-1444703686981-a3abbc4d4fe3?w=600", "desc": "🚄 轻轨"},
    {"id": "liziba_3", "checkpointId": 2, "url": "https://images.unsplash.com/photo-1520639888713-78db11c0a1a3?w=600", "desc": "🚇 站台"},
    {"id": "eling_1", "checkpointId": 3, "url": "https://images.unsplash.com/photo-1560185127-6ed189bf02f4?w=600", "desc": "🎨 二厂"},
    {"id": "eling_2", "checkpointId": 3, "url": "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=600", "desc": "🖼️ 文艺"},
    {"id": "eling_3", "checkpointId": 3, "url": "https://images.unsplash.com/photo-1550950158-d0d960dff51b?w=600", "desc": "🎭 电影"},
    {"id": "nanshan_1", "checkpointId": 4, "url": "https://images.unsplash.com/photo-1506459225024-1428096a4b2e?w=600", "desc": "🌳 观景台"},
    {"id": "nanshan_2", "checkpointId": 4, "url": "https://images.unsplash.com/photo-1518182170546-0766aaefcd09?w=600", "desc": "🌆 夜景"},
    {"id": "nanshan_3", "checkpointId": 4, "url": "https://images.unsplash.com/photo-1506459225024-1428096a4b2e?w=600", "desc": "🌇 全景"},
    {"id": "hongya_1", "checkpointId": 5, "url": "https://images.unsplash.com/photo-1548265047-181289a4168f?w=600", "desc": "🌉 洪崖洞"},
    {"id": "hongya_2", "checkpointId": 5, "url": "https://images.unsplash.com/photo-1554672408-730436b60dde?w=600", "desc": "🏮 千与千寻"},
    {"id": "hongya_3", "checkpointId": 5, "url": "https://images.unsplash.com/photo-1553913861-c0fddf2166ab?w=600", "desc": "🌃 大桥"}
  ],
  "texts": [
    "我在\"趣玩重庆一日游\"打卡活动中，已经获得 {points} 积分！打卡了重庆地标景点，快来一起探索山城魅力吧！",
    "🎉 重庆一日游太好玩了！打卡了 {points} 积分，网红景点都打卡成功！这个周末一起来玩！",
    "🎊 山城重庆之旅完美收官！{points} 积分到手，李子坝轻轨穿楼太震撼了，洪崖洞夜景美到窒息！",
    "🌟 打卡重庆成功！用双腿丈量这座城市，{points} 积分见证我的山城建功之旅！",
    "✨ 重庆一日游完美收官！{points} 积分解锁，嘉陵江的夜风、解放碑的繁华、南山的美景，都不虚此行！",
    "🎈 8D 魔幻城市名不虚传！{points} 积分打卡成功，重庆我还会再来的！",
    "💫 山城打卡成就达成！{points} 积分收入囊中，重庆的美食美景值得 N 刷！",
    "🌈 雾都探索完成！{points} 积分到手，重庆的奇妙超出想象！童伴们冲鸭！"
  ]
}') ON CONFLICT (type) DO NOTHING;

-- 3. 创建 Storage Bucket（用于存放上传的图片）
-- 注意：这需要在 Supabase Dashboard 中手动创建，或者使用 API
-- Dashboard 路径：Storage → Create bucket → Name: share-images, Public: true

-- 4. 设置 Storage policy（允许匿名上传和公开读取）
-- 在 Supabase Dashboard → Authentication → Policies 中设置

-- 或者使用 SQL 创建 policy：
-- 允许匿名上传
CREATE POLICY "公开上传" ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'share-images');

-- 允许公开读取
CREATE POLICY "公开读取" ON storage.objects FOR SELECT
USING (bucket_id = 'share-images');

-- 允许匿名用户删除自己的文件
CREATE POLICY "匿名用户删除" ON storage.objects FOR DELETE
USING (bucket_id = 'share-images' AND auth.role() = 'anon');

-- 5. 授予公共访问权限
GRANT ALL ON public.share_resources TO anon;
GRANT ALL ON public.share_resources TO authenticated;

-- ============================================
-- 使用说明：
-- 
-- 1. 在 Supabase Dashboard 执行上述 SQL
-- 2. 创建 Storage bucket "share-images"（设为 Public）
-- 3. 添加上述 Storage policies
-- 4. 测试 admin-share.html 页面
-- ============================================