/**
 * 投篮检测器 - C投篮训练助手
 * 检测篮球、球框，并判断进球
 */
class ShotDetector {
    constructor() {
        // 球框位置（用户可以手动设置）
        this.hoopPosition = null;
        this.hoopRadius = 30;

        // 轨迹记录
        this.trajectory = [];
        this.maxTrajectoryLength = 60;  // 保存最近60帧

        // 投篮状态
        this.shotState = 'idle';  // idle, shooting, released
        this.lastShotTime = 0;

        // 篮球检测历史（用于平滑）
        this.ballHistory = [];
        this.maxBallHistory = 5;

        // 回调函数
        this.onShotDetected = null;
        this.onBallDetected = null;
    }

    /**
     * 设置球框位置（手动设置或自动检测）
     * @param {Object} position - { x, y, radius }
     */
    setHoopPosition(position) {
        if (position) {
            this.hoopPosition = position;
            CONFIG.HOOP.MANUAL_POSITION = position;
        }
    }

    /**
     * 检测视频帧中的篮球和球框
     * @param {HTMLCanvasElement|HTMLVideoElement} frame - 视频帧
     * @returns {Object} 检测结果
     */
    detect(frame) {
        const ctx = frame.getContext ? frame.getContext('2d') : null;
        if (!ctx) {
            // 如果是 video 元素，创建 canvas
            const canvas = document.createElement('canvas');
            canvas.width = frame.videoWidth || frame.width;
            canvas.height = frame.videoHeight || frame.height;
            canvas.getContext('2d').drawImage(frame, 0, 0);
            return this.detect(canvas);
        }

        const width = ctx.canvas.width;
        const height = ctx.canvas.height;
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;

        // 1. 检测篮球
        const ball = this.detectBall(data, width, height);

        // 2. 检测球框（如果未设置）
        if (!this.hoopPosition && CONFIG.HOOP.MANUAL_POSITION) {
            this.hoopPosition = CONFIG.HOOP.MANUAL_POSITION;
        }

        // 3. 更新轨迹
        if (ball) {
            this.updateTrajectory(ball);
        }

        // 4. 检测投篮
        const shotResult = this.detectShot(ball);

        return {
            ball,
            hoop: this.hoopPosition,
            trajectory: this.trajectory,
            shotResult,
            shotState: this.shotState
        };
    }

    /**
     * RGB转HSV
     */
    rgbToHsv(r, g, b) {
        r /= 255;
        g /= 255;
        b /= 255;

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const d = max - min;

        let h = 0;
        const s = max === 0 ? 0 : d / max;
        const v = max;

        if (max !== min) {
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }

        return { h: h * 180, s: s * 255, v: v * 255 };
    }

    /**
     * 检测篮球 - 基于颜色和形状
     */
    detectBall(data, width, height) {
        const cfg = CONFIG.BALL;
        const lower = cfg.COLOR_LOWER;
        const upper = cfg.COLOR_UPPER;

        // 找橙色区域
        const candidates = [];

        // 采样检测（每4个像素检测一次，提高性能）
        const step = 4;
        for (let y = 0; y < height; y += step) {
            for (let x = 0; x < width; x += step) {
                const i = (y * width + x) * 4;
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];

                const hsv = this.rgbToHsv(r, g, b);

                if (this.isInRange(hsv, lower, upper)) {
                    candidates.push({ x, y, r: r, g: g, b: b });
                }
            }
        }

        if (candidates.length < 10) return null;

        // 找圆形区域（篮球）
        const ball = this.findCircle(candidates, width, height);
        if (ball) {
            // 添加到历史用于平滑
            this.ballHistory.push(ball);
            if (this.ballHistory.length > this.maxBallHistory) {
                this.ballHistory.shift();
            }

            // 返回平滑后的位置
            return this.getSmoothedBall();
        }

