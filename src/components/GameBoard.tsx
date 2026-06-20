import React from 'react';
import { Hole, Prize } from '../App';
import { PunchHole } from './PunchHole';

interface GameBoardProps {
  holes: Hole[];
  currentRound: number;
  prizePool: Prize[];
  onPunch: (id: number) => void;
  onStartNextRound: () => void;
  onGoToAdmin: () => void;
}

export const GameBoard: React.FC<GameBoardProps> = ({
  holes,
  currentRound,
  prizePool,
  onPunch,
  onStartNextRound,
  onGoToAdmin,
}) => {
  const punchedCount = holes.filter((h) => h.isPunched).length;
  const isRoundComplete = punchedCount === holes.length;

  // Calculate total remaining prizes in the entire game
  const totalInitialPrizes = prizePool.reduce((sum, p) => sum + p.totalQuantity, 0);
  const totalPunchedPrizes = prizePool.reduce((sum, p) => sum + p.punchedQuantity, 0);
  const totalRemainingPrizes = totalInitialPrizes - totalPunchedPrizes;

  // Count how many actual prizes (excluding "感謝參與") are left hidden on the current board
  const prizesHiddenOnBoard = holes.filter((h) => !h.isPunched && h.prizeName !== '感謝參與').length;

  return (
    <div className="game-container">
      {/* Game Header Panel */}
      <div className="game-header card">
        <div className="header-top">
          <div className="round-badge">第 {currentRound} 輪</div>
          <h1 className="game-title">🏫 班級期末歡樂戳戳樂</h1>
          <button onClick={onGoToAdmin} className="btn-admin-gear" title="進入後台管理">
            ⚙️ 後台設定
          </button>
        </div>

        <div className="header-stats">
          <div className="progress-section">
            <div className="stat-text-row">
              <span>本輪進度：<strong>{punchedCount}</strong> / {holes.length} 格</span>
              <span>剩餘獎品總數：<strong>{totalRemainingPrizes}</strong> 份</span>
            </div>
            <div className="progress-bar-bg">
              <div
                className="progress-bar-fill"
                style={{ width: `${(punchedCount / holes.length) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="helper-hint">
          {prizesHiddenOnBoard > 0 ? (
            <span>💡 提示：本輪面板上還有 <strong>{prizesHiddenOnBoard}</strong> 個獎品藏在格子裡喔！加油！</span>
          ) : (
            <span className="txt-warning">⚠️ 提示：本輪剩餘未戳開的格子內已經沒有獎品了（只剩「感謝參與」）。</span>
          )}
        </div>
      </div>

      {/* The 6x6 Punch Grid */}
      <div className="grid-outer-board">
        <div className="grid-corkboard">
          <div className="punch-grid">
            {holes.map((hole) => (
              <PunchHole key={hole.id} hole={hole} onPunch={onPunch} />
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Status / Round Controls */}
      <div className="game-controls-footer">
        {isRoundComplete ? (
          <div className="round-action-card card pop-in">
            {totalRemainingPrizes > 0 ? (
              <div className="next-round-cta">
                <h3>🎉 太棒了！本輪 36 格已全部戳完！</h3>
                <p>後台獎品池目前還剩 <strong>{totalRemainingPrizes}</strong> 份禮物。</p>
                <button onClick={onStartNextRound} className="btn btn-primary btn-large btn-glow">
                  ✨ 開始下一輪 (載入剩餘獎品) ✨
                </button>
              </div>
            ) : (
              <div className="next-round-cta finished">
                <h3>🏆 恭喜！所有的禮物都已經被戳出來囉！ 🏆</h3>
                <p>本學期的發送獎品活動已完美結束。辛苦各位學生與老師了！</p>
                <button onClick={onGoToAdmin} className="btn btn-success btn-large">
                  ↩️ 返回後台管理
                </button>
              </div>
            )}
          </div>
        ) : (
          // If not complete, allow skipping to next round if there are remaining prizes in the pool,
          // OR if there are no prizes left on this board and no prizes left in the pool.
          <div className="skip-round-row">
            {totalRemainingPrizes > 0 && (
              <button onClick={onStartNextRound} className="btn btn-outline">
                ⏭️ 跳過本輪，直接開始下一輪 (剩餘 {totalRemainingPrizes} 份)
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
