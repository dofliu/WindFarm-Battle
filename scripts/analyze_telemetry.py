#!/usr/bin/env python3
"""
WindFarm Battle — 遙測批次分析腳本
=====================================
用法：
  python3 scripts/analyze_telemetry.py [目錄或檔案路徑...]

範例：
  python3 scripts/analyze_telemetry.py data/telemetry/
  python3 scripts/analyze_telemetry.py session1.json session2.json
  python3 scripts/analyze_telemetry.py  # 預設讀取 data/telemetry/*.json

輸出：
  - 終端機摘要
  - reports/telemetry_report_YYYYMMDD_HHMMSS.md（Markdown 研究報告）
"""

import json
import sys
import os
import glob
from pathlib import Path
from datetime import datetime
from collections import defaultdict, Counter

# ── 設定 ────────────────────────────────────────────────────
SCRIPT_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent
CARDS_JSON = PROJECT_ROOT / "src" / "data" / "cards.json"
CARDS_I18N = PROJECT_ROOT / "src" / "i18n" / "cards.zh-TW.ts"
REPORTS_DIR = PROJECT_ROOT / "reports"
DEFAULT_TELEMETRY_DIR = PROJECT_ROOT / "data" / "telemetry"


# ── 載入卡牌資料 ─────────────────────────────────────────────
def load_card_names() -> dict[str, str]:
    """從 cards.zh-TW.ts 載入卡牌 ID → 中文名稱對應表"""
    names: dict[str, str] = {}
    try:
        text = CARDS_I18N.read_text(encoding="utf-8")
        for line in text.splitlines():
            line = line.strip()
            if ".name\":" in line and "ability" not in line:
                # 格式：  "cards.M01.name": "綠源 2MW",
                try:
                    key_part, val_part = line.split(":", 1)
                    card_id = key_part.strip().strip('"').split(".")[1]  # M01
                    name = val_part.strip().strip('",')
                    names[card_id] = name
                except Exception:
                    pass
    except FileNotFoundError:
        pass
    return names


def load_card_meta() -> dict[str, dict]:
    """從 cards.json 載入卡牌元資料（類別、費用、稀有度）"""
    meta: dict[str, dict] = {}
    try:
        data = json.loads(CARDS_JSON.read_text(encoding="utf-8"))
        for card_id, card in data["cards"].items():
            meta[card_id] = {
                "type": card.get("type", "unknown"),
                "cost": card.get("cost", 0),
                "rarity": card.get("rarity", 1),
            }
    except FileNotFoundError:
        pass
    return meta


# ── 載入遙測記錄 ─────────────────────────────────────────────
def find_json_files(paths: list[str]) -> list[Path]:
    """解析命令列路徑，回傳所有 JSON 檔案路徑"""
    files: list[Path] = []
    if not paths:
        # 預設：讀取 data/telemetry/*.json
        pattern = str(DEFAULT_TELEMETRY_DIR / "*.json")
        files = [Path(p) for p in glob.glob(pattern)]
        if not files:
            print(f"[提示] 找不到 {DEFAULT_TELEMETRY_DIR}/*.json，請指定路徑")
            print("用法：python3 scripts/analyze_telemetry.py <路徑>")
            sys.exit(0)
    else:
        for p in paths:
            path = Path(p)
            if path.is_dir():
                files.extend(path.glob("*.json"))
            elif path.is_file():
                files.append(path)
            else:
                print(f"[警告] 找不到路徑：{p}")
    return sorted(files)


def load_records(files: list[Path]) -> list[dict]:
    """載入並驗證 GameRecord JSON 檔案"""
    records = []
    for f in files:
        try:
            data = json.loads(f.read_text(encoding="utf-8"))
            if data.get("version") == "1.0" and "gameId" in data:
                records.append(data)
            else:
                print(f"[警告] 格式不符，跳過：{f.name}")
        except json.JSONDecodeError as e:
            print(f"[警告] JSON 解析失敗：{f.name} — {e}")
    return records


