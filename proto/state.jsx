// Mock game state — useGame hook.
// Simulates the full flow without real game logic: drives rounds/phases,
// triggers animations, fake AI decisions, fault application, etc.

const WF_PHASES = ["wind", "draw", "player", "ai", "resolve", "maintenance"];

const initialState = () => ({
  round: 1,
  maxRounds: 12,
  phase: "intro",         // 'intro' | 'wind' | 'player' | 'ai' | 'resolve' | 'gameover'
  currentPlayer: 0,       // 0 = me, 1 = AI
  actionsLeft: 2,
  wind: { value: 10, label: "額定", coeff: 1.0, rolling: false, dice: [4, null], typhoon: false },
  // Players
  me: {
    score: 0,
    deck: 20,
    hand: ["M01", "M03", "T01", "T05", "F01"],
    turbines: [],
    techs: [],
  },
  ai: {
    score: 0,
    deck: 20,
    handCount: 5,
    turbines: [],
    techs: [],
  },
  // Effects queue — animation triggers, removed after duration
  effects: [],            // [{ id, type, target, time }]
  // Active state
  pendingFault: null,     // { handIdx, cardId }
  hoveredCard: null,      // handIdx
  aiThinking: false,
  aiPlayingCard: null,    // { fromOrigin, toTarget, cardId } for animation
  log: [],                // [{ id, text, type }]
  // Weather / contracts
  weather: [{ cardId: "W02", duration: 2 }],
  contracts: [{ cardId: "C01", progress: 2, target: 3, reward: 15, owner: 0 }],
  // Last round summary
  lastRoundScore: null,
});

