// 打卡活动 H5 - 主逻辑
// 版本：完整动画导航 + 地图标记 + 点位列表 + 15 选 3 分享功能

// ==================== 数据状态 ====================
const AppState = {
  userId: null,
  points: 0,
  checkedCheckpoints: [],
  
  // 必打卡点（5 个核心打卡点）
  mandatoryCheckpoints: [
    { id: 1, name: '解放碑步行街', icon: '🏢', points: 15, checked: false, time: '8:00-9:30', period: '上午', desc: '重庆市渝中区解放碑商业步行街', address: '重庆市渝中区解放碑商业步行街', pos: { left: '18%', top: '32%' } },
    { id: 2, name: '李子坝轻轨站', icon: '🚝', points: 15, checked: false, time: '9:30-10:30', period: '上午', desc: '轻轨 2 号线穿楼而过的奇观', address: '重庆市渝中区李子坝正站', pos: { left: '78%', top: '38%' } },
    { id: 3, name: '鹅岭二厂文创园', icon: '🎨', points: 10, checked: false, time: '10:30-12:00', period: '上午', desc: '文艺青年必去的文创园', address: '重庆市渝中区鹅岭正街 1 号', pos: { left: '25%', top: '45%' } },
    { id: 4, name: '南山一棵树观景台', icon: '🌳', points: 15, checked: false, time: '19:00-20:30', period: '晚上', desc: '俯瞰重庆夜景的最佳位置', address: '重庆市南岸区南山公园路', pos: { left: '65%', top: '70%' } },
    { id: 5, name: '洪崖洞 + 千厮门大桥', icon: '🌉', points: 15, checked: false, time: '20:30-22:00', period: '晚上', desc: '现实版千与千寻', address: '重庆市渝中区沧白路', pos: { left: '45%', top: '25%' } }
  ],
  
  // 普通打卡点
  normalCheckpoints: [
    { id: 6, name: '磁器口古镇', icon: '⛩️', points: 5, checked: false, address: '重庆市沙坪坝区磁器口' },
    { id: 7, name: '白公馆', icon: '🏛️', points: 5, checked: false, address: '重庆市沙坪坝区壮志路' },
    { id: 8, name: '渣滓洞', icon: '⛏️', points: 5, checked: false, address: '重庆市沙坪坝区渣滓洞' },
    { id: 9, name: '四川美术学院', icon: '🎨', points: 5, checked: false, address: '重庆市九龙坡区黄桷坪' },
    { id: 10, name: '长江索道', icon: '🚠', points: 5, checked: false, address: '重庆市渝中区长江滨江路' },
    { id: 11, name: '朝天门广场', icon: '⛴️', points: 5, checked: false, address: '重庆市渝中区朝千路' },
    { id: 12, name: '一棵树夜景', icon: '🌃', points: 5, checked: false, address: '重庆市南岸区龙黄公路' }
  ],
  
  // 奖品配置
  prizes: [
    { id: 1, name: '重庆文创纪念品', points: 20, vouchers: [], icon: '🧸' },
    { id: 2, name: '网红奶茶券', points: 40, vouchers: [], icon: '🧋' },
    { id: 3, name: '火锅代金券', points: 80, vouchers: [], icon: '🍲' },
    { id: 4, name: '神秘大奖', points: 120, vouchers: [], icon: '🎁' }
  ],
  
  // 分享相关
  selectedImages: [],
  customShareText: null
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

// ==================== 打卡点管理 ====================
const CheckpointManager = {
  // 渲染地图标记
  renderMap() {
    const mapWrapper = document.getElementById('checkin-map');
    if (!mapWrapper) return;
    
    const bgElement = mapWrapper.querySelector('.map-background');
    const mapImage = mapWrapper.querySelector('.map-image');
    mapWrapper.innerHTML = '';
    if (bgElement) mapWrapper.appendChild(bgElement);
    if (mapImage) mapWrapper.appendChild(mapImage);
    
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
  
  // 渲染打卡点列表
  renderCheckpointList() {
    const container = document.getElementById('mandatory-checkpoints');
    if (!container) return;
    
    let html = '';
    AppState.mandatoryCheckpoints.forEach(cp => {
      html += `
        <div class="checkpoint-item ${cp.checked ? 'checked' : ''}" data-id="${cp.id}">
          <div class="checkpoint-icon">${cp.icon}</div>
          <div class="checkpoint-info">
            <div class="checkpoint-name">${cp.name}</div>
            <div class="checkpoint-desc">${cp.desc}</div>
            <div class="checkpoint-time">${cp.time}</div>
          </div>
          <button class="checkin-btn ${cp.checked ? 'checked' : ''}" onclick="CheckpointManager.toggleCheckin(${cp.id})">
            ${cp.checked ? '✅ 已打卡' : '📍 打卡'}
          </button>
        </div>
      `;
    });
    container.innerHTML = html;
  },
  
  // 打卡/取消打卡
  toggleCheckin(id) {
    const cp = AppState.mandatoryCheckpoints.find(c => c.id === id);
    if (!cp) return;
    
    cp.checked = !cp.checked;
    if (cp.checked) {
      AppState.points += cp.points;
      AppState.checkedCheckpoints.push(cp.id);
    } else {
      AppState.points -= cp.points;
      const idx = AppState.checkedCheckpoints.indexOf(cp.id);
      if (idx > -1) AppState.checkedCheckpoints.splice(idx, 1);
    }
    
    this.renderMap();
    this.renderCheckpointList();
    PageManager.updateAllDisplays();
  },
  
  // 打开导航
  openNavigation(checkpoint) {
    const destName = encodeURIComponent(checkpoint.name);
    const destAddress = encodeURIComponent(checkpoint.address);
    const navUrl = `https://uri.amap.com/navigation?to=${destAddress}&toName=${destName}&from=0&dev=0`;
    
    if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
      window.location.href = navUrl;
    } else {
      window.open(navUrl, '_blank');
    }
  },
  
  // 处理 URL 打卡参数
  handleCheckinFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const checkinId = urlParams.get('checkin');
    if (!checkinId) return;
    
    const index = parseInt(checkinId) - 1;
    if (index >= 0 && index < AppState.mandatoryCheckpoints.length) {
      const cp = AppState.mandatoryCheckpoints[index];
      if (!cp.checked) {
        cp.checked = true;
        AppState.points += cp.points;
        AppState.checkedCheckpoints.push(cp.id);
        this.renderMap();
        this.renderCheckpointList();
        PageManager.updateAllDisplays();
      }
    }
  }
};

