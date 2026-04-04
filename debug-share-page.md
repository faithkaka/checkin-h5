# 分享页面调试步骤

## 1. 打开控制台查看日志

访问：`http://localhost:8080/index.html?page=share`

按 F12 打开 Developer Tools → Console

**应该看到的日志**：
```
🚀 SupabaseManager 初始化...
✅ Supabase 客户端创建成功
👤 用户 ID: user_xxx
✅ Supabase 用户管理初始化完成
🔄 从 Supabase 加载分享图片...
✅ 分享资源加载成功，图片：X 张
✅ ShareManager 完成
```

**如果看到这些，说明什么？**
- ✅ "Supabase 客户端创建成功" → Supabase 连接正常
- ⚠️ "加载分享资源失败" → Supabase 表 `share_resources` 没有数据或表不存在
- ✅ "分享资源加载成功，图片：X 张" → 数据加载成功

---

## 2. 检查 Supabase 数据库

### 方法一：SQL Editor 查询

访问：https://supabase.com/dashboard/project/ussvekkgyntubivhfext/sql

执行：
```sql
SELECT * FROM share_resources WHERE type = 'share';
```

**如果有数据**：会返回一行记录，data 列包含 images 数组

**如果没有数据**：
- 表不存在？创建表
- 表存在但没数据？插入默认数据

---

## 3. 快速解决方案

### 方案 A：在 Supabase 插入数据

在 SQL Editor 执行：
```sql
-- 如果没有表，先创建
CREATE TABLE IF NOT EXISTS public.share_resources (
  id SERIAL PRIMARY KEY,
  type VARCHAR(50) UNIQUE NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 插入数据（覆盖已有数据）
INSERT INTO public.share_resources (type, data) 
VALUES ('share', '{
  "images": [
    {"id": "jfbei_1", "checkpointId": 1, "url": "https://picsum.photos/seed/jfbei1/800/600", "desc": "🏢 解放碑"},
    {"id": "jfbei_2", "checkpointId": 1, "url": "https://picsum.photos/seed/jfbei2/800/600", "desc": "🏙️ 商业中心"},
    {"id": "jfbei_3", "checkpointId": 1, "url": "https://picsum.photos/seed/jfbei3/800/600", "desc": "🌃 夜景"},
    {"id": "liziba_1", "checkpointId": 2, "url": "https://picsum.photos/seed/liziba1/800/600", "desc": "🚝 轻轨穿楼"},
    {"id": "liziba_2", "checkpointId": 2, "url": "https://picsum.photos/seed/liziba2/800/600", "desc": "🚄 轨道交通"},
    {"id": "liziba_3", "checkpointId": 2, "url": "https://picsum.photos/seed/liziba3/800/600", "desc": "🚇 站台"},
    {"id": "eling_1", "checkpointId": 3, "url": "https://picsum.photos/seed/eling1/800/600", "desc": "🎨 文创园区"},
    {"id": "eling_2", "checkpointId": 3, "url": "https://picsum.photos/seed/eling2/800/600", "desc": "🖼️ 艺术空间"},
    {"id": "eling_3", "checkpointId": 3, "url": "https://picsum.photos/seed/eling3/800/600", "desc": "🎭 创意基地"},
    {"id": "nanshan_1", "checkpointId": 4, "url": "https://picsum.photos/seed/nanshan1/800/600", "desc": "🌳 观景台"},
    {"id": "nanshan_2", "checkpointId": 4, "url": "https://picsum.photos/seed/nanshan2/800/600", "desc": "🌆 夜景"},
    {"id": "nanshan_3", "checkpointId": 4, "url": "https://picsum.photos/seed/nanshan3/800/600", "desc": "🌇 全景"},
    {"id": "hongya_1", "checkpointId": 5, "url": "https://picsum.photos/seed/hongya1/800/600", "desc": "🌉 洪崖洞"},
    {"id": "hongya_2", "checkpointId": 5, "url": "https://picsum.photos/seed/hongya2/800/600", "desc": "🏮 千与千寻"},
    {"id": "hongya_3", "checkpointId": 5, "url": "https://picsum.photos/seed/hongya3/800/600", "desc": "🌃 大桥"}
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
}'::jsonb)
ON CONFLICT (type) DO UPDATE SET data = EXCLUDED.data;
```

### 方案 B：直接编辑 share_resources 表

1. 访问：https://supabase.com/dashboard/project/ussvekkgyntubivhfext/editor
2. 找到 `share_resources` 表
3. 如果没有数据，点击 "Insert" 添加一行：
   - type: `share`
   - data: 复制上面的 JSON 数据

---

## 4. 本地测试代码

在分享页面控制台执行：
```javascript
// 检查 Supabase 客户端
console.log('Supabase 客户端:', window.supabaseClient);

// 手动加载数据
ShareManager.loadImagesFromSupabase().then(() => {
  console.log('图片列表:', ShareManager.landmarkImages);
  ShareManager.renderPhotoCards();
});
```

---

## 5. 常见问题

### 问题 1：表不存在
**错误**：`relation "share_resources" does not exist`
**解决**：执行上面的 CREATE TABLE SQL

### 问题 2：没有数据
**现象**：控制台显示 "使用默认图片"
**解决**：执行 INSERT SQL

### 问题 3：Supabase 客户端为 null
**现象**：`Supabase 客户端未初始化`
**解决**：检查 index.html 是否加载了 Supabase SDK

---

请执行以上诊断步骤，告诉我控制台的输出！