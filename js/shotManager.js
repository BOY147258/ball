/**
 * 投篮管理器 - C投篮训练助手
 * 管理投篮数据、统计数据、练习计时
 */
class ShotManager {
    constructor() {
        // 当前训练数据
        this.session = {
            startTime: null,
            endTime: null,
            shots: [],
            totalShots: 0,
            makes: 0,
            misses: 0,
            accuracy: 0,
            streak: 0,
            bestStreak: 0,
            positionStats: {}
        };

        // 练习计时器
        this.timerInterval = null;
        this.elapsedSeconds = 0;
        this.isPaused = false;

        // 投篮位置分析区域
        this.positionZones = this.initPositionZones();

        // 回调函数
        this.onStatsUpdate = null;
        this.onTimerUpdate = null;
    }

    /**
     * 初始化位置区域（用于热力图分析）
     */
    initPositionZones() {
        return {
            // 左侧底角
            leftCorner: { shots: 0, makes: 0, x: 0.15, y: 0.8 },
            // 左侧45度
            left45: { shots: 0, makes: 0, x: 0.3, y: 0.5 },
            // 左侧弧顶
            leftArc: { shots: 0, makes: 0, x: 0.35, y: 0.25 },
            // 中路
            center: { shots: 0, makes: 0, x: 0.5, y: 0.3 },
            // 右侧弧顶
            rightArc: { shots: 0, makes: 0, x: 0.65, y: 0.25 },
            // 右侧45度
            right45: { shots: 0, makes: 0, x: 0.7, y: 0.5 },
            // 右侧底角
            rightCorner: { shots: 0, makes: 0, x: 0.85, y: 0.8 },
            // 禁区
            paint: { shots: 0, makes: 0, x: 0.5, y: 0.7 }
        };
    }

    /**
     * 开始训练
     */
    startSession() {
        this.reset();
        this.session.startTime = Date.now();
        this.startTimer();
        console.log('训练开始');
    }

    /**
     * 结束训练
     */
    endSession() {
        this.session.endTime = Date.now();
        this.stopTimer();
        this.saveSession();
        console.log('训练结束', this.getStats());
        return this.getSessionSummary();
    }

    /**
     * 暂停训练
     */
    pauseSession() {
        this.isPaused = true;
        this.stopTimer();
    }

    /**
     * 继续训练
     */
    resumeSession() {
        this.isPaused = false;
        this.startTimer();
    }

    /**
     * 重置训练数据
     */
    reset() {
        this.session = {
            startTime: null,
            endTime: null,
            shots: [],
            totalShots: 0,
            makes: 0,
            misses: 0,
            accuracy: 0,
            streak: 0,
            bestStreak: 0,
            positionStats: {}
        };
        this.elapsedSeconds = 0;
        this.positionZones = this.initPositionZones();
        this.notifyStatsUpdate();
    }

    /**
     * 记录一次投篮
     * @param {boolean} made - 是否命中
     * @param {Object} position - 投篮位置 { x, y }
     * @param {Object} extra - 额外数据
     */
    recordShot(made, position = null, extra = {}) {
        const shot = {
            id: Date.now(),
            timestamp: Date.now(),
            made: made,
            position: position,
            zone: position ? this.getZone(position) : null,
            ...extra
        };

        this.session.shots.push(shot);
        this.session.totalShots++;

        if (made) {
            this.session.makes++;
            this.session.streak++;
            this.session.bestStreak = Math.max(this.session.bestStreak, this.session.streak);
        } else {
            this.session.misses++;
            this.session.streak = 0;
        }

        // 更新命中率
        this.session.accuracy = this.session.totalShots > 0
            ? Math.round((this.session.makes / this.session.totalShots) * 100)
            : 0;

        // 更新位置统计
        if (shot.zone) {
            this.updatePositionStats(shot.zone, made);
        }

        this.notifyStatsUpdate();
        return shot;
    }

    /**
     * 获取投篮位置对应的区域
     */
    getZone(position) {
        const { x, y } = position;

        // 根据坐标判断区域
        if (y > 0.6) {
            // 底角区域
            if (x < 0.35) return 'leftCorner';
            if (x > 0.65) return 'rightCorner';
            return 'paint';
        } else if (y > 0.35) {
            // 45度区域
            if (x < 0.4) return 'left45';
            if (x > 0.6) return 'right45';
            return 'center';
        } else {
            // 弧顶区域
            if (x < 0.45) return 'leftArc';
            if (x > 0.55) return 'rightArc';
            return 'center';
        }
    }

    /**
     * 更新位置统计数据
     */
    updatePositionStats(zone, made) {
        if (!this.session.positionStats[zone]) {
            this.session.positionStats[zone] = { shots: 0, makes: 0 };
        }

        this.session.positionStats[zone].shots++;
        if (made) {
            this.session.positionStats[zone].makes++;
        }
    }

