/**
 * 配置文件 - C投篮训练助手
 */
const CONFIG = {
    // 应用信息
    APP_NAME: 'C投篮训练助手',
    VERSION: '1.0.0',

    // 摄像头配置
    CAMERA: {
        WIDTH: 1280,
        HEIGHT: 720,
        FPS: 30
    },

    // 篮球检测配置
    BALL: {
        // 橙色范围 (HSV)
        COLOR_LOWER: { h: 5, s: 150, v: 100 },
        COLOR_UPPER: { h: 25, s: 255, v: 255 },
        // 最小/最大半径
        MIN_RADIUS: 10,
        MAX_RADIUS: 60,
        // 圆形度阈值 (0-1)
        CIRCULARITY_THRESHOLD: 0.6,
        // 轨迹平滑窗口大小
        TRAJECTORY_SMOOTH: 5
    },

    // 球框检测配置
    HOOP: {
        // 橙色范围 (HSV) - 篮筐颜色
        COLOR_LOWER: { h: 10, s: 100, v: 80 },
        COLOR_UPPER: { h: 30, s: 255, v: 255 },
        // 椭圆长轴/短轴比例范围
        MIN_ASPECT_RATIO: 1.0,
        MAX_ASPECT_RATIO: 2.5,
        // 最小/最大尺寸
        MIN_WIDTH: 50,
        MAX_WIDTH: 400,
        // 用户可以手动设置
        MANUAL_POSITION: null  // { x, y, radius }
    },

    // 进球判断配置
    SHOT: {
        // 穿过篮筐的容差
        PASS_THRESHOLD: 1.3,  // 半径的倍数
        // 最小轨迹点数
        MIN_TRAJECTORY_POINTS: 5,
        // 投篮状态超时（毫秒）
        SHOT_TIMEOUT: 5000,
        // 出手检测阈值
        RELEASE_THRESHOLD: 0.8  // 出手时手臂高度
    },

    // 投篮姿势分析
    POSE: {
        // MediaPipe Pose 配置
        LOCATE_FILE: 'https://cdn.jsdelivr.net/npm/@mediapipe/pose/pose.js',
        MODEL_COMPLEXITY: 1,
        SMOOTH_LANDMARKS: true,
        MIN_DETECTION_CONFIDENCE: 0.5,
        MIN_TRACKING_CONFIDENCE: 0.5,
        // 出手角度范围
        RELEASE_ANGLE_MIN: 40,
        RELEASE_ANGLE_MAX: 70,
        // 手肘角度
        ELBOW_ANGLE_MIN: 140
    },

    // 关键点索引 (MediaPipe Pose 33个关键点)
    LANDMARKS: {
        NOSE: 0,
        LEFT_EYE: 2,
        RIGHT_EYE: 5,
        LEFT_EAR: 7,
        RIGHT_EAR: 8,
        LEFT_SHOULDER: 11,
        RIGHT_SHOULDER: 12,
        LEFT_ELBOW: 13,
        RIGHT_ELBOW: 14,
        LEFT_WRIST: 15,
        RIGHT_WRIST: 16,
        LEFT_HIP: 23,
        RIGHT_HIP: 24,
        LEFT_KNEE: 25,
        RIGHT_KNEE: 26,
        LEFT_ANKLE: 27,
        RIGHT_ANKLE: 28,
        LEFT_HEEL: 29,
        RIGHT_HEEL: 30,
        LEFT_FOOT_INDEX: 31,
        RIGHT_FOOT_INDEX: 32
    },

    // 样式配置
    COLORS: {
        // 深色运动风格
        PRIMARY: '#FF6B00',      // 橙色
        PRIMARY_DARK: '#CC5500',
        SECONDARY: '#FF8C33',
        BACKGROUND: '#1A1A1A',
        BACKGROUND_LIGHT: '#2A2A2A',
        SURFACE: '#252525',
        SURFACE_LIGHT: '#333333',
        TEXT: '#FFFFFF',
        TEXT_SECONDARY: '#AAAAAA',
        SUCCESS: '#00FF00',      // 命中 - 绿色
        DANGER: '#FF4444',       // 投失 - 红色
        WARNING: '#FFAA00',
        INFO: '#00AAFF',
        BORDER: '#444444',
        // 篮球场线条
        COURT_LINE: '#FF6B00',
        COURT_BACKGROUND: '#1A1A1A'
    },

    // 动画配置
    ANIMATION: {
        FPS_UPDATE_INTERVAL: 500,
        REP_COUNT_ANIMATE: true,
        COUNTDOWN_DURATION: 3000
    },

    // 数据存储
    STORAGE: {
        KEY: 'shot_trainer_data',
        MAX_SESSIONS: 100
    }
};

// 导出配置
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}
