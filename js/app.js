// 打卡活动 H5 - 主逻辑

// ==================== 数据状态 ====================
const AppState = {
  // 当前用户 ID（由 AlipayUserManager 管理）
  userId: null,
  
  // 用户积分
  points: 0,
  
  // 已打卡点位
  checkedCheckpoints: [],
  
  // 必打卡点配置（重庆一日游 - 5 个核心打卡点）
  mandatoryCheckpoints: [
    { 
      id: 1, 
      name: '解放碑步行街', 
      icon: '🏢', 
      points: 15, 
      checked: false, 
      time: '8:00-9:30',
      period: '上午',
      desc: '重庆市渝中区解放碑商业步行街',
      address: '重庆市渝中区解放碑商业步行街',
      pos: { left: '18%', top: '32%' } 
    },
    { 
      id: 2, 
      name: '李子坝轻轨站', 
      icon: '🚝', 
      points: 15, 
      checked: false, 
      time: '9:30-10:30',
      period: '上午',
      desc: '轻轨 2 号线穿楼而过的奇观',
      address: '重庆市渝中区李子坝正站',
      pos: { left: '78%', top: '38%' } 
    },
    { 
      id: 3, 
      name: '鹅岭二厂文创园', 
      icon: '🎨', 
      points: 15, 
      checked: false, 
      time: '11:00-12:30',
      period: '上午',
      desc: '文艺青年聚集地，电影取景地',
      address: '重庆市渝中区鹅岭正街 1 号',
      pos: { left: '72%', top: '52%' } 
    },
    { 
      id: 4, 
      name: '南山一棵树观景台', 
      icon: '🌳', 
      points: 20, 
      checked: false, 
      time: '14:30-16:00',
      period: '下午晚上',
      desc: '俯瞰重庆夜景的最佳观景台',
      address: '重庆市南岸区南山植物园旁',
      pos: { left: '20%', top: '75%' } 
    },
    { 
      id: 5, 
      name: '洪崖洞 + 千厮门大桥', 
      icon: '🌉', 
      points: 25, 
      checked: false, 
      time: '18:30-21:00',
      period: '下午晚上',
      desc: '重庆夜景地标，千与千寻现实版',
      address: '重庆市渝中区嘉陵江滨江路 88 号',
      pos: { left: '80%', top: '85%' } 
    }
  ],
  
  // 普通点位配置（推荐自选）
  normalCheckpoints: [
    { id: 6, name: '八一好吃街', icon: '🍜', points: 5, checked: false, time: '', period: '', desc: '重庆美食聚集地', pos: { left: '25%', top: '28%' } },
    { id: 7, name: '朝天门广场', icon: '⛴️', points: 5, checked: false, time: '', period: '', desc: '两江交汇处', pos: { left: '55%', top: '92%' } },
    { id: 8, name: '长江索道', icon: '🚡', points: 5, checked: false, time: '', period: '', desc: '空中公交', pos: { left: '45%', top: '65%' } },
    { id: 9, name: '来福士广场', icon: '🏗️', points: 5, checked: false, time: '', period: '', desc: '城市综合体', pos: { left: '50%', top: '88%' } }
  ],
  
  // 兑奖成就配置（重庆一日游版）
// 5 个必打卡点全打 = 90 分，加上普通点位最高 110 分
  achievements: [
    { 
      stage: 1, 
      name: '山城萌新', 
      requiredPoints: 30, 
      achieved: false, 
      redeemed: false, 
      icon: '🌶️',
      desc: '初入山城，开启美食之旅'
    },
    { 
      stage: 2, 
      name: '雾都探索者', 
      requiredPoints: 50, 
      achieved: false, 
      redeemed: false, 
      icon: '🚝',
      desc: '穿梭雾都，体验轻轨穿楼'
    },
    { 
      stage: 3, 
      name: '巴渝达人', 
      requiredPoints: 70, 
      achieved: false, 
      redeemed: false, 
      icon: '🌉',
      desc: '深度游玩，打卡网红景点'
    },
    { 
      stage: 4, 
      name: '重庆通', 
      requiredPoints: 90, 
      achieved: false, 
      redeemed: false, 
      icon: '🏆',
      desc: '完美一日游，征服所有必打卡点'
    }
  ],
  
  // 兑奖券
  vouchers: [],
  
  // 是否已经兑换过（无论哪个阶段，只能兑奖一次）
  hasRedeemed: false,
  
  // 现场照片
  shareImage: null
};

