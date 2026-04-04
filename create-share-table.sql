-- ============================================
-- 创建分享资源表
-- ============================================

-- 1. 创建表
CREATE TABLE IF NOT EXISTS public.share_resources (
  id SERIAL PRIMARY KEY,
  type VARCHAR(50) UNIQUE NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 2. 插入默认数据（15 张有效图片 + 8 条文案）
INSERT INTO public.share_resources (type, data) VALUES ('share', '{
  "images": [
    {"id": "jfbei_1", "checkpointId": 1, "url": "https://images.unsplash.com/photo-1599689018248-b3e9e089e8c2?w=800", "desc": "🏢 解放碑步行街"},
    {"id": "jfbei_2", "checkpointId": 1, "url": "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=800", "desc": "🏙️ 城市商业中心"},
    {"id": "jfbei_3", "checkpointId": 1, "url": "https://images.unsplash.com/photo-1519508235410-4e1a9881c138?w=800", "desc": "🌃 城市夜景"},
    {"id": "liziba_1", "checkpointId": 2, "url": "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800", "desc": "🚝 轻轨穿楼"},
    {"id": "liziba_2", "checkpointId": 2, "url": "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800", "desc": "🚄 轨道交通"},
    {"id": "liziba_3", "checkpointId": 2, "url": "https://images.unsplash.com/photo-1520639888713-78db11c0a1a3?w=800", "desc": "🚇 轻轨站台"},
    {"id": "eling_1", "checkpointId": 3, "url": "https://images.unsplash.com/photo-1560185127-6ed189bf02f4?w=800", "desc": "🎨 文创园区"},
    {"id": "eling_2", "checkpointId": 3, "url": "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800", "desc": "🖼️ 艺术空间"},
    {"id": "eling_3", "checkpointId": 3, "url": "https://images.unsplash.com/photo-1550950158-d0d960dff51b?w=800", "desc": "🎭 创业基地"},
    {"id": "nanshan_1", "checkpointId": 4, "url": "https://images.unsplash.com/photo-1506459225024-1428096a4b2e?w=800", "desc": "🌳 南山观景台"},
    {"id": "nanshan_2", "checkpointId": 4, "url": "https://images.unsplash.com/photo-1518182170546-0766aaefcd09?w=800", "desc": "🌆 城市夜景"},
    {"id": "nanshan_3", "checkpointId": 4, "url": "https://images.unsplash.com/photo-1506459225024-1428096a4b2e?w=800", "desc": "🌇 俯瞰全景"},
    {"id": "hongya_1", "checkpointId": 5, "url": "https://images.unsplash.com/photo-1548265047-181289a4168f?w=800", "desc": "🌉 洪崖洞"},
    {"id": "hongya_2", "checkpointId": 5, "url": "https://images.unsplash.com/photo-1554672408-730436b60dde?w=800", "desc": "🏮 千与千寻"},
    {"id": "hongya_3", "checkpointId": 5, "url": "https://images.unsplash.com/photo-1553913861-c0fddf2166ab?w=800", "desc": "🌃 大桥夜景"}
  ],
  "texts": [
    "我在\"趣玩重庆一日游\"打卡活动中，已经获得 {points} 积分！",
    "🎉 重庆一日游太好玩了！打卡了 {points} 积分！",
    "🎊 山城重庆之旅完美收官！{points} 积分到手！",
    "🌟 打卡重庆成功！{points} 积分见证旅程！",
    "✨ 重庆一日游完美收官！{points} 积分解锁！",
    "🎈 8D 魔幻城市！{points} 积分打卡成功！",
    "💫 山城打卡完成！{points} 积分收入囊中！",
    "🌈 雾都探索完成！{points} 积分到手！"
  ]
}') ON CONFLICT (type) DO NOTHING;

-- 3. 授予访问权限
GRANT ALL ON public.share_resources TO anon;
GRANT ALL ON public.share_resources TO authenticated;