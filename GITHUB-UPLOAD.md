# 🚀 上传到 GitHub 指南

## 当前状态

✅ 本地 Git 仓库已初始化
✅ 所有文件已提交（23 个文件，6248 行代码）
✅ 远程仓库已添加：`https://github.com/faithkaka/checkin-h5.git`
⏳ 等待推送到 GitHub

## 🔐 推送方法（选择一种）

### 方法 1: 使用 GitHub Personal Access Token（推荐）

**步骤 1: 创建 Token**

1. 访问：https://github.com/settings/tokens
2. 点击 "Generate new token (classic)"
3. 填写说明（如：checkin-h5 upload）
4. 勾选权限：`repo`（完整控制私有仓库）
5. 点击 "Generate token"
6. **复制 Token**（只显示一次，如：`ghp_xxxxxxxxxxxxxxxx`）

**步骤 2: 配置 Git 凭据**

```bash
# 设置全局用户名和邮箱（如果还没设置）
git config --global user.name "faithkaka"
git config --global user.email "your-email@example.com"

# 使用 Token 推送
cd /Users/kuohai/.homiclaw/workspace/checkin-h5
git push -u origin main
# 当提示输入密码时，粘贴刚才复制的 Token
```

或者直接在 URL 中包含 Token（不推荐，会暴露 Token）：
```bash
git remote set-url origin https://YOUR_TOKEN@github.com/faithkaka/checkin-h5.git
git push -u origin main
```

### 方法 2: 使用 SSH 密钥

**步骤 1: 生成 SSH 密钥**

```bash
ssh-keygen -t ed25519 -C "your-email@example.com"
# 一路回车
```

**步骤 2: 添加 SSH 密钥到 GitHub**

1. 复制公钥：
   ```bash
   cat ~/.ssh/id_ed25519.pub | pbcopy
   ```

2. 访问：https://github.com/settings/keys
3. 点击 "New SSH key"
4. 粘贴公钥，保存

**步骤 3: 切换到 SSH 协议**

```bash
cd /Users/kuohai/.homiclaw/workspace/checkin-h5
git remote set-url origin git@github.com:faithkaka/checkin-h5.git
git push -u origin main
```

### 方法 3: 使用 GitHub Desktop

1. 下载安装：https://desktop.github.com/
2. 登录 GitHub 账号
3. "Add" → "Add Existing Repository"
4. 选择 `/Users/kuohai/.homiclaw/workspace/checkin-h5`
5. 点击 "Push origin"

### 方法 4: 手动上传（最简单）

如果只想快速上传代码：

1. 访问：https://github.com/faithkaka/checkin-h5
2. 如果是空仓库，GitHub 会显示 "uploading an existing file"
3. 点击 "uploading an existing file"
4. 拖拽以下文件到浏览器：
   - index.html
   - css/style.css
   - js/app.js
   - js/supabase-manager.js
   - images/map-bg.png
   - supabase-init.sql
   - README.md
   - 等等...
5. 填写 commit message: "Initial commit"
6. 点击 "Commit changes"

---

## ✅ 完成后的链接

上传成功后，你的项目将在：

- **GitHub 仓库**: https://github.com/faithkaka/checkin-h5
- **GitHub Pages**（可选）: https://faithkaka.github.io/checkin-h5
- **Supabase**: https://ussvekkgyntubivhfext.supabase.co

---

## 📝 快速命令参考

```bash
# 查看当前状态
git status

# 查看提交历史
git log

# 查看远程仓库
git remote -v

# 推送代码
git push -u origin main

# 如果有新变更
git add -A
git commit -m "更新说明"
git push

# 拉取最新代码
git pull
```

---

## 🎨 启用 GitHub Pages（可选）

上传后启用 GitHub Pages 部署：

1. 访问：https://github.com/faithkaka/checkin-h5/settings/pages
2. Source: 选择 `Deploy from a branch`
3. Branch: 选择 `main`，文件夹选 `/ (root)`
4. 点击 "Save"

几分钟后，你的应用将在：
```
https://faithkaka.github.io/checkin-h5
```

访问这个链接即可在手机上测试！

---

## 🔧 故障排查

### 问题：提示密码错误
**解决**: 使用 Personal Access Token，不是 GitHub 登录密码

### 问题：Permission denied
**解决**: 检查 Token 权限或 SSH 密钥是否正确配置

### 问题：找不到仓库
**解决**: 确认仓库地址正确：`https://github.com/faithkaka/checkin-h5.git`

---

**选择一种方法推送代码吧！** 🚀