# Topoboard Unified Wording And UI Hierarchy

This note is the site-wide language and layout standard for Topoboard Games,
Topoboard Life, and Topoboard Labs. It is for keeping player UI and research UI
clear in English and Traditional Chinese.

## Core Content Priorities

| Priority | English | Traditional Chinese |
| --- | --- | --- |
| 1. First choice | Let users first choose whether they are here to play or to research. | 先讓使用者選擇是要遊玩，還是要做研究。 |
| 2. Current action | Every active screen must say what the user can do now. | 每個操作畫面都必須清楚說明現在可以做什麼。 |
| 3. Local rule | Every mode must explain how one local action changes the board. | 每個模式都必須說明一次局部操作如何改變棋盤。 |
| 4. Topology effect | Every topology mode must explain what the boundary changes. | 每個拓撲模式都必須說明邊界如何改變連接關係。 |
| 5. Result meaning | Every observable, score, or warning must say what it means. | 每個可觀測量、分數或警告都必須說明意義。 |
| 6. Reproducibility | Research screens must show seed, model, topology, rule, export, and limits. | 研究畫面必須顯示種子、模型、拓撲、規則、匯出與限制。 |

## First-Screen Copy

Use these short messages for the main initial interface and Labs entry cards.

| Surface | English | Traditional Chinese |
| --- | --- | --- |
| Players title | Players | 玩家 |
| Players body | Start with play: clear rules, readable controls, local robots, online rooms, Life World, and guide books. | 先好好遊玩：清楚規則、易讀控制、本機 Robot、線上房間、Life World 與遊戲指南。 |
| Researchers title | Researchers | 研究者 |
| Researchers body | Build reproducible experiments: choose model, topology, rule, seed, observables, scans, comparisons, validation, and export. | 建立可重現實驗：選擇模型、拓撲、規則、種子、可觀測量、掃描、比較、驗證與匯出。 |
| Labs primary badge | Start here | 從這裡開始 |
| Labs primary title | Simple / Research Interface | 簡易 / 研究介面 |
| Labs primary body | Enter Labs here first. Simple explains the current action and local rule; Research shows model, topology, seed, observables, export, and limitations. | 從這裡先進入 Labs。簡易模式說明現在能做的局部操作與規則；研究模式顯示模型、拓撲、種子、可觀測量、匯出與限制。 |
| Life primary title | Life World | Life World |
| Life primary body | Create patterns, run evolution, and compare how Life changes across spaces. | 建立圖樣、啟動演化，並比較 Life 在不同空間中如何改變。 |

## Mode Description Template

Every mode intro should use this order. Keep it short on the first screen and put
long explanations in guide books or research notes.

| Sentence | English Template | Traditional Chinese Template |
| --- | --- | --- |
| What it is | This mode studies `{system}` on `{space}`. | 此模式研究 `{system}` 在 `{space}` 上的行為。 |
| What user does | Choose `{action}` to change local states. | 選擇 `{action}` 來改變局部狀態。 |
| Why topology matters | The selected topology changes which sites count as neighbors or boundary continuations. | 所選拓撲會改變哪些位置算作鄰居或邊界延續。 |
| What to observe | Watch `{observable}` to compare outcomes. | 觀察 `{observable}` 來比較結果。 |
| Research caution | This is `{validationLevel}`; see limitations before using results as evidence. | 此模型屬於 `{validationLevel}`；將結果作為證據前請先查看限制。 |

## Status Message Grammar

Dynamic status text should follow the same grammar everywhere.

| Type | English Pattern | Traditional Chinese Pattern |
| --- | --- | --- |
| Choose action | Choose `{action}`. | 請選擇 `{action}`。 |
| Select object | Select `{object}` first. | 請先選擇 `{object}`。 |
| Click target | Click `{target}` to `{result}`. | 點擊 `{target}` 以 `{result}`。 |
| Preview result | `{action}` will affect `{count}` sites. | `{action}` 將影響 `{count}` 個位置。 |
| Blocked action | This action is unavailable because `{reason}`. | 此操作無法使用，原因是 `{reason}`。 |
| Warning | Warning: `{risk}`. | 警告：`{risk}`。 |
| Research limitation | Limitation: `{limitation}`. | 限制：`{limitation}`。 |

Examples:

| English | Traditional Chinese |
| --- | --- |
| Select an anyon, then hop to a neighbor or exchange around an occupied vertex. | 先選擇一個 anyon（任意子），然後躍遷到相鄰位置，或繞過已佔據的頂點交換。 |
| Click an empty site to prepare Z0. | 點擊空 site 以準備 Z0。 |
| This topology is unsupported for the selected lattice; using the nearest safe option. | 所選晶格不支援此拓撲；已改用最接近且安全的選項。 |

