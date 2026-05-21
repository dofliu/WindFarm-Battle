# 🎨 CARD PROMPTS — AI 插畫 Prompt 庫

> 給 AI 生成卡牌插畫用的標準化 prompt 模板。**只生純插畫**，UI 與資訊由模板處理。

---

## 📌 使用須知

### 平台支援度

| 平台 | 推薦度 | 備註 |
|---|---|---|
| **Midjourney v6+** | ⭐⭐⭐⭐⭐ | 最強寫實感，最容易控風格 |
| **DALL·E 3 (ChatGPT)** | ⭐⭐⭐⭐ | 容易上手，但 prompt 短 |
| **Gemini Imagen** | ⭐⭐⭐ | 中文支援好 |
| **Stable Diffusion XL** | ⭐⭐⭐ | 開源，可微調 |

### 通用規則

每個 prompt 都應包含：

1. **風格定義**：`Photorealistic CG / Technical illustration / Semi-realistic portrait`
2. **主體描述**：要畫什麼
3. **氛圍光線**：時間、光源、色調
4. **構圖比例**：`--ar 4:3`（卡牌插畫專用）
5. **排除清單**：`--no text, no UI, no borders...`（**必須有！**）

---

## 🚫 必加的排除清單

每個 prompt 結尾都加這段：

```
--no text, no labels, no HUD overlays, no data panels, 
no UI elements, no badges, no logos, no watermarks, 
no borders, no frames, no callout labels, no annotations,
no diagnostic panels, no measurement values, no reference numbers,
clean composition only
```

**為什麼？** AI 很喜歡自己加 HUD、加標籤、加邊框——這些都是「卡片模板」的工作，不是 AI 的工作。

---

## 🎴 六大卡類的 Prompt 範本

### 1️⃣ 機組卡（Turbine）— 真實 CG 寫實風

**通用模板：**

```
Photorealistic CG render of [size] [location] wind turbine, 
[specific features], [environment: ocean/coast/inland], 
[lighting: golden hour / overcast / clear sky], 
[camera angle: low hero shot / wide landscape / closeup detail],
cinematic composition, ultra-detailed mechanical components, 
photorealistic textures, similar to Vestas / Siemens Gamesa 
product photography aesthetic

--no text, no overlays, no UI, no borders, no logos
--ar 4:3 --style raw --v 6
```

**範例 — M06 藍鯨 8MW：**

```
Photorealistic CG render of a large 8MW offshore wind turbine, 
three white composite blades 167m rotor diameter, fixed-bottom 
monopile foundation with yellow access platform, calm blue ocean 
with gentle waves, late afternoon golden hour lighting from left, 
partly cloudy sky, dramatic low-angle hero shot, slim white tower 
110m hub height, cinematic composition, ultra-detailed mechanical 
components, photorealistic textures and water reflections, similar 
to Vestas product photography

--no text, no labels, no HUD overlays, no data panels, no UI elements,
no badges, no logos, no watermarks, no borders, no frames

--ar 4:3 --style raw --v 6
```

---

### 2️⃣ 技師卡（Tech）— 半寫實人物

**通用模板：**

```
Semi-realistic portrait illustration of an East Asian [job role], 
[age range], [expression], wearing [professional outdoor work attire], 
[holding equipment / pose], [setting: control room / field / lab] 
with [softly blurred background], cinematic lighting, depth of field, 
professional engineering aesthetic, painterly digital art style

--no anime style, no perfect model-like appearance, no glossy magazine 
look, no text overlays on the image, no readable screens, no card frames

--ar 4:3 --style raw --v 6
```

**範例 — T05 SCADA 工程師：**

```
Semi-realistic portrait illustration of an East Asian SCADA engineer, 
mid-30s, focused concentrated expression, wearing navy professional 
softshell jacket with reflective stripes (no logos), short black hair, 
holding a ruggedized tablet, standing in a wind farm control room with 
large monitor walls glowing softly in the blurred background, abstract 
glowing panels (not readable dashboards), cinematic blue lighting from 
screens casting glow on face, depth of field, painterly digital art

--no anime, no cartoon, no perfect model look, no readable text on 
screens, no specific dashboard data visible, no card frames

--ar 4:3 --style raw --v 6
```

