# 🚀 推送代码到 GitHub - 完整指南

## 问题诊断
GitHub Pages 上的代码是旧版本，打卡数据没有保存到 Supabase 数据库。

## 解决步骤

### 步骤 1：检查本地代码

首先确认本地代码是正确的。关键文件应该有这些内容：

#### 检查 index.html 的脚本加载顺序
```bash
cd /Users/kuohai/.homiclaw/workspace/checkin-h5
grep -n "supabase" index.html
```

应该看到：
```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.39.0"></script>
<script src="js/supabase-manager.js?v=20260405"></script>
<script src="js/app.js?v=20260405"></script>
```

#### 检查 supabase-manager.js 是否存在
```bash
ls -la js/supabase-manager.js
```

应该存在且文件大小约 12KB。

### 步骤 2：推送代码到 GitHub

打开终端，执行以下命令：

```bash
# 进入项目目录
cd /Users/kuohai/.homiclaw/workspace/checkin-h5

# 查看 Git 状态
git status

# 添加所有更改
git add -A

# 提交更改
git commit -m "fix: 修复支付宝打卡数据保存问题

- 添加 supabase-manager.js 处理用户识别
- 修复 index.html 脚本加载顺序
- 优化打卡数据保存到 Supabase
- 添加时区处理（UTC → 北京时间）"

# 推送到 GitHub
git push origin main

# 如果推送失败，检查远程仓库
git remote -v
# 应该显示类似：
# origin  https://github.com/faithkaka/checkin-h5.git (fetch)
# origin  https://github.com/faithkaka/checkin-h5.git (push)
```

### 步骤 3：等待 GitHub Pages 更新

推送后，GitHub Pages 通常需要 **1-2 分钟** 更新。

访问以下地址检查更新：
```
https://faithkaka.github.io/checkin-h5/index.html?checkin=1
```

### 步骤 4：验证更新

在支付宝中打开链接，打卡后检查：

1. **浏览器控制台日志**（如果有）应该显示：
   ```
   ✅ SupabaseManager 已加载
   💾 保存到 Supabase...
   ✅ 数据已保存到 Supabase
   ```

2. **查看数据库**：
   打开 http://localhost:9000/admin-today.html
   应该能看到新的打卡记录

---

## 🔧 常见问题

### 问题 1：git push 失败

**错误**：`Permission denied (publickey)`

**解决**：
```bash
# 使用 HTTPS 而不是 SSH
git remote set-url origin https://github.com/faithkaka/checkin-h5.git
git push origin main
```

### 问题 2：404 错误

**错误**：GitHub Pages 显示 404

**解决**：
1. 打开 https://github.com/faithkaka/checkin-h5/settings/pages
2. 确认 Source 设置为 `Deploy from a branch`
3. Branch 设置为 `main`，文件夹设置为 `/ (root)`
4. 保存后等待几分钟

### 问题 3：推送后页面还是旧的

**原因**：浏览器缓存

**解决**：
1. 在支付宝中**清除缓存**
2. 或者在链接后加版本号强制刷新：
   ```
   https://faithkaka.github.io/checkin-h5/index.html?v=20260405&checkin=1
   ```

---

## ✅ 验证清单

推送完成后，请检查：

- [ ] GitHub 仓库显示最新的 commit 时间
- [ ] GitHub Pages 可以访问
- [ ] 在支付宝中打开链接能看到控制台日志
- [ ] 打卡后数据库中有新记录
- [ ] 管理后台 http://localhost:9000/admin-today.html 显示新数据

---

## 🆘 如果还有问题

请提供以下信息：

1. **git push 的输出**
2. **GitHub Pages 的 URL**
3. **支付宝打卡时的截图**
4. **数据库检查结果**（打开 admin-today.html）

---

**最后更新**: 2026-04-05 11:31