    /**
     * 获取位置命中率
     */
    getPositionAccuracy(zone) {
        const stats = this.session.positionStats[zone];
        if (!stats || stats.shots === 0) return 0;
        return Math.round((stats.makes / stats.shots) * 100);
    }

    /**
     * 开始计时器
     */
    startTimer() {
        if (this.timerInterval) return;

        this.timerInterval = setInterval(() => {
            if (!this.isPaused) {
                this.elapsedSeconds++;
                if (this.onTimerUpdate) {
                    this.onTimerUpdate(this.getFormattedTime());
                }
            }
        }, 1000);
    }

    /**
     * 停止计时器
     */
    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    /**
     * 获取格式化的练习时间
     */
    getFormattedTime() {
        const hours = Math.floor(this.elapsedSeconds / 3600);
        const minutes = Math.floor((this.elapsedSeconds % 3600) / 60);
        const seconds = this.elapsedSeconds % 60;

        if (hours > 0) {
            return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        }
        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }

    /**
     * 获取统计数据
     */
    getStats() {
        return {
            makes: this.session.makes,
            attempts: this.session.totalShots,
            accuracy: this.session.accuracy,
            streak: this.session.streak,
            bestStreak: this.session.bestStreak,
            time: this.getFormattedTime(),
            makesPerMinute: this.elapsedSeconds > 0
                ? (this.session.makes / (this.elapsedSeconds / 60)).toFixed(1)
                : 0,
            positionStats: this.session.positionStats
        };
    }

    /**
     * 获取训练摘要
     */
    getSessionSummary() {
        const duration = this.session.endTime - this.session.startTime;
        return {
            date: new Date(this.session.startTime).toLocaleDateString('zh-CN'),
            startTime: new Date(this.session.startTime).toLocaleTimeString('zh-CN'),
            duration: this.getFormattedTime(),
            durationSeconds: this.elapsedSeconds,
            totalShots: this.session.totalShots,
            makes: this.session.makes,
            misses: this.session.misses,
            accuracy: this.session.accuracy,
            bestStreak: this.session.bestStreak,
            makesPerMinute: this.elapsedSeconds > 0
                ? (this.session.makes / (this.elapsedSeconds / 60)).toFixed(1)
                : 0,
            shots: this.session.shots
        };
    }

    /**
     * 获取投篮历史（用于热力图）
     */
    getShotHistory() {
        return this.session.shots.map(shot => ({
            x: shot.position?.x || 0.5,
            y: shot.position?.y || 0.5,
            made: shot.made,
            zone: shot.zone,
            timestamp: shot.timestamp
        }));
    }

    /**
     * 获取所有历史记录
     */
    getAllSessions() {
        try {
            const data = localStorage.getItem(CONFIG.STORAGE.KEY);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error('读取历史记录失败:', e);
            return [];
        }
    }

    /**
     * 保存当前训练记录
     */
    saveSession() {
        if (this.session.totalShots === 0) return;

        try {
            const sessions = this.getAllSessions();
            const summary = this.getSessionSummary();

            sessions.unshift(summary);

            // 限制保存数量
            if (sessions.length > CONFIG.STORAGE.MAX_SESSIONS) {
                sessions.pop();
            }

            localStorage.setItem(CONFIG.STORAGE.KEY, JSON.stringify(sessions));
        } catch (e) {
            console.error('保存训练记录失败:', e);
        }
    }

    /**
     * 导出数据
     */
    exportData() {
        const sessions = this.getAllSessions();
        return JSON.stringify({
            exportDate: new Date().toISOString(),
            sessions: sessions,
            stats: this.getAllTimeStats()
        }, null, 2);
    }

    /**
     * 获取累计统计数据
     */
    getAllTimeStats() {
        const sessions = this.getAllSessions();
        const totalShots = sessions.reduce((sum, s) => sum + s.totalShots, 0);
        const totalMakes = sessions.reduce((sum, s) => sum + s.makes, 0);
        const totalTime = sessions.reduce((sum, s) => sum + s.durationSeconds, 0);

        return {
            totalSessions: sessions.length,
            totalShots: totalShots,
            totalMakes: totalMakes,
            overallAccuracy: totalShots > 0 ? Math.round((totalMakes / totalShots) * 100) : 0,
            totalTime: totalTime,
            avgShotsPerSession: sessions.length > 0 ? Math.round(totalShots / sessions.length) : 0,
            avgAccuracy: sessions.length > 0
                ? Math.round(sessions.reduce((sum, s) => sum + s.accuracy, 0) / sessions.length)
                : 0
        };
    }

    /**
     * 通知统计数据更新
     */
    notifyStatsUpdate() {
        if (this.onStatsUpdate) {
            this.onStatsUpdate(this.getStats());
        }
    }

    /**
     * 设置统计更新回调
     */
    setStatsCallback(callback) {
        this.onStatsUpdate = callback;
    }

    /**
     * 设置计时器更新回调
     */
    setTimerCallback(callback) {
        this.onTimerUpdate = callback;
    }
}

// 导出类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ShotManager;
}
