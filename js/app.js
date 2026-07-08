/**
 * C投篮训练助手 - 主应用
 * 整合 basketball-shot-tracker 核心代码
 */
class ShotTrainerApp {
    constructor() {
        // 状态
        this.isRunning = false;
        this.isPaused = false;
        this.videoReady = false;
        this.markingMode = false;
        this.fps = 0;
        this.frameCount = 0;
        this.lastFpsUpdate = 0;

        // 计时器
        this.timerInterval = null;
        this.elapsedSeconds = 0;
        this.sessionStartTime = null;

        // 初始化
        this.init();
    }

    async init() {
        console.log('C投篮训练助手初始化中...');

        try {
            if (document.readyState === 'loading') {
                await new Promise(resolve => document.addEventListener('DOMContentLoaded', resolve));
            }

            this.cacheElements();
            this.bindEvents();

            // 检查浏览器兼容性
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                this.showStatus('❌ 浏览器不支持摄像头访问', 'error');
                return;
            }

            // 初始化 AI 模型
            await this.initModels();

            // 初始化可视化
            Visualization.initPieChart();

            // 尝试加载已保存的篮筐位置
            const savedHoop = CourtMapper.loadSavedHoopPosition();
            if (savedHoop) {
                this.showStatus(`已加载篮筐位置 (${Math.round(savedHoop.x)}, ${Math.round(savedHoop.y)})`, 'info');
                Visualization.drawCourtView();
            }

            // 初始化视频处理器
            const video = this.elements.video;
            const canvas = this.elements.overlayCanvas;
            VideoProcessor.init(video, canvas);

            // 初始绘制
            Visualization.drawCourtView();
            this.hideLoading();

            console.log('初始化完成');

        } catch (error) {
            console.error('初始化失败:', error);
            this.showStatus('初始化失败: ' + error.message, 'error');
        }
    }

    async initModels() {
        const statusText = this.elements.statusText;
        this.showLoading('正在加载 AI 模型...');

        let loadAttempts = 0;
        const maxAttempts = 3;

        const tryLoadModels = async () => {
            try {
                loadAttempts++;
                this.updateLoadingStatus(`加载中... (${loadAttempts}/${maxAttempts})`);

                const success = await Detection.init((msg) => {
                    this.updateLoadingStatus(msg);
                });

                if (!success) {
                    throw new Error('模型初始化失败');
                }

                return true;
            } catch (error) {
                console.error('模型加载错误:', error);

                if (loadAttempts < maxAttempts) {
                    this.updateLoadingStatus(`加载失败，重试中... (${loadAttempts}/${maxAttempts})`);
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    return tryLoadModels();
                } else {
                    this.updateLoadingStatus('❌ 模型加载失败');
                    return false;
                }
            }
        };

        const modelsLoaded = await tryLoadModels();

        if (!modelsLoaded) {
            return false;
        }

        this.updateLoadingStatus('✓ AI 模型就绪');
        return true;
    }

    cacheElements() {
        // 视频元素
        this.elements = {
            video: document.getElementById('video'),
            overlayCanvas: document.getElementById('overlayCanvas'),
            fileInput: document.getElementById('fileInput'),

            // 控制按钮
            cameraBtn: document.getElementById('cameraBtn'),
            cameraSelect: document.getElementById('cameraSelect'),
            switchCameraBtn: document.getElementById('switchCameraBtn'),
            fullscreenBtn: document.getElementById('fullscreenBtn'),
            setHoopBtn: document.getElementById('setHoopBtn'),

            // 状态显示
            fpsDisplay: document.getElementById('fpsDisplay'),
            statusBanner: document.getElementById('statusBanner'),
            statusText: document.getElementById('statusText'),
            loadingStatus: document.getElementById('loadingStatus'),

            // 投篮指示器
            shotIndicator: document.getElementById('shotIndicator'),
            shotIcon: document.getElementById('shotIcon'),
            shotText: document.getElementById('shotText'),

            // 加载
            loadingOverlay: document.getElementById('loadingOverlay'),

            // 统计数据
            statHit: document.getElementById('statHit'),
            statTotal: document.getElementById('statTotal'),
            statPct: document.getElementById('statPct'),
            timerValue: document.getElementById('timerValue'),
            progressFill: document.getElementById('progressFill'),
            shotsLog: document.getElementById('shotsLog'),

            // 热力图
            courtCanvas: document.getElementById('courtCanvas'),

            // 动作按钮
            startBtn: document.getElementById('startBtn'),
            pauseBtn: document.getElementById('pauseBtn'),
            resetBtn: document.getElementById('resetBtn'),
            exportBtn: document.getElementById('exportBtn'),

            // 弹窗
            confirmModal: document.getElementById('confirmModal'),
            historyModal: document.getElementById('historyModal'),
            helpModal: document.getElementById('helpModal'),
            historyBtn: document.getElementById('historyBtn'),
            helpBtn: document.getElementById('helpBtn'),
            closeConfirmModal: document.getElementById('closeConfirmModal'),
            btnConfirmHit: document.getElementById('btnConfirmHit'),
            btnConfirmMiss: document.getElementById('btnConfirmMiss'),

            // 历史
            historyList: document.getElementById('historyList')
        };
    }

    bindEvents() {
        // 摄像头控制
        this.elements.cameraBtn?.addEventListener('click', () => this.toggleCamera());
        this.elements.switchCameraBtn?.addEventListener('click', () => this.switchCamera());
        this.elements.cameraSelect?.addEventListener('change', (e) => this.selectCamera(e.target.value));
        this.elements.fullscreenBtn?.addEventListener('click', () => this.toggleFullscreen());

        // 视频上传
        this.elements.fileInput?.addEventListener('change', (e) => this.handleFileUpload(e));

        // 动作按钮
        this.elements.startBtn?.addEventListener('click', () => this.startSession());
        this.elements.pauseBtn?.addEventListener('click', () => this.togglePause());
        this.elements.resetBtn?.addEventListener('click', () => this.resetSession());
        this.elements.exportBtn?.addEventListener('click', () => this.exportData());

        // 球框设置
        this.elements.setHoopBtn?.addEventListener('click', () => this.enterHoopSettingMode());

        // Canvas 点击标记
        this.elements.overlayCanvas?.addEventListener('click', (e) => this.onCanvasClick(e));

        // 确认弹窗
        this.elements.closeConfirmModal?.addEventListener('click', () => this.hideConfirmModal());
        this.elements.btnConfirmHit?.addEventListener('click', () => this.confirmShotResult('HIT'));
        this.elements.btnConfirmMiss?.addEventListener('click', () => this.confirmShotResult('MISS'));

        // 模态框
        this.elements.historyBtn?.addEventListener('click', () => this.showHistory());
        this.elements.helpBtn?.addEventListener('click', () => this.showModal('helpModal'));

        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', () => {
                const modalId = btn.dataset.close;
                if (modalId) this.hideModal(modalId);
            });
        });

        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('active');
                }
            });
        });

        // 键盘快捷键
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideConfirmModal();
                this.hideModal('helpModal');
                this.hideModal('historyModal');
                this.cancelHoopSetting();
            }
            if (e.key === ' ' && this.isRunning) {
                e.preventDefault();
                this.togglePause();
            }
            if (e.key === 'f' || e.key === 'F') {
                this.toggleFullscreen();
            }
        });
    }

    async toggleCamera() {
        if (this.videoReady) {
            await this.stopCamera();
        } else {
            await this.startCamera();
        }
    }

    async startCamera(deviceId = null) {
        try {
            this.showLoading('正在启动摄像头...');

            const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

            const constraints = {
                video: {
                    deviceId: deviceId ? { exact: deviceId } : undefined,
                    width: { ideal: isMobile ? 640 : 1280 },
                    height: { ideal: isMobile ? 480 : 720 },
                    facingMode: isMobile ? 'environment' : 'user'
                },
                audio: false
            };

            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            this.elements.video.srcObject = stream;
            this.elements.video.play();

            this.elements.video.onloadedmetadata = () => {
                this.elements.overlayCanvas.width = this.elements.video.videoWidth;
                this.elements.overlayCanvas.height = this.elements.video.videoHeight;
                CourtMapper.setVideoSize(this.elements.video.videoWidth, this.elements.video.videoHeight);

                this.videoReady = true;

                this.elements.cameraBtn.innerHTML = '✓ 摄像头运行中';
                this.elements.cameraBtn.disabled = true;

                if (this.elements.setHoopBtn) {
                    this.elements.setHoopBtn.classList.remove('hidden');
                    this.elements.setHoopBtn.disabled = false;
                }
                this.elements.resetBtn.disabled = false;
                this.elements.exportBtn.disabled = false;

                if (CourtMapper.hasHoopPosition()) {
                    this.showStatus('可以开始投篮了！', 'active');
                    VideoProcessor.start();
                    this.startSession();
                } else {
                    this.showStatus('请点击「标记篮筐位置」设置篮筐', 'info');
                }

                this.hideLoading();
            };

        } catch (error) {
            console.error('启动摄像头失败:', error);
            this.hideLoading();
            alert('无法访问摄像头: ' + error.message);
        }
    }

    async stopCamera() {
        const stream = this.elements.video.srcObject;
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
        this.elements.video.srcObject = null;

        VideoProcessor.stop();
        this.stopTimer();

        this.videoReady = false;
        this.isRunning = false;
        this.isPaused = false;

        this.elements.cameraBtn.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                <circle cx="12" cy="13" r="4"/>
            </svg>
            开启摄像头
        `;
        this.elements.cameraBtn.disabled = false;
        this.elements.switchCameraBtn.disabled = true;

        if (this.elements.setHoopBtn) {
            this.elements.setHoopBtn.classList.add('hidden');
        }
        this.elements.resetBtn.disabled = true;
        this.elements.exportBtn.disabled = true;
    }

    async switchCamera() {
        // 获取设备列表并切换
        const devices = await navigator.mediaDevices.enumerateDevices();
        const cameras = devices.filter(d => d.kind === 'videoinput');

        if (cameras.length < 2) return;

        const currentId = this.elements.cameraSelect.value;
        const currentIndex = cameras.findIndex(c => c.deviceId === currentId);
        const nextIndex = (currentIndex + 1) % cameras.length;

        await this.stopCamera();
        await this.startCamera(cameras[nextIndex].deviceId);
    }

    async selectCamera(deviceId) {
        if (deviceId && this.videoReady) {
            await this.stopCamera();
            await this.startCamera(deviceId);
        }
    }

    handleFileUpload(e) {
        const file = e.target.files[0];
        if (!file) return;

        const url = URL.createObjectURL(file);
        this.elements.video.src = url;
        this.elements.video.load();
        this.elements.video.play();

        this.elements.video.onloadedmetadata = () => {
            this.elements.overlayCanvas.width = this.elements.video.videoWidth;
            this.elements.overlayCanvas.height = this.elements.video.videoHeight;
            CourtMapper.setVideoSize(this.elements.video.videoWidth, this.elements.video.videoHeight);

            this.videoReady = true;

            this.elements.setHoopBtn.classList.remove('hidden');
            this.elements.setHoopBtn.disabled = false;
            this.elements.resetBtn.disabled = false;
            this.elements.exportBtn.disabled = false;

            if (CourtMapper.hasHoopPosition()) {
                this.showStatus('视频已加载，可以开始分析了！', 'active');
                VideoProcessor.start();
                this.startSession();
            } else {
                this.showStatus('请点击「标记篮筐位置」设置篮筐', 'info');
            }

            this.hideLoading();
        };
    }

    enterHoopSettingMode() {
        this.markingMode = true;
        VideoProcessor.stop();
        this.showStatus('请在视频画面中点击篮筐的位置', 'info');
        this.elements.setHoopBtn.textContent = '等待标记...';
        this.elements.setHoopBtn.disabled = true;
        this.elements.overlayCanvas.style.cursor = 'crosshair';
    }

    cancelHoopSetting() {
        this.markingMode = false;
        this.elements.setHoopBtn.textContent = '🎯 标记篮筐位置';
        this.elements.setHoopBtn.disabled = false;
        this.elements.overlayCanvas.style.cursor = 'default';
    }

    onCanvasClick(e) {
        if (!this.markingMode) return;

        const rect = this.elements.overlayCanvas.getBoundingClientRect();
        const scaleX = this.elements.overlayCanvas.width / rect.width;
        const scaleY = this.elements.overlayCanvas.height / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;

        CourtMapper.setHoopPosition(x, y);
        this.markingMode = false;

        this.showStatus(`篮筐位置已设置 (${Math.round(x)}, ${Math.round(y)})，开始检测！`, 'active');
        this.elements.setHoopBtn.textContent = '🎯 重新标记';
        this.elements.setHoopBtn.disabled = false;
        this.elements.overlayCanvas.style.cursor = 'default';

        Visualization.drawCourtView();
        VideoProcessor.start();
        this.startSession();
    }

    startSession() {
        if (!this.videoReady) {
            alert('请先开启摄像头或上传视频');
            return;
        }

        this.isRunning = true;
        this.isPaused = false;
        this.sessionStartTime = Date.now();

        this.startTimer();

        this.elements.startBtn?.classList.remove('active');
        this.elements.pauseBtn?.classList.add('active');

        this.showStatus('练习中...', 'active');
    }

    togglePause() {
        if (!this.isRunning) return;

        if (this.isPaused) {
            this.isPaused = false;
            VideoProcessor.start();
            this.startTimer();
            this.showStatus('继续练习', 'active');
            this.elements.pauseBtn?.classList.add('active');
        } else {
            this.isPaused = true;
            VideoProcessor.stop();
            this.stopTimer();
            this.showStatus('已暂停', 'warning');
            this.elements.pauseBtn?.classList.remove('active');
        }
    }

    resetSession() {
        if (!confirm('确定要清空所有投篮记录吗？')) return;

        Statistics.reset();
        ShotAnalyzer.reset();
        Visualization.updateStatsDisplay();
        Visualization.clearShotsLog();
        Visualization.drawCourtView();
        this.stopTimer();
        this.elapsedSeconds = 0;
        this.updateTimerDisplay();

        this.showStatus('数据已重置', 'info');
    }

    exportData() {
        Statistics.downloadData();
        this.showStatus('数据已导出！', 'success');
    }

    startTimer() {
        if (this.timerInterval) return;

        this.timerInterval = setInterval(() => {
            this.elapsedSeconds++;
            this.updateTimerDisplay();
        }, 1000);
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    updateTimerDisplay() {
        const minutes = Math.floor(this.elapsedSeconds / 60);
        const seconds = this.elapsedSeconds % 60;
        const timeStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

        if (this.elements.timerValue) {
            this.elements.timerValue.textContent = timeStr;
        }

        // 更新进度条（基于命中率）
        const stats = Statistics.getStats();
        if (this.elements.progressFill && stats.total > 0) {
            this.elements.progressFill.style.width = stats.accuracy + '%';
        }
    }

    confirmShotResult(result) {
        // 获取当前待确认的投篮
        const modal = this.elements.confirmModal;
        if (!modal.dataset.pendingShot) return;

        try {
            const shotData = JSON.parse(modal.dataset.pendingShot);
            shotData.result = result;

            // 添加到统计
            Statistics.addShot(shotData);

            // 更新显示
            Visualization.updateStatsDisplay();
            Visualization.addShotLogEntry(shotData);
            Visualization.drawCourtView();

            // 重置分析器
            ShotAnalyzer.reset();

        } catch (e) {
            console.error('确认投篮结果失败:', e);
        }

        this.hideConfirmModal();
    }

    showConfirmModal(shotResult) {
        const modal = this.elements.confirmModal;
        modal.dataset.pendingShot = JSON.stringify(shotResult);
        modal.classList.add('active');

        // 显示投篮位置信息
        const body = modal.querySelector('.modal-body');
        if (body && shotResult.position) {
            const distance = shotResult.position.distance ?
                (shotResult.position.distance * 100).toFixed(1) : '?';
            body.innerHTML = `
                <p class="text-center text-secondary mb-4">检测到一次投篮，请确认结果：</p>
                <p class="text-center text-muted" style="font-size: 0.85rem;">
                    位置: 约 ${distance}% 距离篮筐
                </p>
            `;
        }
    }

    hideConfirmModal() {
        this.elements.confirmModal.classList.remove('active');
        this.elements.confirmModal.dataset.pendingShot = '';
    }

    showHistory() {
        // 从 localStorage 读取历史数据
        const sessions = this.getSessionHistory();
        const listEl = this.elements.historyList;

        if (sessions.length === 0) {
            listEl.innerHTML = '<p class="text-muted text-center">暂无历史记录</p>';
        } else {
            listEl.innerHTML = sessions.slice(0, 20).map(session => `
                <div class="history-item">
                    <div class="history-date">
                        <div>${session.date || '未知日期'}</div>
                        <div style="font-size: 0.75rem; color: var(--text-muted);">${session.time || ''}</div>
                    </div>
                    <div class="history-stats">
                        <span class="history-accuracy">${session.accuracy || 0}%</span>
                        <span class="history-shots">${session.hits || 0}/${session.total || 0}投</span>
                    </div>
                </div>
            `).join('');
        }

        this.showModal('historyModal');
    }

    getSessionHistory() {
        try {
            const data = localStorage.getItem('shot_trainer_history');
            return data ? JSON.parse(data) : [];
        } catch (e) {
            return [];
        }
    }

    saveSessionToHistory(stats) {
        const sessions = this.getSessionHistory();
        sessions.unshift({
            date: new Date().toLocaleDateString('zh-CN'),
            time: new Date().toLocaleTimeString('zh-CN'),
            ...stats
        });

        // 限制保存数量
        if (sessions.length > 50) {
            sessions.pop();
        }

        try {
            localStorage.setItem('shot_trainer_history', JSON.stringify(sessions));
        } catch (e) {}
    }

    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
        }
    }

    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
        }
    }

    updateLoadingStatus(text) {
        if (this.elements.statusText) {
            this.elements.statusText.textContent = text;
        }
        const loadingBar = this.elements.loadingStatus;
        if (loadingBar) {
            loadingBar.classList.remove('hidden');
            const textSpan = loadingBar.querySelector('span');
            if (textSpan) {
                textSpan.textContent = text;
            }
        }
    }

    showLoading(text = '加载中...') {
        const overlay = this.elements.loadingOverlay;
        if (overlay) {
            overlay.classList.add('show');
            const textEl = overlay.querySelector('.loading-text');
            if (textEl) {
                textEl.textContent = text;
            }
        }
        const loadingBar = this.elements.loadingStatus;
        if (loadingBar) {
            loadingBar.classList.remove('hidden');
        }
    }

    hideLoading() {
        const overlay = this.elements.loadingOverlay;
        if (overlay) {
            overlay.classList.remove('show');
        }
        const loadingBar = this.elements.loadingStatus;
        if (loadingBar) {
            setTimeout(() => {
                loadingBar.classList.add('hidden');
            }, 1000);
        }
    }

    showStatus(text, type = '') {
        const banner = this.elements.statusBanner;
        if (banner) {
            banner.textContent = text;
            banner.className = 'status-banner';
            if (type) {
                banner.classList.add(type);
            }
        }
    }

    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.error('全屏失败:', err);
            });
        } else {
            document.exitFullscreen();
        }
    }
}

// 页面加载完成后初始化应用
window.addEventListener('load', async function() {
    // 检查必需的库是否加载
    const requiredLibs = [
        { name: 'TensorFlow.js', obj: 'tf' },
        { name: 'COCO-SSD', obj: 'cocoSsd' },
        { name: 'MediaPipe Pose', obj: 'Pose' },
        { name: 'Chart.js', obj: 'Chart' }
    ];

    const missingLibs = requiredLibs.filter(lib => typeof window[lib.obj] === 'undefined');

    if (missingLibs.length > 0) {
        const missing = missingLibs.map(lib => lib.name).join(', ');
        document.getElementById('statusText').textContent = `❌ 缺少必需库: ${missing}`;
        document.getElementById('statusText').style.color = '#e53935';
        return;
    }

    window.app = new ShotTrainerApp();
});