// ==================== 页面管理 ====================
const PageManager = {
  switchPage(pageName) {
    const pages = document.querySelectorAll('.page');
    const navItems = document.querySelectorAll('.nav-item');
    
    pages.forEach(p => {
      p.classList.remove('active');
      if (p.id === `${pageName}-page`) {
        p.classList.add('active');
      }
    });
    
    navItems.forEach(item => {
      item.classList.remove('active');
      if (item.dataset.page === pageName) {
        item.classList.add('active');
      }
    });
    
    if (pageName === 'prize') {
      setTimeout(() => PrizeManager.updatePrizeCards(), 100);
    } else if (pageName === 'share') {
      setTimeout(() => ShareManager.updateShareContent(), 100);
    } else if (pageName === 'checkpoint') {
      setTimeout(() => CheckpointManager.renderCheckpointList(), 100);
    }
    
    if (window.history.pushState) {
      window.history.pushState({ page: pageName }, '', `${window.location.pathname}?page=${pageName}`);
    }
  },
  
  bindNavEvents() {
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', () => {
        this.switchPage(item.dataset.page);
      });
    });
    
    window.addEventListener('popstate', (event) => {
      if (event.state && event.state.page) {
        this.switchPage(event.state.page);
      }
    });
  },
  
  updateAllDisplays() {
    const totalPoints = document.getElementById('total-points');
    if (totalPoints) totalPoints.textContent = AppState.points;
    CheckpointManager.renderMap();
  }
};

