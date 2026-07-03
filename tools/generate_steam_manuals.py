#!/usr/bin/env python3
"""Generate Steam PDF manuals and editable Markdown sources.

Steam accepts PDF manuals in the "Game manuals, quick reference guides, and
read-me files" section. This script creates English and Traditional Chinese
versions for the suitable document types:

  - Quick Start Guide
  - Full Manual
  - Readme and Troubleshooting

The PDF renderer uses Pillow only, so it works in the current project Python
environment without extra packages.
"""

from __future__ import annotations

import textwrap
from pathlib import Path
from typing import Iterable

from PIL import Image, ImageDraw, ImageFont


OUTPUT_DIR = Path(__file__).resolve().parents[1] / "local-app" / "build-resources" / "steam-manuals"
SOURCE_DIR = OUTPUT_DIR / "source"
PAGE_SIZE = (1240, 1754)
MARGIN_X = 86
MARGIN_Y = 82
BACKGROUND = (250, 252, 255)
TEXT = (18, 28, 44)
MUTED = (86, 100, 122)
BLUE = (20, 94, 168)
GOLD = (172, 122, 34)
RULE = (196, 208, 224)


def font_candidates(language: str, bold: bool = False) -> Iterable[Path]:
    zh = [
        "C:/Windows/Fonts/msjhbd.ttc" if bold else "C:/Windows/Fonts/msjh.ttc",
        "C:/Windows/Fonts/mingliub.ttc" if bold else "C:/Windows/Fonts/mingliu.ttc",
        "/System/Library/Fonts/PingFang.ttc",
        "/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc" if bold else "/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc",
    ]
    en = [
        "C:/Windows/Fonts/segoeuib.ttf" if bold else "C:/Windows/Fonts/segoeui.ttf",
        "C:/Windows/Fonts/arialbd.ttf" if bold else "C:/Windows/Fonts/arial.ttf",
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf" if bold else "/System/Library/Fonts/Supplemental/Arial.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    ]
    for name in (zh + en if language == "zh" else en + zh):
        path = Path(name)
        if path.exists():
            yield path


def load_font(language: str, size: int, bold: bool = False) -> ImageFont.ImageFont:
    for path in font_candidates(language, bold):
        try:
            return ImageFont.truetype(str(path), size=size)
        except OSError:
            continue
    return ImageFont.load_default()


def text_width(draw: ImageDraw.ImageDraw, text: str, font: ImageFont.ImageFont) -> int:
    left, top, right, bottom = draw.textbbox((0, 0), text, font=font)
    return right - left


def wrap_line(draw: ImageDraw.ImageDraw, text: str, font: ImageFont.ImageFont, max_width: int, language: str) -> list[str]:
    if not text:
        return [""]
    if language == "zh":
        chunks = list(text)
        lines: list[str] = []
        current = ""
        for chunk in chunks:
            trial = current + chunk
            if current and text_width(draw, trial, font) > max_width:
                lines.append(current)
                current = chunk
            else:
                current = trial
        if current:
            lines.append(current)
        return lines
    words = text.split()
    if not words:
        return [""]
    lines = []
    current = words[0]
    for word in words[1:]:
        trial = f"{current} {word}"
        if text_width(draw, trial, font) <= max_width:
            current = trial
        else:
            lines.append(current)
            current = word
    lines.append(current)
    return lines


