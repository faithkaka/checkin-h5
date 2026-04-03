# 趣玩重庆一日游 - 打卡 H5 应用

> 基于支付宝客户端的多用户打卡活动页面，支持云端数据存储和实时排行榜

## 🎯 功能特性

- 📍 **5 个重庆打卡点**：解放碑、李子坝、鹅岭二厂、南山一棵树、洪崖洞
- 🏆 **4 级成就系统**：山城萌新 → 雾都探索者 → 巴渝达人 → 重庆通
- 📸 **照片墙功能**：支持多张照片、左右滑动、保存到本地
- 🎫 **兑奖券系统**：成就兑奖，每人限兑一次
- 📊 **实时排行榜**：基于 Supabase 云端数据
- 📱 **支付宝集成**：自动识别不同支付宝用户，数据独立存储
- 🌐 **统一链接**：所有用户使用同一链接，自动区分用户身份

## 🚀 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/faithkaka/checkin-h5.git
cd checkin-h5
```

### 2. 配置 Supabase

编辑 `js/supabase-manager.js`，替换为你的 Supabase 配置：

```javascript
const SupabaseManager = {
  supabaseUrl: 'https://YOUR_PROJECT.supabase.co',
  supabaseKey: 'YOUR_ANON_KEY',
  // ...
};
```

### 3. 初始化数据库

在 Supabase SQL Editor 中执行 `supabase-init.sql`。

### 4. 启动服务

```bash
# 使用 Python 快速启动
python3 -m http.server 9000

# 或使用其他 HTTP 服务器
# nginx, apache, etc.
```

### 5. 访问页面

打开浏览器访问：`http://localhost:9000`

## 📱 支付宝使用

### 在支付宝中打开

**统一链接**（所有用户使用同一个）：
```
http://YOUR_SERVER_IP:9000/index.html
```

系统会自动：
- ✅ 检测支付宝环境
- ✅ 获取用户 AuthCode
- ✅ 创建独立用户记录
- ✅ 数据云端存储

### 多用户测试

1. 用**支付宝账号 A** 打开链接 → 完成打卡
2. 用**支付宝账号 B** 打开**同一链接** → 完成打卡
3. 两个用户的积分和打卡记录完全独立！

## 📁 项目结构

```
checkin-h5/
├── index.html                  # 主页面
├── css/
│   └── style.css               # 样式文件
├── js/
│   ├── app.js                  # 主逻辑
│   └── supabase-manager.js     # Supabase 用户管理
├── images/
│   └── map-bg.png              # 重庆地图背景 (596x1132)
├── favicon.svg                 # 网站图标
├── supabase-init.sql           # 数据库初始化脚本
├── test-*.html                 # 测试页面
├── README.md                   # 使用说明（本文档）
├── README-支付宝-Supabase.md    # Supabase 配置详解
└── 支付宝多用户指南.md          # 支付宝使用指南
```

## 🗄️ 数据库表

### users - 用户表
```sql
alipay_user_id  # 用户唯一标识（从支付宝 AuthCode 生成）
points          # 当前积分
created_at      # 创建时间
```

### checkins - 打卡记录表
```sql
alipay_user_id  # 用户 ID
checkpoint_id   # 打卡点 ID (1-5)
points          # 获得积分
checked_at      # 打卡时间
```

### checkpoints - 打卡点配置
```sql
checkpoint_id   # 1-5
name            # 景点名称
points          # 积分
```

### achievements - 成就配置
```sql
achievement_id  # 1-4
name            # 成就名称
required_points # 所需积分
```

## 🧪 测试页面

- **`test-multi-user.html`** - 多用户测试，查看排行榜
- **`test-integration.html`** - Supabase 集成测试
- **`test-supabase.html`** - Supabase 配置验证

## 🔐 支付宝用户识别流程

```
用户打开链接
    ↓
检测支付宝环境（UserAgent + AlipayJSBridge）
    ↓
调用 my.getAuthCode() 或 AlipayJSBridge.call()
    ↓
获取 authCode 生成用户 ID: alipay_{authCode}
    ↓
查询/创建 Supabase 用户记录
    ↓
加载用户打卡数据
    ↓
显示个性化页面
```

## 📊 API 说明

### SupabaseManager 方法

```javascript
// 初始化（异步）
await SupabaseManager.init();

// 保存打卡数据
await SupabaseManager.saveCheckinData();

// 获取用户排名
const rank = await SupabaseManager.getUserRank();

// 清除用户数据（测试用）
SupabaseManager.clearUserData();
```

## 🛠️ 开发技巧

### 查看当前用户
```javascript
console.log('用户 ID:', SupabaseManager.userId);
```

### 查看控制台日志
在支付宝中：摇一摇手机 → 查看控制台  
或连接电脑使用 Safari/Chrome 开发者工具

### 清除本地缓存
```javascript
localStorage.clear();
location.reload();
```

### 数据库查询示例
```sql
-- 查看所有用户
SELECT * FROM users ORDER BY points DESC;

-- 查看某用户打卡记录
SELECT * FROM checkins 
WHERE alipay_user_id = 'alipay_xxx';

-- 查看排行榜
SELECT alipay_user_id, points 
FROM users 
ORDER BY points DESC;
```

## ⚠️ 注意事项

1. **网络要求**：手机和服务器需在同一网络或服务器有公网 IP
2. **支付宝权限**：首次打开需用户授权获取用户信息
3. **HTTPS 要求**：生产环境建议使用 HTTPS
4. **CORS 配置**：在 Supabase 后台配置允许的域名

## 📖 相关文档

- [Supabase 配置详解](./README-支付宝-Supabase.md)
- [支付宝多用户指南](./支付宝多用户指南.md)
- [完成清单](./完成清单.md)

## 🎨 技术栈

- **前端**：HTML5 + CSS3 + Vanilla JavaScript
- **后端**：Supabase（PostgreSQL + Auth + Storage）
- **服务器**：任意 HTTP 服务器（Nginx, Apache, Python http.server）
- **地图**：自定义重庆地图背景图
- **支付**：支付宝 JSAPI（AuthCode 认证）

## 📄 许可证

MIT License

## 👨‍💻 作者

GitHub: [@faithkaka](https://github.com/faithkaka)

---

**有问题？提 Issue 或联系作者！** 🚀