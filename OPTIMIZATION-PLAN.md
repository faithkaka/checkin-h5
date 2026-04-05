# 🎯 checkin-h5 项目优化方案

## 📋 优化目标

优化 checkin-h5 项目，实现在支付宝客户端上打开，5 个打卡点生成 5 个打卡链接，在支付宝上打开链接打卡可以区分是不同用户，同一支付宝用户打卡能累积打卡积分。

## ✅ 当前状态分析

### 已有功能
- ✅ 5 个打卡点配置（解放碑、李子坝、鹅岭二厂、南山一棵树、洪崖洞）
- ✅ URL 参数打卡功能（`?checkin=1` 到 `?checkin=5`）
- ✅ 支付宝用户识别（通过 `AlipayJSBridge` 获取 `authCode`）
- ✅ Supabase 云端存储（users 表、checkins 表）
- ✅ 积分累积系统
- ✅ 成就系统（4 个等级）
- ✅ 兑奖券系统

### 需要优化的地方
1. **打卡链接优化** - 需要生成固定的 5 个打卡链接，便于分享
2. **支付宝环境适配** - 优化支付宝 JSAPI 调用，提高获取用户 ID 的成功率
3. **打卡流程优化** - 简化打卡操作，点击链接自动打卡
4. **用户体验优化** - 添加加载提示、打卡成功动画等

## 🚀 优化方案

### 1. 生成 5 个固定打卡链接

为每个打卡点生成独立的分享链接，格式如下：

```
https://your-domain.com/index.html?checkin=1  # 解放碑
https://your-domain.com/index.html?checkin=2  # 李子坝
https://your-domain.com/index.html?checkin=3  # 鹅岭二厂
https://your-domain.com/index.html?checkin=4  # 南山一棵树
https://your-domain.com/index.html?checkin=5  # 洪崖洞
```

### 2. 支付宝用户识别流程

```
用户打开打卡链接
    ↓
检测支付宝环境（UserAgent + AlipayJSBridge）
    ↓
调用 my.getAuthCode() 获取授权码
    ↓
生成用户 ID: alipay_{authCode}
    ↓
查询 Supabase 用户记录（不存在则创建）
    ↓
检查该用户是否已打卡此点位
    ↓
未打卡 → 自动打卡并保存
已打卡 → 显示已完成提示
    ↓
显示打卡结果（积分、成就等）
```

### 3. 核心代码优化

#### 3.1 优化 SupabaseManager（已在 app.js 中实现）
- ✅ 已实现支付宝环境检测
- ✅ 已实现 authCode 获取
- ✅ 已实现用户数据同步

#### 3.2 优化打卡流程（已在 CheckpointManager 中实现）
- ✅ `handleCheckinFromURL()` - 处理 URL 打卡参数
- ✅ 自动检测并打卡
- ✅ 防止重复打卡

### 4. 打卡链接配置

创建 `share-links.html` 管理后台页面，管理员可以：
- 查看 5 个打卡点的分享链接
- 生成二维码
- 复制链接用于分享

## 📁 需要修改的文件

### 主要修改
1. **js/app.js** - 优化支付宝用户识别和打卡流程
2. **index.html** - 优化加载提示和打卡成功界面
3. **js/supabase-manager.js** - 已在之前的版本中优化

### 新增文件
1. **share-links.html** - 打卡链接管理页面
2. **QRCODE-GENERATOR.md** - 二维码生成指南

## 🔧 实施步骤

### 步骤 1: 优化支付宝用户识别
已在 `supabase-manager.js` 中实现：
- 检测支付宝环境
- 调用 `my.getAuthCode()` 获取用户授权码
- 生成唯一用户 ID：`alipay_{authCode}`
- 同步用户数据到 Supabase

### 步骤 2: 优化打卡流程
已在 `app.js` 的 `CheckpointManager.handleCheckinFromURL()` 中实现：
- 检测 URL 参数 `?checkin=N`
- 自动执行打卡
- 显示成功提示
- 防止重复打卡

### 步骤 3: 生成分享链接
创建管理员页面，展示 5 个打卡点的固定链接。

### 步骤 4: 测试验证
- 使用不同支付宝账号测试
- 验证用户区分功能
- 验证积分累积功能
- 验证重复打卡防护

## 🎯 最终效果

### 用户体验流程
1. 游客收到打卡链接（如：`http://server/index.html?checkin=1`）
2. 在支付宝中打开链接
3. 自动识别用户身份
4. 自动完成打卡（如未打卡）
5. 显示打卡成功和获得积分
6. 可继续打卡其他点位

### 管理员操作
1. 打开 `share-links.html`
2. 查看 5 个打卡点的链接
3. 复制链接分享到微信群/短信
4. 或生成二维码打印

### 数据管理
- 每个支付宝用户独立记录
- 打卡记录存储在 Supabase
- 支持实时排行榜
- 支持 admin 后台查看数据

## 📊 数据表结构

### users 表
```sql
alipay_user_id  TEXT UNIQUE  -- 支付宝用户唯一标识
points          INTEGER      -- 当前积分
created_at      TIMESTAMP    -- 创建时间
updated_at      TIMESTAMP    -- 更新时间
```

### checkins 表
```sql
alipay_user_id  TEXT         -- 支付宝用户 ID
checkpoint_id   INTEGER      -- 打卡点 ID (1-5)
points          INTEGER      -- 获得积分
checked_at      TIMESTAMP    -- 打卡时间
```

## ⚠️ 注意事项

1. **服务器部署**
   - 需要公网可访问的 HTTP/HTTPS 服务器
   - 建议使用 HTTPS（支付宝要求）
   - 可以使用 Vercel、Netlify 等免费托管

2. **支付宝配置**
   - 需要在支付宝开放平台配置 H5 应用
   - 配置 JSAPI 权限（getAuthCode）
   - 配置合法域名白名单

3. **Supabase 配置**
   - 配置 CORS 允许的域名
   - 设置适当的 RLS 策略
   - 备份重要数据

4. **测试建议**
   - 使用多个支付宝账号测试
   - 测试不同场景（首次打卡、重复打卡）
   - 测试网络异常情况

## 📝 相关链接

- [README.md](./README.md) - 项目总览
- [README-支付宝-Supabase.md](./README-支付宝-Supabase.md) - Supabase 配置详解
- [支付宝多用户指南.md](./支付宝多用户指南.md) - 支付宝使用指南

---

**更新日期**: 2026-04-05  
**版本**: v2.0 优化版