// ==================== 工具函数 ====================
const Utils = {
  // 检查成就是否达成（只检查积分）
  checkAchievement(achievement) {
    return AppState.points >= achievement.requiredPoints;
  },
  
  // 生成 QR 码数据
  generateQRData(stage) {
    const achievement = AppState.achievements.find(a => a.stage === stage);
    const data = {
      type: 'redeem',
      stage: stage,
      achievement: achievement.name,
      timestamp: Date.now(),
      userId: 'user_' + Math.random().toString(36).substr(2, 9)
    };
    return JSON.stringify(data);
  },
  
  // 格式化日期
  formatDate(timestamp) {
    const date = new Date(timestamp);
    return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  }
};

// ==================== Supabase 管理 ====================
const SupabaseManager = {
  supabaseUrl: 'https://ussvekkgyntubivhfext.supabase.co',
  supabaseKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVzc3Zla2tneW50dWJpdmhmZXh0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTEwODQwMiwiZXhwIjoyMDkwNjg0NDAyfQ.i1fbQC96UGnToKL6fa7GTfaMtt0s_TGpNNR0xb3ufR0',
  supabase: null,
  userId: null,
  
  async init() {
    console.log('🚀 SupabaseManager 初始化...');
    if (typeof supabase !== 'undefined') {
      this.supabase = supabase.createClient(this.supabaseUrl, this.supabaseKey);
      window.supabaseClient = this.supabase;
      await this.getUserId();
      console.log('✅ Supabase 客户端创建成功');
    } else {
      console.warn('⚠️ Supabase SDK 未加载');
      this.userId = 'local_' + Date.now();
    }
    AppState.userId = this.userId;
    console.log('👤 用户 ID:', this.userId);
  },
  
  async getUserId() {
    this.userId = 'user_' + Date.now();
    return this.userId;
  }
};

// ==================== 页面管理 ====================
const PageManager = {
  init() {
    this.bindNavEvents();
    this.updateAllDisplays();
    console.log('✅ PageManager 初始化完成');
  },
  
  // 切换页面
  switchPage(pageName) {
    const currentPage = document.querySelector('.page.active');
    const targetPage = document.getElementById(`${pageName}-page`);
    
    // 已经是当前页面，不重复切换
    if (targetPage && targetPage.classList.contains('active')) {
      return;
    }
    
    console.log(`🔄 切换到页面：${pageName}`);
    
    // 隐藏当前页面
    if (currentPage) {
      currentPage.classList.remove('active');
    }
    
    // 显示目标页面（稍微延迟，营造过渡效果）
    setTimeout(() => {
      if (targetPage) {
        targetPage.classList.add('active');
        // 滚动到顶部
        targetPage.scrollTop = 0;
      }
    }, 50);
    
    // 更新导航状态
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.remove('active');
      if (item.dataset.page === pageName) {
        item.classList.add('active');
        // 添加点击反馈动画
        const icon = item.querySelector('.nav-icon');
        if (icon) {
          icon.style.animation = 'navBounce 0.4s ease';
          setTimeout(() => {
            icon.style.animation = '';
          }, 400);
        }
      }
    });
    
    // 震动反馈（仅支持设备）
    if (navigator.vibrate) {
      navigator.vibrate(10);
    }
    
    // 页面特定更新
    if (pageName === 'prize') {
      setTimeout(() => {
        PrizeManager.updatePrizeCards();
        PrizeManager.updateVoucherList();
      }, 100);
    } else if (pageName === 'share') {
      setTimeout(() => {
        ShareManager.updateShareContent();
      }, 100);
    } else if (pageName === 'checkpoint') {
      setTimeout(() => {
        CheckpointManager.renderCheckpointList();
      }, 100);
    }
    
    // 保存到历史记录（支持前进后退）
    if (window.history.pushState) {
      const newUrl = `${window.location.pathname}?page=${pageName}`;
      window.history.pushState({page: pageName}, '', newUrl);
    }
  },
  
  // 绑定导航事件
  bindNavEvents() {
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', () => {
        this.switchPage(item.dataset.page);
      });
    });
  },
  
  // 更新所有显示
  updateAllDisplays() {
    // 更新积分显示
    const totalPoints = document.getElementById('total-points');
    const prizePoints = document.getElementById('prize-points');
    const sharePoints = document.getElementById('share-points');
    
    if (totalPoints) totalPoints.textContent = AppState.points;
    if (prizePoints) prizePoints.textContent = AppState.points;
    if (sharePoints) sharePoints.textContent = AppState.points;
    
    // 保存到用户数据
    if (window.AlipayUserManager) {
      AlipayUserManager.saveCheckinData();
    }
  }
};

