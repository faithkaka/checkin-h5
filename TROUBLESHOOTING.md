# 🔧 故障排查指南

## 问题：每次打开都重新开始打卡

### 症状
- 在支付宝客户端打开打卡页面
- 每次都是新的用户，积分从 0 开始
- 已打卡的点位不保留

### 原因分析
这个问题通常由以下原因导致：

1. **用户 ID 没有正确获取或保存**
   - localStorage 中没有保存用户 ID
   - 支付宝 AuthCode 获取失败
   - 用户 ID 生成逻辑有问题

2. **数据没有从 Supabase 加载**
   - Supabase 连接失败
   - 查询逻辑有 bug
   - 数据库表结构不匹配

3. **localStorage 被清除**
   -  clearing browser data
   - 使用了无痕模式

---

## 🔍 诊断步骤

### 步骤 1：打开调试页面

在支付宝客户端中打开：
```
http://<你的服务器 IP>:9000/debug-user.html
```

### 步骤 2：查看检测结果

调试页面会显示以下信息：

#### 环境检测
- ✅ **User Agent**: 应该包含 "AlipayClient" 或 "alipay"
- ✅ **是否支付宝**: 应该显示 "✅ 是"
- ✅ **AlipayJSBridge**: 应该显示 "✅ 存在"
- ✅ **my 对象**: 最好显示 "✅ 存在"

#### 用户信息
- ✅ **用户 ID**: 应该是以 "alipay_" 或 "user_" 开头的字符串
- ✅ **Supabase 状态**: 应该显示 "✅ 已连接"
- ✅ **当前积分**: 应该显示实际积分（不是 0 或"加载中"）
- ✅ **已打卡点位**: 应该显示如 "3/5 (1, 2, 3)"

### 步骤 3：测试 AuthCode 获取

点击调试页面上的 **"🔑 测试获取 AuthCode"** 按钮

**成功结果**：
```
✅ AuthCode 获取成功！
AuthCode: abc123xyz...
```

**失败结果**：
```
❌ AuthCode 获取失败！
错误：支付宝 JSAPI 不可用
```

---

## ✅ 解决方案

### 方案 1：检查 localStorage（最常见）

#### 在浏览器控制台检查
1. 打开 `index.html`
2. 按 F12 打开开发者工具
3. 在 Console 中运行：
```javascript
localStorage.getItem('alipay_user_id')
```

**期望结果**：应该返回类似 `"alipay_xxx"` 或 `"user_xxx"` 的字符串

**如果是 null**：说明用户 ID 没有保存，需要检查代码

#### 手动设置测试 ID
在控制台运行：
```javascript
localStorage.setItem('alipay_user_id', 'user_test_' + Date.now());
location.reload();
```

然后检查是否正常加载用户数据。

---

### 方案 2：检查 Supabase 连接

#### 查看控制台日志
打开 `index.html`，F12 查看 Console，应该看到：
```
🚀 SupabaseManager 初始化...
✅ Supabase 客户端创建成功
🔐 支付宝环境：✅ 是
👤 用户 ID: alipay_xxx
🔄 同步用户到 Supabase: alipay_xxx
✅ 用户已存在：alipay_xxx
📥 从 Supabase 加载用户数据...
✅ 加载用户积分：90
✅ 加载打卡记录：5 个
```

**如果看到错误**：
- `❌ Supabase 初始化失败`: 检查网络和 Supabase 配置
- `❌ 同步用户失败`: 检查数据库表是否存在
- `❌ 从 Supabase 加载失败`: 检查 RLS 策略

#### 检查 Supabase 配置
打开 `js/supabase-manager.js`，确认配置正确：
```javascript
const SupabaseManager = {
  supabaseUrl: 'https://ussvekkgyntubivhfext.supabase.co',
  supabaseKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  // ...
};
```

#### 检查数据库表
在 Supabase SQL Editor 中运行：
```sql
-- 检查 users 表
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'users';

-- 检查 checkins 表
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'checkins';

-- 查看_users
SELECT * FROM users ORDER BY created_at DESC;

-- 查看打卡记录
SELECT * FROM checkins ORDER BY checked_at DESC;
```

---

### 方案 3：检查支付宝环境

#### 确认在支付宝客户端中打开
User Agent 应该包含：
- `AlipayClient` (H5 环境)
- 或通过 `window.AlipayJSBridge` 检测