def render_pdf(markdown: str, pdf_path: Path, language: str) -> None:
    pdf_path.parent.mkdir(parents=True, exist_ok=True)
    pages: list[Image.Image] = []
    page = Image.new("RGB", PAGE_SIZE, BACKGROUND)
    draw = ImageDraw.Draw(page)
    y = MARGIN_Y
    page_number = 1

    fonts = {
        "h1": load_font(language, 48, True),
        "h2": load_font(language, 34, True),
        "h3": load_font(language, 27, True),
        "body": load_font(language, 24, False),
        "bold": load_font(language, 24, True),
        "small": load_font(language, 18, False),
    }

    def footer() -> None:
        nonlocal draw
        draw.line((MARGIN_X, PAGE_SIZE[1] - 70, PAGE_SIZE[0] - MARGIN_X, PAGE_SIZE[1] - 70), fill=RULE, width=2)
        draw.text((MARGIN_X, PAGE_SIZE[1] - 52), "Topological Board Game", font=fonts["small"], fill=MUTED)
        page_text = f"{page_number}"
        draw.text((PAGE_SIZE[0] - MARGIN_X - text_width(draw, page_text, fonts["small"]), PAGE_SIZE[1] - 52), page_text, font=fonts["small"], fill=MUTED)

    def new_page() -> None:
        nonlocal page, draw, y, page_number
        footer()
        pages.append(page)
        page_number += 1
        page = Image.new("RGB", PAGE_SIZE, BACKGROUND)
        draw = ImageDraw.Draw(page)
        y = MARGIN_Y

    def need(height: int) -> None:
        if y + height > PAGE_SIZE[1] - 110:
            new_page()

    def draw_wrapped(text: str, font: ImageFont.ImageFont, fill: tuple[int, int, int], indent: int = 0, bullet: str | None = None, line_gap: int = 10) -> None:
        nonlocal y
        available = PAGE_SIZE[0] - MARGIN_X * 2 - indent
        prefix_width = 0
        if bullet:
            prefix_width = text_width(draw, bullet, font) + 12
            available -= prefix_width
        lines = wrap_line(draw, text, font, available, language)
        line_height = font.size + line_gap if hasattr(font, "size") else 34
        need(line_height * len(lines) + 8)
        x = MARGIN_X + indent
        if bullet:
            draw.text((x, y), bullet, font=font, fill=fill)
            x += prefix_width
        for index, line in enumerate(lines):
            draw.text((x, y), line, font=font, fill=fill)
            y += line_height
            if bullet and index == 0:
                x = MARGIN_X + indent + prefix_width
        y += 6

    for raw in markdown.splitlines():
        line = raw.rstrip()
        if not line:
            y += 18
            continue
        if line == "---":
            need(26)
            draw.line((MARGIN_X, y + 9, PAGE_SIZE[0] - MARGIN_X, y + 9), fill=RULE, width=2)
            y += 28
            continue
        if line.startswith("# "):
            text = line[2:].strip()
            need(92)
            draw_wrapped(text, fonts["h1"], BLUE, line_gap=14)
            y += 12
            continue
        if line.startswith("## "):
            text = line[3:].strip()
            need(70)
            draw_wrapped(text, fonts["h2"], GOLD, line_gap=12)
            y += 4
            continue
        if line.startswith("### "):
            text = line[4:].strip()
            need(56)
            draw_wrapped(text, fonts["h3"], BLUE, line_gap=10)
            continue
        if line.startswith("- "):
            draw_wrapped(line[2:].strip(), fonts["body"], TEXT, indent=24, bullet="•", line_gap=10)
            continue
        draw_wrapped(line, fonts["body"], TEXT, line_gap=10)

    footer()
    pages.append(page)
    pages[0].save(pdf_path, "PDF", save_all=True, append_images=pages[1:], resolution=150)