// ==================== 打卡点管理 ====================
const CheckpointManager = {
  init() {
    this.renderMap();
  },
  
  // 渲染地图
  renderMap() {
    const mapWrapper = document.getElementById('checkin-map');
    
    // 保留背景图
    const bgElement = mapWrapper.querySelector('.map-background');
    const mapImage = mapWrapper.querySelector('.map-image');
    mapWrapper.innerHTML = '';
    if (bgElement) {
      mapWrapper.appendChild(bgElement);
    }
    if (mapImage) {
      mapWrapper.appendChild(mapImage);
    }
    
    // 添加所有打卡点
    AppState.mandatoryCheckpoints.forEach((cp, index) => {
      const marker = document.createElement('div');
      marker.className = `checkpoint-marker ${cp.checked ? 'checked' : ''}`;
      marker.style.left = cp.pos.left;
      marker.style.top = cp.pos.top;
      marker.textContent = cp.checked ? '✅' : cp.icon;
      marker.title = `${cp.name}\n📍 ${cp.address}`;
      marker.style.animationDelay = `${index * 0.3}s`;
      
      marker.addEventListener('click', () => {
        this.openNavigation(cp);
      });
      
      mapWrapper.appendChild(marker);
    });
  },
  
  // 通过 URL 参数打卡
  handleCheckinFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const checkinId = urlParams.get('checkin');
    
    if (!checkinId) return;
    
    const checkpointIndex = parseInt(checkinId) - 1;
    if (checkpointIndex < 0 || checkpointIndex >= AppState.mandatoryCheckpoints.length) {
      return;
    }
    
    const checkpoint = AppState.mandatoryCheckpoints[checkpointIndex];
    
    if (!checkpoint.checked) {
      checkpoint.checked = true;
      AppState.checkedCheckpoints.push(checkpoint.id);
      AppState.points += checkpoint.points;
      
      PageManager.updateAllDisplays();
      this.renderMap();
      PrizeManager.checkNewAchievements();
      
      // 显示成功消息
      setTimeout(() => {
        alert(`✅ 打卡成功！\n\n📍 ${checkpoint.name}\n+${checkpoint.points} 积分\n当前积分：${AppState.points}\n\n🎉 继续打卡其他景点解锁更多成就！`);
        
        // 清除 URL 参数
        window.history.replaceState({}, document.title, window.location.pathname);
      }, 300);
    } else {
      setTimeout(() => {
        alert(`ℹ️ 您已完成 "${checkpoint.name}" 的打卡\n\n当前积分：${AppState.points}`);
        window.history.replaceState({}, document.title, window.location.pathname);
      }, 300);
    }
  },
  
  // 打开导航（优化手机版）
  openNavigation(checkpoint) {
    const ua = navigator.userAgent.toLowerCase();
    const isMobile = /mobile|android|iphone|ipad/i.test(ua);
    
    // 准备导航数据
    const address = encodeURIComponent(checkpoint.address);
    const name = encodeURIComponent(checkpoint.name);
    
    // 高德地图标准 URL（会自动唤起 App 或打开网页）
    const gaodeUrl = `https://uri.amap.com/navigation?to=${address}&toName=${name}&cmd=navi&from=0&dev=0`;
    
    console.log('🗺️ 导航到：', checkpoint.name, checkpoint.address);
    console.log('🔗 URL:', gaodeUrl);
    
    if (isMobile) {
      // 手机版：直接使用 location.href 打开（最可靠）
      // 系统会自动选择：有 App 打开 App，没有 App 打开网页
      window.location.href = gaodeUrl;
    } else {
      // 电脑版：新窗口打开网页版
      window.open(gaodeUrl, '_blank');
    }
  },
  
  // 显示提示消息
  showToast(message, duration = 2000) {
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      bottom: 80px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 12px 20px;
      border-radius: 24px;
      font-size: 14px;
      z-index: 10001;
      transition: opacity 0.3s;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  },
  
  // 显示打卡点详情
  showCheckpointDetail(cp) {
    if (cp.checked) {
      // 已经打卡，取消打卡
      if (confirm(`确定要取消 "${cp.name}" 的打卡吗？\n地址：${cp.address}`)) {
        cp.checked = false;
        AppState.checkedCheckpoints = AppState.checkedCheckpoints.filter(id => id !== cp.id);
        AppState.points -= cp.points;
        if (AppState.points < 0) AppState.points = 0;
        
        PageManager.updateAllDisplays();
        PrizeManager.updatePrizeCards();
        this.renderMap();
        this.renderCheckpointList();
      }
    } else {
      // 进行打卡
      this.handleCheckpointClick(cp);
    }
  },
  
  // 渲染点位列表
  renderCheckpointList() {
    const mandatoryContainer = document.getElementById('mandatory-checkpoints');
    
    // 渲染打卡点（5 个核心打卡点）
    mandatoryContainer.innerHTML = AppState.mandatoryCheckpoints.map(cp => `
      <div class="checkpoint-item ${cp.checked ? 'checked' : ''}" data-id="${cp.id}">
        <span class="checkpoint-icon">${cp.checked ? '✅' : cp.icon}</span>
        <div class="checkpoint-info">
          <div class="checkpoint-name">${cp.name}</div>
          <div class="checkpoint-desc">📍 ${cp.address}</div>
        </div>
        <span class="checkpoint-points">+${cp.points}</span>
      </div>
    `).join('');
    
    // 绑定点击事件
    document.querySelectorAll('.checkpoint-item').forEach(item => {
      item.addEventListener('click', () => {
        const cpId = parseInt(item.dataset.id);
        const cp = AppState.mandatoryCheckpoints.find(c => c.id === cpId);
        if (cp) {
          this.showCheckpointDetail(cp);
          this.renderCheckpointList();
          this.renderMap();
        }
      });
    });
  },
  
  // 处理打卡点点击
  handleCheckpointClick(checkpoint) {
    if (checkpoint.checked) {
      // 已经打卡，取消打卡
      if (confirm(`确定要取消 "${checkpoint.name}" 的打卡吗？`)) {
        checkpoint.checked = false;
        AppState.checkedCheckpoints = AppState.checkedCheckpoints.filter(id => id !== checkpoint.id);
        AppState.points -= checkpoint.points;
        if (AppState.points < 0) AppState.points = 0;
        
        PageManager.updateAllDisplays();
        PrizeManager.updatePrizeCards();
        
        // 保存用户数据
        if (window.AlipayUserManager) {
          AlipayUserManager.saveCheckinData();
        }
        // 同步到 Supabase
        if (window.SupabaseManager) {
          SupabaseManager.saveCheckinData();
        }
      }
    } else {
      // 进行打卡
      checkpoint.checked = true;
      AppState.checkedCheckpoints.push(checkpoint.id);
      AppState.points += checkpoint.points;
      
      PageManager.updateAllDisplays();
      
      // 显示打卡成功弹窗
      ModalManager.showCheckinSuccess(checkpoint.points);
      
      // 检查成就
      PrizeManager.checkNewAchievements();
      
      // 更新奖品页面
      PrizeManager.updatePrizeCards();
      
      // 保存用户数据
      if (window.AlipayUserManager) {
        AlipayUserManager.saveCheckinData();
      }
      // 同步到 Supabase
      if (window.SupabaseManager) {
        SupabaseManager.saveCheckinData();
      }
    }
  }
};

