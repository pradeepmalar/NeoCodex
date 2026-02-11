import React, { useState, useEffect, useRef } from 'react';
import './App.css';

function App() {
  // --- STATE MANAGEMENT ---
  const [gameState, setGameState] = useState('START'); 
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(45 * 60); 
  
  // Track completion status of all 10 levels
  const [completedLevels, setCompletedLevels] = useState({
    1: false, 2: false, 3: false, 4: false, 5: false,
    6: false, 7: false, 8: false, 9: false, 10: false
  });
  
  // Track submitted status
  const [submittedLevels, setSubmittedLevels] = useState({
    1: false, 2: false, 3: false, 4: false, 5: false,
    6: false, 7: false, 8: false, 9: false, 10: false
  });
  
  // Track attempts and strikes
  const [attemptsPerLevel, setAttemptsPerLevel] = useState({
    1: 0, 2: 0, 3: 0, 4: 0, 5: 0,
    6: 0, 7: 0, 8: 0, 9: 0, 10: 0
  });
  const [struckOutLevels, setStruckOutLevels] = useState(new Set());
  
  const [openWindowId, setOpenWindowId] = useState(null);
  
  const [inputs, setInputs] = useState({ 
    1: '', 2: '', 3: '', 4: '', 5: '', 
    6: '', 7: '', 8: '', 9: '', 10: '' 
  });
  const [errors, setErrors] = useState({});
  
  // Timing variables
  const [gameStartTime, setGameStartTime] = useState(null);
  const [gameEndTime, setGameEndTime] = useState(null);
  const [levelStartTime, setLevelStartTime] = useState(null);
  const [lapTimes, setLapTimes] = useState({});

  const [level3Data, setLevel3Data] = useState([]);

  // Terminal State
  const [termOutput, setTermOutput] = useState([
    "NEO-CODEX OS v9.0",
    "Connecting to Ancient Interface...",
    "Connection Established."
  ]);
  const [termInput, setTermInput] = useState("");
  const [currentDir, setCurrentDir] = useState("home");
  const termEndRef = useRef(null);

  const fileSystem = {
    "home": ["tablet_01.txt", "ritual_list.doc"],
    "var": ["sys_log.txt"],
    "etc": ["config", "shadow"],
    "root": [".hidden_key"] 
  };

  // --- TIMER ---
  useEffect(() => {
    let timer;
    if (gameState === 'PLAYING') {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            endGame('TIMEOUT');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [gameState]);

  // --- DATA GEN ---
  useEffect(() => {
    const data = [];
    for (let i = 0; i < 500; i++) {
      if (i === 301) {
        data.push({ id: i, val: 999 }); 
      } else {
        data.push({ id: i, val: Math.floor(Math.random() * 90) + 10 });
      }
    }
    setLevel3Data(data);
  }, []);

  // --- SCROLL TERMINAL ---
  useEffect(() => {
    termEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [termOutput, openWindowId]);

  // --- HELPERS ---
  const formatTime = (seconds) => {
    if (seconds < 0) return "0:00";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' + s : s}`;
  };

  const formatLapTime = (ms) => {
    const seconds = Math.floor(ms / 1000);
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  // Calculate Total Time for End Screen
  const calculateTotalTime = () => {
    if (!gameStartTime || !gameEndTime) return "--";
    const duration = gameEndTime - gameStartTime;
    return formatLapTime(duration);
  };

  const startGame = () => {
    setGameState('PLAYING');
    const now = Date.now();
    setGameStartTime(now);
    setLevelStartTime(now);
  };

  const endGame = (status) => {
    setGameState(status);
    setGameEndTime(Date.now());
    setOpenWindowId(null);
  };

  const checkEndGame = () => {
    const allSubmitted = Object.values(submittedLevels).every(s => s);
    if (allSubmitted) {
      const allCorrect = Object.values(completedLevels).every(c => c);
      endGame(allCorrect ? 'WON' : 'PARTIAL');
    }
  };

  const handleInputChange = (level, value) => {
    setInputs(prev => ({ ...prev, [level]: value }));
    setErrors(prev => ({ ...prev, [level]: false }));
  };

  const recordFailedAttempt = (level) => {
    if (struckOutLevels.has(level)) return; // Already struck out
    
    const newAttempts = attemptsPerLevel[level] + 1;
    setAttemptsPerLevel(prev => ({ ...prev, [level]: newAttempts }));
    
    if (newAttempts >= 3) {
      // Strike out this level
      const newStruckOut = new Set(struckOutLevels);
      newStruckOut.add(level);
      setStruckOutLevels(newStruckOut);
      
      // If 3 levels are struck out, game over
      if (newStruckOut.size >= 3) {
        endGame('STRUCK');
      }
    }
  };

  const completeLevel = (level, points) => {
    const now = Date.now();
    
    // Record Lap
    const duration = now - levelStartTime;
    setLapTimes(prev => ({ ...prev, [level]: formatLapTime(duration) }));
    setLevelStartTime(now); // Reset lap timer

    // Update Score & Status
    setScore(prev => prev + points);
    setCompletedLevels(prev => ({ ...prev, [level]: true }));
    setSubmittedLevels(prev => ({ ...prev, [level]: true }));
    setOpenWindowId(null);

    // Check End Condition
    checkEndGame();
  };

  // --- CHECKERS (WEIGHTED SCORING) ---
  // Riddles (5 pts), Technical (10 pts), Terminal (15 pts)

  const checkLevel1 = () => inputs[1].trim().toUpperCase() === "ECHO" ? completeLevel(1, 5) : (setErrors(prev => ({ ...prev, 1: true })), recordFailedAttempt(1), setSubmittedLevels(prev => ({ ...prev, 1: true })), checkEndGame());
  const checkLevel2 = () => inputs[2].replace(/\s/g, '') === "13,21,34" ? completeLevel(2, 10) : (setErrors(prev => ({ ...prev, 2: true })), recordFailedAttempt(2), setSubmittedLevels(prev => ({ ...prev, 2: true })), checkEndGame());
  const checkLevel3 = () => inputs[3].trim().toUpperCase() === "MAP" ? completeLevel(3, 5) : (setErrors(prev => ({ ...prev, 3: true })), recordFailedAttempt(3), setSubmittedLevels(prev => ({ ...prev, 3: true })), checkEndGame());
  const checkLevel4 = () => inputs[4].trim() === "999" ? completeLevel(4, 10) : (setErrors(prev => ({ ...prev, 4: true })), recordFailedAttempt(4), setSubmittedLevels(prev => ({ ...prev, 4: true })), checkEndGame());
  const checkLevel5 = () => inputs[5].trim().toUpperCase() === "DAUGHTER" ? completeLevel(5, 5) : (setErrors(prev => ({ ...prev, 5: true })), recordFailedAttempt(5), setSubmittedLevels(prev => ({ ...prev, 5: true })), checkEndGame());
  const checkLevel6 = () => inputs[6].trim().toUpperCase() === "FIRE" ? completeLevel(6, 5) : (setErrors(prev => ({ ...prev, 6: true })), recordFailedAttempt(6), setSubmittedLevels(prev => ({ ...prev, 6: true })), checkEndGame());
  const checkLevel7 = () => inputs[7].trim() === "15" ? completeLevel(7, 10) : (setErrors(prev => ({ ...prev, 7: true })), recordFailedAttempt(7), setSubmittedLevels(prev => ({ ...prev, 7: true })), checkEndGame());
  const checkLevel8 = () => inputs[8].trim() === "10100010110" ? completeLevel(8, 10) : (setErrors(prev => ({ ...prev, 8: true })), recordFailedAttempt(8), setSubmittedLevels(prev => ({ ...prev, 8: true })), checkEndGame());
  const checkLevel9 = () => inputs[9].trim().toUpperCase() === "KEYBOARD" ? completeLevel(9, 5) : (setErrors(prev => ({ ...prev, 9: true })), recordFailedAttempt(9), setSubmittedLevels(prev => ({ ...prev, 9: true })), checkEndGame());
  const checkLevel10 = () => inputs[10].trim() === "9" ? completeLevel(10, 5) : (setErrors(prev => ({ ...prev, 10: true })), recordFailedAttempt(10), setSubmittedLevels(prev => ({ ...prev, 10: true })), checkEndGame());

  // --- TERMINAL ---
  // eslint-disable-next-line no-unused-vars
  const handleTerminalSubmit = (e) => {
    if (e.key === 'Enter') {
      const cmd = termInput.trim().toLowerCase();
      const newOutput = [...termOutput, `explorer@neocodex:~/${currentDir}$ ${termInput}`];
      const args = cmd.split(" ");
      const command = args[0];

      if (command === "help") newOutput.push("Glyphs: ls, cd, cat, pwd, clear");
      else if (command === "ls") {
        if (args[1] === "-a") currentDir === "root" ? newOutput.push(".hidden_key") : newOutput.push(`${fileSystem[currentDir].join("  ")} . ..`);
        else currentDir === "root" ? newOutput.push("(empty void)") : newOutput.push(fileSystem[currentDir].join("  "));
      } else if (command === "cd") {
        const target = args[1];
        if (target === "..") setCurrentDir("home");
        else if (fileSystem[target] || target === "root") setCurrentDir(target);
        else newOutput.push("Pathway Blocked.");
      } else if (command === "cat") {
        const target = args[1];
        if (target === ".hidden_key" && currentDir === "root") newOutput.push("GLYPH DECIPHERED: SUDO_MASTER_2026");
        else if (fileSystem[currentDir]?.includes(target)) newOutput.push("(Encrypted Data...)");
        else newOutput.push("Artifact not found.");
      } else if (command === "clear") { setTermOutput([]); setTermInput(""); return; }
      else newOutput.push("Unknown Command.");
      
      setTermOutput(newOutput);
      setTermInput("");
    }
  };

  const renderIcon = (id, label) => {
    const isCompleted = completedLevels[id];
    const isStruckOut = struckOutLevels.has(id);
    
    return (
      <div 
        className={`icon ${isStruckOut ? 'failed' : isCompleted ? 'completed' : 'active'}`} 
        key={id} 
        onClick={() => {
          // Allow opening any level that isn't finished or struck out
          if (!isCompleted && !isStruckOut) setOpenWindowId(id);
        }}
      >
        <img 
          src={`/infinity_stone${id}.png`} 
          alt={`Relic ${id}`} 
          className="stone-img"
        />
        <div className="icon-label">{label}</div>
      </div>
    );
  };

  return (
    <div className="App">
      {/* START SCREEN */}
      {gameState === 'START' && (
        <div id="start-screen" className="full-overlay">
          <h1>NeoCodex</h1>
          <p className="subtitle">RELIC DISCOVERY PROTOCOL</p>
          <button className="start-btn" onClick={startGame}>BEGIN PROTOCOL</button>
        </div>
      )}

      {/* END SCREENS */}
      {(gameState === 'TIMEOUT' || gameState === 'WON' || gameState === 'STRUCK' || gameState === 'MANUAL' || gameState === 'PARTIAL') && (
        <div id="end-screen" className="full-overlay">
          <h1 className={gameState === 'WON' ? 'win-text' : 'fail-text'}>
            {gameState === 'WON' ? 'PROTOCOL COMPLETE' : gameState === 'STRUCK' ? 'SEAL OVERLOAD' : gameState === 'PARTIAL' ? 'PARTIAL SUCCESS' : gameState === 'MANUAL' ? 'PROTOCOL TERMINATED' : 'SYSTEM FAILURE'}
          </h1>
          {/* REMOVED % SYMBOL */}
          <h2 className="final-score">SYNCHRONIZATION: {score}</h2>
          
          {/* TOTAL TIME DISPLAY */}
          <div className="total-time">TOTAL TIME: {calculateTotalTime()}</div>

          <div id="lap-times-container">
            <h3>TEMPORAL REPORT</h3>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(lvl => (
              <div key={lvl} className="lap-row">
                <span>SEAL {lvl}</span>
                <span className={lapTimes[lvl] ? '' : 'unsolved'}>{lapTimes[lvl] || "Unsolved"}</span>
              </div>
            ))}
          </div>
          <p className="screenshot-hint">Capture this record.</p>
        </div>
      )}

      {/* MAIN GAME UI */}
      {gameState === 'PLAYING' && (
        <>
          <div id="top-bar">
            <div className="brand">NeoCodex</div>
            <div className="timer">TIME: {formatTime(timeLeft)}</div>
            <div className="score">SYNC: {score}</div>          <button className="end-btn" onClick={() => endGame('MANUAL')}>END PROTOCOL</button>          </div>

          <div id="desktop">
            <div className="grid-overlay"></div>
            
            <div className="sticky-note">
              <strong>From: Head Archeologist</strong><br />
              <strong>To: Tech Lead</strong><br /><br />
              The <strong>Seal 8</strong> passcode was lost.<br />
              It is <strong>today's date</strong> converted to Binary.<br /><br />
              - Prof. Shells
            </div>

            <div className="icon-container">
              {[1,2,3,4,5,6,7,8,9,10].map(i => renderIcon(i, `SEAL_${i < 10 ? '0'+i : i}`))}
            </div>

            {/* --- WINDOWS --- */}
            {openWindowId && (
              <div className="window">
                <div className="window-header">
                  <span>SEAL_{openWindowId < 10 ? '0'+openWindowId : openWindowId} {/*ACCESS*/} </span>
                  <span className="close-btn" onClick={() => setOpenWindowId(null)}>✕</span>
                </div>
                <div className="window-content">
                  {struckOutLevels.has(openWindowId) ? (
                    <p className="error-msg">SEAL PERMANENTLY LOCKED</p>
                  ) : (
                    <>
                      <div className="attempts-display">ATTEMPTS: {attemptsPerLevel[openWindowId]}/3</div>
                      
                      {openWindowId === 1 && <><p className="ancient-text">THE VOID SPEAKS (5 pts):</p><p className="riddle">"I speak without a mouth and hear without ears. I have no body, but I come alive with wind. What am I?"</p><input type="text" value={inputs[1]} onChange={(e) => handleInputChange(1, e.target.value)} placeholder="Answer..." /><button className="action-btn" onClick={checkLevel1}>UNLOCK</button>{errors[1] && <p className="error-msg">SILENCE...</p>}</>}
                      {openWindowId === 2 && <><p className="ancient-text">GOLDEN SEQUENCE (10 pts):</p><p className="code-text">1, 1, 2, 3, 5, 8 ...</p><p>Predict the next 3 alignments.</p><input type="text" value={inputs[2]} onChange={(e) => handleInputChange(2, e.target.value)} placeholder="x, y, z" /><button className="action-btn" onClick={checkLevel2}>UNLOCK</button>{errors[2] && <p className="error-msg">BROKEN</p>}</>}
                      {openWindowId === 3 && <><p className="ancient-text">THE PARADOX (5 pts):</p><p className="riddle">"I have cities, but no houses. I have mountains, but no trees. I have water, but no fish. What am I?"</p><input type="text" value={inputs[3]} onChange={(e) => handleInputChange(3, e.target.value)} placeholder="Answer..." /><button className="action-btn" onClick={checkLevel3}>UNLOCK</button>{errors[3] && <p className="error-msg">INCORRECT</p>}</>}
                      {openWindowId === 4 && <><p className="ancient-text">ANOMALY SCAN (10 pts):</p><div className="data-viewer">{level3Data.map(row => (<div key={row.id}>Entry {row.id}: {row.val}</div>))}</div><input type="text" value={inputs[4]} onChange={(e) => handleInputChange(4, e.target.value)} placeholder="Anomaly..." /><button className="action-btn" onClick={checkLevel4}>UNLOCK</button>{errors[4] && <p className="error-msg">INCORRECT DATA</p>}</>}
                      {openWindowId === 5 && <><p className="ancient-text">KINSHIP LOGIC (5 pts):</p><p><strong>A</strong> is the father of <strong>B</strong>.<br/>But <strong>B</strong> is NOT the son of <strong>A</strong>.<br/>What relation is B to A?</p><input type="text" value={inputs[5]} onChange={(e) => handleInputChange(5, e.target.value)} placeholder="Answer..." /><button className="action-btn" onClick={checkLevel5}>UNLOCK</button>{errors[5] && <p className="error-msg">LOGIC FLAW</p>}</>}
                      {openWindowId === 6 && <><p className="ancient-text">ELEMENTAL (5 pts):</p><p className="riddle">"I am not alive, but I grow. I need air. I don't have a mouth, but water kills me."</p><input type="text" value={inputs[6]} onChange={(e) => handleInputChange(6, e.target.value)} placeholder="Answer..." /><button className="action-btn" onClick={checkLevel6}>UNLOCK</button>{errors[6] && <p className="error-msg">EXTINGUISHED</p>}</>}
                      {openWindowId === 7 && <><p className="ancient-text">ANCIENT SCRIPT (10 pts):</p><div className="code-block">SET x = 1<br/>SET y = 10<br/>WHILE x &lt; y DO:<br/>&nbsp;&nbsp;x = x * 2<br/>&nbsp;&nbsp;y = y - 1<br/>END WHILE<br/>PRINT x + y</div><input type="text" value={inputs[7]} onChange={(e) => handleInputChange(7, e.target.value)} placeholder="Final Value..." /><button className="action-btn" onClick={checkLevel7}>UNLOCK</button>{errors[7] && <p className="error-msg">LOGIC FLAW</p>}</>}
                      {openWindowId === 8 && <><p className="ancient-text">BINARY ROSETTA (10 pts):</p><p>Convert today's date (DDMM) to 11-bit Binary.</p><input type="text" value={inputs[8]} onChange={(e) => handleInputChange(8, e.target.value)} placeholder="Binary..." /><button className="action-btn" onClick={checkLevel8}>UNLOCK</button>{errors[8] && <p className="error-msg">ACCESS DENIED</p>}</>}
                      {openWindowId === 9 && <><p className="ancient-text">THE ARTIFACT (5 pts):</p><p className="riddle">"I have keys, but no locks. I have a space, but no room. You can enter, but can't go outside."</p><input type="text" value={inputs[9]} onChange={(e) => handleInputChange(9, e.target.value)} placeholder="Answer..." /><button className="action-btn" onClick={checkLevel9}>UNLOCK</button>{errors[9] && <p className="error-msg">SILENCE...</p>}</>}
                      {openWindowId === 10 && <><p className="ancient-text">MEMORY CORRUPTION (5 pts):</p><p className="riddle">"A self-replicating data corruption doubles its size every system cycle. It completely fills the memory core in 10 cycles. At which cycle was the core exactly half full?"</p><input type="text" value={inputs[10]} onChange={(e) => handleInputChange(10, e.target.value)} placeholder="Answer..." /><button className="action-btn" onClick={checkLevel10}>UNLOCK</button>{errors[10] && <p className="error-msg">INCORRECT</p>}</>}
                    </>
                  )}

                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default App;