const useGame = () => {
  const [state, setState] = React.useState(initialState);
  const timersRef = React.useRef([]);

  const setT = (cb, ms) => {
    const id = setTimeout(cb, ms);
    timersRef.current.push(id);
    return id;
  };

  React.useEffect(() => () => {
    timersRef.current.forEach(clearTimeout);
  }, []);

  // ── Log helper ─────────────────────────────────────────
  const log = React.useCallback((text, type = "info") => {
    setState(s => ({ ...s, log: [{ id: Date.now() + Math.random(), text, type }, ...s.log].slice(0, 30) }));
  }, []);

  // ── Add an effect that auto-clears ─────────────────────
  const pushEffect = React.useCallback((type, target, durationMs = 800) => {
    const id = Date.now() + Math.random();
    setState(s => ({ ...s, effects: [...s.effects, { id, type, target, time: Date.now() }] }));
    setT(() => setState(s => ({ ...s, effects: s.effects.filter(e => e.id !== id) })), durationMs);
    return id;
  }, []);

  // ── Roll dice ──────────────────────────────────────────
  const rollDice = React.useCallback(() => new Promise(resolve => {
    setState(s => ({ ...s, wind: { ...s.wind, rolling: true, dice: [null, null] } }));
    // Spin frames
    const spinId = setInterval(() => {
      setState(s => ({
        ...s,
        wind: {
          ...s.wind,
          dice: [1 + Math.floor(Math.random() * 6), s.wind.dice[1] ? 1 + Math.floor(Math.random() * 6) : null]
        }
      }));
    }, 80);
    setT(() => {
      clearInterval(spinId);
      // Roll a real value (weighted to give variety)
      const r1 = Math.floor(Math.random() * 6) + 1;
      let dice = [r1, null], typhoon = false, value = 10, label = "額定", coeff = 1.0;
      if (r1 === 1) { value = 0; label = "無風停機"; coeff = 0.0; }
      else if (r1 <= 3) { value = 5; label = "低風"; coeff = 0.4; }
      else if (r1 <= 5) { value = 10; label = "額定"; coeff = 1.0; }
      else { // r1 === 6
        // 25% chance typhoon
        if (Math.random() < 0.25) {
          dice = [6, 6]; typhoon = true; value = 25; label = "颱風！"; coeff = 0.0;
        } else {
          const r2 = Math.floor(Math.random() * 5) + 1;
          dice = [6, r2]; value = 20; label = "高風"; coeff = 0.7;
        }
      }
      setState(s => ({ ...s, wind: { value, label, coeff, rolling: false, dice, typhoon } }));
      log(typhoon ? `🌀 颱風來襲！全機組停機` : `風速 ${value}m/s · ${label}`, typhoon ? "danger" : "wind");
      resolve({ value, label, coeff, typhoon });
    }, 1500);
  }), [log]);

  // ── Play a card from hand ──────────────────────────────
  const playCard = React.useCallback((handIdx, targetSlot = null) => {
    setState(s => {
      const cardId = s.me.hand[handIdx];
      if (!cardId) return s;
      const card = WF_CARDS[cardId];
      if (!card || s.actionsLeft < card.cost) return s;

      const newHand = s.me.hand.filter((_, i) => i !== handIdx);
      let newState = { ...s, me: { ...s.me, hand: newHand }, actionsLeft: s.actionsLeft - card.cost };

      if (card.type === "turbine") {
        newState.me = {
          ...newState.me,
          turbines: [...newState.me.turbines, { cardId, avail: card.stats.avail, faults: [], placedAt: Date.now() }],
        };
        log(`部署 ${card.name} · ${card.stats.mw}MW`, "deploy");
      } else if (card.type === "tech") {
        newState.me = {
          ...newState.me,
          techs: [...newState.me.techs, cardId],
        };
        log(`雇用 ${card.name}`, "tech");
        // Repair the most damaged fault
        const idx = newState.ai.turbines.findIndex(t => t.faults.length > 0);
        // Tech repairs own faults — find ours instead
        const myIdx = newState.me.turbines.findIndex(t => t.faults.length > 0);
        if (myIdx >= 0) {
          pushEffect("repair", { side: "me", slot: myIdx }, 900);
          newState.me.turbines = newState.me.turbines.map((t, i) =>
            i === myIdx ? { ...t, faults: [] } : t
          );
          log(`${card.name} 修復了故障！`, "success");
        }
      } else if (card.type === "fault") {
        // Apply to targeted slot on AI side
        if (targetSlot != null) {
          pushEffect("fault", { side: "ai", slot: targetSlot, cardId }, 1000);
          newState.ai = {
            ...newState.ai,
            turbines: newState.ai.turbines.map((t, i) =>
              i === targetSlot ? { ...t, faults: [...t.faults, cardId] } : t
            ),
          };
          log(`對 AI ${WF_CARDS[newState.ai.turbines[targetSlot].cardId].name} 施加 ${card.name}`, "fault");
        }
      } else {
        log(`使用 ${card.name}`, "func");
      }
      return newState;
    });
  }, [log, pushEffect]);

  // ── AI plays a card ────────────────────────────────────
  const aiPlayCard = React.useCallback(() => new Promise(resolve => {
    setState(s => ({ ...s, aiThinking: true }));
    setT(() => {
      setState(s => {
        // Pick a random "action": deploy turbine, or attack with fault
        const actions = ["turbine", "fault", "tech"];
        const action = actions[Math.floor(Math.random() * actions.length)];
        let log_text = "";
        let newState = { ...s, aiThinking: false, ai: { ...s.ai, handCount: Math.max(1, s.ai.handCount - 1) } };
        if (action === "turbine" && s.ai.turbines.length < 3) {
          const choices = ["M01", "M03", "M05"];
          const cardId = choices[Math.floor(Math.random() * choices.length)];
          const card = WF_CARDS[cardId];
          newState.ai.turbines = [...newState.ai.turbines, { cardId, avail: card.stats.avail, faults: [], placedAt: Date.now() }];
          log_text = `AI 部署 ${card.name}`;
        } else if (action === "fault" && newState.me.turbines.length > 0) {
          const targetSlot = Math.floor(Math.random() * newState.me.turbines.length);
          const fIds = ["F01", "F03", "F04"];
          const fid = fIds[Math.floor(Math.random() * fIds.length)];
          pushEffect("fault", { side: "me", slot: targetSlot, cardId: fid }, 1000);
          newState.me = {
            ...newState.me,
            turbines: newState.me.turbines.map((t, i) =>
              i === targetSlot ? { ...t, faults: [...t.faults, fid] } : t
            ),
          };
          log_text = `AI 對你的 ${WF_CARDS[newState.me.turbines[targetSlot].cardId].name} 施加 ${WF_CARDS[fid].name}`;
        } else {
          log_text = "AI 跳過";
        }
        newState.log = [{ id: Date.now() + Math.random(), text: log_text, type: "ai" }, ...newState.log].slice(0, 30);
        return newState;
      });
      setT(resolve, 700);
    }, 1200);
  }), [pushEffect]);

  // ── End turn (player) ──────────────────────────────────
  const endTurn = React.useCallback(async () => {
    setState(s => ({ ...s, currentPlayer: 1, actionsLeft: 0 }));
    await aiPlayCard();
    // AI maybe second action
    if (Math.random() < 0.6) await aiPlayCard();
    // Resolve round
    await new Promise(r => setT(r, 400));
    setState(s => {
      const myMwh = s.me.turbines.reduce((sum, t) => {
        const card = WF_CARDS[t.cardId];
        const drop = t.faults.reduce((d, fid) => d + (WF_CARDS[fid]?.stats?.drop || 0), 0);
        const eff = Math.max(0, t.avail - drop);
        return sum + Math.round(card.stats.mw * s.wind.coeff * eff / 100);
      }, 0);
      const aiMwh = s.ai.turbines.reduce((sum, t) => {
        const card = WF_CARDS[t.cardId];
        const drop = t.faults.reduce((d, fid) => d + (WF_CARDS[fid]?.stats?.drop || 0), 0);
        const eff = Math.max(0, t.avail - drop);
        return sum + Math.round(card.stats.mw * s.wind.coeff * eff / 100);
      }, 0);
      return {
        ...s,
        me: { ...s.me, score: s.me.score + myMwh },
        ai: { ...s.ai, score: s.ai.score + aiMwh },
        lastRoundScore: { round: s.round, myMwh, aiMwh, myTotal: s.me.score + myMwh, aiTotal: s.ai.score + aiMwh },
      };
    });
    await new Promise(r => setT(r, 2200));
    setState(s => {
      if (s.round >= s.maxRounds) {
        return { ...s, phase: "gameover", lastRoundScore: null };
      }
      // Draw a card
      const drawPool = ["M01", "M03", "M05", "T01", "T02", "T05", "T08", "F01", "F03", "F04", "FN04", "FN06", "W02"];
      const newCard = drawPool[Math.floor(Math.random() * drawPool.length)];
      return {
        ...s,
        round: s.round + 1,
        currentPlayer: 0,
        actionsLeft: 2,
        me: { ...s.me, hand: [...s.me.hand, newCard].slice(-7), deck: Math.max(0, s.me.deck - 1) },
        ai: { ...s.ai, handCount: Math.min(7, s.ai.handCount + 1), deck: Math.max(0, s.ai.deck - 1) },
        lastRoundScore: null,
      };
    });
    await rollDice();
  }, [aiPlayCard, rollDice]);

  // ── Begin (called from intro) ───────────────────────────
  const begin = React.useCallback(async () => {
    setState(s => ({ ...s, phase: "wind" }));
    await rollDice();
    setState(s => ({ ...s, phase: "player" }));
    // Pre-deploy a starter turbine for both sides
    setState(s => ({
      ...s,
      me: { ...s.me, turbines: [{ cardId: "M07", avail: 88, faults: [], placedAt: Date.now() - 1000 }] },
      ai: { ...s.ai, turbines: [{ cardId: "M03", avail: 92, faults: [], placedAt: Date.now() - 1000 }] },
      log: [{ id: Date.now(), text: "戰鬥開始！", type: "info" }],
    }));
  }, [rollDice]);

  // ── Fault target selection ─────────────────────────────
  const startFaultTargeting = React.useCallback((handIdx) => {
    setState(s => ({ ...s, pendingFault: { handIdx, cardId: s.me.hand[handIdx] } }));
  }, []);
  const cancelFaultTargeting = React.useCallback(() => {
    setState(s => ({ ...s, pendingFault: null }));
  }, []);
  const confirmFaultTarget = React.useCallback((slot) => {
    setState(s => {
      if (!s.pendingFault) return s;
      const { handIdx, cardId } = s.pendingFault;
      const card = WF_CARDS[cardId];
      if (!card || s.actionsLeft < card.cost) return { ...s, pendingFault: null };
      // Apply fault to AI turbine at slot
      pushEffect("fault", { side: "ai", slot, cardId }, 1000);
      const targetCardName = s.ai.turbines[slot] ? WF_CARDS[s.ai.turbines[slot].cardId].name : "目標";
      return {
        ...s,
        pendingFault: null,
        actionsLeft: s.actionsLeft - card.cost,
        me: { ...s.me, hand: s.me.hand.filter((_, i) => i !== handIdx) },
        ai: {
          ...s.ai,
          turbines: s.ai.turbines.map((t, i) =>
            i === slot ? { ...t, faults: [...t.faults, cardId] } : t
          ),
        },
        log: [{ id: Date.now() + Math.random(), text: `對 AI ${targetCardName} 施加 ${card.name}`, type: "fault" }, ...s.log].slice(0, 30),
      };
    });
  }, [pushEffect]);

  const reset = React.useCallback(() => {
    setState(initialState());
  }, []);

  return {
    state, setState,
    log, pushEffect, rollDice,
    playCard, aiPlayCard, endTurn, begin,
    startFaultTargeting, cancelFaultTargeting, confirmFaultTarget,
    reset,
  };
};

window.useGame = useGame;