---

### 3️⃣ 故障卡（Fault）— 工程示意圖 ⭐ 最關鍵

**通用模板：**

```
Technical engineering illustration of [specific failure mode], 
[component cross-section / cutaway view], showing [damaged parts], 
clean light grey background with subtle grid pattern, professional 
schematic style similar to NREL technical reports or IEC 61400 
documentation, industrial color palette of steel grey with signal 
red for damaged areas, slight isometric perspective, sharp focus 
on mechanical details

--no callout labels, no annotations, no text, no measurement values, 
no diagnostic panels, no frequency charts, no fire, no smoke, 
no dramatic flames, no glowing effects, no characters

--ar 4:3 --style raw --v 6
```

**範例 — F06 齒輪箱磨損：**

```
Technical engineering illustration of a wind turbine planetary gearbox 
cutaway, showing main shaft input, sun gear, three planet gears with 
visible micro-pitting damage on tooth surfaces, ring gear, high-speed 
shaft output, dark contaminated oil at bottom, clean light grey 
background with subtle grid pattern, professional schematic style 
similar to NREL technical reports and IEC 61400-4 documentation, 
industrial color palette of steel grey with signal red highlights 
on wear locations, slight isometric three-quarter view, sharp focus 
on mechanical details

--no callout labels, no annotations, no text, no measurement values,
no diagnostic panels, no frequency spectrum charts, no fire, no smoke,
no dramatic flames, no characters, no exterior turbine shots

--ar 4:3 --style raw --v 6
```

---

### 4️⃣ 功能卡（Function）— 科技 HUD 線條

**通用模板：**

```
Futuristic HUD interface illustration symbolizing [abstract concept], 
holographic display showing [visual metaphor], floating geometric 
elements in [color palette], dark gradient background, technical 
sci-fi aesthetic similar to Iron Man HUD or sci-fi research lab 
interface, cool color palette with subtle accents, depth and 
parallax layering, minimalist geometric shapes

--no actual human figures, no realistic photos, no anime characters, 
no cartoon, no chaotic elements, no text overlays

--ar 4:3 --style raw --v 6
```

**範例 — FN02 召喚研究員：**

```
Futuristic HUD interface illustration symbolizing academic research 
and knowledge acquisition, holographic display showing glowing neural 
network connecting to floating document icons, central abstract brain 
or neural symbol surrounded by data nodes, dark gradient background 
from deep navy to black, technical sci-fi aesthetic similar to Iron 
Man HUD, cool cyan and blue palette with subtle gold accents on 
highlighted elements, depth and parallax layering

--no human figures, no realistic photos, no anime, no cartoon, 
no laboratory equipment, no readable text

--ar 4:3 --style raw --v 6
```

---

### 5️⃣ 天氣卡（Weather）— 氣象局風格

**通用模板：**

```
Professional meteorological synoptic chart showing [specific weather 
phenomenon], satellite imagery base layer, isobars and pressure 
systems, wind vectors, color-coded gradient overlay, style of Central 
Weather Bureau (CWB) Taiwan or NOAA weather charts, technical 
scientific aesthetic, [color palette]

--no dramatic storm scenes, no characters, no anime, no fantasy, 
no exaggerated waves, no actual wind turbines visible

--ar 4:3 --style raw --v 6
```

**範例 — W01 東北季風：**

```
Professional meteorological synoptic chart showing northeast monsoon 
over Taiwan Strait, satellite imagery base layer of Taiwan island and 
surrounding seas from space, isobars with "H" high pressure over 
northern China and "L" low pressure over south, wind vectors showing 
strong northeast flow at 15-20 m/s, cool blue color-coded wind speed 
gradient, style of Central Weather Bureau Taiwan and NOAA charts, 
navy-blue and cyan palette with white annotation lines

--no dramatic storm scenes, no characters, no anime, no fantasy, 
no exaggerated waves, no actual wind turbines visible

--ar 4:3 --style raw --v 6
```

---

### 6️⃣ 合約卡（Contract）— 文件 / 標案風