#### 检查 JSAPI 权限
支付宝 H5 应用需要配置：
1. 登录 [支付宝开放平台](https://open.alipay.com/)
2. 进入应用管理
3. 配置 **JSAPI 权限**
4. 添加 `getAuthCode` 权限
5. 配置 **域名白名单**

#### 测试 JSAPI 调用
在调试页面点击 "测试获取 AuthCode" 按钮

**如果失败**：
- 检查是否在支付宝客户端内
- 检查 JSAPI 权限配置
- 尝试使用 `my.getAuthCode` 或 `AlipayJSBridge.call`

---

### 方案 4：代码修复

如果以上都正常，但问题依然存在，可能是代码逻辑问题。

#### 检查点 1：用户 ID 获取顺序
打開 `js/supabase-manager.js`，確認 `getUserId()` 方法：

```javascript
async getUserId() {
  // 1. 优先从 localStorage 获取
  const storedId = localStorage.getItem('alipay_user_id');
  if (storedId && storedId.startsWith('alipay_')) {
    this.userId = storedId;
    await this.syncWithSupabase();
    return;
  }
  
  // 2. 在支付宝环境中获取
  if (this.isAlipay) {
    await this.getAlipayAuthUserId();
    return;
  }
  
  // 3. 生成持久化 ID
  this.userId = 'user_' + this.generateUniqueId();
  this.saveToLocalStorage(); // ← 关键：保存到 localStorage
}
```

#### 检查点 2：数据保存
确认 `saveCheckinData()` 方法正确调用：

在 `js/app.js` 的打卡处理中：
```javascript
// 执行打卡
checkpoint.checked = true;
AppState.points += checkpoint.points;

// 保存到 Supabase
if (window.SupabaseManager && window.SupabaseManager.isReady) {
  await SupabaseManager.saveCheckinData(); // ← 关键
}
```

#### 检查点 3：数据加载
确认页面初始化时加载了用户数据：

在 `js/supabase-manager.js` 的 `syncWithSupabase()` 方法末尾：
```javascript
async syncWithSupabase() {
  // ... 查询或创建用户
  
  if (!existingUser) {
    // 创建新用户
  } else {
    // 加载用户数据 ← 关键
    await this.loadFromSupabase();
  }
}
```

---

## 🧪 测试流程

### 测试 1：新用户首次打卡
1. 打开 `debug-user.html`
2. 点击 "清除本地数据"
3. 刷新页面
4. 记录用户 ID（如：`user_test_123`）
5. 打开 `index.html?checkin=1`
6. 应该看到打卡成功，积分 +15
7. 刷新 `debug-user.html`
8. 应该显示积分：15，已打卡：1/5

### 测试 2：重复打开
1. 关闭页面
2. 重新打开 `index.html`（无参数）
3. 应该保留积分 15
4. 已打卡点位 1 应该是 ✅ 状态

### 测试 3：不同用户
1. 用手机 B 或清除数据
2. 打开 `index.html?checkin=1`
3. 应该看到打卡成功（新用户）
4. 在 `debug-user.html` 中应该看到不同的用户 ID

---

## 📊 数据库验证

### 查询所有用户
```sql
SELECT alipay_user_id, points, created_at 
FROM users 
ORDER BY created_at DESC;
```

### 查询某用户的打卡记录
```sql
SELECT c.checkpoint_id, c.points, c.checked_at, 
       cp.name as checkpoint_name
FROM checkins c
JOIN checkpoints cp ON c.checkpoint_id = cp.checkpoint_id
WHERE c.alipay_user_id = 'user_test_123'
ORDER BY c.checked_at;
```

### 手动添加测试数据
```sql
-- 添加测试用户
INSERT INTO users (alipay_user_id, points) 
VALUES ('user_test_123', 15);

-- 添加打卡记录
INSERT INTO checkins (alipay_user_id, checkpoint_id, points) 
VALUES ('user_test_123', 1, 15);
```

---

## 🛠️ 常用调试命令

### 浏览器控制台
```javascript
// 查看当前用户 ID
console.log('用户 ID:', localStorage.getItem('alipay_user_id'));

// 查看保存的打卡数据
console.log('打卡数据:', JSON.parse(localStorage.getItem('checkin_data')));

// 手动设置用户 ID
localStorage.setItem('alipay_user_id', 'user_test_' + Date.now());

// 清除所有数据
localStorage.clear();
location.reload();

// 查看 Supabase 连接
console.log('Supabase:', window.supabaseClient);

// 手动加载用户数据
await SupabaseManager.loadFromSupabase();
```

---

## 📞 需要帮助？

如果以上方法都无法解决问题，请提供以下信息：

1. **调试页面截图** (debug-user.html)
2. **浏览器控制台日志** (F12 → Console)
3. **User Agent 字符串** (调试页面显示)
4. **使用的设备和支付宝版本**

---

**更新日期**: 2026-04-05  
**适用版本**: checkin-h5 v2.0