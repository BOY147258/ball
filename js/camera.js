/**
 * 摄像头管理器 - C投篮训练助手
 */
class CameraManager {
    constructor() {
        this.video = null;
        this.stream = null;
        this.deviceId = null;
        this.isRunning = false;
        this.dimensions = { width: 0, height: 0 };
    }

    /**
     * 初始化
     * @param {HTMLVideoElement} video - 视频元素
     */
    init(video) {
        this.video = video;
    }

    /**
     * 获取摄像头设备列表
     * @returns {Promise<MediaDeviceInfo[]>}
     */
    async getDevices() {
        try {
            // 先请求权限以获取设备标签
            await navigator.mediaDevices.getUserMedia({ video: true }).then(stream => {
                stream.getTracks().forEach(track => track.stop());
            });
        } catch (e) {
            console.warn('摄像头权限获取失败:', e);
        }

        const devices = await navigator.mediaDevices.enumerateDevices();
        return devices.filter(device => device.kind === 'videoinput');
    }

    /**
     * 启动摄像头
     * @param {string|null} deviceId - 设备ID
     */
    async start(deviceId = null) {
        if (this.isRunning) {
            await this.stop();
        }

        try {
            const constraints = {
                video: {
                    deviceId: deviceId ? { exact: deviceId } : undefined,
                    width: { ideal: CONFIG.CAMERA.WIDTH },
                    height: { ideal: CONFIG.CAMERA.HEIGHT },
                    frameRate: { ideal: CONFIG.CAMERA.FPS }
                },
                audio: false
            };

            this.stream = await navigator.mediaDevices.getUserMedia(constraints);
            this.video.srcObject = this.stream;

            await new Promise((resolve, reject) => {
                this.video.onloadedmetadata = () => {
                    this.video.play();
                    this.dimensions = {
                        width: this.video.videoWidth,
                        height: this.video.videoHeight
                    };
                    this.isRunning = true;
                    resolve();
                };
                this.video.onerror = reject;

                // 超时保护
                setTimeout(() => resolve(), 3000);
            });

            // 尝试获取设备ID
            if (!deviceId && this.stream.getVideoTracks().length > 0) {
                const track = this.stream.getVideoTracks()[0];
                const settings = track.getSettings();
                this.deviceId = settings.deviceId;
            } else {
                this.deviceId = deviceId;
            }

            return true;
        } catch (error) {
            console.error('启动摄像头失败:', error);
            throw error;
        }
    }

    /**
     * 停止摄像头
     */
    async stop() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
        if (this.video) {
            this.video.srcObject = null;
        }
        this.isRunning = false;
        this.deviceId = null;
    }

    /**
     * 切换摄像头
     */
    async switchCamera() {
        const devices = await this.getDevices();
        if (devices.length < 2) return false;

        const currentIndex = devices.findIndex(d => d.deviceId === this.deviceId);
        const nextIndex = (currentIndex + 1) % devices.length;

        await this.stop();
        await this.start(devices[nextIndex].deviceId);
        return true;
    }

    /**
     * 检查是否正在运行
     */
    isCameraRunning() {
        return this.isRunning;
    }

    /**
     * 获取视频尺寸
     */
    getDimensions() {
        return { ...this.dimensions };
    }

    /**
     * 获取当前帧
     * @returns {HTMLCanvasElement}
     */
    getFrame() {
        const canvas = document.createElement('canvas');
        canvas.width = this.dimensions.width;
        canvas.height = this.dimensions.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(this.video, 0, 0);
        return canvas;
    }
}

// 导出类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CameraManager;
}
