# 🔧 修复支付宝"服务正忙"错误

## 问题分析

支付宝显示"服务正忙，请稍后再试"的官方错误弹窗，原因通常是：

1. **Supabase API 调用失败** - 支付宝环境访问外部 API 被限制
2. **CORS 配置问题** - Supabase 未正确配置允许的域名
3. **网络超时** - 支付宝 H5 环境网络不稳定
4. **JSAPI 调用失败** - getAuthCode 调用出错

---

## ✅ 解决方案

### 方案 1: 优化错误处理（立即生效）

修改代码，避免触发支付宝官方错误弹窗，改用自定义提示。

#### 修改 supabase-manager.js

在初始化时添加更友好的错误处理：

```javascript
// 在 getAlipayAuthUserId 方法中
async getAlipayAuthUserId() {
  const self = this;
  
  return new Promise((resolve) => {
    console.log('🔑 开始获取支付宝用户 ID...');
    
    const timeoutId = setTimeout(() => {
      console.warn('⏰ 获取 AuthCode 超时，使用降级方案');
      self.userId = 'user_alipay_' + Date.now();
      self.saveToLocalStorage();
      resolve(true);
    }, 8000); // 8 秒超时
    
    const callAlipayAPI = () => {
      console.log('📱 调用支付宝 getAuthCode...');
      
      // 方式 1: 小程序环境
      if (typeof my !== 'undefined' && my.getAuthCode) {
        try {
          my.getAuthCode({ 
            scopes: ['auth_user'] 
          }, (res) => {
            clearTimeout(timeoutId);
            console.log('📥 my.getAuthCode 响应:', res);
            
            if (res && res.authCode) {
              self.alipayUserId = 'alipay_' + res.authCode;
              self.userId = self.alipayUserId;
              self.saveToLocalStorage();
              console.log('✅ 获取到支付宝用户 ID:', self.userId);
              self.syncWithSupabase();
              resolve(true);
            } else {
              console.warn('⚠️ AuthCode 为空，使用降级方案');
              self.userId = 'user_alipay_' + Date.now();
              self.saveToLocalStorage();
              resolve(true);
            }
          });
        } catch (err) {
          clearTimeout(timeoutId);
          console.error('❌ my.getAuthCode 异常:', err);
          self.userId = 'user_alipay_' + Date.now();
          self.saveToLocalStorage();
          resolve(true);
        }
        return;
      }
      
      // 方式 2: H5 环境
      if (window.AlipayJSBridge && AlipayJSBridge.call) {
        try {
          AlipayJSBridge.call('getAuthCode', { scopes: ['auth_user'] }, (res) => {
            clearTimeout(timeoutId);
            console.log('📥 AlipayJSBridge.call 响应:', res);
            
            if (res && res.authCode) {
              self.alipayUserId = 'alipay_' + res.authCode;
              self.userId = self.alipayUserId;
              self.saveToLocalStorage();
              console.log('✅ 获取到支付宝用户 ID:', self.userId);
              self.syncWithSupabase();
              resolve(true);
            } else {
              console.warn('⚠️ AuthCode 为空，使用降级方案');
              self.userId = 'user_alipay_' + Date.now();
              self.saveToLocalStorage();
              resolve(true);
            }
          });
        } catch (err) {
          clearTimeout(timeoutId);
          console.error('❌ AlipayJSBridge.call 异常:', err);
          self.userId = 'user_alipay_' + Date.now();
          self.saveToLocalStorage();
          resolve(true);
        }
        return;
      }
      
      // 方式 3: 回退方案
      clearTimeout(timeoutId);
      console.warn('⚠️ 支付宝 API 不可用，使用回退方案');
      self.userId = 'user_alipay_' + Date.now();
      self.saveToLocalStorage();
      resolve(true);
    };
    
    // 等待 JSBridge 就绪
    if (window.AlipayJSBridge && AlipayJSBridge.call) {
      callAlipayAPI();
    } else {
      document.addEventListener('AlipayJSBridgeReady', callAlipayAPI, false);
    }
  });
}
```

---

### 方案 2: 优化打卡保存逻辑

修改 app.js，在保存打卡数据时添加错误处理：

