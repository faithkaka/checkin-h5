# 🎯 打卡链接生成与管理

## 📱 5 个打卡点链接（生产环境）

将以下链接分享给游客，在支付宝中打开即可打卡：

### 🔗 打卡链接列表

| 序号 | 打卡点 | 积分 | 打卡链接 |
|------|--------|------|----------|
| 1️⃣ | 解放碑步行街 | 15 分 | `https://your-domain.com/index.html?checkin=1` |
| 2️⃣ | 李子坝轻轨站 | 15 分 | `https://your-domain.com/index.html?checkin=2` |
| 3️⃣ | 鹅岭二厂文创园 | 15 分 | `https://your-domain.com/index.html?checkin=3` |
| 4️⃣ | 南山一棵树观景台 | 20 分 | `https://your-domain.com/index.html?checkin=4` |
| 5️⃣ | 洪崖洞 + 千厮门大桥 | 25 分 | `https://your-domain.com/index.html?checkin=5` |

**注意**: 请将 `https://your-domain.com` 替换为你的实际域名。

## 📱 本地测试链接

本地开发环境使用（需要将 `localhost` 替换为你的服务器 IP）：

```
http://localhost:9000/index.html?checkin=1  # 解放碑
http://localhost:9000/index.html?checkin=2  # 李子坝
http://localhost:9000/index.html?checkin=3  # 鹅岭二厂
http://localhost:9000/index.html?checkin=4  # 南山一棵树
http://localhost:9000/index.html?checkin=5  # 洪崖洞
```

## 🔧 使用方法

### 方式 1: 直接分享链接
复制上面的链接，通过微信、短信或支付宝分享给游客。

### 方式 2: 生成二维码
使用二维码生成工具将链接转换为二维码，打印出来放在打卡点。

推荐二维码生成工具：
- 在线生成：https://www.qr-code-generator.com/
- 命令行：`qrencode -o checkin1.png "https://your-domain.com/index.html?checkin=1"`

### 方式 3: 使用管理后台
访问 `admin-share.html` 页面，可以查看和管理所有打卡链接。

## ✅ 核心功能

### 1. 用户自动识别
- ✅ 在支付宝中打开链接时，自动获取支付宝用户 ID
- ✅ 使用 `alipay_{authCode}` 作为唯一标识
- ✅ 不同支付宝用户数据独立

### 2. 自动打卡
- ✅ 打开链接时自动检测 `checkin` 参数
- ✅ 如果用户未打卡该点位，自动完成打卡
- ✅ 如果已打卡，显示已完成提示

### 3. 积分累积
- ✅ 同一用户打卡不同点位，积分自动累加
- ✅ 积分存储在 Supabase 云端
- ✅ 支持积分排行榜

### 4. 防止重复打卡
- ✅ 每个点位每人只能打卡一次
- ✅ 重复打开链接不会重复计分
- ✅ 打卡记录永久保存

## 📊 打卡流程

```
游客打开打卡链接
        ↓
检测是否在支付宝环境中
        ↓
获取支付宝用户 AuthCode
        ↓
生成用户 ID: alipay_{authCode}
        ↓
查询用户是否已打卡此点位
        ↓
    ┌──────┴──────┐
    ↓             ↓
已打卡        未打卡
    ↓             ↓
显示已完成    自动打卡
    ↓             ↓
显示当前积分  获得积分 + 更新积分
    ↓             ↓
    └──────┬──────┘
           ↓
    显示打卡成功提示
           ↓
    可继续打卡其他点位
```

## 🧪 测试步骤

### 测试 1: 新用户首次打卡
1. 使用支付宝账号 A 打开 `?checkin=1`
2. 应该看到打卡成功提示
3. 获得 15 积分
4. 检查 Supabase 中是否创建了新用户记录

### 测试 2: 重复打卡
1. 再次使用支付宝账号 A 打开 `?checkin=1`
2. 应该看到"已完成"提示
3. 积分不会增加
4. 打卡记录不会重复

