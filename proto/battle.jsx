// Main Battle Screen — orchestrates everything

const BattleScreen = ({ game, tweaks, onLibrary, onTitle }) => {
  const { state, setState, playCard, endTurn, startFaultTargeting, cancelFaultTargeting, confirmFaultTarget } = game;
  const theme = tweaks.theme;
  const t = wfThemeOf(theme);

  // ── Drag state ───────────────────────────────────────────
  const [dragInfo, setDragInfo] = React.useState(null);
  // { handIdx, cardId, x, y, originX, originY, valid }
  const [hoverIdx, setHoverIdx] = React.useState(null);
  const playZoneRef = React.useRef(null);
  const oppZoneRef = React.useRef(null);

  // ── Mouse handlers ───────────────────────────────────────
  React.useEffect(() => {
    if (!dragInfo) return;
    const onMove = (e) => {
      setDragInfo(d => d ? { ...d, x: e.clientX, y: e.clientY } : d);
    };
    const onUp = (e) => {
      setDragInfo(d => {
        if (!d) return null;
        const card = WF_CARDS[d.cardId];
        // Check zones
        const target = elementUnderPoint(e.clientX, e.clientY);
        const isMyZone = target?.closest?.('[data-zone="play-mine"]');
        const isOppZone = target?.closest?.('[data-zone="play-opp"]');
        const slotIdx = target?.closest?.('[data-slot]')?.getAttribute('data-slot');

        if (card.type === "fault" && isOppZone && slotIdx != null) {
          // Targeted fault play
          setTimeout(() => game.confirmFaultTargetDirect?.(d.handIdx, parseInt(slotIdx, 10)) || game.playCardOnTarget?.(d.handIdx, parseInt(slotIdx, 10)), 0);
          // Use inline approach: call playCard with target
          playCardWithTarget(d.handIdx, parseInt(slotIdx, 10));
        } else if ((card.type === "turbine" || card.type === "tech") && isMyZone) {
          playCardWithTarget(d.handIdx, null);
        } else if (card.type === "fault" && !isOppZone) {
          // Start targeting mode for click-to-target
          startFaultTargeting(d.handIdx);
        } else if ((card.type === "func" || card.type === "weather") && (isMyZone || isOppZone)) {
          playCardWithTarget(d.handIdx, null);
        }
        return null;
      });
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [dragInfo, startFaultTargeting]);

  // Custom play to handle targeting
  const playCardWithTarget = (handIdx, slot) => {
    setState(s => {
      const cardId = s.me.hand[handIdx];
      if (!cardId) return s;
      const card = WF_CARDS[cardId];
      if (!card || s.actionsLeft < card.cost) return s;

      const newHand = s.me.hand.filter((_, i) => i !== handIdx);
      let newState = { ...s, me: { ...s.me, hand: newHand }, actionsLeft: s.actionsLeft - card.cost };

      if (card.type === "turbine") {
        if (s.me.turbines.length >= 3) return s;
        newState.me.turbines = [...newState.me.turbines, {
          cardId, avail: card.stats.avail, faults: [], placedAt: Date.now()
        }];
        newState.log = [{ id: Date.now() + Math.random(), text: `部署 ${card.name} · ${card.stats.mw}MW`, type: "deploy" }, ...newState.log].slice(0, 30);
      } else if (card.type === "tech") {
        newState.me.techs = [...newState.me.techs, cardId];
        newState.log = [{ id: Date.now() + Math.random(), text: `雇用 ${card.name}`, type: "tech" }, ...newState.log].slice(0, 30);
        // Auto-repair first faulted turbine
        const myIdx = newState.me.turbines.findIndex(t => t.faults.length > 0);
        if (myIdx >= 0) {
          game.pushEffect("repair", { side: "me", slot: myIdx }, 900);
          newState.me.turbines = newState.me.turbines.map((tu, i) =>
            i === myIdx ? { ...tu, faults: [] } : tu
          );
          newState.log = [{ id: Date.now() + Math.random(), text: `${card.name} 修復了故障！`, type: "success" }, ...newState.log].slice(0, 30);
        }
      } else if (card.type === "fault" && slot != null && newState.ai.turbines[slot]) {
        game.pushEffect("fault", { side: "ai", slot, cardId }, 1000);
        const tn = WF_CARDS[newState.ai.turbines[slot].cardId].name;
        newState.ai.turbines = newState.ai.turbines.map((tu, i) =>
          i === slot ? { ...tu, faults: [...tu.faults, cardId] } : tu
        );
        newState.log = [{ id: Date.now() + Math.random(), text: `對 AI ${tn} 施加 ${card.name}`, type: "fault" }, ...newState.log].slice(0, 30);
      } else {
        newState.log = [{ id: Date.now() + Math.random(), text: `使用 ${card.name}`, type: "func" }, ...newState.log].slice(0, 30);
      }
      return newState;
    });
  };

  // Compute MW totals
  const myMw = state.me.turbines.reduce((s, tu) => s + (WF_CARDS[tu.cardId].stats?.mw || 0), 0);
  const aiMw = state.ai.turbines.reduce((s, tu) => s + (WF_CARDS[tu.cardId].stats?.mw || 0), 0);

  const isMyTurn = state.currentPlayer === 0 && !state.aiThinking;

  // Effects positioning helper
  const renderEffects = (side) => {
    return state.effects.filter(e => e.target.side === side).map(e => {
      const slot = e.target.slot;
      const slotEl = document.querySelector(`[data-zone="play-${side === "me" ? "mine" : "opp"}"] [data-slot="${slot}"]`);
      if (!slotEl) return null;
      const rect = slotEl.getBoundingClientRect();
      const scale = window.wfStageScale || 1;
      const stage = window.wfViewportToStage(rect.left, rect.top);
      return (
        <div key={e.id} style={{
          position: "absolute",
          left: stage.x, top: stage.y,
          width: rect.width / scale, height: rect.height / scale,
          pointerEvents: "none", zIndex: 200,
        }}>
          {e.type === "fault" && <FaultFlashFX theme={theme} cardId={e.target.cardId} />}
          {e.type === "repair" && <RepairFX theme={theme} />}
        </div>
      );
    });
  };

  return (
    <div style={{
      width: "100%", height: "100%",
      position: "relative", overflow: "hidden",
      background: t.bgRoot,
      color: t.textPrimary,
      fontFamily: t.fontUI,
      display: "flex", flexDirection: "column",
    }}>
      <ThemeBackground theme={theme} />

      <div style={{ position: "relative", height: "100%", display: "flex", flexDirection: "column", zIndex: 1 }}>
        <BattleTopBar
          theme={theme}
          onLibrary={onLibrary}
          onRestart={() => game.reset()}
          onTitle={onTitle}
          difficulty={tweaks.difficulty}
          onDifficulty={(d) => tweaks.setTweak("difficulty", d)}
        />

        {/* OPPONENT row */}
        <div style={{
          padding: "14px 28px 10px",
          display: "flex", alignItems: "flex-start", gap: 18,
          background: t.bgOpponent,
          borderBottom: theme === "tideboard" ? "1px solid rgba(168,69,58,0.3)" : "1px solid rgba(168,91,74,0.1)",
        }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <SideLabel theme={theme} side="opp" hand={state.ai.handCount} deck={state.ai.deck} mw={aiMw}
              faulted={state.ai.turbines.some(t => t.faults.length > 0)}
              aiThinking={state.aiThinking} active={state.currentPlayer === 1 && !state.aiThinking} />
            <div style={{ display: "flex", gap: -10, marginLeft: -2 }}>
              {Array.from({ length: state.ai.handCount }, (_, i) => (
                <ThemedCardBack key={i} theme={theme} size={36}
                  style={{ marginLeft: i === 0 ? 0 : -22, transform: `rotate(${(i - state.ai.handCount / 2 + 0.5) * 4}deg)` }} />
              ))}
            </div>
          </div>
          <div data-zone="play-opp" ref={oppZoneRef} style={{
            flex: 1, display: "flex", gap: 16, justifyContent: "center",
            padding: "6px 0",
            borderRadius: 16,
            background: (state.pendingFault || (dragInfo && WF_CARDS[dragInfo.cardId]?.type === "fault"))
              ? "rgba(217,108,90,0.08)" : "transparent",
            boxShadow: (state.pendingFault || (dragInfo && WF_CARDS[dragInfo.cardId]?.type === "fault"))
              ? "inset 0 0 0 2px rgba(217,108,90,0.4)" : "none",
            transition: "all 0.2s",
          }}>
            {[0, 1, 2].map(slot => {
              const tu = state.ai.turbines[slot];
              return (
                <div key={slot} data-slot={slot}>
                  <ThemedTurbine turbine={tu} theme={theme} empty={!tu}
                    deployed={slot}
                    targeted={state.pendingFault != null}
                    onClick={state.pendingFault && tu ? () => confirmFaultTarget(slot) : undefined} />
                </div>
              );
            })}
          </div>
          <ScoreBadge theme={theme} side="opp" label="AI" score={state.ai.score} preview={0} active={state.currentPlayer === 1} />
        </div>

        {/* CENTER bar */}
        <div style={{
          padding: "10px 28px",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 20, flexWrap: "wrap",
          background: theme === "tideboard"
            ? "linear-gradient(180deg, rgba(40,25,15,0.85) 0%, rgba(30,18,8,0.95) 100%)"
            : "rgba(255,255,255,0.4)",
          borderTop: theme === "tideboard" ? "2px solid #c89848" : "1px solid rgba(28,42,58,0.06)",
          borderBottom: theme === "tideboard" ? "2px solid #c89848" : "1px solid rgba(28,42,58,0.06)",
          backdropFilter: theme === "cumulus" ? "blur(10px)" : "none",
        }}>
          <RoundDisplay round={state.round} maxRounds={state.maxRounds} theme={theme} />
          <Divider theme={theme} />
          <WindDisplay wind={state.wind} theme={theme} />
          <Divider theme={theme} />
          <ActionPips actionsLeft={state.actionsLeft} theme={theme} />
          <Divider theme={theme} />
          <StatusEffects weather={state.weather} contracts={state.contracts} theme={theme} />
        </div>

        {/* PLAYER row */}
        <div style={{
          padding: "10px 28px 6px",
          display: "flex", alignItems: "flex-start", gap: 18,
          background: t.bgPlayer,
          borderTop: theme === "tideboard" ? "1px solid rgba(232,200,120,0.2)" : "1px solid rgba(58,167,200,0.1)",
        }}>
          <ScoreBadge theme={theme} side="me" label="你" score={state.me.score}
            preview={state.lastRoundScore?.myMwh || 0} active={isMyTurn} />
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8, alignItems: "center" }}>
            <div data-zone="play-mine" ref={playZoneRef} style={{
              display: "flex", gap: 16,
              padding: "6px 16px",
              borderRadius: 16,
              background: dragInfo && (WF_CARDS[dragInfo.cardId]?.type === "turbine" || WF_CARDS[dragInfo.cardId]?.type === "tech")
                ? (theme === "tideboard" ? "rgba(232,200,120,0.12)" : "rgba(58,167,200,0.08)")
                : "transparent",
              boxShadow: dragInfo && (WF_CARDS[dragInfo.cardId]?.type === "turbine" || WF_CARDS[dragInfo.cardId]?.type === "tech")
                ? `inset 0 0 0 2px ${theme === "tideboard" ? "rgba(232,200,120,0.5)" : "rgba(58,167,200,0.4)"}`
                : "none",
              transition: "all 0.2s",
            }}>
              {[0, 1, 2].map(slot => {
                const tu = state.me.turbines[slot];
                return (
                  <div key={slot} data-slot={slot}>
                    <ThemedTurbine turbine={tu} theme={theme} empty={!tu} deployed={slot} />
                  </div>
                );
              })}
            </div>
            {state.me.techs.length > 0 && (
              <div style={{ display: "flex", gap: 10, marginTop: theme === "tideboard" ? 14 : 0 }}>
                {state.me.techs.map(id => <ThemedTech key={id} techId={id} theme={theme} />)}
              </div>
            )}
          </div>
          <SideLabel theme={theme} side="me" hand={state.me.hand.length} deck={state.me.deck} mw={myMw}
            faulted={state.me.turbines.some(t => t.faults.length > 0)} active={isMyTurn} />
        </div>

        {/* HAND */}
        <div style={{
          marginTop: "auto",
          padding: "10px 28px 18px",
          position: "relative",
          background: theme === "tideboard"
            ? "linear-gradient(180deg, transparent 0%, rgba(40,25,15,0.6) 100%)"
            : "linear-gradient(180deg, transparent 0%, rgba(255,255,255,0.3) 100%)",
          display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16,
        }}>
          {/* Targeting hint */}
          {state.pendingFault && (
            <div style={{
              position: "absolute", top: -4, left: "50%", transform: "translateX(-50%)",
              padding: "7px 16px",
              background: theme === "tideboard" ? "linear-gradient(180deg, #d96c5a, #a8453a)" : "rgba(217,108,90,0.95)",
              border: theme === "tideboard" ? "1.5px solid #f4d68a" : "none",
              color: "#fff", fontSize: 12, fontWeight: 700,
              borderRadius: theme === "tideboard" ? 0 : 999,
              boxShadow: "0 6px 16px rgba(217,108,90,0.3)",
              display: "flex", alignItems: "center", gap: 8, zIndex: 5,
              fontFamily: t.fontUI,
            }}>
              <WFCrosshair size={14} stroke="#fff" />
              點選對手機組施加{WF_CARDS[state.pendingFault.cardId]?.name}
              <button onClick={cancelFaultTargeting} style={{
                marginLeft: 8, background: "rgba(0,0,0,0.2)", border: "none",
                color: "#fff", padding: "2px 8px", borderRadius: 4, cursor: "pointer", fontFamily: "inherit",
              }}>取消</button>
            </div>
          )}

          {/* Drag hint */}
          {dragInfo && (
            <div style={{
              position: "absolute", top: -32, left: "50%", transform: "translateX(-50%)",
              padding: "6px 14px",
              background: theme === "tideboard" ? "linear-gradient(180deg, #6e4a18, #3d2a1e)" : "rgba(28,42,58,0.85)",
              border: theme === "tideboard" ? "1.5px solid #c89848" : "none",
              color: "#fff", fontSize: 11, fontWeight: 600, borderRadius: 999, zIndex: 5,
            }}>
              {WF_CARDS[dragInfo.cardId]?.type === "fault" ? "拖到對手機組上 · 或點對手機組目標" :
                "拖到你的場地上部署"}
            </div>
          )}

          <div style={{ display: "flex", alignItems: "flex-end", gap: 6, flex: 1, justifyContent: "center" }}>
            {state.me.hand.map((cardId, i) => {
              const card = WF_CARDS[cardId];
              const canAfford = state.actionsLeft >= card.cost && isMyTurn;
              const isDragging = dragInfo?.handIdx === i;
              return (
                <div key={`${i}-${cardId}`} style={{
                  position: "relative",
                  marginLeft: i === 0 ? 0 : -14,
                  zIndex: hoverIdx === i ? 50 : (10 - Math.abs(i - state.me.hand.length / 2)),
                  transform: !isDragging && !state.pendingFault
                    ? `translateY(${Math.abs(i - (state.me.hand.length - 1) / 2) * 3}px) rotate(${(i - (state.me.hand.length - 1) / 2) * 2.5}deg)`
                    : "none",
                  transition: "transform 0.2s",
                }}>
                  <ThemedCard
                    cardId={cardId}
                    theme={theme}
                    lifted={hoverIdx === i && !isDragging}
                    faded={!canAfford || isDragging}
                    size={138}
                    onMouseEnter={() => setHoverIdx(i)}
                    onMouseLeave={() => setHoverIdx(null)}
                    onPointerDown={canAfford ? (e) => {
                      e.preventDefault();
                      const r = e.currentTarget.getBoundingClientRect();
                      setDragInfo({
                        handIdx: i, cardId,
                        x: e.clientX, y: e.clientY,
                        originX: r.left + r.width / 2, originY: r.top + r.height / 2,
                      });
                      setHoverIdx(null);
                    } : undefined}
                  />
                  {/* Hover preview */}
                  {hoverIdx === i && !isDragging && !dragInfo && (
                    <HoverPreview cardId={cardId} theme={theme} />
                  )}
                </div>
              );
            })}
          </div>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
            <button
              onClick={() => isMyTurn && endTurn()}
              disabled={!isMyTurn}
              style={{
                padding: theme === "tideboard" ? "14px 22px" : "14px 26px",
                background: !isMyTurn
                  ? (theme === "tideboard" ? "linear-gradient(180deg, #4a3018, #2a1810)" : "rgba(28,42,58,0.2)")
                  : (theme === "tideboard" ? "linear-gradient(180deg, #e8c878, #c89848 50%, #8a6028)" : "linear-gradient(180deg, #d9a85a 0%, #b8893f 100%)"),
                color: !isMyTurn ? "rgba(255,255,255,0.5)" : (theme === "tideboard" ? "#3d2a1e" : "#fff"),
                border: theme === "tideboard" ? "2px solid #3d2a1e" : "none",
                borderRadius: theme === "tideboard" ? 6 : 14,
                fontFamily: theme === "tideboard" ? '"Cinzel", Georgia, serif' : t.fontUI,
                fontSize: 13, fontWeight: 800, letterSpacing: "0.1em",
                boxShadow: !isMyTurn ? "none" : "0 6px 18px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.3)",
                cursor: isMyTurn ? "pointer" : "not-allowed",
                display: "flex", alignItems: "center", gap: 8,
              }}
            >
              <WFHourglass size={15} stroke="currentColor" />
              {state.aiThinking ? "AI 回合" : "結束回合"}
            </button>
            <div style={{ fontSize: 10, color: t.textSecondary, fontFamily: t.fontUI }}>
              剩 {state.actionsLeft} 動作 · 1 抽 1 棄
            </div>
          </div>
        </div>
      </div>

      {/* Effects overlay */}
      {renderEffects("me")}
      {renderEffects("ai")}

      {/* Drag overlay */}
      {dragInfo && (() => {
        const p = window.wfViewportToStage(dragInfo.x, dragInfo.y);
        return (
          <div style={{
            position: "absolute", left: p.x, top: p.y,
            transform: "translate(-50%, -50%) rotate(-4deg) scale(1.15)",
            pointerEvents: "none", zIndex: 1000,
            filter: "drop-shadow(0 20px 40px rgba(0,0,0,0.5))",
          }}>
            <ThemedCard cardId={dragInfo.cardId} theme={theme} dragging size={138} />
          </div>
        );
      })()}

      {/* Typhoon overlay */}
      {state.wind.typhoon && (
        <div style={{
          position: "absolute", inset: 0,
          pointerEvents: "none",
          background: "radial-gradient(circle at center, rgba(217,108,90,0.08) 0%, transparent 70%)",
          animation: "wf-fade-in 0.5s ease-out both",
          zIndex: 50,
        }}>
          <div style={{
            position: "absolute", top: "30%", left: "50%", transform: "translate(-50%, -50%)",
            fontSize: 64, fontWeight: 800, color: "#d96c5a",
            textShadow: "0 0 24px rgba(217,108,90,0.6)",
            animation: "wf-fade-in 0.8s ease-out both",
            letterSpacing: "0.2em",
            fontFamily: theme === "tideboard" ? '"Cinzel", Georgia, serif' : t.fontDisplay,
          }}>🌀 颱風來襲</div>
        </div>
      )}

      {/* Round summary toast */}
      {state.lastRoundScore && <RoundSummaryToast data={state.lastRoundScore} theme={theme} />}
    </div>
  );
};

// Helper: get DOM element under point ignoring drag overlay
function elementUnderPoint(x, y) {
  const els = document.elementsFromPoint(x, y);
  return els.find(el => !el.closest('[data-drag-overlay]')) || els[0];
}

const Divider = ({ theme }) => (
  <div style={{
    height: 36, width: 1,
    background: theme === "tideboard" ? "rgba(200,152,72,0.4)" : "rgba(28,42,58,0.1)"
  }} />
);

const HoverPreview = ({ cardId, theme }) => {
  const card = WF_CARDS[cardId];
  if (!card) return null;
  const t = wfThemeOf(theme);
  const tc = wfTypeColors(theme, card.type);
  const IconComp = wfGetIcon(card.icon);
  if (theme === "tideboard") {
    return (
      <div style={{
        position: "absolute", bottom: "calc(100% + 8px)", left: "50%", transform: "translateX(-50%)",
        width: 240, padding: 14, zIndex: 100,
        background: "linear-gradient(180deg, #f0e0c0, #d8c098)",
        border: "2px solid #c89848",
        boxShadow: "0 16px 40px rgba(0,0,0,0.4)",
        color: "#3d2a1e", fontFamily: 'Georgia, serif',
        pointerEvents: "none",
        animation: "wf-fade-in 0.2s ease-out both",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <IconComp size={24} stroke="#3d2a1e" />
          <div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>{card.name}</div>
            <div style={{ fontSize: 10, color: "#6e4a18", fontStyle: "italic" }}>{card.iec ? `IEC ${card.iec} · ` : ""}費用 {card.cost}</div>
          </div>
        </div>
        {card.abilities?.length > 0 && card.abilities.map((ab, i) => (
          <div key={i} style={{ marginTop: 8, padding: "6px 8px", background: "rgba(245,225,180,0.6)",
            border: "1px solid rgba(110,74,24,0.3)" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#a8453a" }}>{ab.name}</div>
            <div style={{ fontSize: 10, marginTop: 2, lineHeight: 1.4 }}>{ab.desc}</div>
          </div>
        ))}
        {card.flavor && (
          <div style={{ marginTop: 8, fontSize: 10, color: "#6e4a18", fontStyle: "italic",
            borderTop: "1px solid rgba(110,74,24,0.3)", paddingTop: 6 }}>{card.flavor}</div>
        )}
      </div>
    );
  }
  return (
    <div style={{
      position: "absolute", bottom: "calc(100% + 8px)", left: "50%", transform: "translateX(-50%)",
      width: 240, padding: 14, zIndex: 100,
      background: "#fff", borderRadius: 14,
      boxShadow: "0 16px 40px rgba(28,42,58,0.2)",
      border: "1px solid rgba(28,42,58,0.08)",
      color: "#1c2a3a", fontFamily: t.fontUI,
      pointerEvents: "none",
      animation: "wf-fade-in 0.2s ease-out both",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10,
          background: `hsl(${tc.hue}, 35%, 92%)`,
          display: "flex", alignItems: "center", justifyContent: "center" }}>
          <IconComp size={20} stroke={tc.accent} />
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700 }}>{card.name}</div>
          <div style={{ fontSize: 10, color: "#6a7888" }}>{card.iec ? `IEC ${card.iec} · ` : ""}費用 {card.cost}</div>
        </div>
      </div>
      {card.abilities?.length > 0 && card.abilities.map((ab, i) => (
        <div key={i} style={{ marginTop: 8, padding: "6px 10px", borderRadius: 8, background: "#f7f5f0" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: tc.accent }}>{ab.name}</div>
          <div style={{ fontSize: 10, color: "#3a4858", marginTop: 2, lineHeight: 1.4 }}>{ab.desc}</div>
        </div>
      ))}
      {card.flavor && (
        <div style={{ marginTop: 8, fontSize: 10, color: "#8a98a8", fontStyle: "italic",
          borderTop: "1px solid rgba(28,42,58,0.06)", paddingTop: 6 }}>{card.flavor}</div>
      )}
    </div>
  );
};

window.BattleScreen = BattleScreen;
