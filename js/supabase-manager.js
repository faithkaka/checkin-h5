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
      // 1. 先加载用户积分
      const { data: userData } = await this.supabase
        .from('users')
        .select('points')
        .eq('alipay_user_id', this.userId)
        .single();
      
      if (userData && typeof AppState !== 'undefined') {
        AppState.points = userData.points || 0;
        console.log('📊 从云端加载积分:', AppState.points);
      }
      
      // 2. 加载打卡记录
      const { data: checkins } = await this.supabase
        .from('checkins')
        .select('checkpoint_id, points, checked_at')
        .eq('alipay_user_id', this.userId);
      
      if (checkins && checkins.length > 0) {
        AppState.checkedCheckpoints = checkins.map(c => c.checkpoint_id);
        
        // 3. 确保打卡点状态同步（关键修复）
        AppState.mandatoryCheckpoints.forEach(cp => {
          cp.checked = AppState.checkedCheckpoints.includes(cp.id);
        });
        
        console.log('✅ 从云端恢复打卡记录:', AppState.checkedCheckpoints);
        
        // 4. 立即同步数据并快速刷新显示（优化体验）
      // 立即同步 mandatoryCheckpoints 数组
      AppState.mandatoryCheckpoints.forEach(cp => {
        cp.checked = AppState.checkedCheckpoints.includes(cp.id);
      });
      
      // ✅ 关键修复：从积分强制推断成就状态
      console.log('🏆 从积分推断成就状态，当前积分:', AppState.points);
      AppState.achievements.forEach(achievement => {
        const shouldBeAchieved = AppState.points >= achievement.requiredPoints;
        if (shouldBeAchieved) {
          achievement.achieved = true;
          console.log(`✅ 成就已达成：${achievement.name} (${AppState.points} >= ${achievement.requiredPoints})`);
        } else {
          achievement.achieved = false;
        }
      });
      
      console.log('🔄 快速刷新页面显示，打卡点数:', AppState.checkedCheckpoints.length);
      
      // 第一阶段：立即更新数据模型（0ms）
      // 这一步确保数据已经同步
      
      // 第二阶段：快速渲染（50ms）- 优化体验的关键
      setTimeout(() => {
        // 更新积分显示
        if (typeof PageManager !== 'undefined') {
          PageManager.updateAllDisplays();
        }
        
        // 强制更新首页地图标记状态（不重新渲染整个地图，只更新状态）
        const mapWrapper = document.getElementById('checkin-map');
        if (mapWrapper) {
          const markers = mapWrapper.querySelectorAll('.checkpoint-marker');
          if (markers && markers.length > 0) {
            // 地图已存在，只更新标记状态（更快）
            markers.forEach((marker, index) => {
              if (index < AppState.mandatoryCheckpoints.length) {
                const cp = AppState.mandatoryCheckpoints[index];
                marker.className = `checkpoint-marker ${cp.checked ? 'checked' : ''}`;
                marker.textContent = cp.checked ? '✅' : cp.icon;
              }
            });
            console.log('⚡ 快速更新地图标记状态');
          } else {
            // 地图还未渲染，需要重新渲染
            if (typeof CheckpointManager !== 'undefined') {
              CheckpointManager.renderMap();
              console.log('🗺️ 重新渲染首页地图');
            }
          }
        }
      }, 50);
      
      // 第三阶段：完整渲染（150ms）- 确保其他组件也更新
      setTimeout(() => {
        console.log('🔄 第三阶段：更新奖品和点位...');
        console.log('📊 当前成就状态:', AppState.achievements.map(a => ({ name: a.name, achieved: a.achieved })));
        
        // ✅ 关键修复：重新检查成就并生成兑奖券
        if (typeof PrizeManager !== 'undefined') {
          // 先检查新成就（会自动生成 vouchers）
          console.log('🔍 检查新成就...');
          PrizeManager.checkNewAchievements();
          
          console.log('🎫 checkNewAchievements 后 vouchers 数量:', AppState.vouchers.length);
          
          // 如果 vouchers 还是空的，手动从已达成成就生成
          if (AppState.vouchers.length === 0) {
            console.log('⚠️ vouchers 为空，手动生成...');
            AppState.achievements.forEach(achievement => {
              console.log(`  - 检查成就：${achievement.name}, achieved: ${achievement.achieved}`);
              if (achievement.achieved) {
                const exists = AppState.vouchers.find(v => v.stage === achievement.stage);
                if (!exists) {
                  AppState.vouchers.push({
                    stage: achievement.stage,
                    name: achievement.name,
                    achievedAt: Date.now(),
                    redeemed: achievement.redeemed || false
                  });
                  console.log(`  ✅ 添加兑奖券：${achievement.name}`);
                }
              }
            });
            console.log('🎫 手动生成后 vouchers 数量:', AppState.vouchers.length);
          }
          
          console.log('🎫 最终兑奖券列表:', AppState.vouchers.map(v => v.name));
        }
        
        // 更新奖品页面
        if (typeof PrizeManager !== 'undefined') {
          console.log('🏆 更新奖品卡片和兑奖券列表...');
          PrizeManager.updatePrizeCards();
          PrizeManager.updateVoucherList();
        }
        
        // 更新点位列表
        const mandatoryContainer = document.getElementById('mandatory-checkpoints');
        if (mandatoryContainer && typeof CheckpointManager !== 'undefined') {
          CheckpointManager.renderCheckpointList();
          console.log('📍 更新点位列表');
        }
      }, 150);
      } else {
        console.log('ℹ️ 该用户还没有打卡记录');
        this.loadFromLocalStorage();
      }
    } catch (err) {
      console.error('❌ 加载云端数据失败:', err.message);
      this.loadFromLocalStorage();
    }
  },
  
  loadFromLocalStorage() {
    const localData = localStorage.getItem('checkin_data');
    if (localData && typeof AppState !== 'undefined') {
      try {
        const data = JSON.parse(localData);
        AppState.points = data.points || 0;
        AppState.checkedCheckpoints = data.checkedCheckpoints || [];
        
        // 立即同步打卡点状态
        AppState.mandatoryCheckpoints.forEach(cp => {
          cp.checked = AppState.checkedCheckpoints.includes(cp.id);
        });
        
        console.log('💾 从本地缓存加载数据，打卡点数:', AppState.checkedCheckpoints.length);
        
        // ✅ 关键修复：从积分强制推断成就状态
        console.log('🏆 从积分推断成就状态（本地缓存），当前积分:', AppState.points);
        AppState.achievements.forEach(achievement => {
          const shouldBeAchieved = AppState.points >= achievement.requiredPoints;
          if (shouldBeAchieved) {
            achievement.achieved = true;
            console.log(`✅ 成就已达成：${achievement.name} (${AppState.points} >= ${achievement.requiredPoints})`);
          } else {
            achievement.achieved = false;
          }
        });
        
        // 优化体验：分级渲染
        // 第一阶段：立即更新数据（0ms）
        
        // 第二阶段：快速更新地图（50ms）
        setTimeout(() => {
          if (typeof PageManager !== 'undefined') PageManager.updateAllDisplays();
          
          // 只更新已存在的地图标记，不重新渲染整个地图
          const mapWrapper = document.getElementById('checkin-map');
          if (mapWrapper) {
            const markers = mapWrapper.querySelectorAll('.checkpoint-marker');
            if (markers && markers.length > 0) {
              markers.forEach((marker, index) => {
                if (index < AppState.mandatoryCheckpoints.length) {
                  const cp = AppState.mandatoryCheckpoints[index];
                  marker.className = `checkpoint-marker ${cp.checked ? 'checked' : ''}`;
                  marker.textContent = cp.checked ? '✅' : cp.icon;
                }
              });
              console.log('⚡ 快速更新本地缓存地图状态');
            } else {
              if (typeof CheckpointManager !== 'undefined') {
                CheckpointManager.renderMap();
              }
            }
          }
        }, 50);
        
        // 第三阶段：完整渲染（150ms）
        setTimeout(() => {
          // ✅ 关键修复：重新检查成就并生成兑奖券
          if (typeof PrizeManager !== 'undefined') {
            // 先检查新成就（会生成 vouchers）
            PrizeManager.checkNewAchievements();
            
            // 如果 vouchers 还是空的，手动从已达成成就生成
            if (AppState.vouchers.length === 0) {
              AppState.achievements.forEach(achievement => {
                if (achievement.achieved) {
                  const exists = AppState.vouchers.find(v => v.stage === achievement.stage);
                  if (!exists) {
                    AppState.vouchers.push({
                      stage: achievement.stage,
                      name: achievement.name,
                      achievedAt: Date.now(),
                      redeemed: achievement.redeemed || false
                    });
                  }
                }
              });
            }
            
            console.log('💾 从本地缓存更新兑奖券，数量:', AppState.vouchers.length);
          }
          
          if (typeof PrizeManager !== 'undefined') {
            PrizeManager.updatePrizeCards();
            PrizeManager.updateVoucherList();
          }
          
          const mandatoryContainer = document.getElementById('mandatory-checkpoints');
          if (mandatoryContainer && typeof CheckpointManager !== 'undefined') {
            CheckpointManager.renderCheckpointList();
          }
        }, 150);
      } catch (err) {
        console.error('❌ 加载本地数据失败:', err.message);
      }
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