// ==================== 奖品管理 ====================
const PrizeManager = {
  init() {
    this.updatePrizeCards();
    this.bindRedeemEvents();
  },
  
  // 更新奖品卡片
  updatePrizeCards() {
    AppState.achievements.forEach(achievement => {
      const card = document.querySelector(`.prize-card[data-stage="${achievement.stage}"]`);
      const indicator = document.getElementById(`stage${achievement.stage}-indicator`);
      const text = document.getElementById(`stage${achievement.stage}-text`);
      const btn = document.getElementById(`redeem-btn-${achievement.stage}`);
      
      const isAchieved = Utils.checkAchievement(achievement);
      
      if (isAchieved && !achievement.achieved) {
        // 新达成成就
        achievement.achieved = true;
        this.showAchievementNotification(achievement);
      }
      
      // 更新卡片状态
      if (achievement.achieved) {
        card.classList.add('achieved');
        indicator.classList.add('lit');
        text.textContent = '已达成';
        text.style.color = '#f59e0b';
        
        // 检查是否可以兑奖
        if (!achievement.redeemed && !AppState.hasRedeemed) {
          btn.disabled = false;
          btn.textContent = '线下兑奖';
        } else if (achievement.redeemed) {
          btn.disabled = true;
          btn.textContent = '已兑奖';
        } else if (AppState.hasRedeemed) {
          btn.disabled = true;
          btn.textContent = '已达兑奖上限';
        }
      } else {
        card.classList.remove('achieved');
        indicator.classList.remove('lit');
        text.textContent = '未达成';
        text.style.color = '#666';
        btn.disabled = true;
        btn.textContent = '线下兑奖';
      }
    });
  },
  
  // 检查新成就
  checkNewAchievements() {
    let newAchievements = [];
    
    AppState.achievements.forEach(achievement => {
      if (!achievement.achieved && Utils.checkAchievement(achievement)) {
        achievement.achieved = true;
        newAchievements.push(achievement);
        
        // 添加兑奖券
        AppState.vouchers.push({
          stage: achievement.stage,
          name: achievement.name,
          achievedAt: Date.now(),
          redeemed: false
        });
      }
    });
    
    if (newAchievements.length > 0) {
      this.updateVoucherList();
    }
  },
  
  // 显示成就通知
  showAchievementNotification(achievement) {
    const descriptions = {
      1: '🌶️ 已达成「山城萌新」成就，可前往兑奖处兑奖',
      2: '🚝 已达成「雾都探索者」成就，可前往兑奖处兑奖',
      3: '🌉 已达成「巴渝达人」成就，可前往兑奖处兑奖',
      4: '🏆 已达成「重庆通」成就，可前往兑奖处兑奖'
    };
    
    ModalManager.showRedeemInfo(descriptions[achievement.stage]);
  },
  
  // 更新兑奖券列表
  updateVoucherList() {
    const voucherList = document.getElementById('voucher-list');
    
    if (AppState.vouchers.length === 0) {
      voucherList.innerHTML = '<p class="empty-tip">暂无可用兑奖券</p>';
      return;
    }
    
    // 检查是否已经兑奖过
    const hasRedeemed = AppState.hasRedeemed;
    
    voucherList.innerHTML = AppState.vouchers.map(voucher => {
      let statusText = '';
      let statusClass = '';
      
      if (voucher.redeemed) {
        statusText = '✅ 已兑奖';
        statusClass = 'redeemed';
      } else if (hasRedeemed) {
        statusText = '⛔ 已达兑奖上限';
        statusClass = 'limit-reached';
      } else {
        statusText = '⏳ 待兑奖';
        statusClass = 'available';
      }
      
      return `
        <div class="voucher-item ${statusClass}" data-stage="${voucher.stage}">
          <div>
            <div class="voucher-name">${voucher.name}</div>
            <div class="voucher-status">获得时间：${Utils.formatDate(voucher.achievedAt)}</div>
          </div>
          <div class="voucher-status ${statusClass}">${statusText}</div>
        </div>
      `;
    }).join('');
    
    // 绑定兑奖券点击事件
    document.querySelectorAll('.voucher-item').forEach(item => {
      item.addEventListener('click', () => {
        const stage = parseInt(item.dataset.stage);
        const voucher = AppState.vouchers.find(v => v.stage === stage);
        if (voucher && !voucher.redeemed && !AppState.hasRedeemed) {
          this.initiateRedeem(stage);
        }
      });
    });
  },
  
  // 绑定兑奖事件
  bindRedeemEvents() {
    for (let i = 1; i <= 4; i++) {
      const btn = document.getElementById(`redeem-btn-${i}`);
      if (btn) {
        btn.addEventListener('click', () => {
          if (!btn.disabled) {
            this.initiateRedeem(i);
          }
        });
      }
    }
  },
  
  // 发起兑奖
  initiateRedeem(stage) {
    const achievement = AppState.achievements.find(a => a.stage === stage);
    ModalManager.showRedeemConfirm(stage, achievement.name);
  },
  
  // 确认兑奖
  confirmRedeem(stage) {
    const achievement = AppState.achievements.find(a => a.stage === stage);
    achievement.redeemed = true;
    AppState.hasRedeemed = true;
    
    const voucher = AppState.vouchers.find(v => v.stage === stage);
    if (voucher) {
      voucher.redeemed = true;
    }
    
    this.updatePrizeCards();
    this.updateVoucherList();
    
    alert(`✅ 兑奖成功！\n\n成就：${achievement.name}\n\n感谢您的参与！`);
  }
};

