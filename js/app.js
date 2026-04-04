// ==================== 分享管理 - 重写版本 ====================
const ShareManager = {
  currentPhotoIndex: 0,
  landmarkImages: [],
  shareTexts: [],
  
  // 默认图片
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
  
  checkpoints: [
    { id: 1, name: '解放碑步行街', icon: '🏢' },
    { id: 2, name: '李子坝轻轨站', icon: '🚝' },
    { id: 3, name: '鹅岭二厂文创园', icon: '🎨' },
    { id: 4, name: '南山一棵树观景台', icon: '🌳' },
    { id: 5, name: '洪崖洞 + 千厮门大桥', icon: '🌉' }
  ],
  
  async init() {
    AppState.selectedImages = [];
    AppState.customShareText = null;
    await this.loadShareResources();
    this.loadShareData();
    this.renderSelectedPhotos();
    this.renderLandmarkImages();
    this.renderShareText();
    this.bindShareEvents();
  },
  
  async loadShareResources() {
    try {
      const client = window.supabaseClient;
      if (!client) {
        this.landmarkImages = this.defaultImages.slice();
        this.shareTexts = this.defaultTexts.slice();
        return;
      }
      const { data, error } = await client.from('share_resources').select('data').eq('type', 'share').single();
      if (error || !data) {
        this.landmarkImages = this.defaultImages.slice();
        this.shareTexts = this.defaultTexts.slice();
      } else {
        this.landmarkImages = data.data.images || this.defaultImages.slice();
        this.shareTexts = data.data.texts || this.defaultTexts.slice();
      }
    } catch (e) {
      this.landmarkImages = this.defaultImages.slice();
      this.shareTexts = this.defaultTexts.slice();
    }
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
  
  // 渲染已选择的照片
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
      const img = this.landmarkImages.find(i => i.id === imgId);
      return `
        <div class="photo-slide">
          <img src="${img ? img.url : ''}" />
          <button class="photo-delete" onclick="ShareManager.removePhoto(${idx})">×</button>
        </div>
      `;
    }).join('');
    
    if (indicators) {
      indicators.innerHTML = AppState.selectedImages.map((_, idx) => 
        `<div class="indicator ${idx === this.currentPhotoIndex ? 'active' : ''}"></div>`
      ).join('');
    }
  },
  
  // 渲染 15 张景点图片供选择
  renderLandmarkImages() {
    const container = document.getElementById('checkpoint-groups');
    if (!container) return;
    
    let html = '';
    this.checkpoints.forEach(cp => {
      const imgs = this.landmarkImages.filter(img => img.checkpointId === cp.id);
      html += `
        <div class="checkpoint-group">
          <div class="checkpoint-group-title">${cp.icon} ${cp.name}</div>
          <div class="checkpoint-images">
      `;
      imgs.forEach(img => {
        const isSelected = AppState.selectedImages.includes(img.id);
        html += `
          <div class="checkpoint-img ${isSelected ? 'selected' : ''}" data-imgid="${img.id}" onclick="ShareManager.toggleImage('${img.id}')">
            <img src="${img.url}" onerror="this.src='data:image/svg+xml,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'100\\' height=\\'100\\'><rect fill=\\'%23ddd\\' width=\\'100\\' height=\\'100\\'/><text x=\\'50\\' y=\\'50\\' text-anchor=\\'middle\\' fill=\\'%23999\\'>图片</text></svg>'" />
            <div class="checkmark">✓</div>
          </div>
        `;
      });
      html += `</div></div>`;
    });
    container.innerHTML = html;
  },
  
  // 切换图片选择
  toggleImage(imageId) {
    const index = AppState.selectedImages.indexOf(imageId);
    
    if (index >= 0) {
      // 取消选择
      AppState.selectedImages.splice(index, 1);
    } else {
      // 选择新图片
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
  
  // 移除已选择的图片
  removePhoto(index) {
    AppState.selectedImages.splice(index, 1);
    if (this.currentPhotoIndex >= AppState.selectedImages.length) {
      this.currentPhotoIndex = Math.max(0, AppState.selectedImages.length - 1);
    }
    this.renderSelectedPhotos();
    this.renderLandmarkImages();
    this.saveShareData();
  },
  
  renderShareText() {
    const el = document.getElementById('share-text');
    if (!el) return;
    
    let text = AppState.customShareText;
    if (!text) {
      const random = this.shareTexts[Math.floor(Math.random() * this.shareTexts.length)];
      text = random.replace('{points}', AppState.points);
    }
    el.textContent = text;
  },
  
  bindShareEvents() {
    // 编辑文案
    const editBtn = document.getElementById('edit-share-text-btn');
    if (editBtn) {
      editBtn.onclick = () => {
        const text = prompt('请输入分享文案：', AppState.customShareText || '');
        if (text !== null) {
          this.setCustomText(text || null);
        }
      };
    }
    
    // 保存分享
    const saveBtn = document.getElementById('save-share-btn');
    if (saveBtn) {
      saveBtn.onclick = () => {
        if (AppState.selectedImages.length === 0) {
          alert('ℹ️ 请至少选择 1 张图片');
          return;
        }
        this.saveShareData();
        alert('✅ 分享已保存！');
        
        // 可以触发分享流程
        if (navigator.share) {
          navigator.share({
            title: '重庆打卡',
            text: document.getElementById('share-text').textContent,
          }).catch(() => {});
        }
      };
    }
    
    // 分享到其他渠道
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