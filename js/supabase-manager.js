// SupabaseManager - 完整版本（支持删除打卡记录）

const SupabaseManager = {
  supabaseUrl: 'https://ussvekkgyntubivhfext.supabase.co',
  supabaseKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVzc3Zla2tneW50dWJpdmhmZXh0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTEwODQwMiwiZXhwIjoyMDkwNjg0NDAyfQ.i1fbQC96UGnToKL6fa7GTfaMtt0s_TGpNNR0xb3ufR0',
  supabase: null,
  userId: null,
  isReady: false,
  isAlipay: false,
  
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
      console.log('📦 恢复用户 ID:', this.userId);
    } else {
      this.userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('alipay_user_id', this.userId);
      console.log('🆕 生成用户 ID:', this.userId);
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
        .select('id, points')
        .eq('alipay_user_id', this.userId)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      
      if (!data) {
        await this.supabase.from('users').insert({ 
          alipay_user_id: this.userId, 
          points: 0 
        });
        console.log('✅ 新用户已创建');
        await this.restoreLocalData();
      } else {
        if (typeof AppState !== 'undefined' && data.points !== null) {
          AppState.points = data.points;
          console.log('📊 加载积分:', AppState.points);
        }
        await this.loadCheckinRecords();
      }
    } catch (err) {
      console.error('⚠️ 确保用户存在失败:', err.message);
    }
  },
  
  async restoreLocalData() {
    const localData = localStorage.getItem('checkin_data');
    if (!localData) return;
    try {
      const data = JSON.parse(localData);
      if (data.points && typeof AppState !== 'undefined') {
        AppState.points = data.points;
        AppState.checkedCheckpoints = data.checkedCheckpoints || [];
        await this.saveCheckinData();
      }
    } catch (err) {
      console.error('⚠️ 恢复本地数据失败:', err.message);
    }
  },
  
  async loadCheckinRecords() {
    if (!this.supabase || !this.userId) return;
    try {
      const { data: checkins } = await this.supabase
        .from('checkins')
        .select('checkpoint_id, points, checked_at')
        .eq('alipay_user_id', this.userId);
      
      if (checkins && checkins.length > 0 && typeof AppState !== 'undefined') {
        AppState.checkedCheckpoints = checkins.map(c => c.checkpoint_id);
        
        checkins.forEach(record => {
          const cp = AppState.mandatoryCheckpoints?.find(c => c.id === record.checkpoint_id);
          if (cp) {
            cp.checked = true;
            cp.checkedAt = record.checked_at;
          }
        });
        
        console.log('✅ 恢复打卡记录:', AppState.checkedCheckpoints);
        setTimeout(() => {
          PageManager.updateAllDisplays();
          PrizeManager.updatePrizeCards();
        }, 100);
      }
    } catch (err) {
      console.error('⚠️ 加载打卡记录失败:', err.message);
    }
  },
  
  // ⭐ 保存打卡数据（支持打卡和取消打卡）
  async saveCheckinData() {
    if (typeof AppState === 'undefined') return;
    
    console.log('💾 保存打卡数据...');
    
    // 保存到 localStorage
    localStorage.setItem('checkin_data', JSON.stringify({
      points: AppState.points,
      checkedCheckpoints: [...AppState.checkedCheckpoints],
      timestamp: Date.now()
    }));
    
    if (!this.supabase || !this.userId || !this.isReady) {
      console.warn('⚠️ Supabase 未就绪');
      return;
    }
    
    try {
      // 更新用户积分
      await this.supabase.from('users').upsert({
        alipay_user_id: this.userId,
        points: AppState.points,
        updated_at: new Date().toISOString()
      }, { onConflict: 'alipay_user_id' });
      
      // 获取数据库中的所有打卡记录
      const { data: existingCheckins } = await this.supabase
        .from('checkins')
        .select('checkpoint_id')
        .eq('alipay_user_id', this.userId);
      
      const existingIds = existingCheckins ? existingCheckins.map(c => c.checkpoint_id) : [];
      const checkedIds = AppState.checkedCheckpoints;
      
      // 找出需要删除的记录（数据库中有但当前没有的）
      const toDelete = existingIds.filter(id => !checkedIds.includes(id));
      
      // 删除打卡记录
      for (const checkpointId of toDelete) {
        await this.supabase
          .from('checkins')
          .delete()
          .eq('alipay_user_id', this.userId)
          .eq('checkpoint_id', checkpointId);
        console.log('🗑️ 已删除打卡记录:', checkpointId);
      }
      
      // 保存/更新打卡记录
      for (const checkpointId of checkedIds) {
        const cp = AppState.mandatoryCheckpoints.find(c => c.id === checkpointId);
        if (cp) {
          await this.supabase.from('checkins').upsert({
            alipay_user_id: this.userId,
            checkpoint_id: checkpointId,
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