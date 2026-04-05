// SupabaseManager - 支付宝多用户版本 - 优化版（避免"服务正忙"错误）
// 所有用户使用同一链接，自动识别不同支付宝账号

const SupabaseManager = {
  supabaseUrl: 'https://ussvekkgyntubivhfext.supabase.co',
  supabaseKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVzc3Zla2tneW50dWJpdmhmZXh0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTEwODQwMiwiZXhwIjoyMDkwNjg0NDAyfQ.i1fbQC96UGnToKL6fa7GTfaMtt0s_TGpNNR0xb3ufR0',
  supabase: null,
  userId: null,
  alipayUserId: null,
  isAlipay: false,
  isReady: false,
  initCalled: false,
  
  // 初始化（异步，带超时保护）
  async init() {
    if (this.initCalled) {
      console.log('ℹ️ SupabaseManager 已初始化，跳过');
      return;
    }
    this.initCalled = true;
    
    console.log('🚀 SupabaseManager 初始化...');
    
    try {
      if (typeof supabase !== 'undefined') {
        const initPromise = (async () => {
          this.supabase = supabase.createClient(this.supabaseUrl, this.supabaseKey);
          window.supabaseClient = this.supabase;
          console.log('✅ Supabase 客户端创建成功');
          
          this.detectAlipay();
          await this.getUserId();
          this.isReady = true;
          
          console.log('🔐 支付宝环境:', this.isAlipay ? '✅' : '❌');
          console.log('👤 用户 ID:', this.userId);
        })();
        
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Supabase 初始化超时')), 8000);
        });
        
        await Promise.race([initPromise, timeoutPromise]);
      } else {
        console.warn('⚠️ Supabase SDK 未加载，使用本地模式');
        this.isReady = true;
        this.userId = 'user_' + Date.now();
      }
    } catch (error) {
      console.error('❌ Supabase 初始化失败:', error.message);
      this.isReady = true;
      this.userId = 'user_' + Date.now();
    }
  },
  
  // 检测支付宝环境
  detectAlipay() {
    const ua = navigator.userAgent;
    this.isAlipay = /AlipayClient/i.test(ua) || /alipay/i.test(ua);
    
    if (window.AlipayJSBridge) {
      this.isAlipay = true;
    }
    
    if (this.isAlipay) {
      document.body.classList.add('alipay-env');
      console.log('✅ 检测到支付宝环境');
    } else {
      console.log('⚠️ 非支付宝环境，使用游客模式');
    }
  },
  
  // 获取用户 ID（核心逻辑）
  async getUserId() {
    console.log('🔍 开始获取用户 ID...');
    
    // 1. 从 localStorage 恢复
    const storedId = localStorage.getItem('alipay_user_id');
    if (storedId && storedId.startsWith('alipay_')) {
      this.userId = storedId;
      this.alipayUserId = storedId;
      console.log('📦 从缓存恢复用户 ID:', this.userId);
      this.syncWithSupabase();
      return;
    }
    
    // 2. 在支付宝环境中获取
    if (this.isAlipay) {
      const success = await this.getAlipayAuthUserId();
      if (success) return;
    }
    
    // 3. 使用缓存的 ID 或生成新的
    if (storedId) {
      this.userId = storedId;
      this.alipayUserId = storedId;
      console.log('📦 使用保存的 ID:', this.userId);
      this.saveToLocalStorage();
      return;
    }
    
    // 4. 生成新的持久化 ID
    this.userId = 'user_' + this.generateUniqueId();
    this.alipayUserId = this.userId;
    this.saveToLocalStorage();
    console.log('👤 生成新 ID:', this.userId);
  },
  
  // 生成唯一 ID
  generateUniqueId() {
    const ua = navigator.userAgent;
    const lang = navigator.language;
    const screen = screen.width + 'x' + screen.height;
    const time = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    
    const str = ua + lang + screen + time;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    
    return Math.abs(hash).toString(36) + random;
  },
  
  // 通过支付宝 JSAPI 获取用户 ID（优化版 - 避免"服务正忙"错误）
  async getAlipayAuthUserId() {
    const self = this;
    
    return new Promise((resolve) => {
      console.log('🔑 开始获取支付宝用户 ID...');
      
      let hasResolved = false;
      const safeResolve = (value) => {
        if (!hasResolved) {
          hasResolved = true;
          resolve(value);
        }
      };
      
      // 8 秒超时保护
      const timeoutId = setTimeout(() => {
        console.warn('⏰ 获取 AuthCode 超时，使用降级方案');
        self.userId = 'user_' + Date.now();
        self.saveToLocalStorage();
        safeResolve(true);
      }, 8000);
      
      const callAlipayAPI = () => {
        console.log('📱 尝试调用支付宝 API...');
        
        // 方式 1: 小程序环境
        if (typeof my !== 'undefined' && my.getAuthCode) {
          try {
            console.log('📱 使用 my.getAuthCode()');
            my.getAuthCode({ scopes: ['auth_user'] }, (res) => {
              clearTimeout(timeoutId);
              console.log('📥 my.getAuthCode 响应:', res);
              
              if (res && res.authCode) {
                self.alipayUserId = 'alipay_' + res.authCode;
                self.userId = self.alipayUserId;
                self.saveToLocalStorage();
                console.log('✅ 获取到支付宝用户 ID:', self.userId);
                self.syncWithSupabase();
              } else {
                console.warn('⚠️ AuthCode 为空，使用降级方案');
                self.userId = 'user_' + Date.now();
                self.saveToLocalStorage();
              }
              safeResolve(true);
            });
          } catch (err) {
            clearTimeout(timeoutId);
            console.error('❌ my.getAuthCode 异常:', err);
            self.userId = 'user_' + Date.now();
            self.saveToLocalStorage();
            safeResolve(true);
          }
          return;
        }
        
        // 方式 2: H5 环境
        if (window.AlipayJSBridge && AlipayJSBridge.call) {
          try {
            console.log('📱 使用 AlipayJSBridge.call()');
            AlipayJSBridge.call('getAuthCode', { scopes: ['auth_user'] }, (res) => {
              clearTimeout(timeoutId);
              console.log('📥 AlipayJSBridge.call 响应:', res);
              
              if (res && res.authCode) {
                self.alipayUserId = 'alipay_' + res.authCode;
                self.userId = self.alipayUserId;
                self.saveToLocalStorage();
                console.log('✅ 获取到支付宝用户 ID:', self.userId);
                self.syncWithSupabase();
              } else {
                console.warn('⚠️ AuthCode 为空，使用降级方案');
                self.userId = 'user_' + Date.now();
                self.saveToLocalStorage();
              }
              safeResolve(true);
            });
          } catch (err) {
            clearTimeout(timeoutId);
            console.error('❌ AlipayJSBridge.call 异常:', err);
            self.userId = 'user_' + Date.now();
            self.saveToLocalStorage();
            safeResolve(true);
          }
          return;
        }
        
        // 方式 3: 回退方案
        clearTimeout(timeoutId);
        console.warn('⚠️ 支付宝 API 不可用，使用回退方案');
        self.userId = 'user_' + Date.now();
        self.saveToLocalStorage();
        safeResolve(true);
      };
      
      // 等待 JSBridge 就绪
      if (window.AlipayJSBridge && AlipayJSBridge.call) {
        callAlipayAPI();
      } else {
        console.log('⏳ 等待 AlipayJSBridgeReady...');
        document.addEventListener('AlipayJSBridgeReady', callAlipayAPI, false);
        
        setTimeout(() => {
          if (!hasResolved) {
            callAlipayAPI();
          }
        }, 3000);
      }
    });
  },
  
  // 处理支付宝授权响应
  handleAuthResponse(res, callback) {
    if (res && res.authCode) {
      this.alipayUserId = 'alipay_' + res.authCode;
      this.userId = this.alipayUserId;
      this.saveToLocalStorage();
      console.log('✅ 获取到支付宝用户 ID:', this.userId);
      this.syncWithSupabase();
      if (callback) callback(true);
    } else {
      console.warn('⚠️ 支付宝授权响应缺少 authCode:', res);
      this.userId = 'user_' + Date.now();
      this.saveToLocalStorage();
      if (callback) callback(false);
    }
  },
  
  // 保存到 localStorage
  saveToLocalStorage() {
    if (this.userId) {
      localStorage.setItem('alipay_user_id', this.userId);
      localStorage.setItem('alipay_init_time', Date.now().toString());
      console.log('💾 用户 ID 已保存到 localStorage:', this.userId);
    }
  },
  
  // 与 Supabase 同步用户
  async syncWithSupabase() {
    if (!this.supabase || !this.userId) {
      return;
    }
    
    try {
      console.log('🔄 同步用户到 Supabase:', this.userId);
      
      const { data: existingUser, error: queryError } = await this.supabase
        .from('users')
        .select('*')
        .eq('alipay_user_id', this.userId)
        .single();
      
      if (queryError && queryError.code !== 'PGRST116') {
        throw queryError;
      }
      
      if (!existingUser) {
        const { data: newUser, error: insertError } = await this.supabase
          .from('users')
          .insert({ alipay_user_id: this.userId, points: 0 })
          .select()
          .single();
        
        if (insertError) throw insertError;
        console.log('✅ 新用户创建成功:', newUser.alipay_user_id);
      } else {
        console.log('✅ 用户已存在:', existingUser.alipay_user_id);
        await this.loadFromSupabase();
      }
    } catch (err) {
      console.error('❌ 同步用户失败:', err.message);
      if (!this.userId) {
        this.userId = 'user_' + Date.now();
        this.saveToLocalStorage();
      }
    }
  },
  
  // 从 Supabase 加载用户数据
  async loadFromSupabase() {
    if (!this.supabase || !this.userId) {
      console.log('⚠️ 无法从 Supabase 加载');
      return;
    }
    
    try {
      console.log('📥 从 Supabase 加载用户数据...');
      
      const { data: userData, error: userError } = await this.supabase
        .from('users')
        .select('points')
        .eq('alipay_user_id', this.userId)
        .single();
      
      if (!userError && userData && userData.points !== undefined) {
        if (typeof AppState !== 'undefined') {
          AppState.points = userData.points;
        }
        console.log('✅ 加载用户积分:', userData.points);
      }
      
      const { data: checkins, error: checkinError } = await this.supabase
        .from('checkins')
        .select('checkpoint_id, points, checked_at')
        .eq('alipay_user_id', this.userId);
      
      if (!checkinError && checkins && checkins.length > 0) {
        console.log('✅ 加载打卡记录:', checkins.length, '个');
        
        if (typeof AppState !== 'undefined' && AppState.mandatoryCheckpoints) {
          AppState.checkedCheckpoints = checkins.map(c => c.checkpoint_id);
          
          checkins.forEach(checkin => {
            const cp = AppState.mandatoryCheckpoints.find(c => c.id === checkin.checkpoint_id);
            if (cp) {
              cp.checked = true;
              cp.points = checkin.points || cp.points;
              cp.checkedAt = checkin.checked_at;
            }
          });
          
          console.log('✅ 恢复打卡点状态:', AppState.checkedCheckpoints);
        }
      }
      
      console.log('✅ 从 Supabase 加载完成');
    } catch (err) {
      console.error('❌ 从 Supabase 加载失败:', err.message);
    }
  },
  
  // 保存打卡数据到 Supabase
  async saveCheckinData() {
    if (!this.supabase || !this.userId || typeof AppState === 'undefined') {
      console.log('⚠️ 无法保存到 Supabase');
      return;
    }
    
    try {
      console.log('💾 保存打卡数据到 Supabase...');
      
      const { error: userError } = await this.supabase
        .from('users')
        .upsert({
          alipay_user_id: this.userId,
          points: AppState.points,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'alipay_user_id'
        });
      
      if (userError) throw userError;
      console.log('✅ 用户积分已更新');
      
      let savedCount = 0;
      for (const cp of AppState.mandatoryCheckpoints) {
        if (cp.checked) {
          const { error: checkinError } = await this.supabase
            .from('checkins')
            .upsert({
              alipay_user_id: this.userId,
              checkpoint_id: cp.id,
              points: cp.points,
              checked_at: cp.checkedAt || new Date().toISOString()
            }, {
              onConflict: 'alipay_user_id,checkpoint_id'
            });
          
          if (!checkinError) {
            savedCount++;
          }
        }
      }
      
      console.log('✅ 打卡记录已保存:', savedCount, '个');
    } catch (err) {
      console.error('❌ 保存到 Supabase 失败:', err.message);
      this.saveToLocalStorage();
    }
  },
  
  // 清除用户数据（用于测试）
  clearUserData() {
    localStorage.removeItem('alipay_user_id');
    localStorage.removeItem('alipay_init_time');
    this.userId = null;
    this.alipayUserId = null;
    console.log('🗑️ 用户数据已清除');
  },
  
  // 获取用户排名
  async getUserRank() {
    if (!this.supabase || !this.userId) return null;
    
    try {
      const { data, error } = await this.supabase
        .from('users')
        .select('alipay_user_id, points')
        .order('points', { ascending: false });
      
      if (error) throw error;
      
      const rank = data.findIndex(u => u.alipay_user_id === this.userId) + 1;
      return { rank, total: data.length, points: AppState?.points || 0 };
    } catch (err) {
      console.error('❌ 获取排名失败:', err.message);
      return null;
    }
  }
};

// 导出到全局
window.SupabaseManager = SupabaseManager;