import { useState, useEffect } from 'react';
import { AdminPanel } from './components/AdminPanel';
import { GameBoard } from './components/GameBoard';
import { audioSynth } from './utils/audio';

export interface Prize {
  id: string;
  name: string;
  totalQuantity: number;
  punchedQuantity: number;
}

export interface Hole {
  id: number;
  prizeId: string | null;
  prizeName: string;
  isPunched: boolean;
  punchedTime?: string;
}

export interface HistoryEntry {
  id: string;
  prizeName: string;
  roundName: number;
  timestamp: string;
}

const DEFAULT_PRIZES: Prize[] = [];

const TODAYS_GIFT_LIST: Prize[] = [
  { id: '1', name: '卡迪那 95°C 薯條經典原味', totalQuantity: 12, punchedQuantity: 0 },
  { id: '2', name: '本事橘品岩燒海苔 (原味)', totalQuantity: 12, punchedQuantity: 0 },
  { id: '3', name: '翠菓子-航空米果', totalQuantity: 20, punchedQuantity: 0 },
  { id: '4', name: '小老闆海苔棒棒捲 (原味)', totalQuantity: 9, punchedQuantity: 0 },
  { id: '5', name: '義美小泡芙 (草莓)', totalQuantity: 3, punchedQuantity: 0 },
  { id: '6', name: '芒果棒', totalQuantity: 8, punchedQuantity: 0 },
  { id: '7', name: '優格棒', totalQuantity: 7, punchedQuantity: 0 },
  { id: '8', name: '晶晶葡萄果汁棒', totalQuantity: 8, punchedQuantity: 0 },
  { id: '9', name: '果味棒', totalQuantity: 8, punchedQuantity: 0 },
  { id: '10', name: '捲心餅 (1份)', totalQuantity: 1, punchedQuantity: 0 },
  { id: '11', name: '黑豆煎餅 (1份)', totalQuantity: 1, punchedQuantity: 0 },
  { id: '12', name: '原味煎餅 (1份)', totalQuantity: 1, punchedQuantity: 0 },
  { id: '13', name: '海苔薄燒 (1份)', totalQuantity: 1, punchedQuantity: 0 },
  { id: '14', name: '海苔煎餅 (1份)', totalQuantity: 1, punchedQuantity: 0 },
  { id: '15', name: '義美小泡芙 (藍莓夾香風味)', totalQuantity: 1, punchedQuantity: 0 },
];

