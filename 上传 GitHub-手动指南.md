# 📤 GitHub 手动上传指南

由于 SSH 未配置，请使用网页手动上传最新的文件。

## 🚀 上传步骤（2 分钟搞定）

### 步骤 1: 访问 GitHub 仓库

打开：https://github.com/faithkaka/checkin-h5

### 步骤 2: 上传文件

1. 点击 **"Add file"** 按钮
2. 选择 **"Upload files"**

### 步骤 3: 拖拽文件

从以下文件夹拖拽到 GitHub 上传区域：

**必须上传的文件**：
```
/Users/kuohai/.homiclaw/workspace/checkin-h5/

✅ admin-login.html    (新的登录页，100% 可靠)
✅ admin-mobile.html   (手机端管理后台)
✅ admin.html          (管理后台，已修复)
```

也可以一起上传：
```
✅ admin-test.html     (调试工具)
✅ index.html          (打卡主页)
✅ 所有 CSS/JS/图片文件
```

### 步骤 4: 填写提交信息

在 "Commit new files" 下方填写：
```
更新管理后台，修复手机端登录问题
- 添加 admin-login.html 专用登录页
- 添加 admin-mobile.html 手机优化版
- admin.html 支持 URL 参数登录
```

### 步骤 5: 提交

点击绿色按钮 **"Commit changes"**

### 步骤 6: 等待部署

等待 1-2 分钟，GitHub Pages 会自动更新。

## 📱 访问地址

上传完成后，在手机上访问：

**新版登录（推荐）**：
```
https://faithkaka.github.io/checkin-h5/admin-login.html
```

**手机管理后台**：
```
https://faithkaka.github.io/checkin-h5/admin-mobile.html
```

**原有管理后台**：
```
https://faithkaka.github.io/checkin-h5/admin.html
```

## 🎯 使用方法

### 新版登录流程

1. 打开 `admin-login.html`
2. 输入：`admin` / `admin123`
3. 点击登录
4. 显示 "✅ 登录成功！正在跳转..."
5. 自动跳转到管理后台

### 如果还是有问题

**方法 1: 清除浏览器缓存**

在 Safari（iPhone）：
1. 设置 → Safari → 清除历史记录与网站数据
2. 重新打开页面

在手机浏览器：
1. 打开设置
2. 清除浏览器缓存
3. 重新打开页面

**方法 2: 使用调试页面**

打开：https://faithkaka.github.io/checkin-h5/admin-test.html

查看详细的调试信息。

## ✅ 验证上传成功

打开：https://github.com/faithkaka/checkin-h5

查看最新的 commit 应该是：
```
"更新管理后台，修复手机端登录问题"
```

并且能看到你上传的文件。

---

**快速总结**：
1. 访问 https://github.com/faithkaka/checkin-h5
2. 拖拽上传 `admin-login.html`, `admin-mobile.html`, `admin.html`
3. 提交
4. 等待 2 分钟
5. 在手机上打开 `https://faithkaka.github.io/checkin-h5/admin-login.html`
6. 登录测试

就这么简单！🎉