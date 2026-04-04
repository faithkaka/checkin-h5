-- ============================================
-- 创建分享资源表（使用 Picsum 可靠图片源）
-- ============================================

-- 1. 创建表
CREATE TABLE IF NOT EXISTS public.share_resources (
  id SERIAL PRIMARY KEY,
  type VARCHAR(50) UNIQUE NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 2. 插入默认数据（15 张 Picsum 图片 + 8 条文案）
INSERT INTO public.share_resources (type, data) VALUES ('share', '{
  "images": [
    {"id": "jfbei_1", "checkpointId": 1, "url": "https://picsum.photos/seed/jfbei1/800/600", "desc": "🏢 解放碑步行街"},
    {"id": "jfbei_2", "checkpointId": 1, "url": "https://picsum.photos/seed/jfbei2/800/600", "desc": "🏙️ 城市商业中心"},
    {"id": "jfbei_3", "checkpointId": 1, "url": "https://picsum.photos/seed/jfbei3/800/600", "desc": "🌃 城市夜景"},
    
    {"id": "liziba_1", "checkpointId": 2, "url": "https://picsum.photos/seed/liziba1/800/600", "desc": "🚝 轻轨穿楼"},
    {"id": "liziba_2", "checkpointId": 2, "url": "https://picsum.photos/seed/liziba2/800/600", "desc": "🚄 轨道交通"},
    {"id": "liziba_3", "checkpointId": 2, "url": "https://picsum.photos/seed/liziba3/800/600", "desc": "🚇 轻轨站台"},
    
    {"id": "eling_1", "checkpointId": 3, "url": "https://picsum.photos/seed/eling1/800/600", "desc": "🎨 文创园区"},
    {"id": "eling_2", "checkpointId": 3, "url": "https://picsum.photos/seed/eling2/800/600", "desc": "🖼️ 艺术空间"},
    {"id": "eling_3", "checkpointId": 3, "url": "https://picsum.photos/seed/eling3/800/600", "desc": "🎭 创意基地"},
    
    {"id": "nanshan_1", "checkpointId": 4, "url": "https://picsum.photos/seed/nanshan1/800/600", "desc": "🌳 南山观景台"},
    {"id": "nanshan_2", "checkpointId": 4, "url": "https://picsum.photos/seed/nanshan2/800/600", "desc": "🌆 城市夜景"},
    {"id": "nanshan_3", "checkpointId": 4, "url": "https://picsum.photos/seed/nanshan3/800/600", "desc": "🌇 俯瞰全景"},
    
    {"id": "hongya_1", "checkpointId": 5, "url": "https://picsum.photos/seed/hongya1/800/600", "desc": "🌉 洪崖洞"},
    {"id": "hongya_2", "checkpointId": 5, "url": "https://picsum.photos/seed/hongya2/800/600", "desc": "🏮 千与千寻"},
    {"id": "hongya_3", "checkpointId": 5, "url": "https://picsum.photos/seed/hongya3/800/600", "desc": "🌃 大桥夜景"}
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