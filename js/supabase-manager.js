// SupabaseManager - 用户持久化版本
// 关键：正确从 localStorage 恢复用户 ID，确保同一用户每次打开都是相同的 ID

const SupabaseManager = {
  supabaseUrl: 'https://ussvekkgyntubivhfext.supabase.co',
  supabaseKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVzc3Zla2tneW50dWJpdmhmZXh0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTEwODQwMiwiZXhwIjoyMDkwNjg0NDAyfQ.i1fbQC96UGnToKL6fa7GTfaMtt0s_TGpNNR0xb3ufR0',
  supabase: null,
  userId: null,
  isReady: false,
  isAlipay: false,
  
  // 初始化
  init() {
    console.log('🚀 SupabaseManager 初始化');
    
    // 1. 检测支付宝环境
    const ua = navigator.userAgent;
    this.isAlipay = /AlipayClient/i.test(ua) || /alipay/i.test(ua) || !!window.AlipayJSBridge;
    
    if (this.isAlipay) {
      document.body.classList.add('alipay-env');
      console.log('✅ 检测到支付宝环境');
    }
    
    // 2. 获取用户 ID（关键：优先从 localStorage 恢复）
    this.getUserId();
    
    // 3. 异步初始化 Supabase
    this.initSupabaseAsync();
    
    console.log('✅ SupabaseManager 初始化完成');
    console.log('👤 用户 ID:', this.userId);
  },
  
  // ⭐ 获取用户 ID - 核心逻辑
  getUserId() {
    console.log('🔍 开始获取用户 ID...');
    
    // 步骤 1: 从 localStorage 读取已保存的用户 ID
    const storedId = localStorage.getItem('alipay_user_id');
    
    if (storedId) {
      this.userId = storedId;
      console.log('📦 从 localStorage 恢复用户 ID:', this.userId);
      return this.userId;
    }
    
    // 步骤 2: 如果没有已保存的 ID，生成一个新的
    // 格式：user_时间戳_随机数
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substr(2, 9);
    this.userId = 'user_' + timestamp + '_' + randomStr;
    
    // 步骤 3: 立即保存到 localStorage
    localStorage.setItem('alipay_user_id', this.userId);
    console.log('🆕 生成新用户 ID:', this.userId);
    
    return this.userId;
  },
  
  // 异步初始化 Supabase 客户端
  async initSupabaseAsync() {
    if (typeof supabase === 'undefined') {
      console.warn('⚠️ Supabase SDK 未加载');
      return;
    }
    
    try {
      console.log('⏳ 初始化 Supabase 客户端...');
      this.supabase = supabase.createClient(this.supabaseUrl, this.supabaseKey);
      window.supabaseClient = this.supabase;
      this.isReady = true;
      console.log('✅ Supabase 已就绪');
      
      // 确保用户存在并加载数据
      await this.ensureUserExists();
    } catch (err) {
      console.error('❌ Supabase 初始化失败:', err.message);
      this.isReady = false;
    }
  },
  
  // 确保用户存在
  async ensureUserExists() {
    if (!this.supabase || !this.userId) {
      console.warn('⚠️ Supabase 或 userId 未就绪');
      return;
    }
    
    try {
      console.log('🔄 查询/创建用户:', this.userId);
      
      // 查询用户是否存在
      const { data: existingUser, error: queryError } = await this.supabase
        .from('users')
        .select('id, points')
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
            points: 0,
            created_at: new Date().toISOString()
          })
          .select('id, points')
          .single();
        
        if (insertError) throw insertError;
        console.log('✅ 新用户创建成功');
        
        // 如果有本地保存的数据，恢复它
        await this.restoreLocalData();
      } else {
        console.log('✅ 用户已存在');
        // 从数据库加载用户数据
        if (typeof AppState !== 'undefined' && existingUser.points !== null) {
          AppState.points = existingUser.points;
          console.log('📊 加载用户积分:', AppState.points);
        }
        
        // 加载打卡记录
        await this.loadCheckinRecords();
      }
    } catch (err) {
      console.error('❌ 确保用户存在失败:', err.message);
      // 即使失败，用户 ID 仍然有效，只是数据保存在本地
    }
  },
  
  // 从本地恢复打卡数据
  async restoreLocalData() {
    const localData = localStorage.getItem('checkin_data');
    if (!localData) return;
    
    try {
      const data = JSON.parse(localData);
      console.log('📦 发现本地打卡数据:', data);
      
      // 如果有本地积分，保存到数据库
      if (data.points && typeof AppState !== 'undefined') {
        AppState.points = data.points;
        await this.saveCheckinData();
        console.log('✅ 本地数据已同步到数据库');
      }
    } catch (err) {
      console.error('⚠️ 恢复本地数据失败:', err.message);
    }
  },
  
  // 加载打卡记录
  async loadCheckinRecords() {
    if (!this.supabase || !this.userId) return;
    
    try {
      const { data: checkins, error } = await this.supabase
        .from('checkins')
        .select('checkpoint_id, points, checked_at')
        .eq('alipay_user_id', this.userId);
      
      if (error) throw error;
      
      if (checkins && checkins.length > 0 && typeof AppState !== 'undefined') {
        // 恢复打卡点状态
        AppState.checkedCheckpoints = checkins.map(c => c.checkpoint_id);
        
        checkins.forEach(record => {
          const cp = AppState.mandatoryCheckpoints?.find(c => c.id === record.checkpoint_id);
          if (cp) {
            cp.checked = true;
            cp.checkedAt = record.checked_at;
          }
        });
        
        console.log('✅ 恢复打卡记录:', AppState.checkedCheckpoints);
        
        // 更新显示
        setTimeout(() => {
          PageManager.updateAllDisplays();
          PrizeManager.updatePrizeCards();
        }, 100);
      }
    } catch (err) {
      console.error('⚠️ 加载打卡记录失败:', err.message);
    }
  },
  
  // ⭐ 保存打卡数据（立即同步到 Supabase）
  async saveCheckinData() {
    if (typeof AppState === 'undefined') {
      console.error('❌ AppState 未定义');
      return;
    }
    
    console.log('💾 保存打卡数据...');
    
    // 步骤 1: 立即保存到 localStorage（兜底）
    const checkinData = {
      points: AppState.points,
      checkedCheckpoints: [...AppState.checkedCheckpoints],
      timestamp: Date.now()
    };
    localStorage.setItem('checkin_data', JSON.stringify(checkinData));
    console.log('✅ 数据已保存到 localStorage');
    
    // 步骤 2: 同步到 Supabase（如果就绪）
    if (!this.supabase || !this.userId || !this.isReady) {
      console.warn('⚠️ Supabase 未就绪，仅保存到本地');
      return;
    }
    
    try {
      console.log('🔄 同步到 Supabase...');
      
      // 更新用户积分
      const { error: userError } = await this.supabase
        .from('users')
        .upsert({
          alipay_user_id: this.userId,
          points: AppState.points,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'alipay_user_id'
        });
      
      if (userError) {
        console.error('❌ 更新积分失败:', userError);
        throw userError;
      }
      console.log('✅ 用户积分已更新:', AppState.points);
      
      // 保存打卡记录
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
      
      console.log(`✅ 已保存 ${savedCount} 条打卡记录到 Supabase`);
      
    } catch (err) {
      console.error('❌ 同步到 Supabase 失败:', err.message);
      // 数据已在 localStorage 中，不会丢失
    }
  },
  
  // 清除用户数据（测试用）
  clearUserData() {
    localStorage.removeItem('alipay_user_id');
    localStorage.removeItem('checkin_data');
    this.userId = null;
    console.log('🗑️ 用户数据已清除');
  }
};

window.SupabaseManager = SupabaseManager;