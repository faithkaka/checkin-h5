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
const ShareManager = {
  currentPhotoIndex: 0,
  landmarkImages: [], // 从 Supabase 动态加载
  shareTexts: [],
  
  // 默认图片（当 Supabase 加载失败时使用）
  defaultImages: [
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
  
  defaultTexts: [
    '我在"趣玩重庆一日游"打卡活动中，已经获得 {points} 积分！打卡了重庆地标景点，快来一起探索山城魅力吧！',
    '🎉 重庆一日游太好玩了！打卡了 {points} 积分，网红景点都打卡成功！这个周末一起来玩！',
    '🎊 山城重庆之旅完美收官！{points} 积分到手，李子坝轻轨穿楼太震撼了，洪崖洞夜景美到窒息！',
    '🌟 打卡重庆成功！用双腿丈量这座城市，{points} 积分见证我的山城建功之旅！',
    '✨ 重庆一日游完美收官！{points} 积分解锁，嘉陵江的夜风、解放碑的繁华、南山的美景，都不虚此行！',
    '🎈 8D 魔幻城市名不虚传！{points} 积分打卡成功，重庆我还会再来的！',
    '💫 山城打卡成就达成！{points} 积分收入囊中，重庆的美食美景值得 N 刷！',
    '🌈 雾都探索完成！{points} 积分到手，重庆的奇妙超出想象！童伴们冲鸭！'
  ],
  
  async init() {
    AppState.selectedImages = [];
    AppState.customShareText = null;
    
    // 从 Supabase 加载分享资源
    await this.loadShareResources();
    
    // 从 localStorage 加载用户选择
    this.loadShareData();
    this.bindShareEvents();
  },
  
  // 从 Supabase 加载分享资源（图片和文案）
  async loadShareResources() {
    try {
      const client = window.AlipayUserManager ? AlipayUserManager.supabase : null;
      if (!client) {
        console.warn('⚠️ Supabase 客户端未初始化，使用默认图片');
        this.landmarkImages = this.defaultImages.slice();
        this.shareTexts = this.defaultTexts.slice();
        return;
      }
      
      console.log('🔄 从 Supabase 加载分享资源...');
      const { data, error } = await client.from('share_resources').select('data').eq('type', 'share').single();
      
      if (error) {
        console.error('❌ 加载分享资源失败:', error);
        this.landmarkImages = this.defaultImages.slice();
        this.shareTexts = this.defaultTexts.slice();
        return;
      }
      
      if (data && data.data) {
        this.landmarkImages = data.data.images || this.defaultImages.slice();
        this.shareTexts = data.data.texts || this.defaultTexts.slice();
        console.log('✅ 分享资源加载成功，图片:', this.landmarkImages.length, '张，文案:', this.shareTexts.length, '条');
      } else {
        this.landmarkImages = this.defaultImages.slice();
        this.shareTexts = this.defaultTexts.slice();
      }
    } catch (e) {
      console.error('❌ 加载分享资源异常:', e);
      this.landmarkImages = this.defaultImages.slice();
      this.shareTexts = this.defaultTexts.slice();
    }
  },
  
  // 加载保存的分享数据
  loadShareData() {
  
  // 保存分享数据
  saveShareData() {
    const data = {
      selectedImages: AppState.selectedImages,
      customShareText: AppState.customShareText,
      currentPhotoIndex: this.currentPhotoIndex
    };
    localStorage.setItem('share_data', JSON.stringify(data));
  },
  
  // 更新分享内容
  updateShareContent() {
    document.getElementById('share-points').textContent = AppState.points;
    this.renderPhotoWall();
    this.renderShareText();
    this.saveShareData();
  },
  
  // 渲染分享文案
  renderShareText() {
    const shareTextEl = document.getElementById('share-text');
    if (!shareTextEl) return;
    
    let text;
    if (AppState.customShareText) {
      text = AppState.customShareText;
    } else {
      // 随机选择一段文案
      const randomText = this.shareTexts[Math.floor(Math.random() * this.shareTexts.length)];
      text = randomText.replace('{points}', AppState.points);
    }
    
    shareTextEl.textContent = text;
  },
  
  // 渲染照片墙
  renderPhotoWall() {
    const slider = document.getElementById('photo-slider');
    const indicators = document.getElementById('photo-indicators');
    const placeholder = document.getElementById('photo-placeholder');
    
    if (!slider || !indicators || !placeholder) {
      console.error('❌ 照片墙元素未找到');
      return;
    }
    
    console.log('📸 渲染照片墙，已选图片:', AppState.selectedImages.length);
    
    if (AppState.selectedImages.length === 0) {
      placeholder.style.display = 'block';
      slider.style.display = 'none';
      indicators.style.display = 'none';
      placeholder.innerHTML = `
        <div style="text-align:center;padding:20px;">
          <span style="font-size:14px;color:#666;">📸 点击"选择图片"<br>每个景点最多选择 3 张</span>
        </div>
      `;
      return;
    }
    
    placeholder.style.display = 'none';
    slider.style.display = 'flex';
    indicators.style.display = 'flex';
    
    try {
      // 渲染已选择的图片
      slider.innerHTML = AppState.selectedImages.map((imgId, index) => {
        const imgData = this.landmarkImages.find(img => img.id === imgId);
        const imgUrl = imgData ? imgData.url : '';
        const imgDesc = imgData ? imgData.desc : '景点图片';
        console.log(`  图片 ${index}:`, imgId, imgUrl);
        
        return `
          <div class="photo-slide" data-index="${index}">
            <img src="${imgUrl}" alt="${imgDesc}" onerror="console.error('图片加载失败:', this.src)" />
            <button class="photo-delete" onclick="ShareManager.removePhoto(${index})">×</button>
          </div>
        `;
      }).join('');
      
      // 渲染指示器
      indicators.innerHTML = AppState.selectedImages.map((_, index) => `
        <div class="indicator ${index === this.currentPhotoIndex ? 'active' : ''}"></div>
      `).join('');
      
      // 清除旧的事件监听（避免重复）
      const newSlider = slider.cloneNode(true);
      slider.parentNode.replaceChild(newSlider, slider);
      
      // 重新绑定滑动事件
      newSlider.addEventListener('scroll', () => {
        const slideWidth = newSlider.clientWidth;
        const newIndex = Math.round(newSlider.scrollLeft / slideWidth);
        if (newIndex !== this.currentPhotoIndex && newIndex >= 0 && newIndex < AppState.selectedImages.length) {
          this.currentPhotoIndex = newIndex;
          this.updateIndicators();
        }
      });
      
      console.log('✅ 照片墙渲染完成');
    } catch (e) {
      console.error('❌ 渲染照片墙失败:', e);
    }
  },
  
  // 更新指示器
  updateIndicators() {
    const indicators = document.querySelectorAll('.indicator');
    indicators.forEach((ind, index) => {
      ind.classList.toggle('active', index === this.currentPhotoIndex);
    });
  },
  
  // 选择图片
  selectImage(imageId) {
    // 检查是否已选择
    if (AppState.selectedImages.includes(imageId)) {
      this.removePhoto(AppState.selectedImages.indexOf(imageId));
      return;
    }
    
    // 获取图片所属的景点 ID
    const imgData = this.landmarkImages.find(img => img.id === imageId);
    if (!imgData) return;
    
    // 检查该景点已选图片数量（最多 3 张）
    const checkpointImages = AppState.selectedImages.filter(id => {
      const img = this.landmarkImages.find(i => i.id === id);
      return img && img.checkpointId === imgData.checkpointId;
    });
    
    if (checkpointImages.length >= 3) {
      alert(`ℹ️ ${this.getCheckpointName(imgData.checkpointId)} 最多选择 3 张图片`);
      return;
    }
    
    // 添加图片
    AppState.selectedImages.push(imageId);
    this.currentPhotoIndex = AppState.selectedImages.length - 1;
    this.renderPhotoWall();
    this.saveShareData();
    
    // 滚动到最后
    const slider = document.getElementById('photo-slider');
    if (slider) {
      slider.scrollLeft = slider.scrollWidth;
    }
  },
  
  // 移除图片
  removePhoto(index) {
    AppState.selectedImages.splice(index, 1);
    if (this.currentPhotoIndex >= AppState.selectedImages.length) {
      this.currentPhotoIndex = Math.max(0, AppState.selectedImages.length - 1);
    }
    this.renderPhotoWall();
    this.saveShareData();
  },
  
  // 获取景点名称
  getCheckpointName(checkpointId) {
   const cp = AppState.mandatoryCheckpoints.find(cp => cp.id === checkpointId);
    return cp ? cp.name : '未知景点';
  },
  
  // 设置自定义文案
  setCustomText(text) {
    AppState.customShareText = text || null;
    this.renderShareText();
    this.saveShareData();
  },
  
  // 重置为随机文案
  resetToRandomText() {
    AppState.customShareText = null;
    this.renderShareText();
    this.saveShareData();
  },
  
  // 绑定分享事件
  bindShareEvents() {
    // 替换原来的上传按钮为图片选择区域
    const addBtnSection = document.getElementById('add-photo-btn');
    const photoInput = document.getElementById('photo-input');
    
    // 移除上传相关按钮（如果没有就不处理）
    if (addBtnSection) {
      addBtnSection.parentElement.innerHTML = `
        <div style="text-align:center;margin-top:20px;">
          <button class="action-btn" id="manage-images-btn" style="background:#168EEA;">
            📸 选择景点图片
          </button>
          <button class="action-btn" id="edit-text-btn" style="background:#2ecc71;margin-left:10px;">
            ✏️ 编辑文案
          </button>
        </div>
      `;
    }
    
    // 选择图片按钮
    document.getElementById('manage-images-btn').addEventListener('click', () => {
      this.openImageSelector();
    });
    
    // 编辑文案按钮
    document.getElementById('edit-text-btn').addEventListener('click', () => {
      this.openTextEditor();
    });
    
    // 滑动手势绑定
    const slider = document.getElementById('photo-slider');
    if (slider) {
      let startX, scrollLeft;
      
      slider.addEventListener('touchstart', (e) => {
        startX = e.touches[0].pageX;
        scrollLeft = slider.scrollLeft;
      });
      
      slider.addEventListener('touchmove', (e) => {
        const x = e.touches[0].pageX;
        const walk = (x - startX) * 2;
        slider.scrollLeft = scrollLeft - walk;
      });
    }
    
    // 保存到本地
    const saveBtn = document.getElementById('save-local-btn');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        this.saveToLocal();
      });
    }
    
    // 分享到其他渠道
    const shareBtn = document.getElementById('share-channel-btn');
    if (shareBtn) {
      shareBtn.addEventListener('click', () => {
        this.shareToChannel();
      });
    }
  },
  
  // 打开图片选择器
  openImageSelector() {
    const html = `
      <div class="image-selector-modal" style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);z-index:10001;overflow-y:auto;">
        <div style="background:white;min-height:100%;padding:20px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
            <h3 style="margin:0;font-size:18px;">📸 选择景点标志性图片</h3>
            <button onclick="document.querySelector('.image-selector-modal').remove()" style="background:#f5f5f5;border:none;border-radius:50%;width:36px;height:36px;font-size:20px;color:#666;cursor:pointer;">×</button>
          </div>
          
          <div style="margin-bottom:15px;">
            <p style="color:#666;font-size:14px;margin:0;">💡 每个景点最多选择 3 张图片，点击已选的图片可取消</p>
          </div>
          
          ${this.renderCheckpointImageSelector()}
          
          <div style="position:sticky;bottom:20px;margin-top:30px;text-align:center;">
            <button onclick="document.querySelector('.image-selector-modal').remove()" style="background:#168EEA;color:white;border:none;border-radius:10px;padding:14px 40px;font-size:16px;font-weight:600;cursor:pointer;">完成</button>
          </div>
        </div>
      </div>
    `;
    
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    document.body.appendChild(tempDiv);
  },
  
  // 渲染景点图片选择器
  renderCheckpointImageSelector() {
    let html = '';
    
    AppState.mandatoryCheckpoints.forEach(cp => {
      const images = this.landmarkImages.filter(img => img.checkpointId === cp.id);
      const selectedIds = AppState.selectedImages.filter(id => {
        const img = this.landmarkImages.find(i => i.id === id);
        return img && img.checkpointId === cp.id;
      });
      
      html += `
        <div class="checkpoint-images-section" style="margin-bottom:25px;">
          <h4 style="margin:0 0 15px 0;font-size:16px;display:flex;align-items:center;">
            <span style="margin-right:8px;">${cp.icon}</span>
            ${cp.name}
            <span style="margin-left:auto;font-size:12px;color:#666;">已选 ${selectedIds.length}/3</span>
          </h4>
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;">
            ${images.map(img => {
              const isSelected = AppState.selectedImages.includes(img.id);
              return `
                <div
                  class="image-item ${isSelected ? 'selected' : ''}"
                  onclick="ShareManager.selectImage('${img.id}')"
                  style="aspect-ratio:1;border-radius:8px;overflow:hidden;cursor:pointer;position:relative;border:3px solid ${isSelected ? '#168EEA' : '#e0e0e0'};"
                >
                  <img src="${img.url}" alt="${img.desc}" style="width:100%;height:100%;object-fit:cover;" />
                  ${isSelected ? '<div style="position:absolute;top:5px;right:5px;background:#168EEA;color:white;border-radius:50%;width:24px;height:24px;display:flex;align-items:center;justify-content:center;font-size:14px;">✓</div>' : ''}
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    });
    
    return html;
  },
  
  // 打开文案编辑器
  openTextEditor() {
    const currentText = document.getElementById('share-text').textContent;
    
    const html = `
      <div class="text-editor-modal" style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:10002;display:flex;justify-content:center;align-items:center;">
        <div style="background:white;border-radius:16px;padding:24px;width:90%;max-width:400px;">
          <h3 style="margin:0 0 20px 0;font-size:18px;text-align:center;">✏️ 编辑分享文案</h3>
          
          <textarea id="share-text-input" style="width:100%;min-height:120px;padding:12px;border:1px solid #ddd;border-radius:8px;font-size:14px;resize:vertical;font-family:inherit;" placeholder="输入分享文案...">${currentText}</textarea>
          
          <div style="margin-top:15px;display:flex;flex-direction:column;gap:10px;">
            <button id="save-custom-text-btn" style="background:#2ecc71;color:white;border:none;border-radius:8px;padding:12px;font-size:15px;font-weight:600;cursor:pointer;">💾 保存文案</button>
            <button id="reset-random-text-btn" style="background:#168EEA;color:white;border:none;border-radius:8px;padding:12px;font-size:15px;cursor:pointer;">🎲 换一句</button>
            <button onclick="document.querySelector('.text-editor-modal').remove()" style="background:#f5f5f5;color:#666;border:none;border-radius:8px;padding:12px;font-size:15px;cursor:pointer;">取消</button>
          </div>
        </div>
      </div>
    `;
    
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    document.body.appendChild(tempDiv);
    
    // 绑定保存按钮
    document.getElementById('save-custom-text-btn').onclick = () => {
      const text = document.getElementById('share-text-input').value.trim();
      if (text) {
        this.setCustomText(text);
      }
      document.querySelector('.text-editor-modal').remove();
    };
    
    // 绑定"换一句"按钮
    document.getElementById('reset-random-text-btn').onclick = () => {
      this.resetToRandomText();
      document.querySelector('.text-editor-modal').remove();
    };
  },
  
  // 保存到本地
  saveToLocal() {
    const currentPhoto = this.getCurrentPhoto();
    const text = document.getElementById('share-text').textContent;
    const timestamp = new Date().toLocaleString('zh-CN');
    
    if (currentPhoto) {
      // 保存照片
      const link = document.createElement('a');
      link.href = currentPhoto;
      link.download = `打卡照片_${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // 保存文案到单独文件
      const content = `🎉 趣玩重庆一日游 - 打卡分享

${text}

生成时间：${timestamp}
      `.trim();
      
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `打卡文案_${Date.now()}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      alert('✅ 已保存到本地！\n\n📷 照片：打卡照片_*.jpg\n📝 文案：打卡文案_*.txt');
    } else {
      // 只保存文案
      const content = `🎉 趣玩重庆一日游 - 打卡分享

${text}

生成时间：${timestamp}
      `.trim();
      
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `打卡文案_${Date.now()}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      alert('ℹ️ 暂无照片，已保存文案到本地！\n\n📝 打卡文案_*.txt');
    }
  },
  
  // 分享到其他渠道
  shareToChannel() {
    const text = document.getElementById('share-text').textContent;
    
    // 尝试使用系统分享
    if (navigator.share) {
      navigator.share({
        title: '追光打卡活动',
        text: text,
        url: window.location.href
      }).catch(err => {
        this.fallbackShare(text);
      });
    } else {
      this.fallbackShare(text);
    }
  },
  
  // 降级分享方案
  fallbackShare(text) {
    // 复制到剪贴板
    navigator.clipboard.writeText(text).then(() => {
      alert('✅ 分享文案已复制到剪贴板！\n\n您可以粘贴到微信、QQ 等任何地方分享。');
    }).catch(() => {
      // 如果剪贴板失败，选择文本
      const textElement = document.getElementById('share-text');
      const range = document.createRange();
      range.selectNode(textElement);
      window.getSelection().removeAllRanges();
      window.getSelection().addRange(range);
      alert('📋 请长按选择分享文案进行复制');
    });
  }
};

// ==================== 弹窗管理 ====================
const ModalManager = {
  // 显示打卡成功弹窗
  showCheckinSuccess(points) {
    const modal = document.getElementById('checkin-success-modal');
    const rewardPoints = modal.querySelector('.reward-points');
    rewardPoints.textContent = `+${points}`;
    
    // 检查是否需要显示成就提示
    const achievementTip = document.getElementById('achievement-tip');
    const tipDesc = document.getElementById('tip-desc');
    
    const newAchievement = AppState.achievements.find(a => 
      a.achieved && !a.notified
    );
    
    if (newAchievement) {
      achievementTip.style.display = 'block';
      const descriptions = {
        1: '🌶️ 已达成「山城萌新」成就',
        2: '🚝 已达成「雾都探索者」成就',
        3: '🌉 已达成「巴渝达人」成就',
        4: '🏆 已达成「重庆通」成就'
      };
      tipDesc.textContent = descriptions[newAchievement.stage];
      newAchievement.notified = true;
    } else {
      achievementTip.style.display = 'none';
    }
    
    modal.classList.add('show');
    
    document.getElementById('close-modal-btn').onclick = () => {
      modal.classList.remove('show');
    };
  },
  
  // 显示兑奖信息
  showRedeemInfo(description) {
    const modal = document.getElementById('redeem-modal');
    document.getElementById('redeem-desc').textContent = description;
    modal.classList.add('show');
    
    document.getElementById('close-redeem-modal-btn').onclick = () => {
      modal.classList.remove('show');
    };
  },
  
  // 显示兑奖确认
  showRedeemConfirm(stage, achievementName) {
    const modal = document.getElementById('redeem-confirm-modal');
    
    // 生成 QR 码（这里用简单的占位符，实际可以用 QR 码库）
    const qrCode = document.getElementById('qr-code');
    qrCode.innerHTML = `
      <div style="text-align: center;">
        <div style="font-size: 80px;">📱</div>
        <p style="color: #999; font-size: 12px; margin-top: 10px;">
          兑奖码：${stage}-${Date.now().toString(36).toUpperCase()}
        </p>
      </div>
    `;
    
    document.getElementById('redeem-achievement').textContent = achievementName;
    modal.classList.add('show');
    
    // 确认按钮
    document.getElementById('confirm-redeem-btn').onclick = () => {
      PrizeManager.confirmRedeem(stage);
      modal.classList.remove('show');
    };
    
    // 取消按钮
    document.getElementById('cancel-redeem-btn').onclick = () => {
      modal.classList.remove('show');
    };
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
  
  // 等待 Supabase 客户端就绪
  await new Promise(resolve => setTimeout(resolve, 100));
  
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
  
  // 5. 初始化分享管理（异步，需要等待 Supabase）
  try {
    await ShareManager.init();
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