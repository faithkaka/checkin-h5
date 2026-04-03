// 支付宝用户管理模块
const AlipayUserManager = {
  userId: null,
  isAlipay: false,
  
  // 初始化
  init() {
    this.detectAlipay();
    this.getUserId();
    console.log('🔐 支付宝环境:', this.isAlipay ? '是' : '否');
    console.log('👤 用户 ID:', this.userId);
    
    // 加载用户数据
    this.loadUserData();
  },
  
  // 检测是否在支付宝环境
  detectAlipay() {
    const ua = navigator.userAgent;
    this.isAlipay = /AlipayClient/i.test(ua) || /alipay/i.test(ua);
    
    // 检查是否有支付宝 JSAPI
    if (window.AlipayJSBridge) {
      this.isAlipay = true;
    }
    
    // 添加标识类到 body
    if (this.isAlipay) {
      document.body.classList.add('alipay-env');
      console.log('✅ 已在 body 添加 alipay-env 类');
    }
  },
  
  // 获取用户 ID
  getUserId() {
    // 优先从 URL 参数获取
    const urlParams = new URLSearchParams(window.location.search);
    const urlUserId = urlParams.get('userId') || urlParams.get('alipayUserId') || urlParams.get('uid');
    
    if (urlUserId) {
      this.userId = 'u_' + urlUserId;
      this.saveUserId();
      console.log('📋 从 URL 获取用户 ID:', this.userId);
      return;
    }
    
    // 从 localStorage 获取
    const storedUserId = localStorage.getItem('alipay_user_id');
    if (storedUserId) {
      this.userId = storedUserId;
      console.log('💾 从 localStorage 获取用户 ID:', this.userId);
      return;
    }
    
    // 尝试通过支付宝 JSAPI 获取
    if (window.AlipayJSBridge) {
      this.getAlipayUserId();
    } else {
      // 生成临时用户 ID
      this.userId = 'guest_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      this.saveUserId();
      console.log('🆔 生成临时用户 ID:', this.userId);
    }
  },
  
  // 通过支付宝 JSAPI 获取用户 ID
  getAlipayUserId() {
    const self = this;
    console.log('🔑 尝试通过支付宝 JSAPI 获取用户 ID...');
    
    // 支付宝小程序/生活号环境
    if (typeof my !== 'undefined' && my.getAuthCode) {
      my.getAuthCode({
        scopes: ['auth_user']
      }, (res) => {
        console.log('📱 my.getAuthCode 响应:', res);
        if (res && res.authCode) {
          self.userId = 'alipay_' + res.authCode.substr(0, 16);
          self.saveUserId();
        } else {
          self.userId = 'alipay_anonymous_' + Date.now();
          self.saveUserId();
        }
      });
    } else if (window.AlipayJSBridge && window.AlipayJSBridge.call) {
      // 支付宝 H5 环境
      window.AlipayJSBridge.call('getAuthCode', {
        scopes: ['auth_user']
      }, (res) => {
        console.log('🌐 AlipayJSBridge 响应:', res);
        if (res && res.authCode) {
          self.userId = 'alipay_' + res.authCode.substr(0, 16);
          self.saveUserId();
        } else {
          self.userId = 'alipay_anonymous_' + Date.now();
          self.saveUserId();
        }
      });
    } else {
      this.userId = 'alipay_guest_' + Date.now();
      this.saveUserId();
    }
  },
  
  // 保存用户 ID
  saveUserId() {
    if (this.userId) {
      localStorage.setItem('alipay_user_id', this.userId);
      console.log('💾 保存用户 ID 到 localStorage');
    }
  },
  
  // 获取用户数据存储键
  getUserDataKey(key) {
    return `alipay_${this.userId || 'guest'}_${key}`;
  },
  
  // 保存用户数据
  saveUserData(key, data) {
    const storageKey = this.getUserDataKey(key);
    localStorage.setItem(storageKey, JSON.stringify(data));
    console.log('💾 保存用户数据:', storageKey);
  },
  
  // 读取用户数据
  getUserData(key) {
    const storageKey = this.getUserDataKey(key);
    const data = localStorage.getItem(storageKey);
    if (data) {
      console.log('📖 读取用户数据:', storageKey);
      return JSON.parse(data);
    }
    return null;
  },
  
  // 加载用户打卡数据
  loadUserData() {
    const savedData = this.getUserData('checkin_data');
    if (savedData) {
      AppState.points = savedData.points || 0;
      AppState.checkedCheckpoints = savedData.checkedCheckpoints || [];
      
      // 恢复打卡点状态
      savedData.checkpoints.forEach(savedCp => {
        const cp = AppState.mandatoryCheckpoints.find(c => c.id === savedCp.id);
        if (cp) {
          cp.checked = savedCp.checked;
        }
      });
      
      console.log('✅ 已加载用户打卡数据');
    }
  },
  
  // 保存用户打卡数据
  saveCheckinData() {
    const checkinData = {
      points: AppState.points,
      checkedCheckpoints: AppState.checkedCheckpoints,
      checkpoints: AppState.mandatoryCheckpoints.map(cp => ({
        id: cp.id,
        checked: cp.checked
      })),
      lastUpdate: Date.now()
    };
    
    this.saveUserData('checkin_data', checkinData);
  },
  
  // 清除用户数据
  clearUserData() {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(`alipay_${this.userId}_`)) {
        localStorage.removeItem(key);
      }
    });
    console.log('🗑️ 已清除用户数据');
  },
  
  // 切换用户（用于测试）
  switchUser(newUserId) {
    this.userId = newUserId;
    this.saveUserId();
    this.loadUserData();
    console.log('🔄 已切换到用户:', newUserId);
  }
};

// 导出到全局
window.AlipayUserManager = AlipayUserManager;