# ── 統計計算 ─────────────────────────────────────────────────
def compute_stats(records: list[dict], card_names: dict, card_meta: dict) -> dict:
    """計算所有統計指標"""
    n = len(records)
    if n == 0:
        return {}

    # 基本勝負統計
    wins = sum(1 for r in records if r["winner"] == "player")
    losses = sum(1 for r in records if r["winner"] == "ai")
    draws = sum(1 for r in records if r["winner"] == "draw")

    # 難度分布
    difficulty_counts: Counter = Counter(r["difficulty"] for r in records)

    # 分數統計
    p0_scores = [r["p0FinalScore"] for r in records]
    p1_scores = [r["p1FinalScore"] for r in records]
    score_diffs = [r["p0FinalScore"] - r["p1FinalScore"] for r in records]

    # 回合數統計
    round_counts = [r["totalRounds"] for r in records]

    # 卡牌使用頻率（玩家）
    p0_freq: Counter = Counter()
    p1_freq: Counter = Counter()
    for r in records:
        for card_id, count in r.get("p0CardFrequency", {}).items():
            p0_freq[card_id] += count
        for card_id, count in r.get("p1CardFrequency", {}).items():
            p1_freq[card_id] += count

    # 依類別統計卡牌使用
    type_usage_p0: Counter = Counter()
    type_usage_p1: Counter = Counter()
    for card_id, count in p0_freq.items():
        ctype = card_meta.get(card_id, {}).get("type", "unknown")
        type_usage_p0[ctype] += count
    for card_id, count in p1_freq.items():
        ctype = card_meta.get(card_id, {}).get("type", "unknown")
        type_usage_p1[ctype] += count

    # 逐回合平均分數
    max_rounds = max(round_counts) if round_counts else 0
    round_p0_avg: list[float] = []
    round_p1_avg: list[float] = []
    for rnd_idx in range(max_rounds):
        p0_vals = []
        p1_vals = []
        for r in records:
            rounds = r.get("rounds", [])
            if rnd_idx < len(rounds):
                p0_vals.append(rounds[rnd_idx]["p0Total"])
                p1_vals.append(rounds[rnd_idx]["p1Total"])
        round_p0_avg.append(sum(p0_vals) / len(p0_vals) if p0_vals else 0)
        round_p1_avg.append(sum(p1_vals) / len(p1_vals) if p1_vals else 0)

    return {
        "n": n,
        "wins": wins,
        "losses": losses,
        "draws": draws,
        "win_rate": wins / n,
        "loss_rate": losses / n,
        "draw_rate": draws / n,
        "difficulty_counts": difficulty_counts,
        "p0_scores": p0_scores,
        "p1_scores": p1_scores,
        "score_diffs": score_diffs,
        "round_counts": round_counts,
        "p0_freq": p0_freq,
        "p1_freq": p1_freq,
        "type_usage_p0": type_usage_p0,
        "type_usage_p1": type_usage_p1,
        "round_p0_avg": round_p0_avg,
        "round_p1_avg": round_p1_avg,
        "card_names": card_names,
        "card_meta": card_meta,
    }


def avg(lst: list) -> float:
    return sum(lst) / len(lst) if lst else 0.0


def stdev(lst: list) -> float:
    if len(lst) < 2:
        return 0.0
    m = avg(lst)
    return (sum((x - m) ** 2 for x in lst) / (len(lst) - 1)) ** 0.5


