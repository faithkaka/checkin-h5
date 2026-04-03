# 📱 支付宝打卡 + Supabase 后端 - 完整配置指南

## ✅ 功能概述

实现了基于 Supabase 的云端存储，支持：
- 🔐 自动识别支付宝用户
- ☁️ 数据存储在 Supabase 云端
- 📊 多用户数据完全隔离
- 🏆 实时排行榜
- 📱 跨设备同步
- 💾 离线降级到 localStorage

## 🚀 快速开始

### 步骤 1: 创建 Supabase 项目

1. 访问 [supabase.com](https://supabase.com)
2. 注册/登录账号
3. 创建新项目（选择就近区域，推荐 `ap-southeast-1` 新加坡）
4. 等待项目初始化完成（约 2 分钟）

### 步骤 2: 获取项目凭证

进入项目后，导航到：
```
Settings → API
```

记录以下信息：
- **Project URL**: `https://xxxxx.supabase.co`
- **anon public key**: `eyJhbGc...`（以 ey 开头的长字符串）

### 步骤 3: 配置数据库

1. 进入 **SQL Editor** 页面
2. 点击 **New Query**
3. 复制 `supabase-schema.sql` 文件的全部内容
4. 点击 **Run** 执行

执行成功后会创建：
- ✅ 6 张表（users, checkins, checkpoints, achievements, user_achievements, user_photos）
- ✅ 索引和触发器
- ✅ 行级安全策略（RLS）
- ✅ 用户排行榜视图
- ✅ 默认打卡点和成就数据

### 步骤 4: 配置前端

编辑 `js/supabase-manager.js` 文件，替换以下配置：

```javascript
const SupabaseManager = {
  supabaseUrl: 'https://YOUR_PROJECT_ID.supabase.co',
  supabaseKey: 'YOUR_ANON_KEY',
  // ...
};
```

替换为你步骤 2 中获取的凭证。

### 步骤 5: 测试

1. 在支付宝中打开页面，或
2. 使用测试页面：`http://localhost:9000/test-alipay-user.html`
3. 查看浏览器控制台日志，确认 Supabase 连接成功

## 📁 文件结构

```
checkin-h5/
├── index.html                  # 主页面
├── js/
│   ├── supabase-manager.js     # ⭐ Supabase 用户管理（新增）
│   ├── app.js                  # 主逻辑（已更新）
│   └── ...
├── css/
├── images/
├── supabase-schema.sql         # ⭐ 数据库结构（新增）
├── test-alipay-user.html       # 测试页面
└── README-支付宝-Supabase.md   # ⭐ 本文档
```

## 🗄️ 数据库说明

### 核心表

#### 1. users - 用户表
```sql
user_id          # 用户唯一标识
alipay_user_id   # 支付宝用户 ID
points           # 当前积分
```

#### 2. checkins - 打卡记录表
```sql
user_id          # 用户 ID
checkpoint_id    # 打卡点 ID (1-5)
checked          # 是否已打卡
points           # 获得积分
checked_at       # 打卡时间
```

#### 3. checkpoints - 打卡点配置表
```sql
id               # 1-5
name             # 景点名称
points           # 积分
address          # 地址
```

#### 4. achievements - 成就表
```sql
id               # 1-4
name             # 成就名称
required_points  # 所需积分
```

### 自动化功能

1. **积分自动更新** - 打卡记录变化时自动更新用户总积分
2. **数据隔离** - RLS 策略确保用户只能访问自己的数据
3. **排行榜视图** - `user_leaderboard` 提供实时排名

## 🔐 支付宝集成

### 获取用户真实 ID

在支付宝开放平台配置 OAuth 2.0 授权后，系统将自动获取用户的真实支付宝 ID。

**流程**：
```
1. 用户在支付宝打开页面
   ↓
2. 调用 my.getAuthCode() 或 AlipayJSBridge.call('getAuthCode')
   ↓
3. 获取 authCode
   ↓
4. 用 authCode 作为用户标识存储
```

### 测试方法

**方式 1: 传入测试用户 ID**
```
http://localhost:9000/index.html?userId=test_user_001
```

**方式 2: 使用测试页面**
```
http://localhost:9000/test-alipay-user.html
```

在测试页面可以：
- 切换不同用户
- 查看数据隔离
- 清除测试数据

## 📊 API 使用示例

### 保存打卡数据

```javascript
// 用户打卡后自动调用
await SupabaseManager.saveCheckinData();
```

### 加载用户数据

```javascript
// 初始化时自动调用
await SupabaseManager.loadFromSupabase();
```

### 获取用户排名

```javascript
const rank = await SupabaseManager.getUserRank();
console.log(`当前排名：${rank.rank}/${rank.total}`);
```

## 🔧 调试技巧

### 1. 浏览器控制台

```javascript
// 查看当前用户
SupabaseManager.userId

// 查看 Supabase 客户端
SupabaseManager.supabase

// 手动同步数据
await SupabaseManager.saveCheckinData()

// 查看用户数据
const { data } = await SupabaseManager.supabase
  .from('checkins')
  .select('*')
  .eq('user_id', SupabaseManager.userId);
```

### 2. Supabase 后台

进入项目后台：
```
Authentication → Users       # 查看用户
Database Editor              # 查看表数据
Logs                         # 查看 API 日志
```

### 3. 本地存储降级

如果 Supabase 连接失败，系统会自动降级到 localStorage：
```
Application → Local Storage → alipay_user_id
```

## ⚠️ 注意事项

### 1. 安全配置

在 Supabase 后台配置：
```
Authentication → Settings
- Enable Email Auth: 关闭（不需要邮箱登录）
- Site URL: 填写你的域名
```

### 2. 数据库配额

免费配额：
- 数据库大小：500MB
- 带宽：5GB/月
- 用户数：无限制

对于打卡应用完全够用。

### 3. 网络延迟

如果在大陆使用，建议：
- 选择新加坡区域（ap-southeast-1）
- 添加 CDN 加速
- 实现离线缓存

### 4. 数据备份

定期导出数据库：
```
Settings → Database → Backup
```

或使用 CLI：
```bash
supabase db dump -f backup.sql
```

## 🚀 部署

### 方式 1: GitHub Pages（推荐）

```bash
# 1. 创建 GitHub 仓库
# 2. 推送代码
git push origin main

# 3. 开启 GitHub Pages
Settings → Pages → Source: main branch
```

### 方式 2: Vercel/Netlify

直接将项目部署到 Vercel 或 Netlify，自动 HTTPS。

### 方式 3: 自建服务器

```bash
# 使用 Nginx
server {
  listen 80;
  server_name yourdomain.com;
  root /path/to/checkin-h5;
  index index.html;
}
```

## 📈 扩展功能

### 添加实时排行榜

在 SupabaseManager 中添加：

```javascript
// 获取排行榜
async getLeaderboard(limit = 10) {
  const { data, error } = await this.supabase
    .from('user_leaderboard')
    .select('*')
    .limit(limit);
  
  return data;
}
```

### 添加兑奖记录

创建 `redemptions` 表：

```sql
CREATE TABLE redemptions (
  id BIGSERIAL PRIMARY KEY,
  user_id VARCHAR(100) NOT NULL,
  achievement_id INTEGER,
  redeemed_at TIMESTAMP DEFAULT NOW(),
  status VARCHAR(50) DEFAULT 'pending'
);
```

### 添加照片上传

使用 Supabase Storage：

```javascript
// 上传照片
const { data, error } = await supabase.storage
  .from('checkin-photos')
  .upload(`photos/${userId}/${Date.now()}.jpg`, file);
```

## 🆘 常见问题

### Q: Supabase 连接失败？
**A**: 检查以下几点：
1. Project URL 和 anon key 是否正确
2. 网络是否可访问 supabase.co
3. 查看浏览器控制台错误日志
4. 在 Supabase 后台查看 API 日志

### Q: 用户数据没有保存？
**A**: 检查：
1. 用户 ID 是否正确获取
2. RLS 策略是否配置正确
3. 查看数据库是否有 INSERT 记录

### Q: 如何清空测试数据？
**A**: 在 Supabase SQL Editor 执行：
```sql
DELETE FROM checkins WHERE user_id LIKE 'test_%';
DELETE FROM users WHERE user_id LIKE 'test_%';
```

### Q: 支持微信/QQ 环境吗？
**A**: 支持！系统会自动检测环境并生成临时用户 ID。

---

**技术支持**: 查看 [Supabase 文档](https://supabase.com/docs)  
**更新时间**: 2026-04-03