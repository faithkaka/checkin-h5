// SupabaseManager - 数据同步版本
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
    const ua = navigator.userAgent;
    this.isAlipay = /AlipayClient/i.test(ua) || /alipay/i.test(ua) || !!window.AlipayJSBridge;
    if (this.isAlipay) document.body.classList.add('alipay-env');
    this.getUserId();
    this.initSupabaseAsync();
  },
  
  getUserId() {
    const storedId = localStorage.getItem('alipay_user_id');
    if (storedId) {
      this.userId = storedId;
    } else {
      this.userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('alipay_user_id', this.userId);
    }
    return this.userId;
  },
  
  async initSupabaseAsync() {
    if (typeof supabase === 'undefined') return;
    try {
      this.supabase = supabase.createClient(this.supabaseUrl, this.supabaseKey);
      window.supabaseClient = this.supabase;
      this.isReady = true;
      console.log('✅ Supabase 已就绪');
      await this.ensureUserExists();
    } catch (err) {
      console.error('❌ Supabase 初始化失败:', err.message);
    }
  },
  
  async ensureUserExists() {
    if (!this.supabase || !this.userId) return;
    try {
      const { data, error } = await this.supabase
        .from('users')
        .select('id')
        .eq('alipay_user_id', this.userId)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      if (!data) {
        await this.supabase.from('users').insert({ alipay_user_id: this.userId, points: 0 });
        console.log('✅ 新用户已创建');
      } else {
        await this.loadUserData();
      }
    } catch (err) {
      console.error('⚠️ 确保用户存在失败:', err.message);
    }
  },
  
  async loadUserData() {
    if (!this.supabase || !this.userId) return;
    try {
      const { data } = await this.supabase
        .from('users')
        .select('points')
        .eq('alipay_user_id', this.userId)
        .single();
      if (data && typeof AppState !== 'undefined') {
        AppState.points = data.points || 0;
        console.log('✅ 加载积分:', AppState.points);
      }
    } catch (err) {
      console.error('⚠️ 加载数据失败:', err.message);
    }
  },
  
  // ⭐ 保存打卡数据（立即同步）
  async saveCheckinData() {
    if (typeof AppState === 'undefined') return;
    console.log('💾 保存打卡数据...');
    
    // 保存到 localStorage
    localStorage.setItem('checkin_data', JSON.stringify({
      points: AppState.points,
      checkedCheckpoints: [...AppState.checkedCheckpoints]
    }));
    
    // 同步到 Supabase
    if (!this.supabase || !this.userId) {
      console.warn('⚠️ Supabase 未就绪');
      return;
    }
    
    try {
      // 更新积分
      await this.supabase.from('users').upsert({
        alipay_user_id: this.userId,
        points: AppState.points,
        updated_at: new Date().toISOString()
      }, { onConflict: 'alipay_user_id' });
      
      // 保存打卡记录
      for (const cp of AppState.mandatoryCheckpoints) {
        if (cp.checked) {
          await this.supabase.from('checkins').upsert({
            alipay_user_id: this.userId,
            checkpoint_id: cp.id,
            points: cp.points,
            checked_at: cp.checkedAt || new Date().toISOString()
          }, { onConflict: 'alipay_user_id,checkpoint_id' });
        }
      }
      console.log('✅ 数据已同步到 Supabase');
    } catch (err) {
      console.error('❌ 同步失败:', err.message);
    }
  },
  
  clearUserData() {
    localStorage.removeItem('alipay_user_id');
    this.userId = null;
  }
};

window.SupabaseManager = SupabaseManager;