# ── 報告生成 ─────────────────────────────────────────────────
def generate_report(stats: dict, generated_at: str) -> str:
    """生成 Markdown 研究報告"""
    if not stats:
        return "# 無資料\n\n找不到有效的遙測記錄。\n"

    n = stats["n"]
    card_names = stats["card_names"]
    card_meta = stats["card_meta"]

    def card_label(cid: str) -> str:
        name = card_names.get(cid, cid)
        return f"`{cid}` {name}"

    lines = []
    lines.append("# WindFarm Battle — 遙測分析報告")
    lines.append(f"\n> 生成時間：{generated_at}  ")
    lines.append(f"> 分析場次：**{n} 場**\n")
    lines.append("---\n")

    # 1. 勝負統計
    lines.append("## 1. 勝負統計\n")
    lines.append("| 結果 | 場次 | 比例 |")
    lines.append("|------|------|------|")
    lines.append(f"| 玩家勝 | {stats['wins']} | {stats['win_rate']:.1%} |")
    lines.append(f"| AI 勝  | {stats['losses']} | {stats['loss_rate']:.1%} |")
    lines.append(f"| 平局   | {stats['draws']} | {stats['draw_rate']:.1%} |")
    lines.append(f"| **合計** | **{n}** | 100% |\n")

    # 難度分布
    if stats["difficulty_counts"]:
        lines.append("**難度分布：**\n")
        diff_map = {"easy": "簡單", "normal": "普通", "hard": "困難"}
        for diff, cnt in sorted(stats["difficulty_counts"].items()):
            label = diff_map.get(diff, diff)
            lines.append(f"- {label}（{diff}）：{cnt} 場（{cnt/n:.1%}）")
        lines.append("")

    # 2. 分數統計
    lines.append("## 2. 分數統計（MWh）\n")
    p0s = stats["p0_scores"]
    p1s = stats["p1_scores"]
    diffs = stats["score_diffs"]
    lines.append("| 指標 | 玩家 | AI | 分差（玩家－AI） |")
    lines.append("|------|------|-----|-----------------|")
    lines.append(f"| 平均 | {avg(p0s):.1f} | {avg(p1s):.1f} | {avg(diffs):+.1f} |")
    lines.append(f"| 標準差 | {stdev(p0s):.1f} | {stdev(p1s):.1f} | {stdev(diffs):.1f} |")
    lines.append(f"| 最高 | {max(p0s):.0f} | {max(p1s):.0f} | {max(diffs):+.0f} |")
    lines.append(f"| 最低 | {min(p0s):.0f} | {min(p1s):.0f} | {min(diffs):+.0f} |\n")

    # 3. 回合數統計
    lines.append("## 3. 回合數統計\n")
    rc = stats["round_counts"]
    lines.append(f"- 平均回合數：**{avg(rc):.1f}**（標準差 {stdev(rc):.1f}）")
    lines.append(f"- 最短：{min(rc)} 回合 ／ 最長：{max(rc)} 回合\n")

    # 逐回合平均分數趨勢
    if stats["round_p0_avg"]:
        lines.append("**逐回合累積分數趨勢（平均值）：**\n")
        lines.append("| 回合 | 玩家平均 MWh | AI 平均 MWh | 差距 |")
        lines.append("|------|-------------|------------|------|")
        for i, (p0v, p1v) in enumerate(zip(stats["round_p0_avg"], stats["round_p1_avg"]), 1):
            diff = p0v - p1v
            lines.append(f"| {i} | {p0v:.1f} | {p1v:.1f} | {diff:+.1f} |")
        lines.append("")

    # 4. 卡牌使用分析
    lines.append("## 4. 卡牌使用分析\n")

    # 依類別
    lines.append("### 4.1 類別使用分布\n")
    type_labels = {
        "turbine": "機組", "tech": "技師", "fault": "故障",
        "func": "功能", "weather": "天氣", "contract": "合約"
    }
    all_types = set(stats["type_usage_p0"].keys()) | set(stats["type_usage_p1"].keys())
    lines.append("| 類別 | 玩家出牌次數 | AI 出牌次數 |")
    lines.append("|------|------------|------------|")
    for t in ["turbine", "tech", "fault", "func", "weather", "contract"]:
        if t in all_types:
            label = type_labels.get(t, t)
            p0c = stats["type_usage_p0"].get(t, 0)
            p1c = stats["type_usage_p1"].get(t, 0)
            lines.append(f"| {label} | {p0c} | {p1c} |")
    lines.append("")

    # 玩家最常出的牌（Top 10）
    lines.append("### 4.2 玩家最常使用的卡牌（Top 10）\n")
    lines.append("| 排名 | 卡牌 | 類別 | 使用次數 | 每場平均 |")
    lines.append("|------|------|------|---------|---------|")
    for rank, (cid, cnt) in enumerate(stats["p0_freq"].most_common(10), 1):
        ctype = type_labels.get(card_meta.get(cid, {}).get("type", ""), "")
        lines.append(f"| {rank} | {card_label(cid)} | {ctype} | {cnt} | {cnt/n:.1f} |")
    lines.append("")

    # AI 最常出的牌（Top 10）
    lines.append("### 4.3 AI 最常使用的卡牌（Top 10）\n")
    lines.append("| 排名 | 卡牌 | 類別 | 使用次數 | 每場平均 |")
    lines.append("|------|------|------|---------|---------|")
    for rank, (cid, cnt) in enumerate(stats["p1_freq"].most_common(10), 1):
        ctype = type_labels.get(card_meta.get(cid, {}).get("type", ""), "")
        lines.append(f"| {rank} | {card_label(cid)} | {ctype} | {cnt} | {cnt/n:.1f} |")
    lines.append("")

    # 玩家最少使用的牌（冷門卡）
    all_card_ids = list(card_meta.keys())
    unused_by_player = [cid for cid in all_card_ids if stats["p0_freq"].get(cid, 0) == 0]
    if unused_by_player:
        lines.append("### 4.4 玩家從未使用的卡牌\n")
        lines.append("| 卡牌 | 類別 |")
        lines.append("|------|------|")
        for cid in sorted(unused_by_player):
            ctype = type_labels.get(card_meta.get(cid, {}).get("type", ""), "")
            lines.append(f"| {card_label(cid)} | {ctype} |")
        lines.append("")

    # 5. 研究摘要
    lines.append("## 5. 研究摘要\n")
    lines.append(f"本次分析共納入 **{n} 場**對局記錄。")
    win_rate = stats["win_rate"]
    if win_rate > 0.6:
        balance_note = f"玩家勝率偏高（{win_rate:.1%}），建議提升 AI 難度或調整卡牌平衡。"
    elif win_rate < 0.4:
        balance_note = f"AI 勝率偏高（{stats['loss_rate']:.1%}），建議降低 AI 難度或調整卡牌平衡。"
    else:
        balance_note = f"玩家勝率 {win_rate:.1%}，對局平衡性良好（40%–60% 區間）。"
    lines.append(balance_note)
    lines.append(f"\n平均對局長度為 **{avg(rc):.1f} 回合**，")
    lines.append(f"玩家平均得分 **{avg(p0s):.1f} MWh**，AI 平均得分 **{avg(p1s):.1f} MWh**，")
    lines.append(f"平均分差 **{avg(diffs):+.1f} MWh**。\n")

    top_p0 = stats["p0_freq"].most_common(3)
    if top_p0:
        top_names = "、".join(f"{card_names.get(cid, cid)}（{cnt}次）" for cid, cnt in top_p0)
        lines.append(f"玩家最常使用的三張卡為：{top_names}。\n")

    lines.append("---\n")
    lines.append("*本報告由 `scripts/analyze_telemetry.py` 自動生成。*")

    return "\n".join(lines)