**通用模板：**

```
Professional document illustration depicting a [contract type], 
top-down view of official paperwork on dark wood desk, [specific 
visual elements: official seals, signature lines, blueprint sketches], 
elegant typography in latin alphabet, dramatic side lighting, 
photorealistic still life composition

--no readable specific text, no real company logos, no anime, 
no characters, no cartoon

--ar 4:3 --style raw --v 6
```

**範例 — C02 大型開發案：**

```
Professional document illustration of a large-scale wind farm 
development project, top-down view of official paperwork on dark 
wood executive desk, blueprint sketches of offshore wind farm 
layout, government official seals (abstract/red), signature lines, 
calculator and engineering ruler beside, elegant latin typography 
visible but not specific, dramatic side lighting from window, 
photorealistic still life composition

--no readable specific text, no real company logos, no anime, 
no characters

--ar 4:3 --style raw --v 6
```

---

## 📋 47 張卡的 Prompt 庫（待補完）

下表是 47 張卡的 prompt 完整列表的**待填表格**——這是 Claude Code 在 Sprint 4 可以協助完成的工作。

**做法建議：**
1. 先確認三張代表卡的 prompt 效果（M06、F06、T05）
2. 用對應卡類的模板，依每張卡的特性微調
3. 整理成 `data/card-prompts.json`，供批次生成工具使用

```json
// data/card-prompts.json 結構範例
{
  "M01": {
    "prompt": "Photorealistic CG render of a small 2MW inland wind turbine...",
    "negative": "no text, no UI, no borders",
    "params": "--ar 4:3 --style raw --v 6",
    "tested": false,
    "approvedDate": null
  },
  "M07": {
    "prompt": "Photorealistic CG render of a next-gen 12MW floating offshore...",
    "negative": "no text, no UI, no borders",
    "params": "--ar 4:3 --style raw --v 6",
    "tested": true,
    "approvedDate": "2025-01-15"
  }
  // ...其餘 45 張
}
```

---

## 🔧 Claude Code 可以做的進階工具

### 1. Prompt 自動生成器

讀取 `cards.json`，依卡類自動產出對應的 prompt 草稿：

```typescript
function generatePrompt(card: Card): string {
  const template = TEMPLATES[card.type];
  return template
    .replace('[NAME]', card.name)
    .replace('[STATS]', formatStats(card))
    .replace('[FLAVOR]', card.flavor);
}
```

### 2. 批次生成腳本（透過 API）

```bash
npm run art:generate -- --card M06     # 生單張
npm run art:generate -- --all          # 生所有 47 張
npm run art:generate -- --regenerate F06   # 重生失敗的
```

### 3. 視覺驗證

每張卡生圖後，自動：
- 檢查是否有文字殘留（OCR）
- 檢查長寬比是否正確
- 檢查色彩是否符合該卡類調性

---

## ⚠️ 常見錯誤與修正

| 錯誤 | 範例 | 修正 |
|---|---|---|
| AI 加 HUD | 圖上出現 "8MW 167m" 之類字樣 | 加強排除：`no HUD, no data overlays` |
| 機艙噴火 | F05 過熱卡冒火 | 改用 "cutaway view" + "internal damage analysis" |
| 像照片庫 | T05 像廣告美女 | 加 "no glossy magazine look" |
| 風機長 4 葉片 | 構圖錯誤 | 明寫 "three-blade design" |
| 葉片內部塞滿管路 | T03 主動流場控制 | 寫明 "blade surface mounted actuators" |
| 颱風太戲劇 | W02 像災難電影 | 改用 "synoptic chart" 氣象圖風 |

---

## 🎯 給 Claude Code 的明確指示

當你在 Sprint 4 處理視覺資源時：

1. **不要自己生圖**（這是 Dof 的工作）
2. **建立 prompt 模板系統**，讓 Dof 容易批次生成
3. **設計插畫驗證工具**（自動檢查是否符合規範）
4. **建立模板渲染系統**，讓插畫能無痛套版

具體任務見 PROJECT_STATUS.md 的 Sprint 4 章節。

---

**文件版本**：v1.0 (新)
**最後更新**：2025-05
