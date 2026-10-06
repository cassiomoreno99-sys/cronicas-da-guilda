from pathlib import Path

ROOT = Path(".")

css = ROOT / "app" / "globals.css"
s = css.read_text(encoding="utf-8")
marker = "/* v1.2.2 — MOBILE FIRST */"
if marker in s:
    s = s.split(marker)[0].rstrip() + "\n"

s += r'''
/* v1.2.2 — MOBILE FIRST */
@media (max-width:760px) {
  html, body, #root, .game {
    max-width:100%;
    overflow-x:hidden;
  }

  body {
    overscroll-behavior-y:contain;
    -webkit-text-size-adjust:100%;
  }

  .topbar-inner {
    min-height:58px !important;
    padding:7px 12px !important;
  }

  .brand { gap:8px !important; }
  .brand-mark {
    width:27px !important;
    height:33px !important;
    flex:0 0 27px !important;
  }
  .brand-mark > svg:first-child {
    width:27px !important;
    height:33px !important;
  }
  .brand-mark > svg:last-child {
    width:17px !important;
    height:17px !important;
    left:5px !important;
    top:5px !important;
  }
  .brand-title {
    font-size:21px !important;
    line-height:1.05 !important;
    white-space:nowrap;
  }
  .version { display:none !important; }
  .help-button {
    width:40px !important;
    height:40px !important;
    min-width:40px !important;
  }

  .workspace {
    padding:10px 10px calc(170px + env(safe-area-inset-bottom)) !important;
  }
  .workspace:has(.command-grid[data-mobile-view="mission"]),
  .workspace:has(.command-grid[data-mobile-view="team"]),
  .workspace:has(.command-grid[data-mobile-view="league"]),
  .workspace:has(.command-grid[data-mobile-view="camp"]) {
    padding-bottom:calc(185px + env(safe-area-inset-bottom)) !important;
  }

  .guild-heading {
    margin-bottom:9px !important;
  }
  .guild-heading h1 { font-size:22px !important; }

  .resources {
    margin-bottom:10px !important;
  }
  .resource {
    padding:7px 2px !important;
  }
  .resource div > span {
    font-size:11px !important;
  }
  .resource strong {
    font-size:17px !important;
  }

  .mobile-subnav {
    position:sticky !important;
    top:58px !important;
    z-index:34 !important;
    margin:0 -2px 10px !important;
    padding:4px !important;
    background:rgba(8,15,24,.98) !important;
    border-color:#4b5e72 !important;
    box-shadow:0 8px 18px rgba(0,0,0,.28);
    backdrop-filter:blur(8px);
  }
  .mobile-subnav [data-slot="toggle-group-item"] {
    min-height:40px !important;
    padding:7px 4px !important;
    font-size:12px !important;
    gap:3px !important;
  }
  .mobile-subnav svg {
    width:15px !important;
    height:15px !important;
  }

  .section-heading {
    margin-bottom:10px !important;
  }
  .section-heading h2 {
    font-size:21px !important;
  }
  .section-heading .eyebrow {
    font-size:10px !important;
  }
  .section-heading > .subtle-chip {
    font-size:11px !important;
    padding:4px 7px !important;
  }

  .mobile-mission-detail {
    padding:13px !important;
    margin-top:9px !important;
  }
  .mobile-mission-detail h3 {
    font-size:22px !important;
    margin:4px 0 7px !important;
  }
  .mobile-mission-detail > p {
    font-size:14px !important;
    line-height:1.42 !important;
  }
  .mission-levels { gap:4px !important; }
  .mission-levels label {
    min-height:52px !important;
    padding:5px 1px !important;
  }
  .mission-levels label strong {
    font-size:10px !important;
  }

  .team-preview {
    min-height:52px !important;
    padding:9px 2px !important;
  }

  .mobile-roster {
    border-radius:12px;
    overflow:hidden;
  }
  .mobile-hero {
    min-height:96px !important;
    padding:10px 8px !important;
    gap:9px !important;
  }
  .mobile-hero + .mobile-hero {
    border-top-color:#34485d !important;
  }
  .mobile-hero-select {
    gap:7px !important;
  }
  .mobile-hero-select .hero-portrait {
    width:54px !important;
    height:54px !important;
    flex:0 0 54px !important;
  }
  .mobile-hero-info {
    gap:3px !important;
    min-width:0;
  }
  .mobile-hero-info > strong {
    font-size:18px !important;
    line-height:1.12 !important;
    white-space:nowrap;
    overflow:hidden;
    text-overflow:ellipsis;
  }
  .mobile-hero-info > span {
    font-size:12px !important;
    line-height:1.25 !important;
    white-space:nowrap;
    overflow:hidden;
    text-overflow:ellipsis;
  }
  .mobile-hero-info .energy {
    margin-top:3px !important;
  }
  .mobile-hero-info .energy > span {
    min-width:40px !important;
    font-size:12px !important;
  }
  .mobile-hero-info .energy [data-slot="progress"] {
    height:5px !important;
  }
  .mobile-hero-info .negative {
    font-size:12px !important;
    margin-top:1px !important;
  }
  .mobile-hero > [data-slot="button"] {
    width:40px !important;
    height:44px !important;
    min-width:40px !important;
    padding:0 !important;
  }

  .formation-grid {
    gap:7px !important;
  }
  .formation-card {
    padding:10px !important;
  }
  .tactic-grid {
    gap:7px !important;
  }
  .tactic-card {
    padding:10px !important;
  }

  /* Ação de missão nunca fica escondida atrás da navegação. */
  .command-grid[data-mobile-view="team"] .launch-row,
  .command-grid[data-mobile-view="mission"] .launch-row {
    position:static !important;
    left:auto !important;
    right:auto !important;
    bottom:auto !important;
    margin:12px 0 8px !important;
    padding:10px 0 0 !important;
    background:transparent !important;
    border-top:1px solid #4d5e6d !important;
    box-shadow:none !important;
  }
  .command-grid[data-mobile-view="team"] .launch-row > div,
  .command-grid[data-mobile-view="mission"] .launch-row > div {
    display:none !important;
  }
  .command-grid[data-mobile-view="team"] .primary-launch,
  .command-grid[data-mobile-view="mission"] .primary-launch {
    width:100% !important;
    min-height:50px !important;
    font-size:16px !important;
  }

  .game .main-tabs {
    min-height:66px !important;
    height:calc(66px + env(safe-area-inset-bottom)) !important;
    padding:2px 4px env(safe-area-inset-bottom) !important;
    border-top:1px solid #80643c !important;
    background:rgba(8,16,25,.985) !important;
  }
  .game .main-tabs [data-slot="tabs-trigger"] {
    min-height:62px !important;
    padding:6px 2px !important;
    gap:3px !important;
    font-size:12px !important;
    touch-action:manipulation;
    -webkit-tap-highlight-color:transparent;
  }
  .game .main-tabs [data-slot="tabs-trigger"] > svg {
    width:20px !important;
    height:20px !important;
  }
  .game .main-tabs [data-slot="tabs-trigger"][data-state="active"] {
    border-radius:10px 10px 0 0 !important;
  }

  .game-tabs [data-slot="tabs-content"] {
    padding-bottom:24px !important;
    scroll-margin-bottom:150px !important;
  }

  .panel,
  .mobile-mission-detail,
  .recruit-card,
  .rival-hero-card {
    box-shadow:0 8px 18px rgba(0,0,0,.20) !important;
  }

  .item-grid,
  .recruit-grid {
    gap:10px !important;
  }
  .item-card,
  .recruit-card {
    padding:14px !important;
  }

  [data-slot="dialog-content"].live-battle-dialog {
    width:100vw !important;
    max-width:100vw !important;
    height:100dvh !important;
    max-height:100dvh !important;
    border-radius:0 !important;
    padding:10px 10px calc(12px + env(safe-area-inset-bottom)) !important;
  }
  .live-battle-log {
    max-height:20dvh !important;
  }
  .battle-clock-bar {
    padding:10px !important;
  }
  .battle-clock output {
    font-size:25px !important;
  }
  .combatants-grid {
    gap:6px !important;
  }
  .combatant {
    padding:7px !important;
  }
  .combatant-top strong {
    font-size:12px !important;
  }
  .combatant-life > span {
    font-size:10px !important;
  }

  .game [data-slot="button"],
  .game [data-slot="tabs-trigger"],
  .game [data-slot="toggle-group-item"] {
    touch-action:manipulation;
  }
}

@media (max-width:420px) {
  .brand-title { font-size:19px !important; }
  .workspace { padding-left:8px !important; padding-right:8px !important; }
  .mobile-subnav [data-slot="toggle-group-item"] {
    font-size:11px !important;
    padding-left:2px !important;
    padding-right:2px !important;
  }
  .mobile-hero {
    min-height:92px !important;
  }
  .mobile-hero-select .hero-portrait {
    width:50px !important;
    height:50px !important;
    flex-basis:50px !important;
  }
  .mobile-hero-info > strong {
    font-size:17px !important;
  }
}
'''
css.write_text(s, encoding="utf-8")

