// ==================== 应用状态管理 ====================
const AppState = {
  userId: null,
  points: 0,
  checkedCheckpoints: [],
  achievements: [],
  selectedImages: [],
  customShareText: null,
  
  // 必打卡点
  mandatoryCheckpoints: [
    { id: 1, name: '解放碑步行街', icon: '🏢', lat: 29.557849, lng: 106.577736, points: 5, checked: false },
    { id: 2, name: '李子坝轻轨站', icon: '🚝', lat: 29.556876, lng: 106.537612, points: 3, checked: false },
    { id: 3, name: '鹅岭二厂文创园', icon: '🎨', lat: 29.559523, lng: 106.551849, points: 2, checked: false },
    { id: 4, name: '南山一棵树观景台', icon: '🌳', lat: 29.554078, lng: 106.592418, points: 3, checked: false },
    { id: 5, name: '洪崖洞 + 千厮门大桥', icon: '🌉', lat: 29.564864, lng: 106.579963, points: 4, checked: false }
  ],
  
  // 普通打卡点
  normalCheckpoints: [
    { id: 6, name: '磁器口古镇', icon: '⛩️', lat: 29.579833, lng: 106.450806, points: 1, checked: false },
    { id: 7, name: '白公馆', icon: '🏛️', lat: 29.572083, lng: 106.432915, points: 1, checked: false },
    { id: 8, name: '渣滓洞', icon: '⛏️', lat: 29.574871, lng: 106.434875, points: 1, checked: false },
    { id: 9, name: '四川美术学院', icon: '🎨', lat: 29.558953, lng: 106.552654, points: 1, checked: false },
    { id: 10, name: '长江索道', icon: '🚠', lat: 29.568776, lng: 106.584738, points: 1, checked: false },
    { id: 11, name: '朝天门广场', icon: '⛴️', lat: 29.565823, lng: 106.588576, points: 1, checked: false },
    { id: 12, name: '一棵树夜景', icon: '🌃', lat: 29.554346, lng: 106.592267, points: 1, checked: false }
  ],
  
  // 奖品配置
  prizes: [
    { id: 1, name: '重庆文创纪念品', points: 5, vouchers: [], icon: '🧸' },
    { id: 2, name: '网红奶茶券', points: 10, vouchers: [], icon: '🧋' },
    { id: 3, name: '火锅代金券', points: 20, vouchers: [], icon: '🍲' },
    { id: 4, name: '神秘大奖', points: 30, vouchers: [], icon: '🎁' }
  ]
};

// ==================== Supabase 管理 ====================
const SupabaseManager = {
  supabaseUrl: 'https://ussvekkgyntubivhfext.supabase.co',
  supabaseKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVzc3Zla2tneW50dWJpdmhmZXh0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTEwODQwMiwiZXhwIjoyMDkwNjg0NDAyfQ.i1fbQC96UGnToKL6fa7GTfaMtt0s_TGpNNR0xb3ufR0',
  supabase: null,
  userId: null,
  
  async init() {
    if (typeof supabase !== 'undefined') {
      this.supabase = supabase.createClient(this.supabaseUrl, this.supabaseKey);
      window.supabaseClient = this.supabase;
      await this.getUserId();
    } else {
      this.userId = 'local_' + Date.now();
    }
    AppState.userId = this.userId;
  },
  
  async getUserId() {
    this.userId = 'user_' + Date.now();
    return this.userId;
  }
};

// ==================== 页面管理 ====================
const PageManager = {
  switchPage(pageName) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    
    const targetPage = document.getElementById(pageName + '-page');
    if (targetPage) targetPage.classList.add('active');
    
    const navItem = document.querySelector(`.nav-item[data-page="${pageName}"]`);
    if (navItem) navItem.classList.add('active');
    
    if (navigator.vibrate) navigator.vibrate(10);
    
    if (pageName === 'share' && window.ShareManager) {
      setTimeout(() => ShareManager.renderSelectedPhotos(), 100);
    }
    
    if (window.history.pushState) {
      window.history.pushState({page: pageName}, '', `?page=${pageName}`);
    }
  },
  
  bindNavEvents() {
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', () => {
        this.switchPage(item.dataset.page);
      });
    });
  },
  
  updateAllDisplays() {
    const totalPoints = document.getElementById('total-points');
    if (totalPoints) totalPoints.textContent = AppState.points;
  }
};

