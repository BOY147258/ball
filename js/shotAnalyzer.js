/**
 * shotAnalyzer.js
 * 投篮动作识别和进球判定的核心模块
 * 使用状态机追踪投篮流程：IDLE → PREPARING → SHOOTING → BALL_IN_AIR → EVALUATING
 */
const ShotAnalyzer = (() => {
  const STATE = {
    IDLE: 'IDLE',
    PREPARING: 'PREPARING',
    SHOOTING: 'SHOOTING',
    BALL_IN_AIR: 'BALL_IN_AIR',
    EVALUATING: 'EVALUATING'
  };

  let currentState = STATE.IDLE;
  let ballTrajectory = []; // 记录球的轨迹 [{x, y, timestamp}]
  let shooterPosition = null; // 投手位置
  let lastBallPos = null;
  let stateStartTime = 0;
  let armWasRaised = false;

  // 超时设置（毫秒）
  const TIMEOUT = {
    PREPARING: 3000,    // 准备状态最多3秒
    BALL_IN_AIR: 5000,  // 球在空中最多5秒
    EVALUATING: 1000    // 评估状态1秒
  };

  function reset() {
    currentState = STATE.IDLE;
    ballTrajectory = [];
    shooterPosition = null;
    lastBallPos = null;
    stateStartTime = 0;
    armWasRaised = false;
  }

  function getState() {
    return currentState;
  }

  function getTrajectory() {
    return ballTrajectory;
  }

  /**
   * 核心更新函数，每帧调用
   * @param {object} detections - { ball, pose, timestamp }
   * @returns {object|null} - 如果完成一次投篮识别，返回 { result: 'HIT'|'MISS', position, trajectory }
   */
  function update(detections) {
    const now = detections.timestamp || Date.now();
    const ball = detections.ball;
    const pose = detections.pose;
    const hoopPos = CourtMapper.getHoopPosition();

    // 如果没有篮筐位置，无法进行分析
    if (!hoopPos) {
      return null;
    }

    // 状态超时检查
    if (stateStartTime > 0 && currentState !== STATE.IDLE) {
      const elapsed = now - stateStartTime;
      const timeout = TIMEOUT[currentState] || 10000;
      if (elapsed > timeout) {
        console.log(`状态 ${currentState} 超时，重置`);
        reset();
        return null;
      }
    }

    switch (currentState) {
      case STATE.IDLE:
        // 检测到人和球 → 进入准备状态
        if (pose && pose.length > 0 && ball) {
          const personPos = Detection.getPersonFootPosition(pose);
          if (personPos) {
            shooterPosition = personPos;
            currentState = STATE.PREPARING;
            stateStartTime = now;
            ballTrajectory = [];
            console.log('进入 PREPARING 状态');
          }
        }
        break;

      case STATE.PREPARING:
        // 等待投篮动作（手臂向上）
        if (!ball) {
          // 球消失，可能被遮挡或离开画面，回到 IDLE
          reset();
          break;
        }

        if (pose && Detection.isArmRaising(pose)) {
          armWasRaised = true;
        }

        // 如果手臂抬起且球开始向上移动 → 进入投篮状态
        if (armWasRaised && lastBallPos && ball.centerY < lastBallPos.y - 10) {
          currentState = STATE.SHOOTING;
          stateStartTime = now;
          ballTrajectory = [{ x: ball.centerX, y: ball.centerY, timestamp: now }];
          console.log('进入 SHOOTING 状态');
        }

        lastBallPos = ball ? { x: ball.centerX, y: ball.centerY } : null;
        break;

      case STATE.SHOOTING:
        // 球离开人体区域 → 球在空中
        if (!ball) {
          // 球可能短暂消失，继续等待
          break;
        }

        ballTrajectory.push({ x: ball.centerX, y: ball.centerY, timestamp: now });

        const personPos = Detection.getPersonFootPosition(pose);
        if (personPos) {
          const distToPerson = Math.sqrt(
            Math.pow(ball.centerX - personPos.x, 2) +
            Math.pow(ball.centerY - personPos.y, 2)
          );
          // 球距离人体超过一定距离 → 球在空中
          if (distToPerson > 150) {
            currentState = STATE.BALL_IN_AIR;
            stateStartTime = now;
            console.log('进入 BALL_IN_AIR 状态');
          }
        }
        break;

      case STATE.BALL_IN_AIR:
        // 追踪球的轨迹，判断是否进球
        if (ball) {
          ballTrajectory.push({ x: ball.centerX, y: ball.centerY, timestamp: now });
        }

        // 判断是否可以评估进球
        // 1. 球已经过篮筐位置
        // 2. 球轨迹足够长
        if (ballTrajectory.length > 10) {
          const result = evaluateShot(ballTrajectory, hoopPos);
          if (result) {
            currentState = STATE.EVALUATING;
            stateStartTime = now;
            return result;
          }
        }

        // 如果球消失太久或落地，也触发评估
        if (!ball && ballTrajectory.length > 5) {
          const result = evaluateShot(ballTrajectory, hoopPos);
          if (result) {
            currentState = STATE.EVALUATING;
            stateStartTime = now;
            return result;
          } else {
            reset();
          }
        }
        break;

      case STATE.EVALUATING:
        // 等待一小段时间后重置
        if (now - stateStartTime > TIMEOUT.EVALUATING) {
          reset();
        }
        break;
    }

    return null;
  }

  /**
   * 评估投篮结果
   * @returns {object|null} - { result: 'HIT'|'MISS', position, trajectory }
   */
  function evaluateShot(trajectory, hoopPos) {
    if (trajectory.length < 5) return null;

    // 简化判断逻辑：
    // 1. 检查球的轨迹是否经过篮筐附近
    // 2. 检查球是否向下穿过篮筐

    const HOOP_RADIUS = 40; // 篮筐判定半径（像素）

    let passedHoop = false;
    let wasAboveHoop = false;
    let wentDown = false;

    for (let i = 1; i < trajectory.length; i++) {
      const curr = trajectory[i];
      const prev = trajectory[i - 1];

      const distToHoop = Math.sqrt(
        Math.pow(curr.x - hoopPos.x, 2) +
        Math.pow(curr.y - hoopPos.y, 2)
      );

      // 球在篮筐上方
      if (curr.y < hoopPos.y - 20) {
        wasAboveHoop = true;
      }

      // 球向下移动
      if (curr.y > prev.y) {
        wentDown = true;
      }

      // 球经过篮筐区域
      if (distToHoop < HOOP_RADIUS && wasAboveHoop && wentDown) {
        passedHoop = true;
      }
    }

    // 如果球经过篮筐区域且满足条件 → 可能进球
    // 注意：这只是简化判断，实际需要用户确认
    const result = passedHoop ? 'HIT' : 'MISS';

    // 计算投手位置（相对篮筐）
    const position = shooterPosition ?
      CourtMapper.screenToCourtCoordinates(shooterPosition.x, shooterPosition.y) :
      { dx: 0, dy: 0, distance: 0, angle: 0 };

    return {
      result,
      position: {
        ...position,
        screenX: shooterPosition ? shooterPosition.x : 0,
        screenY: shooterPosition ? shooterPosition.y : 0,
      },
      trajectory: trajectory.slice(),
      timestamp: Date.now(),
    };
  }

  return {
    reset,
    getState,
    getTrajectory,
    update,
  };
})();
