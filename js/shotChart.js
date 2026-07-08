/**
 * 投篮热力图 - C投篮训练助手
 * 绘制篮球场和投篮点热力图
 */
class ShotChart {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width || 400;
        this.height = canvas.height || 300;
        this.padding = 20;

        // 投篮数据
        this.shots = [];
        this.maxShots = 100;

        // 颜色配置
        this.colors = {
            made: '#00FF00',
            miss: '#FF4444',
            heatLow: 'rgba(0, 100, 255, 0.3)',
            heatMid: 'rgba(255, 200, 0, 0.4)',
            heatHigh: 'rgba(255, 50, 0, 0.5)',
            court: '#FF6B00',
            courtBg: '#1A1A1A',
            text: '#FFFFFF'
        };

        // 缩放和偏移
        this.scale = 1;
        this.offsetX = 0;
        this.offsetY = 0;
    }

    /**
     * 设置画布尺寸
     */
    setSize(width, height) {
        this.width = width;
        this.height = height;
        this.canvas.width = width;
        this.canvas.height = height;
        this.draw();
    }

    /**
     * 添加投篮点
     */
    addShot(x, y, made) {
        // 将屏幕坐标转换为归一化坐标 (0-1)
        const normalizedX = x / this.width;
        const normalizedY = y / this.height;

        this.shots.push({
            x: normalizedX,
            y: normalizedY,
            made: made,
            time: Date.now()
        });

        // 限制数量
        if (this.shots.length > this.maxShots) {
            this.shots.shift();
        }

        this.draw();
    }

    /**
     * 设置投篮数据
     */
    setShots(shots) {
        this.shots = shots.map(s => ({
            x: s.x || 0.5,
            y: s.y || 0.5,
            made: s.made,
            time: s.timestamp || Date.now()
        }));
        this.draw();
    }

    /**
     * 清空数据
     */
    clear() {
        this.shots = [];
        this.draw();
    }

    /**
     * 绘制篮球场（简化版半场）
     */
    drawCourt() {
        const ctx = this.ctx;
        const w = this.width;
        const h = this.height;
        const p = this.padding;

        // 背景
        ctx.fillStyle = this.colors.courtBg;
        ctx.fillRect(0, 0, w, h);

        // 球场线条颜色
        ctx.strokeStyle = this.colors.court;
        ctx.lineWidth = 2;

        // 绘制底线
        ctx.beginPath();
        ctx.moveTo(p, h - p);
        ctx.lineTo(w - p, h - p);
        ctx.stroke();

        // 绘制边线（左）
        ctx.beginPath();
        ctx.moveTo(p, h - p);
        ctx.lineTo(p, p);
        ctx.stroke();

        // 绘制边线（右）
        ctx.beginPath();
        ctx.moveTo(w - p, h - p);
        ctx.lineTo(w - p, p);
        ctx.stroke();

        // 绘制顶线
        ctx.beginPath();
        ctx.moveTo(p, p);
        ctx.lineTo(w - p, p);
        ctx.stroke();

        // 绘制三分线（圆弧）
        const hoopX = w / 2;
        const hoopY = h - p - 20;
        const threePointRadius = Math.min(w, h) * 0.4;

        ctx.beginPath();
        ctx.arc(hoopX, hoopY, threePointRadius, Math.PI, 0, false);
        ctx.stroke();

        // 绘制罚球线（半圆）
        const freeThrowRadius = threePointRadius * 0.4;
        ctx.beginPath();
        ctx.arc(hoopX, hoopY, freeThrowRadius, Math.PI, 0, false);
        ctx.stroke();

        // 绘制禁区（矩形）
        const paintWidth = freeThrowRadius * 2;
        const paintHeight = (hoopY - p) * 0.4;
        ctx.strokeRect(hoopX - paintWidth / 2, hoopY - paintHeight, paintWidth, paintHeight);

        // 绘制篮板
        ctx.fillStyle = this.colors.court;
        ctx.fillRect(hoopX - 15, hoopY - 5, 30, 5);

        // 绘制篮筐位置标记
        ctx.beginPath();
        ctx.arc(hoopX, hoopY, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#FF0000';
        ctx.fill();

        // 篮筐中心点坐标（供外部使用）
        this.hoopPosition = {
            x: hoopX,
            y: hoopY,
            radius: 15
        };

        return this.hoopPosition;
    }

    /**
     * 绘制投篮点
     */
    drawShots() {
        const ctx = this.ctx;
        const w = this.width;
        const h = this.height;

        for (const shot of this.shots) {
            const x = shot.x * w;
            const y = shot.y * h;

            // 根据命中/投失选择颜色
            ctx.beginPath();
            ctx.arc(x, y, 6, 0, Math.PI * 2);
            ctx.fillStyle = shot.made ? this.colors.made : this.colors.miss;
            ctx.fill();

            // 命中用圆圈标记
            if (shot.made) {
                ctx.beginPath();
                ctx.arc(x, y, 10, 0, Math.PI * 2);
                ctx.strokeStyle = this.colors.made;
                ctx.lineWidth = 2;
                ctx.stroke();
            } else {
                // 投失用X标记
                ctx.beginPath();
                ctx.moveTo(x - 5, y - 5);
                ctx.lineTo(x + 5, y + 5);
                ctx.moveTo(x + 5, y - 5);
                ctx.lineTo(x - 5, y + 5);
                ctx.strokeStyle = this.colors.miss;
                ctx.lineWidth = 2;
                ctx.stroke();
            }
        }
    }

    /**
     * 绘制热力图
     */
    drawHeatmap(intensity = 0.5) {
        if (this.shots.length === 0) return;

        const ctx = this.ctx;
        const w = this.width;
        const h = this.height;

        // 创建热力图层
        const heatCanvas = document.createElement('canvas');
        heatCanvas.width = w;
        heatCanvas.height = h;
        const heatCtx = heatCanvas.getContext('2d');

        // 为每个命中投篮添加热点
        const madeShots = this.shots.filter(s => s.made);

        for (const shot of madeShots) {
            const x = shot.x * w;
            const y = shot.y * h;

            // 创建径向渐变
            const gradient = heatCtx.createRadialGradient(x, y, 0, x, y, 40);
            gradient.addColorStop(0, 'rgba(255, 100, 0, 0.6)');
            gradient.addColorStop(0.5, 'rgba(255, 50, 0, 0.3)');
            gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');

            heatCtx.fillStyle = gradient;
            heatCtx.beginPath();
            heatCtx.arc(x, y, 40, 0, Math.PI * 2);
            heatCtx.fill();
        }

        // 混合到主画布
        ctx.globalAlpha = intensity;
        ctx.drawImage(heatCanvas, 0, 0);
        ctx.globalAlpha = 1;
    }

    /**
     * 绘制位置命中率统计
     */
    drawPositionStats(positionStats) {
        const ctx = this.ctx;
        const w = this.width;
        const h = this.height;

        ctx.font = '12px Arial';
        ctx.textAlign = 'center';

        const positions = {
            leftCorner: { x: 0.15 * w, y: h * 0.75 },
            left45: { x: 0.3 * w, y: h * 0.5 },
            leftArc: { x: 0.35 * w, y: h * 0.3 },
            center: { x: 0.5 * w, y: h * 0.35 },
            rightArc: { x: 0.65 * w, y: h * 0.3 },
            right45: { x: 0.7 * w, y: h * 0.5 },
            rightCorner: { x: 0.85 * w, y: h * 0.75 },
            paint: { x: 0.5 * w, y: h * 0.65 }
        };

        for (const [zone, pos] of Object.entries(positions)) {
            const stats = positionStats[zone];
            if (stats && stats.shots > 0) {
                const accuracy = Math.round((stats.makes / stats.shots) * 100);

                // 绘制背景
                ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                ctx.beginPath();
                ctx.roundRect(pos.x - 20, pos.y - 10, 40, 20, 4);
                ctx.fill();

                // 绘制文字
                ctx.fillStyle = accuracy >= 50 ? this.colors.made : this.colors.miss;
                ctx.fillText(`${accuracy}%`, pos.x, pos.y + 4);
            }
        }
    }

    /**
     * 绘制统计信息
     */
    drawStats(stats) {
        const ctx = this.ctx;
        const w = this.width;

        // 背景面板
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.beginPath();
        ctx.roundRect(10, 10, 180, 80, 8);
        ctx.fill();

        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'left';
        ctx.fillStyle = this.colors.text;

        // 命中率
        ctx.fillStyle = stats.accuracy >= 50 ? this.colors.made : this.colors.miss;
        ctx.font = 'bold 24px Arial';
        ctx.fillText(`${stats.accuracy}%`, 20, 40);

        // 投篮数
        ctx.font = '14px Arial';
        ctx.fillStyle = this.colors.text;
        ctx.fillText(`${stats.makes}/${stats.attempts}`, 80, 40);

        // 连续命中
        ctx.fillStyle = stats.streak > 0 ? '#FFAA00' : this.colors.text;
        ctx.fillText(`连胜: ${stats.streak}`, 20, 65);

        // 最佳连胜
        ctx.fillStyle = '#FFAA00';
        ctx.fillText(`最佳: ${stats.bestStreak}`, 100, 65);
    }

    /**
     * 绘制轨迹
     */
    drawTrajectory(trajectory) {
        if (trajectory.length < 2) return;

        const ctx = this.ctx;
        const w = this.width;
        const h = this.height;

        // 绘制轨迹线
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(255, 165, 0, 0.8)';
        ctx.lineWidth = 3;

        const points = trajectory.slice(-20);  // 最近20个点

        for (let i = 0; i < points.length; i++) {
            const p = points[i];
            const x = p.x;
            const y = p.y;

            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }

        ctx.stroke();

        // 绘制球的位置
        const lastPoint = points[points.length - 1];
        ctx.beginPath();
        ctx.arc(lastPoint.x, lastPoint.y, 8, 0, Math.PI * 2);
        ctx.fillStyle = '#FF6B00';
        ctx.fill();
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    /**
     * 绘制球框标记
     */
    drawHoopMark(x, y, radius) {
        const ctx = this.ctx;

        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.strokeStyle = '#FF0000';
        ctx.lineWidth = 3;
        ctx.setLineDash([5, 5]);
        ctx.stroke();
        ctx.setLineDash([]);

        // 中心点
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#FF0000';
        ctx.fill();
    }

    /**
     * 主绘制函数
     */
    draw() {
        // 清空画布
        this.ctx.clearRect(0, 0, this.width, this.height);

        // 绘制篮球场
        this.drawCourt();

        // 绘制热力图
        this.drawHeatmap(0.3);

        // 绘制投篮点
        this.drawShots();
    }

    /**
     * 导出图片
     */
    toDataURL() {
        return this.canvas.toDataURL('image/png');
    }

    /**
     * 获取篮筐位置
     */
    getHoopPosition() {
        return this.hoopPosition || { x: this.width / 2, y: this.height - 20, radius: 15 };
    }
}

// 导出类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ShotChart;
}