// ==================== 打卡点管理 ====================
const CheckpointManager = {
  renderCheckpointList() {
    const list = document.getElementById('checkpoint-list');
    if (!list) return;
    
    let html = '<h3>必打卡点</h3>';
    AppState.mandatoryCheckpoints.forEach(cp => {
      html += `
        <div class="checkpoint-item ${cp.checked ? 'checked' : ''}" data-id="${cp.id}">
          <div class="checkpoint-info">
            <div class="checkpoint-icon">${cp.icon}</div>
            <div class="checkpoint-details">
              <div class="checkpoint-name">${cp.name}</div>
              <div class="checkpoint-points">${cp.points} 积分</div>
            </div>
          </div>
          <button class="checkin-btn ${cp.checked ? 'checked' : ''}" onclick="CheckpointManager.toggleCheckin(${cp.id}, 'mandatory')">
            ${cp.checked ? '✅' : '📍'}
          </button>
        </div>
      `;
    });
    
    html += '<h3 style="margin-top:20px;">普通打卡点</h3>';
    AppState.normalCheckpoints.forEach(cp => {
      html += `
        <div class="checkpoint-item ${cp.checked ? 'checked' : ''}" data-id="${cp.id}">
          <div class="checkpoint-info">
            <div class="checkpoint-icon">${cp.icon}</div>
            <div class="checkpoint-details">
              <div class="checkpoint-name">${cp.name}</div>
              <div class="checkpoint-points">${cp.points} 积分</div>
            </div>
          </div>
          <button class="checkin-btn ${cp.checked ? 'checked' : ''}" onclick="CheckpointManager.toggleCheckin(${cp.id}, 'normal')">
            ${cp.checked ? '✅' : '📍'}
          </button>
        </div>
      `;
    });
    
    list.innerHTML = html;
  },
  
  toggleCheckin(id, type) {
    const checkpoints = type === 'mandatory' ? AppState.mandatoryCheckpoints : AppState.normalCheckpoints;
    const cp = checkpoints.find(c => c.id === id);
    if (!cp) return;
    
    cp.checked = !cp.checked;
    
    if (cp.checked) {
      AppState.points += cp.points;
      AppState.checkedCheckpoints.push(id);
      if (navigator.vibrate) navigator.vibrate(50);
    } else {
      AppState.points -= cp.points;
      const idx = AppState.checkedCheckpoints.indexOf(id);
      if (idx > -1) AppState.checkedCheckpoints.splice(idx, 1);
    }
    
    this.renderCheckpointList();
    PageManager.updateAllDisplays();
  },
  
  getCheckedCount() {
    return [...AppState.mandatoryCheckpoints, ...AppState.normalCheckpoints].filter(c => c.checked).length;
  }
};

// ==================== 奖品管理 ====================
const PrizeManager = {
  updatePrizeCards() {
    const cards = document.querySelectorAll('.prize-card');
    cards.forEach((card, idx) => {
      const prize = AppState.prizes[idx];
      if (!prize) return;
      
      const ptsEl = card.querySelector('.prize-points');
      const nameEl = card.querySelector('.prize-name');
      const iconEl = card.querySelector('.prize-icon');
      
      if (ptsEl) ptsEl.textContent = `${prize.points} 积分`;
      if (nameEl) nameEl.textContent = prize.name;
      if (iconEl) iconEl.textContent = prize.icon;
    });
  },
  
  updateVoucherList() {
    const list = document.getElementById('voucher-list');
    if (!list) return;
    list.innerHTML = '<p class="empty-tip">暂无可用兑奖券</p>';
  }
};

// ==================== 分享管理 ====================
const ShareManager = {
  checkpoints: [
    { id: 1, name: '解放碑步行街', icon: '🏢' },
    { id: 2, name: '李子坝轻轨站', icon: '🚝' },
    { id: 3, name: '鹅岭二厂文创园', icon: '🎨' },
    { id: 4, name: '南山一棵树观景台', icon: '🌳' },
    { id: 5, name: '洪崖洞 + 千厮门大桥', icon: '🌉' }
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
  
  async init() {
    AppState.selectedImages = [];
    AppState.customShareText = null;
    this.loadShareData();
    this.renderSelectedPhotos();
    this.renderLandmarkImages();
    this.renderShareText();
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
      text = random.replace('{points}', AppState.points);
    }
    el.textContent = text;
  },
  
  bindShareEvents() {
    const editBtn = document.getElementById('edit-share-text-btn');
    if (editBtn) {
      editBtn.onclick = () => {
        const text = prompt('请输入分享文案：', AppState.customShareText || '');
        if (text !== null) this.setCustomText(text || null);
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
  },
  
  setCustomText(text) {
    AppState.customShareText = text;
    this.renderShareText();
    this.saveShareData();
  }
};

// ==================== 初始化 ====================
document.addEventListener('DOMContentLoaded', async () => {
  console.log('🚀 重庆打卡活动初始化...');
  
  await SupabaseManager.init();
  PageManager.bindNavEvents();
  CheckpointManager.renderCheckpointList();
  PrizeManager.updatePrizeCards();
  PrizeManager.updateVoucherList();
  await ShareManager.init();
  
  PageManager.updateAllDisplays();
  
  const urlParams = new URLSearchParams(window.location.search);
  const page = urlParams.get('page') || 'home';
  PageManager.switchPage(page);
  
  console.log('✅ 初始化完成！');
  console.log('👤 用户 ID:', AppState.userId);
  console.log('📊 当前积分:', AppState.points);
});