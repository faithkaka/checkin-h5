# 🔍 分享页面图片不显示 - 诊断指南

## 问题现象
管理后台上传图片成功，但分享页面看不到最新图片。

---

## 🔎 诊断步骤

### 步骤 1：检查管理后台是否保存成功

1. 访问管理后台：`http://localhost:8080/admin-share.html`
2. 打开浏览器控制台（F12）
3. 点击 "💾 保存所有修改"
4. 查看控制台输出：

**成功的日志**：
```javascript
✅ 保存成功！
```

**失败的日志**：
```javascript
❌ Save failed: ...
```

---

### 步骤 2：检查 Supabase 数据库

访问：https://supabase.com/dashboard/project/ussvekkgyntubivhfext/editor

1. 找到 `share_resources` 表
2. 查看是否有数据

**应该有 1 行数据**：
- type: `share`
- data: JSON 对象，包含 images 数组

**如果没有数据**：
- 表不存在？→ 执行 CREATE TABLE
- 表存在但空？→ 管理后台没保存成功
- data 是 null？→ 数据格式问题

---

### 步骤 3：检查分享页面加载日志

1. 访问分享页面：`http://localhost:8080/index.html?page=share`
2. 打开浏览器控制台（F12）
3. 强制刷新（Cmd+Shift+R）
4. 查看日志：

**成功的日志**：
```javascript
🚀 SupabaseManager 初始化...
✅ Supabase 客户端创建成功
👤 用户 ID: user_xxx
🔄 从 Supabase 加载分享图片...
✅ 分享资源加载成功，图片：X 张
✅ ShareManager 完成
```

**警告日志**：
```javascript
⚠️ Supabase 客户端未初始化，使用默认图片
```
→ 检查 index.html 是否加载 Supabase SDK

```javascript
⚠️ 加载分享资源失败，使用默认图片：...
```
→ 表不存在或没有数据

---

### 步骤 4：在控制台手动测试

在分享页面控制台执行：

```javascript
// 1. 检查 Supabase 客户端
console.log('Supabase 客户端:', window.supabaseClient);

// 2. 手动查询数据
const result = await window.supabaseClient
  .from('share_resources')
  .select('data')
  .eq('type', 'share')
  .single();

console.log('查询结果:', result);
console.log('图片数量:', result.data?.data?.images?.length);
console.log('图片列表:', result.data?.data?.images);

// 3. 强制重新加载
await ShareManager.loadImagesFromSupabase();
console.log('ShareManager.landmarkImages:', ShareManager.landmarkImages);
ShareManager.renderPhotoCards();
```

---

## 🛠️ 解决方案

### 方案 A：管理后台重新保存

1. 访问管理后台：`http://localhost:8080/admin-share.html`
2. 确保页面上显示了所有图片（包括最新上传的）
3. 点击底部 "💾 保存所有修改" 按钮
4. 看到 "✅ 保存成功！" 提示
5. 刷新分享页面查看

---

### 方案 B：直接在 Supabase 插入数据

如果管理后台保存失败，直接在 Supabase 执行 SQL：

1. 访问：https://supabase.com/dashboard/project/ussvekkgyntubivhfext/sql
2. 执行以下 SQL：

```sql
-- 创建表（如果不存在）
CREATE TABLE IF NOT EXISTS public.share_resources (
  id SERIAL PRIMARY KEY,
  type VARCHAR(50) UNIQUE NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 插入/更新数据
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

3. 点击 "Run" 执行
4. 刷新分享页面

---

### 方案 C：管理后台添加调试日志

在管理后台控制台执行：

```javascript
// 检查 shareData
console.log('当前 shareData:', shareData);
console.log('图片数量:', shareData.images.length);
console.log('图片列表:', shareData.images);

// 手动保存
getSupabase().from('share_resources')
  .upsert({ type: 'share', data: shareData })
  .then(result => {
    if (result.error) console.error('保存失败:', result.error);
    else console.log('保存成功');
  });
```

---

## 📋 常见错误及解决

### 错误 1：用户未登录
```
error: "JWT expired"
```
→ 刷新页面重新获取 token

### 错误 2：表不存在
```
error: "relation public.share_resources does not exist"
```
→ 执行 CREATE TABLE SQL

### 错误 3：权限不足
```
error: "permission denied for table share_resources"
```
→ 在 Supabase 设置表权限：
```sql
GRANT ALL ON public.share_resources TO anon;
GRANT ALL ON public.share_resources TO authenticated;
```

### 错误 4：数据格式错误
```
error: "invalid input value for type jsonb"
```
→ JSON 格式错误，确保 data 是有效的 JSON 对象

---

## ✅ 验证成功

刷新分享页面后，应该：
1. 看到所有 15 张图片
2. 图片可以横向滑动
3. 点击可以选择
4. 文案随机显示

如果还是看不到，请将**管理后台**和**分享页面**的控制台完整日志发给我！