```javascript
// 在 handleCheckinFromURL 方法中
async handleCheckinFromURL() {
  const urlParams = new URLSearchParams(window.location.search);
  const checkinId = urlParams.get('checkin');
  
  if (!checkinId) return;
  
  const checkpointIndex = parseInt(checkinId) - 1;
  if (checkpointIndex < 0 || checkpointIndex >= AppState.mandatoryCheckpoints.length) {
    console.log('⚠️ 无效的打卡点 ID:', checkinId);
    return;
  }
  
  const checkpoint = AppState.mandatoryCheckpoints[checkpointIndex];
  console.log('🎯 处理打卡请求 - 点位:', checkpoint.name);
  
  try {
    // 检查是否已打卡
    if (checkpoint.checked) {
      setTimeout(() => {
        this.showToast('ℹ️ 您已完成此点位的打卡', 'info');
      }, 500);
      return;
    }
    
    // 执行打卡
    checkpoint.checked = true;
    checkpoint.checkedAt = new Date().toISOString();
    AppState.checkedCheckpoints.push(checkpoint.id);
    AppState.points += checkpoint.points;
    
    // 更新显示
    PageManager.updateAllDisplays();
    this.renderMap();
    PrizeManager.checkNewAchievements();
    
    // 保存到 Supabase（带超时）
    const savePromise = (async () => {
      if (window.SupabaseManager && window.SupabaseManager.isReady) {
        console.log('💾 保存到 Supabase...');
        try {
          await Promise.race([
            SupabaseManager.saveCheckinData(),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('保存超时')), 10000)
            )
          ]);
          console.log('✅ 数据已保存到 Supabase');
        } catch (saveError) {
          console.error('❌ 保存失败:', saveError);
          // 降级到本地存储
          localStorage.setItem('checkin_data', JSON.stringify({
            points: AppState.points,
            checkedCheckpoints: AppState.checkedCheckpoints
          }));
          console.log('✅ 数据已保存到本地');
        }
      }
    })();
    
    // 显示成功提示（不等待保存完成）
    setTimeout(() => {
      this.showCheckinSuccess(checkpoint);
    }, 800);
    
  } catch (error) {
    console.error('❌ 打卡处理失败:', error);
    setTimeout(() => {
      this.showToast('⚠️ 打卡失败，请重试', 'error');
    }, 500);
  }
}

// 添加友好的提示方法
showToast(message, type = 'success') {
  const colors = {
    success: 'linear-gradient(135deg, #10b981, #059669)',
    error: 'linear-gradient(135deg, #ef4444, #dc2626)',
    info: 'linear-gradient(135deg, #667eea, #764ba2)'
  };
  
  const icons = {
    success: '✅',
    error: '⚠️',
    info: 'ℹ️'
  };
  
  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: ${colors[type]};
    color: white;
    padding: 20px 30px;
    border-radius: 16px;
    text-align: center;
    z-index: 10000;
    box-shadow: 0 8px 32px rgba(0,0,0,0.2);
    font-size: 15px;
    font-weight: 500;
    animation: toastIn 0.3s ease;
    max-width: 280px;
  `;
  toast.innerHTML = `<div style="font-size: 24px; margin-bottom: 8px;">${icons[type]}</div><div>${message}</div>`;
  
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s';
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}

// 在 head 中添加动画样式
const style = document.createElement('style');
style.textContent = `
  @keyframes toastIn {
    from { opacity: 0; transform: translate(-50%, -60%); }
    to { opacity: 1; transform: translate(-50%, -50%); }
  }
`;
document.head.appendChild(style);
```

---

### 方案 3: 配置 Supabase CORS

1. 访问 Supabase Dashboard: https://ussvekkgyntubivhfext.supabase.co/project

2. 进入 API 设置
   - 左侧菜单：Settings → API
   - 找到 "HTTP Cache" 和 "Max Connections"

3. 或者在数据库层面配置：
   ```sql
   -- 在 SQL Editor 中执行
   ALTER DATABASE postgres SET "app.settings.cors_origins" = '*';
   ```

4. 如果使用自定义域名，需要在 Supabase 中添加

---

### 方案 4: 简化初始化流程

减少页面加载时的 API 调用，改为按需加载：

```javascript
// 修改初始化逻辑
document.addEventListener('DOMContentLoaded', async () => {
  console.log('🚀 开始初始化...');
  
  // 1. 等待 SupabaseManager 加载
  let waitForManager = 0;
  while (!window.SupabaseManager && waitForManager < 50) {
    await new Promise(resolve => setTimeout(resolve, 100));
    waitForManager++;
  }
  
  if (window.SupabaseManager) {
    // 只初始化，不等待同步完成
    if (!window.SupabaseManager.isReady) {
      window.SupabaseManager.init().catch(err => {
        console.error('❌ SupabaseManager 初始化失败:', err);
      });
    }
    AppState.userId = window.SupabaseManager.userId;
    console.log('👤 用户 ID:', AppState.userId);
  }
  
  // 2. 其他初始化...
  PageManager.init();
  CheckpointManager.init();
  PrizeManager.init();
  ShareManager.init();
  
  // 3. 处理 URL 打卡
  await CheckpointManager.handleCheckinFromURL();
  
  // 4. 延迟加载用户数据（不阻塞页面）
  setTimeout(async () => {
    if (window.SupabaseManager && window.SupabaseManager.isReady) {
      try {
        await window.SupabaseManager.loadFromSupabase();
      } catch (err) {
        console.error('❌ 加载用户数据失败:', err);
      }
    }
  }, 1000);
  
  console.log('🎉 初始化完成！');
});
```

---

## 🧪 测试步骤

### 1. 在支付宝中测试

1. 打开 GitHub Pages 链接
2. 应该能看到页面正常加载
3. 点击打卡，应该看到自定义的成功提示
4. 不应该出现"服务正忙"的官方弹窗

### 2. 查看控制台日志

如果能看到控制台，应该看到：
```
🚀 开始初始化...
👤 用户 ID: user_alipay_xxx
🎯 处理打卡请求
✅ 数据已保存到本地
```

### 3. 验证数据

访问管理后台：
```
http://localhost:9000/admin-today.html
```

查看是否有新的打卡记录。

---

## ⚠️ 注意事项

1. **不要频繁刷新** - 可能被支付宝风控
2. **等待几秒再试** - 如果是网络问题
3. **清除支付宝缓存** - 设置 → 通用 → 存储空间

---

**更新时间**: 2026-04-05 11:48