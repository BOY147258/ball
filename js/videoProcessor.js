/**
 * videoProcessor.js
 * 视频处理循环：从视频源获取帧 → 检测 → 分析 → 可视化
 */
const VideoProcessor = (() => {
  let video = null;
  let canvas = null;
  let isProcessing = false;
  let animationFrameId = null;
  let lastProcessTime = 0;
  const PROCESS_INTERVAL = 100; // 移动端降低处理频率到10fps
  let frameSkipCounter = 0;

  function init(videoElement, canvasElement) {
    video = videoElement;
    canvas = canvasElement;
  }

  async function processFrame() {
    if (!isProcessing || !video || !canvas) return;

    const now = Date.now();

    // 控制帧率，避免移动端过载
    if (now - lastProcessTime < PROCESS_INTERVAL) {
      animationFrameId = requestAnimationFrame(processFrame);
      return;
    }

    lastProcessTime = now;

    try {
      // 检测球和人
      const ballDetection = await Detection.detectBall(video);

      // 仅在检测到球时才运行姿态检测，节省性能
      let poseDetection = [];
      if (ballDetection || frameSkipCounter % 3 === 0) {
        poseDetection = await Detection.detectPose(video);
      }
      frameSkipCounter++;

      const detections = {
        ball: ballDetection,
        pose: poseDetection,
        timestamp: Date.now(),
        state: ShotAnalyzer.getState(),
        trajectory: ShotAnalyzer.getTrajectory(),
      };

      // 更新投篮分析状态机
      const shotResult = ShotAnalyzer.update(detections);

      // 如果检测到一次完整的投篮，显示确认弹窗
      if (shotResult) {
        handleShotDetected(shotResult);
      }

      // 绘制 overlay（检测框、骨架、轨迹）
      Visualization.drawOverlay(canvas, detections);

      // 继续下一帧
      if (isProcessing) {
        animationFrameId = requestAnimationFrame(processFrame);
      }
    } catch (error) {
      console.error('处理帧时出错:', error);
      if (isProcessing) {
        animationFrameId = requestAnimationFrame(processFrame);
      }
    }
  }

  function handleShotDetected(shotResult) {
    console.log('检测到投篮:', shotResult);
    // 显示确认弹窗让用户确认结果
    showConfirmModal(shotResult);
  }

  function showConfirmModal(shotResult) {
    const modal = document.getElementById('confirmModal');
    modal.style.display = 'flex';

    const btnHit = document.getElementById('btnConfirmHit');
    const btnMiss = document.getElementById('btnConfirmMiss');

    // 移除旧的事件监听器
    const newBtnHit = btnHit.cloneNode(true);
    const newBtnMiss = btnMiss.cloneNode(true);
    btnHit.parentNode.replaceChild(newBtnHit, btnHit);
    btnMiss.parentNode.replaceChild(newBtnMiss, btnMiss);

    newBtnHit.onclick = () => {
      confirmShot(shotResult, 'HIT');
      modal.style.display = 'none';
    };

    newBtnMiss.onclick = () => {
      confirmShot(shotResult, 'MISS');
      modal.style.display = 'none';
    };
  }

  function confirmShot(shotResult, userResult) {
    // 使用用户确认的结果
    shotResult.result = userResult;

    // 添加到统计
    Statistics.addShot(shotResult);

    // 更新显示
    Visualization.updateStatsDisplay();
    Visualization.addShotLogEntry(shotResult);
    Visualization.drawCourtView();

    // 重置分析器状态
    ShotAnalyzer.reset();
  }

  function start() {
    if (isProcessing) return;
    isProcessing = true;
    processFrame();
  }

  function stop() {
    isProcessing = false;
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
  }

  return {
    init,
    start,
    stop,
  };
})();