function App() {
  const [prizePool, setPrizePool] = useState<Prize[]>(() => {
    const saved = localStorage.getItem('punch_prize_pool');
    return saved ? JSON.parse(saved) : DEFAULT_PRIZES;
  });

  const [holes, setHoles] = useState<Hole[]>(() => {
    const saved = localStorage.getItem('punch_holes');
    return saved ? JSON.parse(saved) : [];
  });

  const [currentRound, setCurrentRound] = useState<number>(() => {
    const saved = localStorage.getItem('punch_current_round');
    return saved ? parseInt(saved, 10) : 1;
  });

  const [isConfigured, setIsConfigured] = useState<boolean>(() => {
    const saved = localStorage.getItem('punch_is_configured');
    return saved ? JSON.parse(saved) : false;
  });

  const [historyLog, setHistoryLog] = useState<HistoryEntry[]>(() => {
    const saved = localStorage.getItem('punch_history_log');
    return saved ? JSON.parse(saved) : [];
  });

  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [showAdmin, setShowAdmin] = useState<boolean>(!isConfigured);

  // Sync to Local Storage
  useEffect(() => {
    localStorage.setItem('punch_prize_pool', JSON.stringify(prizePool));
  }, [prizePool]);

  useEffect(() => {
    localStorage.setItem('punch_holes', JSON.stringify(holes));
  }, [holes]);

  useEffect(() => {
    localStorage.setItem('punch_current_round', currentRound.toString());
  }, [currentRound]);

  useEffect(() => {
    localStorage.setItem('punch_is_configured', JSON.stringify(isConfigured));
  }, [isConfigured]);

  useEffect(() => {
    localStorage.setItem('punch_history_log', JSON.stringify(historyLog));
  }, [historyLog]);

  // Audio lifecycle management
  useEffect(() => {
    if (!isMuted) {
      audioSynth.startBGM();
    } else {
      audioSynth.stopBGM();
    }
    return () => {
      audioSynth.stopBGM();
    };
  }, [isMuted]);

  // Generate a round of 36 holes from remaining prize pool
  const generateRound = (pool: Prize[]): Hole[] => {
    const remainingList: { prizeId: string; name: string }[] = [];
    
    // Flatten the remaining prizes
    pool.forEach((p) => {
      const qtyLeft = p.totalQuantity - p.punchedQuantity;
      for (let i = 0; i < qtyLeft; i++) {
        remainingList.push({ prizeId: p.id, name: p.name });
      }
    });

    // Shuffle remaining list
    const shuffledRemaining = [...remainingList].sort(() => Math.random() - 0.5);

    // Pick top 36
    const roundPrizes = shuffledRemaining.slice(0, 36);

    // Fill remaining slots with "感謝參與" if fewer than 36
    while (roundPrizes.length < 36) {
      roundPrizes.push({ prizeId: 'none', name: '感謝參與' });
    }

    // Shuffle the final 36 slots
    return roundPrizes
      .sort(() => Math.random() - 0.5)
      .map((item, index) => ({
        id: index,
        prizeId: item.prizeId === 'none' ? null : item.prizeId,
        prizeName: item.name,
        isPunched: false,
      }));
  };

  const handlePunchHole = (holeId: number) => {
    const targetHole = holes.find((h) => h.id === holeId);
    if (!targetHole || targetHole.isPunched) return;

    // 1. Mark as punched
    const updatedHoles = holes.map((h) => {
      if (h.id === holeId) {
        return {
          ...h,
          isPunched: true,
          punchedTime: new Date().toLocaleTimeString(),
        };
      }
      return h;
    });
    setHoles(updatedHoles);

    // 2. Increment punchedQuantity if it's a real prize
    if (targetHole.prizeId) {
      const updatedPool = prizePool.map((p) => {
        if (p.id === targetHole.prizeId) {
          return { ...p, punchedQuantity: p.punchedQuantity + 1 };
        }
        return p;
      });
      setPrizePool(updatedPool);
    }

    // 3. Log history
    const newEntry: HistoryEntry = {
      id: Date.now().toString(),
      prizeName: targetHole.prizeName,
      roundName: currentRound,
      timestamp: new Date().toLocaleTimeString(),
    };
    setHistoryLog((prev) => [newEntry, ...prev]);
  };

  const handleStartNextRound = () => {
    // Confirm if not all holes are punched yet
    const unpunchedCount = holes.filter((h) => !h.isPunched).length;
    if (unpunchedCount > 0) {
      const confirmSkip = window.confirm(
        `目前這一輪還有 ${unpunchedCount} 個格子還沒戳開，確定要直接進入下一輪嗎？(未戳開的獎品會自動收回獎品池重新分配)`
      );
      if (!confirmSkip) return;
    }

    // Generate new round
    const nextHoles = generateRound(prizePool);
    setHoles(nextHoles);
    setCurrentRound((prev) => prev + 1);
  };

  const handleSaveAndStart = () => {
    // Generate first round if holes are empty or pool changed
    if (holes.length === 0 || holes.length !== 36) {
      const firstHoles = generateRound(prizePool);
      setHoles(firstHoles);
    }
    setIsConfigured(true);
    setShowAdmin(false);
  };

  const handleLoadTodaysGifts = () => {
    if (prizePool.length > 0) {
      const confirmLoad = window.confirm(
        '確定要載入今天預設的 93 份獎品清單嗎？這將會覆蓋您目前在後台設定的獎品（已戳出得獎紀錄將會被重設）。'
      );
      if (!confirmLoad) return;
    }
    setPrizePool(TODAYS_GIFT_LIST);
    setHoles([]);
    setHistoryLog([]);
    setCurrentRound(1);
    setIsConfigured(false);
    alert('已成功載入 93 份預設獎品！請點選下方儲存並開始遊戲。');
  };

  const handleResetAllGame = () => {
    const confirmReset = window.confirm(
      '⚠️ 確定要重設整個遊戲嗎？這將會清除所有歷史得獎紀錄與後台獎品！'
    );
    if (!confirmReset) return;

    localStorage.clear();
    setPrizePool(DEFAULT_PRIZES);
    setHoles([]);
    setCurrentRound(1);
    setIsConfigured(false);
    setHistoryLog([]);
    setShowAdmin(true);
    setIsMuted(true);
    audioSynth.stopBGM();
  };

  const handleClearHistory = () => {
    const confirmClear = window.confirm('確定要清空所有的中獎歷史紀錄嗎？（不影響剩餘獎品數量）');
    if (!confirmClear) return;
    setHistoryLog([]);
  };

  const toggleMusic = () => {
    setIsMuted((prev) => !prev);
  };

  return (
    <div className="app-layout">
      {/* Top Floating Music Controller */}
      <div className="music-bar">
        <button
          onClick={toggleMusic}
          className={`music-btn ${!isMuted ? 'playing' : ''}`}
          aria-label={isMuted ? '啟動音樂' : '靜音'}
        >
          <span className="music-icon">{isMuted ? '🔇' : '🎵'}</span>
          <span className="music-text">{isMuted ? '播放輕快音樂' : '音樂播放中'}</span>
          {!isMuted && (
            <div className="music-waves">
              <span className="wave-bar"></span>
              <span className="wave-bar"></span>
              <span className="wave-bar"></span>
            </div>
          )}
        </button>
      </div>

      <main className="main-content">
        {showAdmin ? (
          <AdminPanel
            prizePool={prizePool}
            setPrizePool={setPrizePool}
            historyLog={historyLog}
            clearHistory={handleClearHistory}
            onSaveAndStart={handleSaveAndStart}
            resetAllGame={handleResetAllGame}
            onLoadTodaysGifts={handleLoadTodaysGifts}
          />
        ) : (
          <GameBoard
            holes={holes}
            currentRound={currentRound}
            prizePool={prizePool}
            onPunch={handlePunchHole}
            onStartNextRound={handleStartNextRound}
            onGoToAdmin={() => setShowAdmin(true)}
          />
        )}
      </main>

      <footer className="footer-credits">
        <p>🏫 2026 期末歡樂戳戳樂網頁版 • 精心為學生設計</p>
      </footer>
    </div>
  );
}

export default App;
