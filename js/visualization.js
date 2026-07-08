/**
 * visualization.js
 * 负责绘制统计图表、场地俯视图、实时检测框和球轨迹
 */
const Visualization = (() => {
  let pieChart = null;

  /**
   * 初始化饼图
   */
  function initPieChart() {
    const ctx = document.getElementById('pieChart');
    if (!ctx) return;

    pieChart = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: ['命中', '未命中'],
        datasets: [{
          data: [0, 0],
          backgroundColor: ['#4caf50', '#e53935'],
          borderWidth: 0,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: { color: '#e6e6e6' }
          }
        }
      }
    });
  }

  /**
   * 更新统计面板和饼图
   */
  function updateStatsDisplay() {
    const stats = Statistics.getStats();
    document.getElementById('statTotal').textContent = stats.total;
    document.getElementById('statHit').textContent = stats.hit;
    document.getElementById('statMiss').textContent = stats.miss;
    document.getElementById('statPct').textContent = stats.accuracy + '%';

    if (pieChart) {
      pieChart.data.datasets[0].data = [stats.hit, stats.miss];
      pieChart.update();
    }
  }

  /**
   * 在投篮记录日志中添加一条
   */
  function addShotLogEntry(shot) {
    const log = document.getElementById('shotsLog');
    const entry = document.createElement('div');
    entry.className = `shot-entry ${shot.result.toLowerCase()}`;
    const time = new Date(shot.timestamp).toLocaleTimeString('zh-CN');
    const resultText = shot.result === 'HIT' ? '✓ 命中' : '✗ 未命中';
    entry.innerHTML = `<span>${time}</span><span>${resultText}</span>`;
    log.insertBefore(entry, log.firstChild);
  }

  /**
   * 清空投篮记录日志
   */
  function clearShotsLog() {
    const log = document.getElementById('shotsLog');
    log.innerHTML = '';
  }

  /**
   * 绘制场地俯视图
   * 显示篮筐位置、每次投篮的位置（绿勾/红叉）
   */
  function drawCourtView() {
    const canvas = document.getElementById('courtCanvas');
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    // 绘制背景色
    ctx.fillStyle = '#1c2028';
    ctx.fillRect(0, 0, w, h);

    // 绘制简化的半场区域（仅示意）
    ctx.strokeStyle = '#3a4048';
    ctx.lineWidth = 2;
    ctx.strokeRect(50, 50, w - 100, h - 100);

    // 篮筐位置（固定在顶部中央作为参考点）
    const hoopX = w / 2;
    const hoopY = 120;

    // 绘制篮筐标记
    ctx.fillStyle = '#ff7a00';
    ctx.beginPath();
    ctx.arc(hoopX, hoopY, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🎯', hoopX, hoopY + 6);

    // 绘制投篮点
    const shots = Statistics.getAllShots();
    shots.forEach(shot => {
      // 基于 dx/dy 相对偏移量映射到画布
      // 缩放因子用于调整显示范围
      const scale = 400;
      const shotX = hoopX + shot.position.dx * scale;
      const shotY = hoopY + shot.position.dy * scale;

      // 确保在画布范围内
      if (shotX < 0 || shotX > w || shotY < 0 || shotY > h) return;

      if (shot.result === 'HIT') {
        // 绿色打勾
        ctx.fillStyle = '#4caf50';
        ctx.font = 'bold 20px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('✓', shotX, shotY);
      } else {
        // 红色打叉
        ctx.fillStyle = '#e53935';
        ctx.font = 'bold 20px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('✗', shotX, shotY);
      }
    });

    // 绘制说明文字
    ctx.fillStyle = '#9aa0aa';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('绿色 ✓ = 命中    红色 ✗ = 未命中', 60, h - 60);
  }

  /**
   * 在视频 overlay canvas 上绘制检测框、骨架、球轨迹
   */
  function drawOverlay(canvas, detections) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 绘制篮筐标记（如果已设置）
    const hoop = CourtMapper.getHoopPosition();
    if (hoop) {
      ctx.strokeStyle = '#ff7a00';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(hoop.x, hoop.y, 20, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = '#ff7a00';
      ctx.font = 'bold 24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🎯', hoop.x, hoop.y + 8);
    }

    // 绘制球的检测框
    if (detections.ball) {
      const ball = detections.ball;
      ctx.strokeStyle = '#ff5722';
      ctx.lineWidth = 2;
      ctx.strokeRect(ball.x, ball.y, ball.width, ball.height);
      ctx.fillStyle = '#ff5722';
      ctx.font = '14px sans-serif';
      ctx.fillText('Basketball', ball.x, ball.y - 5);
    }

    // 绘制人体姿态骨架（简化版，连接关键点）
    if (detections.pose && detections.pose.length > 0) {
      ctx.fillStyle = '#00bcd4';
      ctx.strokeStyle = '#00bcd4';
      ctx.lineWidth = 2;

      // 绘制关键点
      detections.pose.forEach(kp => {
        if (kp.visibility > 0.5) {
          ctx.beginPath();
          ctx.arc(kp.x, kp.y, 4, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // 绘制骨架连接（简化）
      const connections = [
        [11, 12], [11, 13], [13, 15], [12, 14], [14, 16], // 上半身
        [11, 23], [12, 24], [23, 24], // 躯干
        [23, 25], [25, 27], [24, 26], [26, 28] // 下半身
      ];
      connections.forEach(([i, j]) => {
        const p1 = detections.pose[i];
        const p2 = detections.pose[j];
        if (p1 && p2 && p1.visibility > 0.5 && p2.visibility > 0.5) {
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
        }
      });
    }

    // 绘制球轨迹
    if (detections.trajectory && detections.trajectory.length > 1) {
      ctx.strokeStyle = '#ffeb3b';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(detections.trajectory[0].x, detections.trajectory[0].y);
      for (let i = 1; i < detections.trajectory.length; i++) {
        ctx.lineTo(detections.trajectory[i].x, detections.trajectory[i].y);
      }
      ctx.stroke();
    }

    // 显示当前状态
    if (detections.state) {
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`状态: ${detections.state}`, 10, 30);
    }
  }

  return {
    initPieChart,
    updateStatsDisplay,
    addShotLogEntry,
    clearShotsLog,
    drawCourtView,
    drawOverlay,
  };
})();
