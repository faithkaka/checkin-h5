# 🔧 解决 Git 推送冲突 - 快速指南

## 问题
```
! [rejected] main -> main (non-fast-forward)
hint: Updates were rejected because the tip of your current branch is behind
```

**原因**：远程仓库有你本地没有的提交，需要先合并远程代码。

---

## ✅ 解决步骤

### 步骤 1：切换到 HTTPS 远程地址

```bash
cd /Users/kuohai/.homiclaw/workspace/checkin-h5

# 修改远程仓库地址为 HTTPS
git remote set-url origin https://github.com/faithkaka/checkin-h5.git

# 验证修改
git remote -v
```

应该显示：
```
origin  https://github.com/faithkaka/checkin-h5.git (fetch)
origin  https://github.com/faithkaka/checkin-h5.git (push)
```

---

### 步骤 2：拉取远程代码并合并

```bash
# 拉取远程代码
git pull origin main

# 如果有冲突，Git 会提示
# 解决冲突后：
git add -A
git commit -m "Merge remote changes"
```

---

### 步骤 3：推送代码

```bash
# 推送（正常情况）
git push origin main

# 如果远程代码不重要，可以强制推送（⚠️ 会覆盖远程代码）
# git push -f origin main
```

系统会提示输入：
- **Username**: `faithkaka`
- **Password**: GitHub Personal Access Token

---

## 🎯 一键解决方案

### 如果你想直接覆盖远程代码（远程代码不重要）

```bash
cd /Users/kuohai/.homiclaw/workspace/checkin-h5

# 1. 切换到 HTTPS
git remote set-url origin https://github.com/faithkaka/checkin-h5.git

# 2. 强制推送（⚠️ 会丢失远程代码）
git push -f origin main
```

---

### 如果你想保留远程代码并合并

```bash
cd /Users/kuohai/.homiclaw/workspace/checkin-h5

# 1. 切换到 HTTPS
git remote set-url origin https://github.com/faithkaka/checkin-h5.git

# 2. 拉取远程代码
git pull origin main --allow-unrelated-histories

# 3. 解决冲突（如果有）
# 编辑冲突文件，解决冲突标记

# 4. 提交合并
git add -A
git commit -m "Merge remote with local fixes"

# 5. 推送
git push origin main
```

---

## 🔑 获取 GitHub Token

如果没有 Token：

1. 访问 https://github.com/settings/tokens
2. 点击 **"Generate new token (classic)"**
3. Note: `checkin-h5-deploy`
4. ✅ 勾选 **`repo`** 全选
5. 生成并复制 Token（`ghp_xxxxx`）
6. 推送时粘贴这个 Token

---

## 📊 当前状态

### 本地提交历史
```
c3a0e1b fix: 修复支付宝打卡数据保存问题
3cae1f5 修复：admin-v2.html Promise 链结构
4324374 修复：admin-v2.html 语法错误彻底修复
...
```

### 远程状态
```
❌ 无法访问（SSH 权限问题）
```

---

## ✅ 推送后验证

1. **检查 GitHub**: https://github.com/faithkaka/checkin-h5/commits/main
2. **等待 GitHub Pages 更新**（1-3 分钟）
3. **测试打卡**: https://faithkaka.github.io/checkin-h5/index.html?checkin=1
4. **查看数据**: http://localhost:9000/admin-today.html

---

**更新时间**: 2026-04-05 11:40