// ==================== 奖品管理 ====================
const PrizeManager = {
  updatePrizeCards() {
    AppState.prizes.forEach((prize, index) => {
      const card = document.getElementById(`prize-card-${index + 1}`);
      if (!card) return;
      
      const canRedeem = AppState.points >= prize.points;
      const btn = card.querySelector('.redeem-btn');
      const ptsEl = card.querySelector('.prize-points');
      const nameEl = card.querySelector('.prize-name');
      const iconEl = card.querySelector('.prize-icon');
      
      if (ptsEl) ptsEl.textContent = `${prize.points} 积分`;
      if (nameEl) nameEl.textContent = prize.name;
      if (iconEl) iconEl.textContent = prize.icon;
      
      if (btn) {
        btn.disabled = !canRedeem;
        btn.textContent = canRedeem ? '立即兑奖' : '积分不足';
      }
    });
  }
};

// ==================== 分享管理（15 张图选 3 张） ====================
const ShareManager = {
  checkpoints: [
    { id: 1, name: '解放碑', icon: '🏢' },
    { id: 2, name: '李子坝', icon: '🚝' },
    { id: 3, name: '二厂', icon: '🎨' },
    { id: 4, name: '南山', icon: '🌳' },
    { id: 5, name: '洪崖洞', icon: '🌉' }
  ],
  
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
    '我在"趣玩重庆一日游"打卡活动中，已经获得 {points} 积分！',
    '🎉 重庆一日游太好玩了！打卡了 {points} 积分！',
    '🎊 山城重庆之旅完美收官！{points} 积分到手！',
    '🌟 打卡重庆成功！{points} 积分见证旅程！',
    '✨ 重庆一日游完美收官！{points} 积分解锁！',
    '🎈 8D 魔幻城市！{points} 积分打卡成功！',
    '💫 山城打卡完成！{points} 积分收入囊中！',
    '🌈 雾都探索完成！{points} 积分到手！'
  ],
  
  init() {
    this.loadShareData();
    this.bindShareEvents();
  },
  
  loadShareData() {
    const saved = localStorage.getItem('share_data');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        AppState.selectedImages = data.selectedImages || [];
        AppState.customShareText = data.customShareText || null;
      } catch(e) {}
    }
  },
  
  saveShareData() {
    localStorage.setItem('share_data', JSON.stringify({
      selectedImages: AppState.selectedImages,
      customShareText: AppState.customShareText
    }));
  },
  
  updateShareContent() {
    const ptsEl = document.getElementById('share-points');
    if (ptsEl) ptsEl.textContent = AppState.points;
    this.renderSelectedPhotos();
    this.renderLandmarkImages();
    this.renderShareText();
  },
  
  renderSelectedPhotos() {
    const slider = document.getElementById('photo-slider');
    const indicators = document.getElementById('photo-indicators');
    const countEl = document.getElementById('selected-count');
    if (!slider || !countEl) return;
    
    countEl.innerHTML = `已选择 <span class="count-num">${AppState.selectedImages.length}</span>/3 张图片`;
    
    if (AppState.selectedImages.length === 0) {
      slider.style.display = 'none';
      if (indicators) indicators.style.display = 'none';
      return;
    }
    
    slider.style.display = 'flex';
    if (indicators) indicators.style.display = 'flex';
    
    slider.innerHTML = AppState.selectedImages.map((imgId, idx) => {
      const img = this.defaultImages.find(i => i.id === imgId);
      return `
        <div class="photo-slide">
          <img src="${img ? img.url : ''}" />
          <button class="photo-delete" onclick="ShareManager.removePhoto(${idx})">×</button>
        </div>
      `;
    }).join('');
    
    if (indicators) {
      indicators.innerHTML = AppState.selectedImages.map((_, idx) => 
        `<div class="indicator ${idx === 0 ? 'active' : ''}"></div>`
      ).join('');
    }
  },
  
  renderLandmarkImages() {
    const container = document.getElementById('checkpoint-groups');
    if (!container) return;
    
    let html = '';
    this.checkpoints.forEach(cp => {
      const imgs = this.defaultImages.filter(img => img.checkpointId === cp.id);
      html += `
        <div class="checkpoint-group">
          <div class="checkpoint-group-title">${cp.icon} ${cp.name}</div>
          <div class="checkpoint-images">
      `;
      imgs.forEach(img => {
        const isSelected = AppState.selectedImages.includes(img.id);
        html += `
          <div class="checkpoint-img ${isSelected ? 'selected' : ''}" data-imgid="${img.id}" onclick="ShareManager.toggleImage('${img.id}')">
            <img src="${img.url}" />
            <div class="checkmark">✓</div>
          </div>
        `;
      });
      html += `</div></div>`;
    });
    container.innerHTML = html;
  },
  
  toggleImage(imageId) {
    const index = AppState.selectedImages.indexOf(imageId);
    if (index >= 0) {
      AppState.selectedImages.splice(index, 1);
    } else {
      if (AppState.selectedImages.length >= 3) {
        alert('ℹ️ 最多只能选择 3 张图片');
        return;
      }
      AppState.selectedImages.push(imageId);
    }
    this.renderSelectedPhotos();
    this.renderLandmarkImages();
    this.saveShareData();
  },
  
  removePhoto(index) {
    AppState.selectedImages.splice(index, 1);
    this.renderSelectedPhotos();
    this.renderLandmarkImages();
    this.saveShareData();
  },
  
  renderShareText() {
    const el = document.getElementById('share-text');
    if (!el) return;
    let text = AppState.customShareText;
    if (!text) {
      const random = this.defaultTexts[Math.floor(Math.random() * this.defaultTexts.length)];
      text = random.replace('{points}', AppState.points.toString());
    }
    el.textContent = text;
  },
  
  bindShareEvents() {
    const editBtn = document.getElementById('edit-share-text-btn');
    if (editBtn) {
      editBtn.onclick = () => {
        const text = prompt('请输入分享文案：', AppState.customShareText || '');
        if (text !== null) {
          AppState.customShareText = text || null;
          this.renderShareText();
          this.saveShareData();
        }
      };
    }
    
    const saveBtn = document.getElementById('save-share-btn');
    if (saveBtn) {
      saveBtn.onclick = () => {
        if (AppState.selectedImages.length === 0) {
          alert('ℹ️ 请至少选择 1 张图片');
          return;
        }
        this.saveShareData();
        alert('✅ 分享已保存！');
      };
    }
    
    const shareBtn = document.getElementById('share-channel-btn');
    if (shareBtn) {
      shareBtn.onclick = () => {
        alert('📤 复制下方文案，分享到微信/朋友圈！\n\n' + document.getElementById('share-text').textContent);
      };
    }
  }
};

// ==================== 初始化 ====================
document.addEventListener('DOMContentLoaded', async () => {
  console.log('🚀 重庆打卡活动初始化...');
  console.log('='.repeat(50));
  
  try {
    await SupabaseManager.init();
  } catch(e) {
    console.error('❌ SupabaseManager:', e);
  }
  
  PageManager.bindNavEvents();
  CheckpointManager.renderMap();
  console.log('✅ 地图标记渲染完成');
  
  PrizeManager.updatePrizeCards();
  console.log('✅ PrizeManager 完成');
  
  ShareManager.init();
  console.log('✅ ShareManager 完成');
  
  CheckpointManager.handleCheckinFromURL();
  PageManager.updateAllDisplays();
  
  console.log('='.repeat(50));
  console.log('🎉 初始化完成！');
  console.log('👤 用户 ID:', AppState.userId);
  console.log('📊 当前积分:', AppState.points);
  console.log('📍 已打卡:', AppState.checkedCheckpoints.length, '个点');
  console.log('='.repeat(50));
});