## Important Mode Families

| Family | English Purpose | Traditional Chinese Purpose |
| --- | --- | --- |
| Chess | Move pieces by legal piece rules; topology changes adjacency, attack lines, and board boundaries. | 依棋子合法走法移動；拓撲會改變相鄰關係、攻擊線與棋盤邊界。 |
| Go | Place stones, capture groups without liberties, and compare territory on different graph spaces. | 放置棋子、提取無氣棋群，並比較不同圖空間上的地盤。 |
| Reversi | Place a legal disc/operator to bracket and flip connected opponent chains. | 放置合法棋子或算符，夾住並翻轉連接的對方鏈。 |
| Jump | Use Chinese checkers style steps and chain jumps to reach target zones. | 使用中國跳棋式步行與連跳，抵達目標區。 |
| Life | Apply cellular automata rules to patterns, species, age, noise, and topology. | 將細胞自動機規則套用到圖樣、物種、年齡、噪聲與拓撲。 |
| Spin Systems | Study local spin or phase updates, domain walls, energy, and winding. | 研究局部自旋或相位更新、疇壁、能量與繞行。 |
| Statistical Dynamics | Study cluster growth, percolation, random local contacts, and transport. | 研究團簇成長、滲流、隨機局部接觸與傳輸。 |
| Quantum Information | Study Pauli labels, stabilizer recovery, logical sectors, and seeded noise. | 研究 Pauli 標籤、Stabilizer recovery、邏輯扇區與帶種子的噪聲。 |
| Topological Matter | Study anyon charge, fusion, braiding, Wilson loops, and memory sectors. | 研究 anyon 電荷、融合、編織、Wilson 迴路與記憶扇區。 |
| Field Theory | Study discrete field insertions, OPE channels, entropy estimates, and stress proxies. | 研究離散場插入、OPE 通道、熵估計與 stress proxy。 |

## Read-Only Content Placement

| Content | Correct Place | Do Not Put It |
| --- | --- | --- |
| Basic game guide | Below the board, collapsible guide book, or mode guide panel. | Inside the tuning controls. |
| History / move log | Below observables or in a separate log panel. | Above the board title or mixed into selectors. |
| Research notes | Research Notes section after results/export. | In the main play toolbar. |
| References | Research Notes / References area. | In the first control group. |
| Long physical meaning | Guide book or Model Description. | Button labels or compact dropdown labels. |
| Warnings | Near the affected control and in export metadata. | Only inside browser console. |

## Product Areas

| Level | English | Traditional Chinese | Use |
| --- | --- | --- | --- |
| Platform | Topoboard | Topoboard | The whole website and app. |
| Player entry | Players | 玩家 | Normal play, guides, robots, online rooms. |
| Research entry | Researchers | 研究者 | Reproducible experiments, observables, export. |
| Entertainment area | Topoboard Games | Topoboard Games | Chess, Go, Reversi, Jump. |
| Life area | Topoboard Life | Topoboard Life | Cellular automata, artificial life, ecology. |
| Research area | Topoboard Labs | Topoboard Labs | Physics, mathematics, information, topology. |

## Navigation Hierarchy

1. Initial interface
   - Players
   - Researchers
2. Player-facing areas
   - Games
   - Life World
   - Guides and controls
3. Research-facing areas
   - Labs Home
   - Simple / Research Interface
   - Experiment Builder
   - Phase / Regime Scan
   - Topology Comparison
   - Validation & Reproducibility
   - Publication & Dataset Export

The Simple / Research Interface is the primary Labs gateway. Deeper tools should
remain visible, but they should not visually compete with the gateway.

## Page Section Order

Use this order unless a specific game needs a smaller surface.

| Order | Player UI | Research UI |
| --- | --- | --- |
| 1 | Current game / turn | Current experiment / model |
| 2 | Board / world | Visualization panel |
| 3 | Play controls | Experiment controls |
| 4 | Legal move preview | Local rule preview |
| 5 | Guide book / rules | State space, topology, local rule |
| 6 | Move history | Observables, event log, export |
| 7 | Help and warnings | Research notes and limitations |

Read-only text such as guide books, history, assumptions, references, and long
introductions should live below or beside the active control surface. Do not put
long read-only text inside the main tuning controls.

## Shared Terms

