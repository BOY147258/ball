/**
 * statistics.js
 * 负责投篮数据的存储、统计计算和导出功能。
 */
const Statistics = (() => {
  let shots = []; // 存储所有投篮记录

  /**
   * 添加一次投篮记录
   * @param {object} shotData - { timestamp, position: {x, y, dx, dy, distance, angle}, result: 'HIT'|'MISS', trajectory }
   */
  function addShot(shotData) {
    shots.push(shotData);
  }

  /**
   * 获取所有投篮记录
   */
  function getAllShots() {
    return shots;
  }

  /**
   * 清空所有数据
   */
  function reset() {
    shots = [];
  }

  /**
   * 计算统计数据
   * @returns {{total: number, hit: number, miss: number, accuracy: number}}
   */
  function getStats() {
    const total = shots.length;
    const hit = shots.filter(s => s.result === 'HIT').length;
    const miss = total - hit;
    const accuracy = total > 0 ? (hit / total * 100).toFixed(1) : 0;
    return { total, hit, miss, accuracy };
  }

  /**
   * 导出数据为 JSON
   */
  function exportData() {
    const stats = getStats();
    const data = {
      exportTime: new Date().toISOString(),
      summary: stats,
      shots: shots,
    };
    return JSON.stringify(data, null, 2);
  }

  /**
   * 触发下载 JSON 文件
   */
  function downloadData() {
    const json = exportData();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `basketball-shots-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return {
    addShot,
    getAllShots,
    reset,
    getStats,
    exportData,
    downloadData,
  };
})();
