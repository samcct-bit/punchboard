import React, { useState } from 'react';
import { Prize, HistoryEntry } from '../App';

interface AdminPanelProps {
  prizePool: Prize[];
  setPrizePool: (pool: Prize[]) => void;
  historyLog: HistoryEntry[];
  clearHistory: () => void;
  onSaveAndStart: () => void;
  resetAllGame: () => void;
  onLoadTodaysGifts: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  prizePool,
  setPrizePool,
  historyLog,
  clearHistory,
  onSaveAndStart,
  resetAllGame,
  onLoadTodaysGifts,
}) => {
  const [newPrizeName, setNewPrizeName] = useState('');
  const [newPrizeQty, setNewPrizeQty] = useState<number>(1);

  // Calculate stats
  const totalInitialPrizes = prizePool.reduce((sum, p) => sum + p.totalQuantity, 0);
  const totalPunchedPrizes = prizePool.reduce((sum, p) => sum + p.punchedQuantity, 0);
  const totalRemainingPrizes = totalInitialPrizes - totalPunchedPrizes;

  const handleQtyChange = (id: string, value: number) => {
    const updated = prizePool.map((p) => {
      if (p.id === id) {
        const qty = Math.max(p.punchedQuantity, value); // Cannot set less than what is already punched
        return { ...p, totalQuantity: qty };
      }
      return p;
    });
    setPrizePool(updated);
  };

  const handleAddPrize = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPrizeName.trim()) return;

    // Check if prize exists
    const exists = prizePool.find((p) => p.name === newPrizeName.trim());
    if (exists) {
      handleQtyChange(exists.id, exists.totalQuantity + newPrizeQty);
    } else {
      const newPrize: Prize = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
        name: newPrizeName.trim(),
        totalQuantity: newPrizeQty,
        punchedQuantity: 0,
      };
      setPrizePool([...prizePool, newPrize]);
    }
    setNewPrizeName('');
    setNewPrizeQty(1);
  };

  const handleDeletePrize = (id: string) => {
    const prize = prizePool.find((p) => p.id === id);
    if (!prize) return;
    if (prize.punchedQuantity > 0) {
      alert('該品項已經有被抽中的紀錄，無法刪除！但您可以調低數量。');
      return;
    }
    setPrizePool(prizePool.filter((p) => p.id !== id));
  };

  return (
    <div className="admin-container">
      <div className="admin-header card">
        <h2>🛠️ 戳戳樂後台管理</h2>
        <p className="subtitle">在這裡您可以設定獎品清單與總數量。目前剩餘獎品總數：<strong>{totalRemainingPrizes}</strong> 份。</p>
        
        <div className="admin-quick-stats">
          <div className="stat-box">
            <span className="stat-val">{totalInitialPrizes}</span>
            <span className="stat-lbl">初始獎品總數</span>
          </div>
          <div className="stat-box">
            <span className="stat-val positive">{totalRemainingPrizes}</span>
            <span className="stat-lbl">剩餘可抽獎品</span>
          </div>
          <div className="stat-box">
            <span className="stat-val negative">{totalPunchedPrizes}</span>
            <span className="stat-lbl">已戳出獎品數</span>
          </div>
        </div>
      </div>

      <div className="admin-body">
        {/* Prize List Configuration */}
        <div className="admin-section card">
          <h3>📦 獎品清單設定</h3>
          
          <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={onLoadTodaysGifts}
              className="btn btn-outline"
              style={{
                borderColor: 'var(--color-peach)',
                fontSize: '14px',
                padding: '8px 16px',
                borderRadius: '30px'
              }}
            >
              📥 一鍵載入今日 93 份預設禮品清單
            </button>
          </div>

          <form onSubmit={handleAddPrize} className="add-prize-form">
            <input
              type="text"
              placeholder="新增獎品名稱 (例如: 樂高積木)"
              value={newPrizeName}
              onChange={(e) => setNewPrizeName(e.target.value)}
              className="input-text"
              required
            />
            <input
              type="number"
              min="1"
              value={newPrizeQty}
              onChange={(e) => setNewPrizeQty(parseInt(e.target.value) || 1)}
              className="input-number"
              required
            />
            <button type="submit" className="btn btn-primary">新增 / 增加數量</button>
          </form>

          <div className="prize-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>獎品品名</th>
                  <th style={{ width: '120px' }}>初始總量</th>
                  <th style={{ width: '100px' }}>已抽中</th>
                  <th style={{ width: '100px' }}>剩餘數量</th>
                  <th style={{ width: '80px' }}>操作</th>
                </tr>
              </thead>
              <tbody>
                {prizePool.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', color: '#999' }}>
                      目前獎品池為空，請在上方新增獎品！
                    </td>
                  </tr>
                ) : (
                  prizePool.map((prize) => {
                    const remaining = prize.totalQuantity - prize.punchedQuantity;
                    return (
                      <tr key={prize.id}>
                        <td className="prize-name-cell">🎁 {prize.name}</td>
                        <td>
                          <input
                            type="number"
                            min={prize.punchedQuantity}
                            value={prize.totalQuantity}
                            onChange={(e) => handleQtyChange(prize.id, parseInt(e.target.value) || 0)}
                            className="table-input-number"
                          />
                        </td>
                        <td className="txt-muted">{prize.punchedQuantity}</td>
                        <td className={`txt-bold ${remaining > 0 ? 'txt-success' : 'txt-danger'}`}>
                          {remaining}
                        </td>
                        <td>
                          <button
                            onClick={() => handleDeletePrize(prize.id)}
                            className="btn-text btn-delete"
                            title="刪除品項"
                            disabled={prize.punchedQuantity > 0}
                          >
                            🗑️
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* History Logs */}
        <div className="admin-section card">
          <div className="section-title-row">
            <h3>📜 得獎紀錄歷程 (共 {historyLog.length} 筆)</h3>
            {historyLog.length > 0 && (
              <button onClick={clearHistory} className="btn-text btn-danger">
                清空紀錄
              </button>
            )}
          </div>
          
          <div className="log-list-wrapper">
            {historyLog.length === 0 ? (
              <p className="no-logs">目前尚無任何得獎紀錄。</p>
            ) : (
              <div className="log-scroll">
                <table className="admin-table simple-table">
                  <thead>
                    <tr>
                      <th>時間</th>
                      <th>輪數</th>
                      <th>獲得獎項</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historyLog.map((log) => (
                      <tr key={log.id}>
                        <td className="txt-sm">{log.timestamp}</td>
                        <td>第 {log.roundName} 輪</td>
                        <td className="txt-bold">🎉 {log.prizeName}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer Controls */}
      <div className="admin-footer-controls">
        <button onClick={resetAllGame} className="btn btn-outline-danger">
          ⚠️ 重設整個遊戲 (清除所有設定與紀錄)
        </button>
        <button onClick={onSaveAndStart} className="btn btn-success btn-large">
          💾 儲存設定並進入前台遊戲畫面
        </button>
      </div>
    </div>
  );
};
