/**
 * courtMapper.js
 * 负责篮筐位置标记，以及将视频画面坐标转换为“相对篮筐”的场地坐标。
 *
 * MVP 简化说明：
 * 由于只用单个摄像头（非俯视角），无法还原真实的公制距离。
 * 这里采用“相对篮筐的归一化偏移”作为位置指标：
 *   - 以篮筐标记点为原点
 *   - dx/dy 是相对视频画面对角线长度归一化后的偏移量
 *   - distance/angle 基于 dx/dy 计算，用于场地图布局和分区统计
 * 这足够用于识别“左侧/右侧/远/近”等相对强弱区域，
 * 后续如果需要真实距离，可以增加两点已知距离的校准步骤。
 */
const CourtMapper = (() => {
  const STORAGE_KEY = 'bst_hoopPosition';

  let hoopPosition = null; // { x, y } 视频像素坐标
  let videoWidth = 0;
  let videoHeight = 0;

  function setVideoSize(w, h) {
    videoWidth = w;
    videoHeight = h;
  }

  function setHoopPosition(x, y) {
    hoopPosition = { x, y };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(hoopPosition));
    } catch (e) {
      // localStorage 不可用时静默忽略，不影响核心功能
    }
  }

  function loadSavedHoopPosition() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        hoopPosition = JSON.parse(raw);
        return hoopPosition;
      }
    } catch (e) {
      // ignore
    }
    return null;
  }

  function getHoopPosition() {
    return hoopPosition;
  }

  function hasHoopPosition() {
    return hoopPosition !== null;
  }

  function clearHoopPosition() {
    hoopPosition = null;
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      // ignore
    }
  }

  /**
   * 将视频像素坐标转换为相对篮筐的归一化坐标
   * @returns {{dx:number, dy:number, distance:number, angle:number}}
   */
  function screenToCourtCoordinates(x, y) {
    if (!hoopPosition || !videoWidth || !videoHeight) {
      return { dx: 0, dy: 0, distance: 0, angle: 0 };
    }
    const diagonal = Math.sqrt(videoWidth * videoWidth + videoHeight * videoHeight);
    const dx = (x - hoopPosition.x) / diagonal;
    const dy = (y - hoopPosition.y) / diagonal;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);
    return { dx, dy, distance, angle };
  }

  return {
    setVideoSize,
    setHoopPosition,
    loadSavedHoopPosition,
    getHoopPosition,
    hasHoopPosition,
    clearHoopPosition,
    screenToCourtCoordinates,
  };
})();