DOCS = {
    "Topological_Board_Game_Quick_Start_EN": {
        "language": "en",
        "markdown": """# Topological Board Game - Quick Start Guide

Language: English

This guide is for players opening the Steam version for the first time. It explains what to click, how to start a game, and what the main modes mean.

## 1. Start The Game

- Open Topological Board Game from Steam.
- Choose a game family: Chess, Go, Reversi, Jump / Chinese Checkers, Hex, Life World, or Labs.
- Choose a dimension or mode: 2D, 3D, 4D, 2+1D, or 3+1D.
- Choose Local, Online, or Robot where available.
- Press New Game or Start.

## 2. Basic Controls

- Left click or tap a board site to select, place, or move.
- Drag to rotate 3D boards when the page supports a rotatable view.
- Use mouse wheel or pinch gestures to zoom.
- Use Reset Camera if the board moves out of view.
- Use Home to return to the main launcher.
- Use the globe icon to switch English and Traditional Chinese.

## 3. Game Families

### Chess

- Move one piece at a time according to standard chess piece movement.
- Protect your king and try to checkmate the opponent king.
- Topological boards change which squares are adjacent or connected, but the chess rule is still the chess rule.

### Go

- Place black and white stones on board intersections.
- Stones with no liberties are captured.
- Pass when you do not want to play.
- At the end, territory and captures are counted to decide the winner.

### Reversi

- Place a disc so that at least one straight connected line of opponent discs is bracketed.
- Bracketed discs flip to your color.
- The player with more discs at the end wins.

### Jump / Chinese Checkers

- Move or jump pieces along the board graph.
- Reach the target camp before the opponent.
- Topology changes the connection graph, so legal jumps follow the shown links.

### Hex

- Blue and Orange place cells on empty Hex board units.
- Blue connects its two target sides.
- Orange connects its two target sides.
- There is no movement, flipping, capture, or passing by default.

## 4. Dimensions And Topology

- 2D: flat board-game play.
- 3D: rotatable boards, surfaces, volumes, or embedded boards.
- 4D: higher-dimensional boards shown through slices or projection controls.
- 2+1D and 3+1D: board games with a time layer.
- Boundary and topology options change how edges connect, such as open boundary, cylinder, torus, Mobius strip, Klein bottle, sphere, or projective-style boundary.

## 5. Time Modes In +1D Games

- Future Mode: choose a move now; it resolves after a delay.
- Past Mode: rewrite a recent resolved move inside a fixed window, then replay the timeline.
- Past+Future Mode: combine scheduling future moves and rewriting recent past moves.
- Age and Go Time Period are separate optional modes where available.
- Ordinary 2D, 3D, and 4D games are normal board games and do not need time modes.

## 6. Online Play

- Use Find Match or Room controls where available.
- If sign-in is required, use the account panel.
- If password login says the sign-in method is not enabled, enable Email/Password in Firebase Authentication for the project.

## 7. Life World

- Life World is a cellular automata and artificial-life mode.
- Use Start, Step, Reset, Random seed, drawing, erasing, species selection, and pattern tools.
- Research controls include topology, lattice, B/S rules, observables, phase scans, and topology comparisons.

## 8. Labs

- Labs is the scientific research area.
- It is for topology, graph dynamics, spin systems, quantum information, topological matter, and field-theory style experiments.
- Labs is not ordinary gameplay; it focuses on reproducible experiments, observables, export, and comparison.

## 9. Quick Troubleshooting

- If the board is off screen, use Reset Camera or reduce zoom.
- If online play does not connect, check internet, Firebase config, and room settings.
- If a 3D board feels slow, reduce board size or use a simpler lattice.
- If language is wrong, use the globe icon and reload.

## 10. Steam Manual Files

This PDF is a quick reference. For complete rules, use the Full Manual PDF. For installation and support, use the README and Troubleshooting PDF.
""",
    },
    "Topological_Board_Game_Full_Manual_EN": {
        "language": "en",
        "markdown": """# Topological Board Game - Full Manual

Language: English

Topological Board Game is a board-game and research platform where familiar rules are played on unfamiliar spaces. Chess, Go, Reversi, Jump / Chinese Checkers, and Hex keep their original game identity, while topology, dimension, boundary conditions, lattice choices, robots, online rooms, and time-layer modes change the board on which those rules live.

## 1. Main Launcher

- Players enter normal game pages for quick play.
- Researchers enter Labs for reproducible discrete topological dynamics experiments.
- Life World is separate from Labs and focuses on cellular automata, artificial life, ecology, and species interaction.
- The globe icon switches English and Traditional Chinese.
- Home returns to the main launcher from game pages.

## 2. Common Interface

- Game board: the central interactive area.
- Game Controls: mode, board size, topology, boundary, lattice, robot, online, and new-game controls.
- Status card: current turn, winner, counts, clocks, warnings, or connection state.
- Move history: past moves and, in +1D modes, pending or replayed events.
- Chat panel: available in online pages.
- Camera controls: rotate, zoom, slice, focus, and reset options where available.

## 3. Input Controls

- 2D boards: click or tap a valid cell, intersection, or piece.
- 3D boards: rotate the board, then click the visible target site or face.
- 4D boards: select slices or projected layers, then choose a visible site.
- Mobile: tap controls; pinch or drag on supported boards.
- If a click seems blocked, rotate or zoom so the intended site is visible.

## 4. Board Spaces

- Standard open board: edges stop at the board boundary.
- Cylinder: one pair of opposite edges wraps.
- Torus: both edge directions wrap.
- Mobius strip: one edge wraps with a flip.
- Klein bottle: one direction wraps normally and the other wraps with orientation reversal.
- Sphere: a closed surface board, sometimes with pole sites or geodesic-style links.
- Projective plane / RP-style boundary: opposite boundary points are identified with reversal when supported.
- R3 / voxel volume: a 3D board volume.
- T3 / periodic volume: R3 with periodic boundary conditions.
- RBC / random boundary: a fixed random boundary connection map.

## 5. Lattices

- Square: the standard grid.
- Triangular: diagonal connections create triangular local cells.
- Honeycomb: hexagon-cell graph; Go usually plays on vertices, while Reversi and Hex may use faces depending on the page.
- BCC, FCC, HCP, and other 3D lattices: 3D neighbor structures where supported.
- Lattice choices change adjacency, legal paths, captures, flips, and connection tests.

## 6. Chess Rules

- Objective: checkmate the opponent king.
- King: moves one step in any legal adjacent direction and may not move into check.
- Queen: moves along legal straight lines.
- Rook: moves along orthogonal legal lines.
- Bishop: moves along diagonal legal lines.
- Knight: moves in the page's legal knight pattern.
- Pawn: advances according to the selected chess page rules and captures diagonally where supported.
- A move is illegal if it leaves your king in check.
- In topological and higher-dimensional boards, the displayed graph or geometry determines which directions and connections are legal.

## 7. Go Rules

- Objective: control more territory after captures and scoring.
- Stones are placed on intersections or graph vertices.
- A liberty is an adjacent empty point on the board graph.
- A connected group with no liberties is captured.
- Suicide, ko, superko, pass, komi, and scoring follow the selected page settings.
- On non-square topological boards, liberties and territories are counted through graph connectivity, not through a flat picture.
- Final scoring should label black and white territory clearly and include captures, komi, and dead-stone handling where the page supports it.

## 8. Reversi Rules

- Objective: finish with more discs than the opponent.
- A legal move places a disc so that one or more connected lines of opponent discs are bracketed between the new disc and an existing friendly disc.
- Bracketed discs flip to the player who moved.
- If no legal move exists, the turn may pass according to page rules.
- On topological boards, flip lines follow the board graph and available directions.
- For surface boards, some pages place discs on faces rather than vertices; follow the board explanation shown beside the controls.

## 9. Jump / Chinese Checkers Rules

- Objective: move your pieces into the target camp.
- A normal move goes to an adjacent empty site.
- A jump crosses an occupied neighboring site and lands on the empty site beyond it when the path is legal.
- Chain jumps may continue when supported.
- Topology changes the graph, so legal jumps follow shown connections.
- Robot turns should animate step by step so players can see the path.

## 10. Hex Rules

- Players are Blue and Orange.
- A move fills one empty Hex unit.
- Blue connects its two target zones.
- Orange connects its two target zones.
- There is no flipping, capture, movement, or pass by default.
- Standard 2D Hex usually uses a honeycomb-style cell board.
- Other topological Hex boards use explicit target zones or seams, not imaginary physical edges.
- A win is detected by graph connectivity through the player's filled cells.

## 11. Robots

- Robot mode lets a local player face the computer.
- Difficulty levels may change search depth, evaluation, rollout count, or heuristic strength.
- Stronger robots may use more time.
- If a robot move feels too fast to understand, use pages that expose animation speed or replay history.

## 12. Online Play

- Use Find Match for matchmaking when supported.
- Use Room controls to create or join a room.
- Online play depends on Firebase configuration.
- Email/password accounts require Email/Password sign-in to be enabled in Firebase Authentication.
- If online mode is developing for a feature, the page should say so clearly.

## 13. +1D Time Modes

### Future Mode

- A player chooses an action now.
- The action is scheduled for a future tick.
- The original board-game rule is checked when the action resolves.
- If legal at resolve time, it applies.
- If illegal at resolve time, it fails and should be shown in history.

### Past Mode

- Moves normally resolve immediately.
- A recent resolved event can be rewritten inside a fixed rewrite window.
- The rewrite replaces an event, then the timeline replays.
- If validation fails, the rewrite is rejected with a clear conflict message.
- No branch timeline is shown in the current UI.

### Past+Future Mode

- Players can schedule future actions and rewrite recent past actions.
- Later events are replayed and revalidated.
- Pending future actions may be cancelled or rescheduled before they resolve.

### Age And Go Time Period

- Age mode and noise can modify supported +1D games except where disabled.
- Go Time Period is a Go-specific time-period mode and should not be mixed into other games.
- Age counters and period counters are separate UI concepts.

## 14. Life World

- Life World is for cellular automata, artificial life, evolution, ecology, and species interaction.
- Basic play: Start, Step, Reset, Random seed, Draw, Erase, Inspect, species selection, and board size.
- Research controls: geometry, lattice, dimension, rule preset, B/S custom rule, neighborhood, noise, age, mutation, max generations, pattern JSON, observables, phase scanning, topology comparison, and experiment notebook.
- R3 Life uses a full 3D voxel volume.
- T3 periodic and RBC are R3 boundary-condition choices, not separate Life geometries.

## 15. Labs

- Labs is a research platform for discrete topological dynamics.
- It separates physics, mathematics, information, topology, graph dynamics, and research export from game progression.
- Labs pages emphasize topology, state space, local rule, dynamics, observables, experiment configuration, results, reproducibility, and export.
- Labs does not contain biological Life World models.

## 16. Saving And Export

- Many pages support JSON export/import.
- Labs and Life World may export observables, snapshots, experiment configs, CSV time series, or notebook entries.
- Keep exported files if you need reproducibility across versions.

## 17. Performance Tips

- Reduce board size for slow 3D or 4D boards.
- Prefer simpler lattices for older devices.
- Use WebGL-capable browsers and updated GPU drivers.
- For research scans, Web Workers or offline Python tools can improve responsiveness.

## 18. Support

Use the README and Troubleshooting PDF for installation, account, online, and reset help. For online manuals, link the Steam Basic Info tab to the public Topoboardgame website manual page.
""",
    },
    "Topological_Board_Game_Readme_Troubleshooting_EN": {
        "language": "en",
        "markdown": """# Topological Board Game - README And Troubleshooting

Language: English

This file is for Steam users who need installation, account, online-room, display, performance, or reset help.

## 1. Installation

- Install the game from Steam.
- Launch from the Steam Library.
- If Windows SmartScreen appears during testing builds, confirm that the publisher and folder are expected.
- Keep the game installed in a normal writable Steam library folder.

## 2. Supported Platforms

- Windows 64-bit is the primary build target.
- macOS 64-bit and Linux builds may be distributed when the Steam depot includes them.
- Android is not a Steam desktop build target unless a separate mobile release is prepared.

## 3. Display And Controls

- Use Reset Camera if a board is off screen.
- Use zoom sliders, mouse wheel, or pinch gestures where available.
- On mobile-sized windows, controls may stack vertically.
- If text overlaps, switch to a wider window or reduce browser/app zoom.

## 4. Online Account Help

- Email/password login requires Firebase Email/Password sign-in to be enabled in the Firebase console.
- If the message says "This sign-in method is not enabled yet," open Firebase Console, Authentication, Sign-in method, and enable Email/Password.
- Password reset requires the user to enter the registered email.
- Account deletion should be used carefully because online identity data may be lost.

## 5. Online Rooms

- Check internet connection.
- Use the same game family, board mode, and room code.
- If room state seems stale, leave and recreate the room.
- Some experimental modes may disable online play until safe synchronization exists.

## 6. Robot Mode

- Robot difficulty can affect speed.
- Stronger levels may think longer.
- If a robot is too slow, reduce board size or choose a lower level.

## 7. Firebase Configuration

- Website deployments need public Firebase web config values.
- Vite builds should use variables like VITE_FIREBASE_API_KEY.
- Local preview may warn about missing config if the environment file is absent.
- Production and Preview variables should both be set in the hosting provider when needed.

## 8. Steam Build Files

- Steam app id: use the app id assigned in Steamworks.
- Depot content must point to the built game folder.
- Upload through Steamworks ContentBuilder.
- Keep capsule art, icons, manuals, privacy policy, EULA, and third-party notices available.

## 9. Performance

- 3D, 4D, large Go boards, large Life scans, and research plots can be heavy.
- Reduce board size, lattice complexity, or visual opacity.
- Close other GPU-heavy apps.
- Research-grade scans can be generated offline with Python and imported as data when needed.

## 10. Reset Local Data

- Browser/local app settings can include language, room settings, notebooks, and saved experiments.
- Use in-game reset buttons first.
- If necessary, clear site/app storage from the browser or app webview.
- Export important notebooks before clearing storage.

## 11. Known Limitations

- Some advanced topological boards are visual approximations of mathematical spaces.
- Some Labs models are toy or estimator-level demonstrations, not calibrated physical simulations.
- Some online synchronization paths are disabled for experimental time rewriting modes.

## 12. Getting Help

- Read the Full Manual for detailed rules.
- Read the Quick Start Guide for short usage steps.
- Use the online manual link on the Steam Basic Info tab for the latest website documentation.
""",
    },
    "Topological_Board_Game_Quick_Start_ZH": {
        "language": "zh",
        "markdown": """# Topological Board Game - 快速開始指南

語言：繁體中文

本指南給第一次從 Steam 開啟遊戲的玩家使用，說明要點哪裡、如何開始，以及主要模式代表什麼。

## 1. 開始遊戲

- 從 Steam 開啟 Topological Board Game。
- 選擇遊戲類型：Chess、Go、Reversi、Jump / 中國跳棋、Hex / 六貫棋、Life World，或 Labs。
- 選擇維度或模式：2D、3D、4D、2+1D，或 3+1D。
- 在可用頁面選擇本機、線上，或機器人。
- 按 New Game 或 Start 開始。

## 2. 基本操作

- 滑鼠左鍵或觸控點選棋盤位置，可以選取、落子或移動。
- 3D 棋盤支援拖曳旋轉。
- 使用滑鼠滾輪或雙指縮放調整視野。
- 如果棋盤跑出畫面，使用 Reset Camera。
- Home 回到主選單。
- 使用地球圖示切換英文與繁體中文。

## 3. 遊戲類型

### Chess

- 依照棋子走法每次移動一枚棋子。
- 保護自己的 King，並嘗試將死對方 King。
- 拓撲棋盤會改變格點連接方式，但 Chess 本身仍是 Chess 規則。

### Go

- 黑白雙方在交點落子。
- 沒有氣的棋串會被提掉。
- 不想落子時可以 Pass。
- 終局時依照地、提子、貼目與死活計算勝負。

### Reversi

- 落下一枚棋，使至少一條連線上的對方棋被自己的棋夾住。
- 被夾住的棋會翻成自己的顏色。
- 終局時棋子較多者獲勝。

### Jump / 中國跳棋

- 沿棋盤圖移動或跳躍棋子。
- 目標是比對方更早進入目標營區。
- 拓撲會改變連接圖，因此合法跳法依照畫面上的連線判定。

### Hex / 六貫棋

- Blue 與 Orange 在空的 Hex 單元落子。
- Blue 連通自己的兩側目標區。
- Orange 連通自己的兩側目標區。
- 預設沒有移動、翻轉、吃子或 Pass。

## 4. 維度與拓撲

- 2D：平面棋盤玩法。
- 3D：可旋轉的曲面、體積或嵌入棋盤。
- 4D：透過切片或投影控制顯示高維棋盤。
- 2+1D 與 3+1D：在棋類規則上加入時間層。
- 邊界與拓撲選項會改變棋盤邊緣如何相接，例如開放邊界、Cylinder、Torus、Mobius、Klein、Sphere，或投影式邊界。

## 5. +1D 時間模式

- Future Mode：現在選擇行動，延遲後才生效。
- Past Mode：在固定窗口內改寫最近已生效的行動，並重播時間線。
- Past+Future Mode：同時支援排程未來行動與改寫近期過去行動。
- Age 與 Go Time Period 是另外的可選模式。
- 一般 2D、3D、4D 是普通棋類，不需要時間模式。

## 6. 線上遊戲

- 在支援的頁面使用 Find Match 或 Room。
- 如果需要登入，使用帳號面板。
- 若看到 sign-in method 尚未啟用，請在 Firebase Authentication 啟用 Email/Password。

## 7. Life World

- Life World 是細胞自動機與人工生命模式。
- 可使用 Start、Step、Reset、Random seed、繪製、擦除、物種選擇與圖樣工具。
- 研究控制包含拓撲、晶格、B/S 規則、觀測量、相圖掃描與拓撲比較。

## 8. Labs

- Labs 是科學研究區。
- 用於拓撲、圖動力學、自旋系統、量子資訊、拓撲物質與場論風格實驗。
- Labs 不是普通遊戲流程，而是重視可重現實驗、觀測量、匯出與比較。

## 9. 快速排除問題

- 棋盤跑出畫面時，使用 Reset Camera 或縮小。
- 線上無法連線時，檢查網路、Firebase 設定與房間設定。
- 3D 棋盤很慢時，降低棋盤大小或使用較簡單晶格。
- 語言錯誤時，使用地球圖示並重新載入。

## 10. Steam 手冊檔案

本 PDF 是快速參考。完整規則請看 Full Manual PDF。安裝與支援請看 README and Troubleshooting PDF。
""",
    },
    "Topological_Board_Game_Full_Manual_ZH": {
        "language": "zh",
        "markdown": """# Topological Board Game - 完整手冊

語言：繁體中文

Topological Board Game 是棋類遊戲與研究平台。熟悉的規則會被放到不熟悉的空間上：Chess、Go、Reversi、Jump / 中國跳棋、Hex / 六貫棋保留各自的遊戲身份，而拓撲、維度、邊界條件、晶格、機器人、線上房間與時間層模式會改變這些規則所在的棋盤。

## 1. 主選單

- 玩家可進入一般遊戲頁面快速遊玩。
- 研究者可進入 Labs，進行可重現的離散拓撲動力學實驗。
- Life World 與 Labs 分開，專注於細胞自動機、人工生命、生態與物種互動。
- 地球圖示可切換英文與繁體中文。
- Home 可從各頁回到主選單。

## 2. 通用介面

- 棋盤：中央互動區。
- Game Controls：模式、棋盤大小、拓撲、邊界、晶格、機器人、線上與新局控制。
- 狀態卡：顯示目前回合、勝負、數量、時鐘、警告或連線狀態。
- Move History：顯示過去行動；在 +1D 模式會顯示待生效或重播事件。
- Chat panel：線上頁面可用。
- Camera controls：在支援頁面提供旋轉、縮放、切片、聚焦與重設。

## 3. 輸入操作

- 2D 棋盤：點選合法格、交點或棋子。
- 3D 棋盤：旋轉視角後，點選可見的目標位置或面。
- 4D 棋盤：先選擇切片或投影層，再點選可見位置。
- 手機或窄視窗：使用觸控；支援時可拖曳或雙指縮放。
- 如果點擊被擋住，請旋轉或縮放到目標位置清楚可見。

## 4. 棋盤空間

- Standard open board：邊界停止。
- Cylinder：一組相對邊相接。
- Torus：兩個方向都週期相接。
- Mobius strip：一組邊翻轉後相接。
- Klein bottle：一方向正常相接，另一方向翻轉相接。
- Sphere：封閉曲面棋盤，有些頁面包含極點或測地線式連線。
- Projective plane / RP-style boundary：支援時使用反向識別邊界點。
- R3 / voxel volume：3D 體素棋盤。
- T3 / periodic volume：具有週期邊界條件的 R3。
- RBC / random boundary：固定隨機邊界連接圖。

## 5. 晶格

- Square：標準方格。
- Triangular：由斜向連線形成三角局部單元。
- Honeycomb：六邊形單元圖；Go 通常在頂點上遊玩，Reversi 與 Hex 依頁面可能使用面。
- BCC、FCC、HCP 與其他 3D 晶格：支援頁面中的 3D 鄰接結構。
- 晶格會改變鄰接、合法路徑、提子、翻轉與連通判定。

## 6. Chess 規則

- 目標：將死對方 King。
- King：向任意合法相鄰方向走一步，且不能走進被將軍的位置。
- Queen：沿合法直線方向移動。
- Rook：沿正交合法直線移動。
- Bishop：沿斜向合法直線移動。
- Knight：依頁面定義的 Knight 型合法跳法移動。
- Pawn：依所選 Chess 頁面的規則前進並斜吃。
- 若一步棋會讓自己的 King 被將軍，該步非法。
- 在拓撲與高維棋盤上，畫面中的圖或幾何決定哪些方向與連接合法。

## 7. Go 規則

- 目標：終局時控制更多地。
- 棋子放在交點或圖頂點。
- 氣是棋盤圖上相鄰的空點。
- 無氣的連通棋串會被提掉。
- 自殺、劫、超劫、Pass、貼目與數子方式依頁面設定。
- 在非方格拓撲棋盤上，氣與地依圖連通計算，不依平面展開圖的外觀。
- 終局計分應清楚標示黑地、白地、提子、貼目與死子處理。

## 8. Reversi 規則

- 目標：終局時擁有較多棋子。
- 合法落子必須在一個或多個連通方向上，把對方棋夾在新棋與既有己方棋之間。
- 被夾住的棋會翻成己方顏色。
- 若沒有合法步，依頁面規則可能 Pass。
- 在拓撲棋盤上，翻轉線沿棋盤圖與可用方向判定。
- 在曲面棋盤上，有些頁面把棋放在面中心，而不是頂點；請依控制區說明判定。

## 9. Jump / 中國跳棋規則

- 目標：把棋子移入目標營區。
- 普通移動是走到相鄰空點。
- 跳躍是跨過相鄰被佔點，落到其後方空點。
- 支援時可連跳。
- 拓撲會改變圖，因此合法跳躍依畫面連線判定。
- 機器人行動應逐步動畫，讓玩家看清楚路徑。

## 10. Hex / 六貫棋規則

- 玩家為 Blue 與 Orange。
- 每步填入一個空的 Hex 單元。
- Blue 連通自己的兩側目標區。
- Orange 連通自己的兩側目標區。
- 預設沒有翻轉、吃子、移動或 Pass。
- 標準 2D Hex 通常使用蜂巢式面棋盤。
- 其他拓撲 Hex 棋盤使用明確目標區或切縫，不使用假的物理邊界。
- 勝負由己方填色單元的圖連通判定。

## 11. 機器人

- Robot mode 可讓本機玩家對戰電腦。
- 難度可能改變搜尋深度、評估、模擬次數或啟發式強度。
- 較強機器人可能需要較多計算時間。
- 如果機器人行動太快，使用有動畫速度或歷史重播的頁面。

## 12. 線上遊戲

- 支援時可使用 Find Match 配對。
- 可用 Room 控制建立或加入房間。
- 線上遊戲依賴 Firebase 設定。
- Email/password 帳號需要在 Firebase Authentication 啟用 Email/Password 登入方式。
- 如果某功能線上同步仍在開發，頁面應清楚顯示。

## 13. +1D 時間模式

### Future Mode

- 玩家現在選擇行動。
- 行動被排程到未來 tick。
- 行動生效時重新檢查原棋類規則。
- 若在生效時合法，行動套用。
- 若在生效時非法，行動失敗並應在歷史中顯示。

### Past Mode

- 行動通常立即生效。
- 最近已生效事件可在固定改寫窗口內改寫。
- 改寫會替換事件，然後重播時間線。
- 驗證失敗時，改寫會被拒絕並顯示衝突訊息。
- 目前 UI 不顯示分支時間線。

### Past+Future Mode

- 玩家可排程未來行動，也可改寫最近過去行動。
- 後續事件會重新回放與驗證。
- 待生效未來行動可在生效前取消或重排。

### Age 與 Go Time Period

- Age mode 與 noise 可套用到支援的 +1D 遊戲，但禁用頁面例外。
- Go Time Period 是 Go 專用時間週期模式，不應混入其他遊戲。
- Age 計數圈與 Period 計數圈是不同 UI 概念。

## 14. Life World

- Life World 用於細胞自動機、人工生命、演化、生態與物種互動。
- 基本玩法包含 Start、Step、Reset、Random seed、Draw、Erase、Inspect、物種選擇與棋盤大小。
- 研究控制包含幾何、晶格、維度、規則預設、B/S 自訂規則、鄰域、噪聲、年齡、突變、最大世代、Pattern JSON、觀測量、相圖掃描、拓撲比較與實驗筆記本。
- R3 Life 使用完整 3D 體素體積。
- T3 週期與 RBC 是 R3 邊界條件，不是獨立 Life 幾何。

## 15. Labs

- Labs 是離散拓撲動力學研究平台。
- 它把物理、數學、資訊、拓撲、圖動力學與研究匯出，和遊戲進程分開。
- Labs 頁面重視拓撲、狀態空間、局部規則、動力學、觀測量、實驗配置、結果、可重現性與匯出。
- Labs 不包含 Life World 的生物模型。

## 16. 儲存與匯出

- 許多頁面支援 JSON 匯出與匯入。
- Labs 與 Life World 可能匯出觀測量、快照、實驗配置、CSV 時間序列或筆記本。
- 如果需要跨版本重現，請保存匯出檔。

## 17. 效能建議

- 3D、4D、大型 Go 棋盤、大型 Life 掃描與研究圖表可能較重。
- 降低棋盤大小、晶格複雜度或視覺透明度。
- 使用支援 WebGL 的瀏覽器與較新的 GPU 驅動。
- 研究掃描可用 Web Worker 或離線 Python 工具提升流暢度。

## 18. 支援

安裝、帳號、線上與重設請看 README and Troubleshooting PDF。線上手冊可在 Steam Basic Info 分頁連到公開網站手冊頁。
""",
    },
    "Topological_Board_Game_Readme_Troubleshooting_ZH": {
        "language": "zh",
        "markdown": """# Topological Board Game - README 與問題排除

語言：繁體中文

本檔案提供 Steam 使用者安裝、帳號、線上房間、顯示、效能與重設協助。

## 1. 安裝

- 從 Steam 安裝遊戲。
- 從 Steam Library 啟動。
- 測試版若出現 Windows SmartScreen，請確認發行者與資料夾是預期來源。
- 建議安裝在正常可寫入的 Steam library 資料夾。

## 2. 支援平台

- Windows 64-bit 是主要建置目標。
- macOS 64-bit 與 Linux 可在 Steam depot 包含時發布。
- Android 不是 Steam 桌面版目標，除非另外準備行動版。

## 3. 顯示與控制

- 棋盤跑出畫面時使用 Reset Camera。
- 使用縮放滑桿、滑鼠滾輪或支援頁面的雙指縮放。
- 手機大小視窗會把控制項垂直排列。
- 若文字重疊，請改用較寬視窗或降低瀏覽器 / app 縮放。

## 4. 線上帳號協助

- Email/password 登入需要在 Firebase console 啟用 Email/Password sign-in。
- 若訊息顯示「This sign-in method is not enabled yet」，請開啟 Firebase Console，Authentication，Sign-in method，啟用 Email/Password。
- 重設密碼需要輸入已註冊 email。
- 刪除帳號要小心，因為線上身份資料可能遺失。

## 5. 線上房間

- 檢查網路連線。
- 使用相同遊戲類型、棋盤模式與 room code。
- 若房間狀態異常，離開後重新建立房間。
- 某些實驗性模式在安全同步完成前可能停用線上功能。

## 6. Robot Mode

- 機器人難度會影響速度。
- 較強等級可能思考更久。
- 如果機器人太慢，降低棋盤大小或選擇較低等級。

## 7. Firebase 設定

- 網站部署需要公開 Firebase web config。
- Vite build 應使用 VITE_FIREBASE_API_KEY 等變數。
- 本機 preview 如果沒有環境檔，可能會提示缺少 config。
- 若部署到 hosting provider，Production 與 Preview 需要的變數都應設定。

## 8. Steam 建置檔

- Steam app id 使用 Steamworks 指派的 app id。
- Depot content 必須指向已建置的遊戲資料夾。
- 使用 Steamworks ContentBuilder 上傳。
- 請保留 capsule 圖、icon、manuals、privacy policy、EULA 與 third-party notices。

## 9. 效能

- 3D、4D、大型 Go、Life 掃描與研究圖表可能負擔較高。
- 降低棋盤大小、晶格複雜度或視覺透明度。
- 關閉其他大量使用 GPU 的程式。
- 研究級掃描可用 Python 離線產生，再匯入資料。

## 10. 重設本機資料

- Browser / local app 設定可能包含語言、房間設定、筆記本與已存實驗。
- 優先使用遊戲內 Reset 按鈕。
- 必要時可清除網站或 app webview storage。
- 清除資料前請先匯出重要筆記本。

## 11. 已知限制

- 某些高階拓撲棋盤是數學空間的視覺近似。
- 某些 Labs 模型是 toy 或 estimator 等級示範，不是校準過的物理模擬。
- 某些實驗性時間改寫模式會停用線上同步。

## 12. 取得協助

- 詳細規則請看 Full Manual。
- 短步驟請看 Quick Start Guide。
- Steam Basic Info 分頁可連到線上手冊，取得最新網站文件。
""",
    },
}


def write_markdown(name: str, markdown: str) -> Path:
    SOURCE_DIR.mkdir(parents=True, exist_ok=True)
    path = SOURCE_DIR / f"{name}.md"
    path.write_text(markdown.strip() + "\n", encoding="utf-8")
    return path


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    written: list[Path] = []
    for name, spec in DOCS.items():
        markdown = textwrap.dedent(spec["markdown"]).strip()
        written.append(write_markdown(name, markdown))
        pdf_path = OUTPUT_DIR / f"{name}.pdf"
        render_pdf(markdown, pdf_path, spec["language"])
        written.append(pdf_path)
    print(f"Wrote Steam manuals to {OUTPUT_DIR}")
    for path in written:
        print(path)


if __name__ == "__main__":
    main()