        return null;
    }

    /**
     * 检查HSV值是否在范围内
     */
    isInRange(hsv, lower, upper) {
        return hsv.h >= lower.h && hsv.h <= upper.h &&
               hsv.s >= lower.s && hsv.s <= upper.s &&
               hsv.v >= lower.v && hsv.v <= upper.v;
    }

    /**
     * 找圆形区域
     */
    findCircle(candidates, width, height) {
        const cfg = CONFIG.BALL;

        // 按颜色强度分组
        const grouped = this.groupCandidates(candidates, width, height);

        // 找最大的圆形区域
        let bestCircle = null;
        let bestScore = 0;

        for (const group of grouped) {
            if (group.points.length < 20) continue;

            const center = this.getCentroid(group.points);
            const radius = Math.sqrt(group.area / Math.PI);
            const circularity = this.calculateCircularity(group.points, center);

            if (radius >= cfg.MIN_RADIUS && radius <= cfg.MAX_RADIUS &&
                circularity >= cfg.CIRCULARITY_THRESHOLD) {

                const score = circularity * group.points.length;
                if (score > bestScore) {
                    bestScore = score;
                    bestCircle = {
                        x: center.x,
                        y: center.y,
                        radius: radius,
                        circularity: circularity,
                        confidence: Math.min(1, group.points.length / 100)
                    };
                }
            }
        }

        return bestCircle;
    }

    /**
     * 分组候选点
     */
    groupCandidates(candidates, width, height) {
        const gridSize = 20;
        const grid = new Map();

        // 将点放入网格
        for (const p of candidates) {
            const gx = Math.floor(p.x / gridSize);
            const gy = Math.floor(p.y / gridSize);
            const key = `${gx},${gy}`;

            if (!grid.has(key)) {
                grid.set(key, { points: [], sumX: 0, sumY: 0, count: 0 });
            }

            const cell = grid.get(key);
            cell.points.push(p);
            cell.sumX += p.x;
            cell.sumY += p.y;
            cell.count++;
        }

        // 合并相邻网格形成区域
        const regions = [];
        const visited = new Set();

        for (const [key, cell] of grid) {
            if (visited.has(key) || cell.count < 3) continue;

            const region = { points: [], area: 0 };
            const queue = [key];

            while (queue.length > 0) {
                const current = queue.shift();
                if (visited.has(current)) continue;
                visited.add(current);

                const [cx, cy] = current.split(',').map(Number);
                const c = grid.get(current);
                if (!c || c.count < 3) continue;

                region.points.push(...c.points);

                // 检查相邻格子
                for (let dx = -1; dx <= 1; dx++) {
                    for (let dy = -1; dy <= 1; dy++) {
                        if (dx === 0 && dy === 0) continue;
                        const nk = `${cx + dx},${cy + dy}`;
                        if (grid.has(nk) && !visited.has(nk)) {
                            queue.push(nk);
                        }
                    }
                }
            }

            if (region.points.length >= 20) {
                const bounds = this.getBounds(region.points);
                region.area = bounds.width * bounds.height;
                regions.push(region);
            }
        }

        return regions;
    }

    /**
     * 获取中心点
     */
    getCentroid(points) {
        let sumX = 0, sumY = 0;
        for (const p of points) {
            sumX += p.x;
            sumY += p.y;
        }
        return { x: sumX / points.length, y: sumY / points.length };
    }

    /**
     * 计算圆形度
     */
    calculateCircularity(points, center) {
        if (points.length < 3) return 0;

        const distances = points.map(p =>
            Math.sqrt((p.x - center.x) ** 2 + (p.y - center.y) ** 2)
        );

        const avgDist = distances.reduce((a, b) => a + b, 0) / distances.length;
        const variance = distances.reduce((sum, d) => sum + (d - avgDist) ** 2, 0) / distances.length;
        const stdDev = Math.sqrt(variance);

        // 圆形度 = 1 - (标准差 / 平均距离)
        return Math.max(0, 1 - stdDev / avgDist);
    }

    /**
     * 获取边界
     */
    getBounds(points) {
        let minX = Infinity, minY = Infinity;
        let maxX = -Infinity, maxY = -Infinity;

        for (const p of points) {
            minX = Math.min(minX, p.x);
            minY = Math.min(minY, p.y);
            maxX = Math.max(maxX, p.x);
            maxY = Math.max(maxY, p.y);
        }

        return {
            x: minX,
            y: minY,
            width: maxX - minX,
            height: maxY - minY,
            centerX: (minX + maxX) / 2,
            centerY: (minY + maxY) / 2
        };
    }

    /**
     * 获取平滑后的篮球位置
     */
    getSmoothedBall() {
        if (this.ballHistory.length === 0) return null;

        const recent = this.ballHistory.slice(-3);
        return {
            x: recent.reduce((sum, b) => sum + b.x, 0) / recent.length,
            y: recent.reduce((sum, b) => sum + b.y, 0) / recent.length,
            radius: recent.reduce((sum, b) => sum + b.radius, 0) / recent.length,
            confidence: recent[recent.length - 1].confidence
        };
    }

    /**
     * 更新轨迹
     */
    updateTrajectory(ball) {
        this.trajectory.push({
            x: ball.x,
            y: ball.y,
            time: Date.now()
        });

        if (this.trajectory.length > this.maxTrajectoryLength) {
            this.trajectory.shift();
        }
    }

    /**
     * 检测投篮
     */
    detectShot(ball) {
        const cfg = CONFIG.SHOT;
        const now = Date.now();

        // 超时重置
        if (now - this.lastShotTime > cfg.SHOT_TIMEOUT) {
            this.shotState = 'idle';
            this.trajectory = [];
        }

        if (!ball || !this.hoopPosition) {
            return null;
        }

        // 检测球是否穿过篮筐
        const result = this.checkMadeShot();

        if (result.made) {
            this.lastShotTime = now;
            this.shotState = 'idle';

            // 触发回调
            if (this.onShotDetected) {
                this.onShotDetected(result);
            }
        }

        return result;
    }

    /**
     * 检查是否进球
     */
    checkMadeShot() {
        const cfg = CONFIG.SHOT;
        const hoop = this.hoopPosition;

        if (this.trajectory.length < cfg.MIN_TRAJECTORY_POINTS) {
            return { made: false, reason: 'not_enough_points' };
        }

        // 检查轨迹是否穿过篮筐
        const hoopRadius = hoop.radius || this.hoopRadius;

        for (let i = 0; i < this.trajectory.length - 1; i++) {
            const curr = this.trajectory[i];
            const next = this.trajectory[i + 1];

            // 检查是否从上方穿过篮筐平面
            const hoopY = hoop.y;
            if (curr.y < hoopY && next.y >= hoopY) {
                // 计算穿过点的x坐标
                const t = (hoopY - curr.y) / (next.y - curr.y);
                const passX = curr.x + t * (next.x - curr.x);

                // 检查是否在篮筐宽度范围内
                const dx = Math.abs(passX - hoop.x);
                if (dx < hoopRadius * cfg.PASS_THRESHOLD) {
                    // 计算轨迹方向
                    const direction = this.analyzeTrajectoryDirection(i);

                    return {
                        made: true,
                        x: passX,
                        y: hoopY,
                        distance: this.calculateDistance(this.trajectory[0], hoop),
                        direction: direction
                    };
                }
            }
        }

        return { made: false, reason: 'no_passing' };
    }

    /**
     * 分析轨迹方向
     */
    analyzeTrajectoryDirection(startIndex) {
        const points = this.trajectory.slice(
            Math.max(0, startIndex - 5),
            startIndex + 1
        );

        if (points.length < 2) return 'unknown';

        const start = points[0];
        const end = points[points.length - 1];

        const dx = end.x - start.x;
        const dy = end.y - start.y;

        // 计算角度（以篮筐为原点）
        const angle = Math.atan2(dy, dx) * 180 / Math.PI;

        // 判断方向
        if (angle > -22.5 && angle <= 22.5) return 'right';
        if (angle > 22.5 && angle <= 67.5) return 'bottom_right';
        if (angle > 67.5 && angle <= 112.5) return 'bottom';
        if (angle > 112.5 && angle <= 157.5) return 'bottom_left';
        if (angle > 157.5 || angle <= -157.5) return 'left';
        if (angle > -157.5 && angle <= -112.5) return 'top_left';
        if (angle > -112.5 && angle <= -67.5) return 'top';
        if (angle > -67.5 && angle <= -22.5) return 'top_right';

        return 'center';
    }

    /**
     * 计算距离
     */
    calculateDistance(p1, p2) {
        return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
    }

    /**
     * 重置状态
     */
    reset() {
        this.trajectory = [];
        this.ballHistory = [];
        this.shotState = 'idle';
        this.lastShotTime = 0;
    }

    /**
     * 设置投篮检测回调
     */
    setShotCallback(callback) {
        this.onShotDetected = callback;
    }
}

// 导出类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ShotDetector;
}