# ── 主程式 ───────────────────────────────────────────────────
def main():
    paths = sys.argv[1:]
    files = find_json_files(paths)

    if not files:
        print("[錯誤] 找不到任何 JSON 遙測檔案。")
        sys.exit(1)

    print(f"[資訊] 找到 {len(files)} 個遙測檔案，開始分析...")

    records = load_records(files)
    if not records:
        print("[錯誤] 所有檔案均無有效的 GameRecord（version=1.0）。")
        sys.exit(1)

    print(f"[資訊] 成功載入 {len(records)} 場對局記錄。")

    card_names = load_card_names()
    card_meta = load_card_meta()
    stats = compute_stats(records, card_names, card_meta)

    # 終端機摘要
    print("\n" + "=" * 50)
    print(f"  WindFarm Battle 遙測分析摘要")
    print("=" * 50)
    print(f"  分析場次：{stats['n']} 場")
    print(f"  玩家勝率：{stats['win_rate']:.1%}（{stats['wins']}勝 {stats['losses']}敗 {stats['draws']}平）")
    print(f"  玩家平均分：{avg(stats['p0_scores']):.1f} MWh")
    print(f"  AI 平均分：  {avg(stats['p1_scores']):.1f} MWh")
    print(f"  平均回合數：{avg(stats['round_counts']):.1f}")
    if stats["p0_freq"]:
        top3 = stats["p0_freq"].most_common(3)
        top3_str = ", ".join(f"{card_names.get(c, c)}×{n}" for c, n in top3)
        print(f"  玩家最愛卡：{top3_str}")
    print("=" * 50)

    # 生成 Markdown 報告
    generated_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    report_md = generate_report(stats, generated_at)

    REPORTS_DIR.mkdir(exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    report_path = REPORTS_DIR / f"telemetry_report_{timestamp}.md"
    report_path.write_text(report_md, encoding="utf-8")

    print(f"\n[完成] 報告已儲存至：{report_path.relative_to(PROJECT_ROOT)}")
    print(f"       字數：{len(report_md)} 字元")


if __name__ == "__main__":
    main()