// ==================== 分享管理 ====================
// ==================== 分享管理 - 简化版 ====================
const ShareManager = {
  // 15 张标志性图片
  landmarkImages: [
    { id: 'jfbei_1', checkpointId: 1, url: 'https://images.unsplash.com/photo-1599689018248-b3e9e089e8c2?w=600', desc: '🏢 解放碑' },
    { id: 'jfbei_2', checkpointId: 1, url: 'https://images.unsplash.com/photo-1478131333081-31f9a7e96847?w=600', desc: '🏙️ 商业中心' },
    { id: 'jfbei_3', checkpointId: 1, url: 'https://images.unsplash.com/photo-1519508235410-4e1a9881c138?w=600', desc: '🌃 夜景' },
    { id: 'liziba_1', checkpointId: 2, url: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=600', desc: '🚝 轻轨穿楼' },
    { id: 'liziba_2', checkpointId: 2, url: 'https://images.unsplash.com/photo-1444703686981-a3abbc4d4fe3?w=600', desc: '🚄 轻轨' },
    { id: 'liziba_3', checkpointId: 2, url: 'https://images.unsplash.com/photo-1520639888713-78db11c0a1a3?w=600', desc: '🚇 站台' },
    { id: 'eling_1', checkpointId: 3, url: 'https://images.unsplash.com/photo-1560185127-6ed189bf02f4?w=600', desc: '🎨 二厂' },
    { id: 'eling_2', checkpointId: 3, url: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=600', desc: '🖼️ 文艺' },
    { id: 'eling_3', checkpointId: 3, url: 'https://images.unsplash.com/photo-1550950158-d0d960dff51b?w=600', desc: '🎭 电影' },
    { id: 'nanshan_1', checkpointId: 4, url: 'https://images.unsplash.com/photo-1506459225024-1428096a4b2e?w=600', desc: '🌳 观景台' },
    { id: 'nanshan_2', checkpointId: 4, url: 'https://images.unsplash.com/photo-1518182170546-0766aaefcd09?w=600', desc: '🌆 夜景' },
    { id: 'nanshan_3', checkpointId: 4, url: 'https://images.unsplash.com/photo-1506459225024-1428096a4b2e?w=600', desc: '🌇 全景' },
    { id: 'hongya_1', checkpointId: 5, url: 'https://images.unsplash.com/photo-1548265047-181289a4168f?w=600', desc: '🌉 洪崖洞' },
    { id: 'hongya_2', checkpointId: 5, url: 'https://images.unsplash.com/photo-1554672408-730436b60dde?w=600', desc: '🏮 千与千寻' },
    { id: 'hongya_3', checkpointId: 5, url: 'https://images.unsplash.com/photo-1553913861-c0fddf2166ab?w=600', desc: '🌃 大桥' }
  ],
  
  // 8 条文案
  shareTexts: [
    '我在"趣玩重庆一日游"打卡活动中，已经获得 {points} 积分！打卡了重庆地标景点，快来一起探索山城魅力吧！',
    '🎉 重庆一日游太好玩了！打卡了 {points} 积分，网红景点都打卡成功！这个周末一起来玩！',
    '🎊 山城重庆之旅完美收官！{points} 积分到手，李子坝轻轨穿楼太震撼了，洪崖洞夜景美到窒息！',
    '🌟 打卡重庆成功！用双腿丈量这座城市，{points} 积分见证我的山城建功之旅！',
    '✨ 重庆一日游完美收官！{points} 积分解锁，嘉陵江的夜风、解放碑的繁华、南山的美景，都不虚此行！',
    '🎈 8D 魔幻城市名不虚传！{points} 积分打卡成功，重庆我还会再来的！',
    '💫 山城打卡成就达成！{points} 积分收入囊中，重庆的美食美景值得 N 刷！',
    '🌈 雾都探索完成！{points} 积分到手，重庆的奇妙超出想象！童伴们冲鸭！'
  ],
  
  init() {
    AppState.selectedImages = [];
    AppState.currentShareTextIndex = null;
    this.loadShareData();
    this.bindShareEvents();
  },
  
  loadShareData() {
    const saved = localStorage.getItem('share_data');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        AppState.selectedImages = data.selectedImages || [];
      } catch(e) {
        AppState.selectedImages = [];
      }
    }
  },
  
  saveShareData() {
    localStorage.setItem('share_data', JSON.stringify({
      selectedImages: AppState.selectedImages
    }));
  },
  
  updateShareContent() {
    const ptsEl = document.getElementById('share-points');
    if (ptsEl) ptsEl.textContent = AppState.points;
    this.renderPhotoCards();
    this.renderShareText();
    this.updateSelectionHint();
  },
  
  // 渲染所有 15 张卡片
  renderPhotoCards() {
    const slider = document.getElementById('photo-slider-card');
    if (!slider) return;
    
    slider.innerHTML = this.landmarkImages.map((img, index) => {
      const isSelected = AppState.selectedImages.includes(img.id);
      return `
        <div class="photo-card ${isSelected ? 'selected-card' : ''}" data-imgid="${img.id}" onclick="ShareManager.toggleSelect('${img.id}')">
          <img src="${img.url}" alt="${img.desc}" />
          <div class="checkmark">✓</div>
        </div>
      `;
    }).join('');
  },
  
  // 切换选择
  toggleSelect(imgId) {
    const index = AppState.selectedImages.indexOf(imgId);
    
    if (index >= 0) {
      // 取消选择
      AppState.selectedImages.splice(index, 1);
    } else {
      // 选择新图片
      if (AppState.selectedImages.length >= 3) {
        alert('ℹ️ 最多只能选择 3 张图片');
        return;
      }
      AppState.selectedImages.push(imgId);
    }
    
    this.renderPhotoCards();
    this.saveShareData();
    this.updateSelectionHint();
  },
  
  // 更新选择提示
  updateSelectionHint() {
    let hintEl = document.querySelector('.select-hint');
    if (!hintEl) {
      // 创建提示元素
      hintEl = document.createElement('div');
      hintEl.className = 'select-hint';
      const container = document.getElementById('photo-slider-card').parentNode;
      container.insertBefore(hintEl, container.firstChild);
    }
    
    const count = AppState.selectedImages.length;
    hintEl.innerHTML = `已选择 <span class="count">${count}</span>/3 张`;
  },
  
  // 渲染随机文案
  renderShareText() {
    const el = document.getElementById('share-text-content');
    if (!el) return;
    
    if (AppState.currentShareTextIndex === null || 
        AppState.currentShareTextIndex >= this.shareTexts.length) {
      AppState.currentShareTextIndex = Math.floor(Math.random() * this.shareTexts.length);
    }
    
    const text = this.shareTexts[AppState.currentShareTextIndex]
      .replace('{points}', AppState.points.toString());
    
    el.innerHTML = `<p>${text}</p>`;
  },
  
  // 刷新文案
  refreshText() {
    const newIndex = Math.floor(Math.random() * this.shareTexts.length);
    AppState.currentShareTextIndex = newIndex;
    this.renderShareText();
  },
  
  bindShareEvents() {
    // 换一个按钮
    const refreshBtn = document.getElementById('refresh-text-btn');
    if (refreshBtn) {
      refreshBtn.onclick = () => this.refreshText();
    }
    
    // 去分享按钮
    const shareBtn = document.getElementById('share-main-btn');
    if (shareBtn) {
      shareBtn.onclick = () => {
        if (AppState.selectedImages.length === 0) {
          alert('ℹ️ 请至少选择 1 张图片');
          return;
        }
        
        const text = document.getElementById('share-text-content').textContent;
        alert('📤 长按复制下方文案，然后分享到朋友圈：\n\n' + text);
      };
    }
  }
};
// ==================== 初始化 ====================
document.addEventListener('DOMContentLoaded', async () => {
  console.log('🚀 开始初始化...');
  console.log('='.repeat(50));
  
  // 1. 初始化 Supabase 用户管理（异步，必须在最前面）
  try {
    if (window.SupabaseManager) {
      await SupabaseManager.init();
      AppState.userId = SupabaseManager.userId;
      console.log('✅ Supabase 用户管理初始化完成');
    } else {
      console.warn('⚠️ SupabaseManager 未加载');
      AppState.userId = 'unknown_' + Date.now();
    }
  } catch(e) { 
    console.error('❌ Supabase 用户管理:', e); 
    AppState.userId = 'error_' + Date.now();
  }
  
  console.log('-'.repeat(50));
  
  // 2. 初始化页面管理
  try {
    PageManager.init();
    console.log('✅ PageManager 完成');
  } catch(e) { console.error('❌ PageManager:', e); }
  
  // 3. 初始化打卡点管理
  try {
    CheckpointManager.init();
    console.log('✅ CheckpointManager 完成');
  } catch(e) { console.error('❌ CheckpointManager:', e); }
  
  // 4. 初始化奖品管理
  try {
    PrizeManager.init();
    console.log('✅ PrizeManager 完成');
  } catch(e) { console.error('❌ PrizeManager:', e); }
  
  // 5. 初始化分享管理
  try {
    ShareManager.init();
    console.log('✅ ShareManager 完成');
  } catch(e) { console.error('❌ ShareManager:', e); }
  
  console.log('-'.repeat(50));
  
  // 6. 处理 URL 打卡参数
  try {
    CheckpointManager.handleCheckinFromURL();
  } catch(e) { console.error('❌ URL 打卡:', e); }
  
  // 7. 更新显示
  PageManager.updateAllDisplays();
  
  console.log('='.repeat(50));
  console.log('🎉 初始化完成！');
  console.log('👤 用户 ID:', AppState.userId);
  console.log('📊 当前积分:', AppState.points);
  console.log('📍 已打卡点数:', AppState.checkedCheckpoints.length);
  console.log('='.repeat(50));
});

// 调试用 - 可以通过控制台调用
window.DebugApp = {
  getState: () => AppState,
  addPoints: (n) => {
    AppState.points += n;
    PageManager.updateAllDisplays();
    PrizeManager.checkNewAchievements();
  },
  checkAll: () => {
    [...AppState.mandatoryCheckpoints, ...AppState.normalCheckpoints].forEach(cp => {
      if (!cp.checked) {
        cp.checked = true;
        AppState.points += cp.points;
      }
    });
    PageManager.updateAllDisplays();
    PrizeManager.checkNewAchievements();
  },
  reset: () => {
    location.reload();
  }
};