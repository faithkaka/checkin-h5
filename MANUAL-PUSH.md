# 🚀 手动推送代码到 GitHub

## 当前状态

✅ 代码已提交到本地 Git 仓库  
❌ 推送到 GitHub 失败（SSH 密钥问题）

## 解决方案

### 方式 1：使用 HTTPS 推送（推荐）

在终端中执行以下命令：

```bash
cd /Users/kuohai/.homiclaw/workspace/checkin-h5

# 修改远程仓库为 HTTPS
git remote set-url origin https://github.com/faithkaka/checkin-h5.git

# 推送代码
git push origin main
```

系统会提示输入 GitHub 用户名和密码：
- **Username**: `faithkaka`
- **Password**: 输入你的 **GitHub Personal Access Token**（不是登录密码）

如果没有 Token，可以创建一个：
1. 访问 https://github.com/settings/tokens
2. 点击 "Generate new token (classic)"
3. 勾选 `repo` 权限
4. 生成后复制 Token
5. 在终端输入时粘贴

---

### 方式 2：使用 GitHub Desktop

1. 打开 GitHub Desktop
2. 应该能看到 checkin-h5 项目
3. 点击 "Push origin" 按钮

---

### 方式 3：在 GitHub 网站上查看代码

访问 https://github.com/faithkaka/checkin-h5 确认：
- 最新 commit 应该是 "fix: 修复支付宝打卡数据保存问题"
- 时间应该是刚刚

如果不是，说明推送没成功，需要执行方式 1。

---

## ✅ 推送成功后的验证步骤

### 1. 检查 GitHub 仓库

访问 https://github.com/faithkaka/checkin-h5/commits/main

应该能看到最新的 commit：
```
fix: 修复支付宝打卡数据保存问题
c3a0e1b · 刚刚
```

### 2. 等待 GitHub Pages 更新

通常需要 **1-3 分钟**。访问：
```
https://faithkaka.github.io/checkin-h5/index.html
```

### 3. 在支付宝中测试打卡

打开：
```
https://faithkaka.github.io/checkin-h5/index.html?checkin=1
```

打卡后，等待 1 分钟，然后打开管理后台查看数据。

### 4. 查看管理后台

打开：
```
http://localhost:9000/admin-today.html
```

应该能看到新的打卡记录！

---

## 🔧 如果推送成功但还是看不到数据

可能的原因：

### 原因 1：浏览器缓存
**解决**：在支付宝中清除缓存，或者在链接后加版本号：
```
https://faithkaka.github.io/checkin-h5/index.html?v=2026040501&checkin=1
```

### 原因 2：代码还没有生效
**解决**：等待几分钟，GitHub Pages 需要时间构建。

### 原因 3：Supabase 权限问题
**检查**：在浏览器控制台（如果有）查看是否有 Supabase 错误。

---

## 📞 需要帮助？

请告诉我：
1. 执行 `git push` 后的输出
2. GitHub 仓库的最新 commit 是什么
3. 支付宝打卡后，管理后台看到什么

---

**更新时间**: 2026-04-05 11:32