| English | Traditional Chinese | Notes |
| --- | --- | --- |
| Home | 首頁 | Main navigation. |
| Simple | 簡易 | Low-detail workspace. |
| Research | 研究 | Full reproducible workspace. |
| Play | 遊玩 | Player action mode only. |
| Experiment | 實驗 | Labs equivalent of play session. |
| Mode | 模式 | Player-facing selectable variant. |
| Model | 模型 | Research-facing system definition. |
| Board | 棋盤 | Games and Life visual board. |
| Workspace | 工作區 | Labs control + visualization page. |
| Geometry | 幾何 | Shape of the board or space. |
| Topology | 拓撲 | Boundary identification and global space. |
| Lattice | 晶格 | Local grid or graph structure. |
| Dimension | 維度 | 2D, 3D, 4D, or spacetime dimension. |
| Boundary | 邊界 | Open, periodic, twisted, reflective, random. |
| State Space | 狀態空間 | Allowed states in Labs. |
| Local Rule | 局部規則 | Update / interaction rule. |
| Local Rule Preview | 局部規則預覽 | Short live action hint. |
| Observable | 可觀測量 | Measured quantity. |
| Event Log | 事件紀錄 | Research and online logs. |
| Export | 匯出 | JSON, CSV, snapshot, dataset. |
| Seed | 種子 | Reproducibility seed. |
| Warning | 警告 | Safety, limitations, unsupported topology. |

Keep abbreviations and standard names unchanged: CFT, QEC, OPE, Z2, RP2, S2,
R2, R3, T2, T3, Pauli, Clifford, Wilson, Ising, Virasoro, Anyon, B/S, JSON,
CSV, UUID-like hashes, and app version strings.

## Game Terms

| English | Traditional Chinese | Applies To |
| --- | --- | --- |
| Chess | Chess / 西洋棋 | Keep Chess visible in bilingual text. |
| Go | Go / 圍棋 | Use Go in technical labels, 圍棋 in guides. |
| Reversi | Reversi / 黑白棋 | Use Reversi in mode names. |
| Jump | Chinese checkers / 中國跳棋 | Use Jump as product mode, explain with Chinese checkers. |
| Move | 著法 / 移動 | Use 著法 for board games, 移動 for spatial motion. |
| Legal move | 合法著法 | Player-facing status. |
| Capture | 捕獲 / 提子 | Use 提子 for Go. |
| Pass | 停手 | Go/Reversi style pass. |
| Count | 數目 / 計分 | Endgame scoring. |
| Robot | Robot / 機器人 | Keep Robot in selectors if already used. |

## Life Terms

| English | Traditional Chinese | Notes |
| --- | --- | --- |
| Life World | Life World | Module name. |
| Generation | 世代 | Simulation step. |
| Species | 物種 | Life/ecology only, not Labs cluster physics. |
| Pattern | 圖樣 | Player-facing pattern library. |
| Rule preset | 規則預設 | Conway, HighLife, etc. |
| Custom Rule Designer | 自訂規則設計器 | B/S rules. |
| Neighborhood | 鄰域 | Moore, Von Neumann, lattice nearest. |
| Phase Diagram Scanner | 相圖掃描器 | Research view only. |
| Topology Compare | 拓撲比較 | Research view only. |
| Experiment Notebook | 實驗筆記本 | Local storage, no account required. |

## Labs Terms

Labs must avoid game progression language.

| Avoid | Use |
| --- | --- |
| Play | Experiment |
| Level | Model |
| Win | Stable configuration / final state |
| Score | Observable summary |
| Round | Trial |
| Restart | Reset experiment |

Labs pages should always communicate:
"This is an experimental environment for studying how local rules interact with
topology."

## UI Arrangement Rules

Desktop:
- Keep the board or visualization in the largest central region.
- Put active controls in a side panel with 2-column groups where space allows.
- Put read-only guides, notes, references, and long histories below the board or
  in collapsible panels.
- Keep the Simple / Research toggle, Home, and language globe aligned and not
  overlapping.

Mobile:
- No horizontal scrolling.
- Board/world appears before long guide text.
- Controls collapse into short grouped sections.
- Touch targets should be at least 40 px high.
- Long English and Traditional Chinese labels must wrap without covering buttons.

Both languages:
- Use the shared localizer for dynamic status text.
- Do not hardcode new dynamic English-only warnings, previews, or annotations.
- If a phrase includes variable numbers or selected labels, add a regex
  translation to the shared localizer.
- Keep scientific abbreviations unchanged, and translate the surrounding sentence.

## Review Checklist

Before upload or release, check:
- Launcher: Players and Researchers entries are clear on desktop and mobile.
- Labs: Simple / Research Interface is the primary first Labs choice.
- Labs: Local Rule Preview, State Space, Local Rule, Observables, Research Notes,
  warnings, buttons, and exports are translated.
- Life: board fits the first screen, but can still be zoomed beyond it.
- Life: Play view stays simple; Research view keeps advanced controls.
- Games: board, controls, guide book, robot/analysis, online, and endgame text do
  not overlap in English or Traditional Chinese.
- All devices: no horizontal overflow, no controls hidden behind fixed bars, and
  no read-only guide text inside the active tuning controls.
