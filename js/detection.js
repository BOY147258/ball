/**
 * detection.js
 * 负责加载和运行 AI 模型（COCO-SSD 检测球，MediaPipe Pose 检测人体）
 */
const Detection = (() => {
  let cocoModel = null;
  let pose = null;
  let isModelReady = false;

  /**
   * 初始化所有 AI 模型
   */
  async function init(onProgress) {
    try {
      onProgress('正在加载 TensorFlow.js...');
      await tf.ready();

      onProgress('正在加载 COCO-SSD 模型（球检测）...');
      cocoModel = await cocoSsd.load({
        base: 'lite_mobilenet_v2' // 使用轻量级版本提升性能
      });

      onProgress('正在加载 MediaPipe Pose 模型（人体检测）...');

      // 检测是否为移动设备
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

      pose = new Pose({
        locateFile: (file) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675471989/${file}`;
        }
      });

      pose.setOptions({
        modelComplexity: isMobile ? 0 : 1, // 移动端使用lite模型
        smoothLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
      });

      // MediaPipe Pose 不需要显式初始化
      // 创建实例并设置选项后即可使用

      isModelReady = true;
      onProgress('模型加载完成！');
      return true;
    } catch (error) {
      console.error('模型加载失败:', error);
      onProgress('模型加载失败: ' + error.message);
      return false;
    }
  }

  /**
   * 检测视频帧中的篮球
   * @param {HTMLVideoElement|HTMLCanvasElement} videoElement
   * @returns {object|null} - { x, y, width, height, confidence } 或 null
   */
  async function detectBall(videoElement) {
    if (!cocoModel) return null;

    try {
      const predictions = await cocoModel.detect(videoElement);

      // COCO-SSD 将篮球归类为 "sports ball"
      const ball = predictions.find(p => p.class === 'sports ball');

      if (ball && ball.score > 0.4) {
        return {
          x: ball.bbox[0],
          y: ball.bbox[1],
          width: ball.bbox[2],
          height: ball.bbox[3],
          confidence: ball.score,
          centerX: ball.bbox[0] + ball.bbox[2] / 2,
          centerY: ball.bbox[1] + ball.bbox[3] / 2,
        };
      }
    } catch (error) {
      console.error('球检测错误:', error);
    }

    return null;
  }

  /**
   * 检测人体姿态
   * @param {HTMLVideoElement|HTMLCanvasElement} videoElement
   * @returns {Promise<Array>} - 33个关键点数组，每个点 {x, y, z, visibility}
   */
  async function detectPose(videoElement) {
    if (!pose) return [];

    return new Promise((resolve) => {
      pose.onResults((results) => {
        if (results.poseLandmarks) {
          // MediaPipe Pose 返回归一化坐标 [0,1]，需要转换为像素坐标
          const landmarks = results.poseLandmarks.map((lm, idx) => ({
            id: idx,
            x: lm.x * videoElement.videoWidth || lm.x * videoElement.width,
            y: lm.y * videoElement.videoHeight || lm.y * videoElement.height,
            z: lm.z,
            visibility: lm.visibility || 1.0
          }));
          resolve(landmarks);
        } else {
          resolve([]);
        }
      });

      pose.send({ image: videoElement }).catch(err => {
        console.error('姿态检测错误:', err);
        resolve([]);
      });
    });
  }

  /**
   * 从姿态关键点中获取人物的脚部位置（用于定位投手位置）
   * @returns {{x: number, y: number}|null}
   */
  function getPersonFootPosition(poseLandmarks) {
    if (!poseLandmarks || poseLandmarks.length < 28) return null;

    // MediaPipe Pose 关键点索引：
    // 27 = 左脚踝, 28 = 右脚踝
    const leftAnkle = poseLandmarks[27];
    const rightAnkle = poseLandmarks[28];

    if (leftAnkle && rightAnkle &&
        leftAnkle.visibility > 0.5 && rightAnkle.visibility > 0.5) {
      return {
        x: (leftAnkle.x + rightAnkle.x) / 2,
        y: (leftAnkle.y + rightAnkle.y) / 2,
      };
    }

    // 如果脚踝不可见，使用髋部位置
    const leftHip = poseLandmarks[23];
    const rightHip = poseLandmarks[24];
    if (leftHip && rightHip &&
        leftHip.visibility > 0.5 && rightHip.visibility > 0.5) {
      return {
        x: (leftHip.x + rightHip.x) / 2,
        y: (leftHip.y + rightHip.y) / 2,
      };
    }

    return null;
  }

  /**
   * 判断手臂是否向上运动（投篮动作特征）
   */
  function isArmRaising(poseLandmarks) {
    if (!poseLandmarks || poseLandmarks.length < 16) return false;

    // 手腕 (15, 16) 是否高于肩膀 (11, 12)
    const leftWrist = poseLandmarks[15];
    const rightWrist = poseLandmarks[16];
    const leftShoulder = poseLandmarks[11];
    const rightShoulder = poseLandmarks[12];

    const leftRaising = leftWrist && leftShoulder &&
                       leftWrist.visibility > 0.5 && leftShoulder.visibility > 0.5 &&
                       leftWrist.y < leftShoulder.y;

    const rightRaising = rightWrist && rightShoulder &&
                        rightWrist.visibility > 0.5 && rightShoulder.visibility > 0.5 &&
                        rightWrist.y < rightShoulder.y;

    return leftRaising || rightRaising;
  }

  function isReady() {
    return isModelReady;
  }

  return {
    init,
    detectBall,
    detectPose,
    getPersonFootPosition,
    isArmRaising,
    isReady,
  };
})();
