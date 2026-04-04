// SupabaseManager - 支付宝多用户版本
// 所有用户使用同一链接，自动识别不同支付宝账号
const SupabaseManager = {
  supabaseUrl: 'https://ussvekkgyntubivhfext.supabase.co',
  supabaseKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVzc3Zla2tneW50dWJpdmhmZXh0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTEwODQwMiwiZXhwIjoyMDkwNjg0NDAyfQ.i1fbQC96UGnToKL6fa7GTfaMtt0s_TGpNNR0xb3ufR0',
  supabase: null,
  userId: null,
  alipayUserId: null,
  isAlipay: false,
  isReady: false,
  
  // 初始化（异步，带超时保护）
  async init() {
    console.log('🚀 SupabaseManager 初始化...');
    console.log('='.repeat(50));
    
    try {
      // 检查 Supabase SDK 是否加载
      if (typeof supabase !== 'undefined') {
        // 设置超时，防止网络请求卡住
        const initPromise = (async () => {
          this.supabase = supabase.createClient(this.supabaseUrl, this.supabaseKey);
          window.supabaseClient = this.supabase; // 暴露给全局
          console.log('✅ Supabase 客户端创建成功');
          
          this.detectAlipay();
          await this.getUserId();
          this.isReady = true;
          
          console.log('🔐 支付宝环境:', this.isAlipay ? '✅ 是' : '❌ 否');
          console.log('👤 用户 ID:', this.userId);
          console.log('='.repeat(50));
        })();
        
        // 5 秒超时保护
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Supabase 初始化超时')), 5000);
        });
        
        await Promise.race([initPromise, timeoutPromise]);
      } else {
        console.warn('⚠️ Supabase JS SDK 未加载，使用本地存储模式');
        this.isReady = true;
        this.userId = 'local_' + Date.now();
      }
    } catch (error) {
      console.error('❌ Supabase 初始化失败:', error.message);
      console.warn('⚠️ 降级到本地存储模式');
      this.isReady = true;
      this.userId = 'local_' + Date.now();
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
    // 1. 优先从 localStorage 获取缓存的用户 ID
    const storedId = localStorage.getItem('alipay_user_id');
    if (storedId && storedId.startsWith('alipay_')) {
      this.userId = storedId;
      this.alipayUserId = storedId;
      console.log('📦 从缓存恢复用户 ID:', this.userId);
      await this.syncWithSupabase();
      return;
    }
    
    // 2. 在支付宝环境中获取用户 ID
    if (this.isAlipay) {
      await this.getAlipayAuthUserId();
      return;
    }
    
    // 3. 非支付宝环境 - 生成游客 ID
    this.userId = 'guest_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    this.alipayUserId = this.userId;
    this.saveToLocalStorage();
    console.log('👤 生成游客 ID:', this.userId);
  },
  
  // 通过支付宝 JSAPI 获取用户 ID
  async getAlipayAuthUserId() {
    const self = this;
    
    return new Promise((resolve) => {
      // 等待支付宝 JSAPI 就绪
      const waitForJSBridge = () => {
        if (window.AlipayJSBridge && window.AlipayJSBridge.call) {
          callAlipayAPI();
        } else {
          document.addEventListener('AlipayJSBridgeReady', callAlipayAPI, false);
          setTimeout(() => {
            if (!self.userId) {
              console.warn('⚠️ 支付宝 JSAPI 超时，使用备用方案');
              self.userId = 'alipay_anonymous_' + Date.now();
              self.saveToLocalStorage();
              resolve();
            }
          }, 5000);
        }
      };
      
      const callAlipayAPI = () => {
        console.log('🔑 调用支付宝 getAuthCode...');
        
        // 方式 1: 小程序环境
        if (typeof my !== 'undefined' && my.getAuthCode) {
          my.getAuthCode({ scopes: ['auth_user'] }, (res) => {
            self.handleAuthResponse(res, resolve);
          });
          return;
        }
        
        // 方式 2: H5 环境（支付宝内网页）
        if (window.AlipayJSBridge && window.AlipayJSBridge.call) {
          window.AlipayJSBridge.call('getAuthCode', { scopes: ['auth_user'] }, (res) => {
            self.handleAuthResponse(res, resolve);
          });
          return;
        }
        
        // 方式 3: 回退方案
        self.userId = 'alipay_fallback_' + Date.now();
        self.saveToLocalStorage();
        resolve();
      };
      
      waitForJSBridge();
    });
  },
  
  // 处理支付宝授权响应
  handleAuthResponse(res, callback) {
    if (res && res.authCode) {
      // 使用 authCode 作为用户唯一标识
      this.alipayUserId = 'alipay_' + res.authCode;
      this.userId = this.alipayUserId;
      this.saveToLocalStorage();
      console.log('✅ 获取到支付宝用户 ID:', this.userId);
      this.syncWithSupabase();
    } else {
      // 授权失败，使用匿名用户 ID
      this.userId = 'alipay_anonymous_' + Date.now();
      this.saveToLocalStorage();
      console.log('⚠️ 支付宝授权失败，使用匿名 ID:', this.userId);
    }
    callback();
  },
  
  // 保存到 localStorage
  saveToLocalStorage() {
    if (this.userId) {
      localStorage.setItem('alipay_user_id', this.userId);
      localStorage.setItem('alipay_init_time', Date.now().toString());
    }
  },
  
  // 与 Supabase 同步用户
  async syncWithSupabase() {
    if (!this.supabase || !this.userId) {
      return;
    }
    
    try {
      console.log('🔄 同步用户到 Supabase:', this.userId);
      
      // 查询用户是否存在
      const { data: existingUser, error: queryError } = await this.supabase
        .from('users')
        .select('*')
        .eq('alipay_user_id', this.userId)
        .single();
      
      if (queryError && queryError.code !== 'PGRST116') {
        throw queryError;
      }
      
      if (!existingUser) {
        // 创建新用户
        const { data: newUser, error: insertError } = await this.supabase
          .from('users')
          .insert({
            alipay_user_id: this.userId,
            points: 0
          })
          .select()
          .single();
        
        if (insertError) throw insertError;
        console.log('✅ 新用户创建成功:', newUser.alipay_user_id);
      } else {
        console.log('✅ 用户已存在:', existingUser.alipay_user_id);
        // 从数据库加载用户数据
        await this.loadFromSupabase();
      }
    } catch (err) {
      console.error('❌ 同步用户失败:', err.message);
      // 失败时确保有本地 ID
      if (!this.userId) {
        this.userId = 'error_' + Date.now();
        this.saveToLocalStorage();
      }
    }
  },
  
  // 从 Supabase 加载用户数据
  async loadFromSupabase() {
    if (!this.supabase || !this.userId) {
      console.log('⚠️ 无法从 Supabase 加载：缺少 supabase 或 userId');
      return;
    }
    
    try {
      console.log('📥 从 Supabase 加载用户数据...');
      
      // 加载用户积分
      const { data: userData, error: userError } = await this.supabase
        .from('users')
        .select('points')
        .eq('alipay_user_id', this.userId)
        .single();
      
      if (!userError && userData && userData.points !== undefined) {
        // 通过 AppState 更新积分
        if (typeof AppState !== 'undefined') {
          AppState.points = userData.points;
        }
        console.log('✅ 加载用户积分:', userData.points);
      }
      
      // 加载打卡记录
      const { data: checkins, error: checkinError } = await this.supabase
        .from('checkins')
        .select('checkpoint_id, points, checked_at')
        .eq('alipay_user_id', this.userId);
      
      if (!checkinError && checkins && checkins.length > 0) {
        console.log('✅ 加载打卡记录:', checkins.length, '个');
        
        // 恢复打卡点状态
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
      } else {
        console.log('ℹ️ 暂无打卡记录');
      }
      
      console.log('✅ 从 Supabase 加载完成');
    } catch (err) {
      console.error('❌ 从 Supabase 加载失败:', err.message);
    }
  },
  
  // 保存打卡数据到 Supabase
  async saveCheckinData() {
    if (!this.supabase || !this.userId || typeof AppState === 'undefined') {
      console.log('⚠️ 无法保存到 Supabase:', { 
        hasSupabase: !!this.supabase, 
        hasUserId: !!this.userId,
        hasAppState: typeof AppState !== 'undefined'
      });
      return;
    }
    
    try {
      console.log('💾 保存打卡数据到 Supabase...');
      console.log('   用户 ID:', this.userId);
      console.log('   当前积分:', AppState.points);
      
      // 1. 更新用户积分
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
      
      // 2. 保存/更新打卡记录
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
      console.log('💾 保存完成！');
    } catch (err) {
      console.error('❌ 保存到 Supabase 失败:', err.message);
      // 失败时降级到 localStorage
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
      return {
        rank: rank,
        total: data.length,
        points: typeof AppState !== 'undefined' ? AppState.points : 0
      };
    } catch (err) {
      console.error('❌ 获取排名失败:', err.message);
      return null;
    }
  }
};

// 导出到全局
window.SupabaseManager = SupabaseManager;