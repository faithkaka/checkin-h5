// Supabase 配置和用户管理模块
const SupabaseManager = {
  supabaseUrl: 'https://ussvekkgyntubivhfext.supabase.co',
  supabaseKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVzc3Zla2tneW50dWJpdmhmZXh0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTEwODQwMiwiZXhwIjoyMDkwNjg0NDAyfQ.i1fbQC96UGnToKL6fa7GTfaMtt0s_TGpNNR0xb3ufR0',
  supabase: null,
  
  // 当前用户信息
  userId: null,
  alipayUserId: null,
  isAlipay: false,
  
  // 初始化
  init() {
    // 初始化 Supabase 客户端
    if (typeof supabase !== 'undefined') {
      this.supabase = supabase.createClient(this.supabaseUrl, this.supabaseKey);
      console.log('✅ Supabase 客户端初始化完成');
    } else {
      console.error('❌ Supabase JS SDK 未加载');
    }
    
    this.detectAlipay();
    this.getUserId();
    console.log('🔐 支付宝环境:', this.isAlipay ? '是' : '否');
    console.log('👤 用户 ID:', this.userId);
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
    }
  },
  
  // 获取用户 ID
  async getUserId() {
    // 1. 优先从 URL 参数获取
    const urlParams = new URLSearchParams(window.location.search);
    const urlUserId = urlParams.get('userId') || urlParams.get('alipayUserId') || urlParams.get('uid') || urlParams.get('alipay_user_id');
    
    if (urlUserId) {
      this.alipayUserId = urlUserId;
      this.userId = 'u_' + urlUserId;
      await this.syncWithSupabase();
      return;
    }
    
    // 2. 尝试通过支付宝 JSAPI 获取
    if (window.AlipayJSBridge) {
      await this.getAlipayUserId();
    } else {
      // 3. 生成临时用户 ID
      this.userId = 'guest_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      this.saveToLocalStorage();
    }
  },
  
  // 获取支付宝用户 ID
  async getAlipayUserId() {
    const self = this;
    
    return new Promise((resolve) => {
      // 支付宝小程序/生活号
      if (typeof my !== 'undefined' && my.getAuthCode) {
        my.getAuthCode({
          scopes: ['auth_user']
        }, (res) => {
          if (res && res.authCode) {
            self.alipayUserId = 'alipay_' + res.authCode.substr(0, 16);
            self.userId = self.alipayUserId;
            self.syncWithSupabase();
          } else {
            self.userId = 'anonymous_' + Date.now();
            self.saveToLocalStorage();
          }
          resolve();
        });
      } else if (window.AlipayJSBridge && window.AlipayJSBridge.call) {
        // 支付宝 H5
        window.AlipayJSBridge.call('getAuthCode', {
          scopes: ['auth_user']
        }, (res) => {
          if (res && res.authCode) {
            self.alipayUserId = 'alipay_' + res.authCode.substr(0, 16);
            self.userId = self.alipayUserId;
            self.syncWithSupabase();
          } else {
            self.userId = 'anonymous_' + Date.now();
            self.saveToLocalStorage();
          }
          resolve();
        });
      } else {
        self.userId = 'alipay_guest_' + Date.now();
        self.saveToLocalStorage();
        resolve();
      }
    });
  },
  
  // 保存到 localStorage
  saveToLocalStorage() {
    if (this.userId) {
      localStorage.setItem('alipay_user_id', this.userId);
      if (this.alipayUserId) {
        localStorage.setItem('alipay_real_id', this.alipayUserId);
      }
    }
  },
  
  // 与 Supabase 同步用户
  async syncWithSupabase() {
    if (!this.supabase || !this.userId) {
      this.saveToLocalStorage();
      return;
    }
    
    try {
      // 查询用户是否存在
      const { data: existingUser, error: queryError } = await this.supabase
        .from('users')
        .select('*')
        .eq('user_id', this.userId)
        .single();
      
      if (queryError && queryError.code !== 'PGRST116') {
        console.error('查询用户失败:', queryError);
        this.saveToLocalStorage();
        return;
      }
      
      if (!existingUser) {
        // 创建新用户
        const { data: newUser, error: insertError } = await this.supabase
          .from('users')
          .insert({
            user_id: this.userId,
            alipay_user_id: this.alipayUserId,
            points: 0,
            created_at: new Date().toISOString()
          })
          .select()
          .single();
        
        if (insertError) {
          console.error('创建用户失败:', insertError);
        } else {
          console.log('✅ 新用户创建成功:', newUser.user_id);
        }
      } else {
        console.log('✅ 用户已存在:', existingUser.user_id);
        // 从数据库加载用户数据
        await this.loadFromSupabase();
      }
      
      this.saveToLocalStorage();
    } catch (err) {
      console.error('同步用户失败:', err);
      this.saveToLocalStorage();
    }
  },
  
  // 从 Supabase 加载用户数据
  async loadFromSupabase() {
    if (!this.supabase || !this.userId) return;
    
    try {
      // 加载用户基础信息
      const { data: userData, error: userError } = await this.supabase
        .from('users')
        .select('*')
        .eq('user_id', this.userId)
        .single();
      
      if (userError) {
        console.error('加载用户数据失败:', userError);
        return;
      }
      
      if (userData.points !== undefined) {
        AppState.points = userData.points;
      }
      
      // 加载打卡记录
      const { data: checkins, error: checkinError } = await this.supabase
        .from('checkins')
        .select('*')
        .eq('user_id', this.userId);
      
      if (!checkinError && checkins) {
        AppState.checkedCheckpoints = checkins.map(c => c.checkpoint_id);
        
        // 恢复打卡点状态
        checkins.forEach(checkin => {
          const cp = AppState.mandatoryCheckpoints.find(c => c.id === checkin.checkpoint_id);
          if (cp) {
            cp.checked = true;
          }
        });
        
        console.log('✅ 从 Supabase 加载打卡记录:', checkins.length, '个');
      }
      
      console.log('✅ 从 Supabase 加载用户数据完成');
    } catch (err) {
      console.error('从 Supabase 加载失败:', err);
    }
  },
  
  // 保存打卡数据到 Supabase
  async saveCheckinData() {
    if (!this.supabase || !this.userId) {
      return;
    }
    
    try {
      // 更新用户积分
      await this.supabase
        .from('users')
        .upsert({
          user_id: this.userId,
          alipay_user_id: this.alipayUserId,
          points: AppState.points,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });
      
      // 保存/更新打卡记录
      for (const cp of AppState.mandatoryCheckpoints) {
        await this.supabase
          .from('checkins')
          .upsert({
            user_id: this.userId,
            checkpoint_id: cp.id,
            checked: cp.checked,
            points: cp.checked ? cp.points : 0,
            checked_at: cp.checked ? new Date().toISOString() : null
          }, {
            onConflict: 'user_id,checkpoint_id'
          });
      }
      
      console.log('✅ 打卡数据已保存到 Supabase');
    } catch (err) {
      console.error('保存到 Supabase 失败:', err);
      // 降级到 localStorage
      this.saveToLocalStorage();
    }
  },
  
  // 获取用户排名
  async getUserRank() {
    if (!this.supabase || !this.userId) return null;
    
    try {
      const { data, error } = await this.supabase
        .from('users')
        .select('user_id, points')
        .order('points', { ascending: false });
      
      if (error) {
        console.error('获取排名失败:', error);
        return null;
      }
      
      const rank = data.findIndex(u => u.user_id === this.userId) + 1;
      return {
        rank: rank,
        total: data.length,
        points: AppState.points
      };
    } catch (err) {
      console.error('获取排名失败:', err);
      return null;
    }
  }
};

// 导出到全局
window.SupabaseManager = SupabaseManager;