client = ROOT / "app" / "game-client.tsx"
s = client.read_text(encoding="utf-8")
s = s.replace("v1.2.1 · VISUAL 3D", "v1.2.2 · MOBILE FIRST")
client.write_text(s, encoding="utf-8")

pkg = ROOT / "package.json"
s = pkg.read_text(encoding="utf-8").replace('"version": "1.2.1"', '"version": "1.2.2"')
pkg.write_text(s, encoding="utf-8")

sw = ROOT / "public" / "sw.js"
s = sw.read_text(encoding="utf-8")
s = s.replace('const CACHE = "cronicas-da-guilda-standalone-v1-2-1";', 'const CACHE = "cronicas-da-guilda-standalone-v1-2-2";')
sw.write_text(s, encoding="utf-8")

changelog = ROOT / "docs" / "CHANGELOG_STANDALONE_V1_2.md"
s = changelog.read_text(encoding="utf-8")
if "## v1.2.2" not in s:
    s += """

## v1.2.2 — Mobile First
- subnavegação Missão/Equipe/Liga/Descanso agora fica visível abaixo do cabeçalho;
- reduz altura do cabeçalho e da barra inferior;
- compacta os cards de heróis sem diminuir os alvos de toque;
- botão Partir deixa de ser coberto pela navegação inferior;
- aumenta a área segura no fim de todas as telas;
- batalha passa a ocupar corretamente a viewport móvel;
- melhora espaçamento, tipografia e toque em telas de 420–760 px.
"""
changelog.write_text(s, encoding="utf-8")