### 测试 3: 不同用户打卡
1. 使用支付宝账号 B 打开 `?checkin=1`
2. 应该看到打卡成功提示（账号 B 的首次打卡）
3. 账号 B 获得 15 积分
4. Supabase 中创建了新用户记录

### 测试 4: 积分累积
1. 使用支付宝账号 A 依次打开 `?checkin=1` 到 `?checkin=5`
2. 每次打卡都应该成功
3. 最终积分应该是 90 分（15+15+15+20+25）
4. 检查 Supabase 中用户积分是否正确

### 测试 5: 非支付宝环境
1. 在普通浏览器中打开打卡链接
2. 应该降级为游客模式
3. 生成临时用户 ID
4. 数据存储在本地

## 🔐 安全说明

### 用户识别安全
- 使用支付宝官方 `getAuthCode` API
- authCode 由支付宝生成，无法伪造
- 用户 ID 格式：`alipay_{authCode}`

### 打卡记录安全
- 打卡记录存储在 Supabase 云端
- 每条记录包含用户 ID、点位 ID、时间戳
- 数据库唯一约束防止重复打卡

### 积分安全
- 积分由服务器计算（基于打卡记录）
- 前端无法直接修改积分
- 支持后台审计

## 📝 数据库表结构

### users - 用户表
```sql
CREATE TABLE users (
  id BIGSERIAL PRIMARY KEY,
  alipay_user_id TEXT UNIQUE NOT NULL,  -- 支付宝用户唯一标识
  points INTEGER DEFAULT 0,               -- 当前积分
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### checkins - 打卡记录表
```sql
CREATE TABLE checkins (
  id BIGSERIAL PRIMARY KEY,
  alipay_user_id TEXT NOT NULL,          -- 支付宝用户 ID
  checkpoint_id INTEGER NOT NULL,         -- 打卡点 ID (1-5)
  points INTEGER DEFAULT 0,               -- 获得积分
  checked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(alipay_user_id, checkpoint_id)   -- 防止重复打卡
);
```

## 🛠️ 管理员工具

### 查看打卡统计
```sql
-- 查看总打卡次数
SELECT COUNT(*) FROM checkins;

-- 查看每个点位的打卡人数
SELECT checkpoint_id, COUNT(DISTINCT alipay_user_id) as user_count
FROM checkins
GROUP BY checkpoint_id
ORDER BY checkpoint_id;

-- 查看积分排行榜
SELECT alipay_user_id, points
FROM users
ORDER BY points DESC
LIMIT 20;

-- 查看某用户的打卡记录
SELECT c.checkpoint_id, c.points, c.checked_at, cp.name
FROM checkins c
JOIN checkpoints cp ON c.checkpoint_id = cp.checkpoint_id
WHERE c.alipay_user_id = 'alipay_xxx'
ORDER BY c.checked_at;
```

## ⚠️ 常见问题

### Q1: 为什么在支付宝中打不开链接？
A: 检查以下几点：
- 服务器是否可公网访问
- 是否使用 HTTPS（支付宝要求）
- 域名是否在支付宝白名单中

### Q2: 为什么打卡后积分没有增加？
A: 检查：
- Supabase 连接是否正常
- 用户 ID 是否正确获取
- 打卡记录是否成功保存

### Q3: 如何清除测试数据？
A: 在 Supabase SQL Editor 中执行：
```sql
DELETE FROM checkins;
DELETE FROM users;
```

### Q4: 如何查看所有测试数据？
A: 
```sql
SELECT * FROM users ORDER BY created_at DESC;
SELECT * FROM checkins ORDER BY checked_at DESC;
```

## 📞 技术支持

遇到问题可以：
1. 查看浏览器控制台日志（支付宝中摇一摇手机）
2. 检查 Supabase 日志
3. 查看项目文档

---

**更新日期**: 2026-04-05  
**适用版本**: checkin-h5 v2.0