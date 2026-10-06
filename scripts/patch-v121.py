from pathlib import Path
from PIL import Image, ImageEnhance, ImageDraw

ROOT = Path(".")
SHEET = ROOT / "public" / "hero-portraits-v12.webp"
OUT = ROOT / "public" / "hero-portraits-v121.webp"

sheet = Image.open(SHEET).convert("RGB")
sw, sh = sheet.width // 4, sheet.height // 4

def slot(i):
    x, y = (i % 4) * sw, (i // 4) * sh
    return sheet.crop((x, y, x + sw, y + sh)).resize((128, 128), Image.Resampling.LANCZOS).convert("RGBA")

def tint(im, rgb, alpha):
    overlay = Image.new("RGBA", im.size, rgb + (int(alpha * 255),))
    return Image.alpha_composite(im, overlay)

# Seis heróis iniciais corrigidos.
aric = ImageEnhance.Contrast(slot(0)).enhance(1.05)

lyra = tint(slot(1), (55, 18, 90), 0.34)
lyra = ImageEnhance.Contrast(lyra).enhance(1.12)
d = ImageDraw.Draw(lyra, "RGBA")
d.ellipse((45, 45, 50, 50), fill=(206, 145, 255, 220))
d.ellipse((79, 45, 84, 50), fill=(206, 145, 255, 220))

elen = tint(slot(13), (20, 80, 48), 0.12)
elen = ImageEnhance.Brightness(elen).enhance(1.06)

kael = ImageEnhance.Contrast(slot(3)).enhance(1.08)

sora = tint(slot(4), (80, 35, 10), 0.08)
d = ImageDraw.Draw(sora, "RGBA")
d.polygon([(26, 24), (36, 1), (46, 27)], fill=(36, 27, 28, 245), outline=(184, 119, 78, 240))
d.polygon([(82, 27), (94, 1), (104, 24)], fill=(36, 27, 28, 245), outline=(184, 119, 78, 240))
d.polygon([(31, 21), (36, 6), (42, 22)], fill=(126, 73, 78, 210))
d.polygon([(87, 22), (94, 6), (99, 21)], fill=(126, 73, 78, 210))
d.ellipse((44, 47, 49, 51), fill=(255, 193, 69, 220))
d.ellipse((79, 47, 84, 51), fill=(255, 193, 69, 220))
d.line((37, 63, 44, 60), fill=(214, 163, 91, 170), width=1)
d.line((84, 60, 91, 63), fill=(214, 163, 91, 170), width=1)

doran = tint(slot(8), (190, 130, 45), 0.09)
doran = ImageEnhance.Brightness(doran).enhance(1.03)

# Fallbacks por raça para heróis recrutados/rivais.
human = aric.copy()
elf = elen.copy()
dwarf = slot(2)
orc = slot(5)
beastkin = sora.copy()
umbral = kael.copy()

portraits = [aric, lyra, elen, kael, sora, doran, human, elf, dwarf, orc, beastkin, umbral]
atlas = Image.new("RGB", (512, 384), (10, 16, 24))
for i, im in enumerate(portraits):
    atlas.paste(im.convert("RGB"), ((i % 4) * 128, (i // 4) * 128))
atlas.save(OUT, "WEBP", quality=82, method=6)

# Mapeamento de retratos: primeiro por herói, depois por raça.
(ROOT / "lib" / "portraits.ts").write_text(
'''import type { HeroClass, HeroRace } from "./game";

const coreSlots: Record<string, number> = { aric: 0, lyra: 1, elen: 2, kael: 3, sora: 4, doran: 5 };
const raceSlots: Record<HeroRace, number> = { human: 6, elf: 7, dwarf: 8, orc: 9, beastkin: 10, umbral: 11 };
const classRaceFallback: Record<HeroClass, HeroRace> = {
  warrior: "human", mage: "umbral", healer: "elf", rogue: "umbral", ranger: "elf",
  paladin: "human", monk: "human", necromancer: "umbral", druid: "elf", bard: "human",
};

export function portraitPosition(name: string, id?: string, heroClass?: HeroClass, race?: HeroRace) {
  const resolvedRace = race || (heroClass ? classRaceFallback[heroClass] : "human");
  const slot = (id ? coreSlots[id] : undefined) ?? raceSlots[resolvedRace];
  const col = slot % 4, row = Math.floor(slot / 4);
  return (col / 3 * 100) + "% " + (row / 2 * 100) + "%";
}
''',
encoding="utf-8"
)

client = ROOT / "app" / "game-client.tsx"
s = client.read_text(encoding="utf-8")
s = s.replace(
    "type Campaign, type Hero, type HeroClass, type Tactic, type FormationLine } from \"@/lib/game\";",
    "type Campaign, type Hero, type HeroClass, type HeroRace, type Tactic, type FormationLine } from \"@/lib/game\";"
)
old = '''function Portrait({ hero, large = false }: { hero: { id?: string; name: string; class?: HeroClass }; large?: boolean }) {
  return <span role="img" aria-label={"Retrato de " + hero.name} className={"hero-portrait " + (large ? "portrait-large" : "")} style={{ backgroundPosition: portraitPosition(hero.name, hero.id, hero.class) }} />;
}'''
new = '''function Portrait({ hero, large = false }: { hero: { id?: string; name: string; class?: HeroClass; race?: HeroRace }; large?: boolean }) {
  const race = hero.class ? heroRace({ id: hero.id || hero.name, name: hero.name, class: hero.class, race: hero.race }) : undefined;
  return <span role="img" aria-label={"Retrato de " + hero.name} className={"hero-portrait " + (large ? "portrait-large" : "")} style={{ backgroundPosition: portraitPosition(hero.name, hero.id, hero.class, race) }} />;
}'''
if old not in s:
    raise RuntimeError("Bloco Portrait não encontrado")
s = s.replace(old, new)
s = s.replace("v1.2 · VISUAL 3D", "v1.2.1 · VISUAL 3D")
client.write_text(s, encoding="utf-8")

market = ROOT / "app" / "guild-market.tsx"
s = market.read_text(encoding="utf-8")
old = 'function Face({ hero }: { hero: RivalHero }) { return <span role="img" aria-label={"Retrato de " + hero.name} className="hero-portrait" style={{ backgroundPosition: portraitPosition(hero.name, hero.id, hero.class) }} />; }'
new = 'function Face({ hero }: { hero: RivalHero }) { return <span role="img" aria-label={"Retrato de " + hero.name} className="hero-portrait" style={{ backgroundPosition: portraitPosition(hero.name, hero.id, hero.class, heroRace(hero)) }} />; }'
if old not in s:
    raise RuntimeError("Bloco Face não encontrado")
market.write_text(s.replace(old, new), encoding="utf-8")

css = ROOT / "app" / "globals.css"
s = css.read_text(encoding="utf-8")
marker = "/* v1.2.1 — retratos coerentes + correção de sobreposição mobile */"
if marker in s:
    s = s.split(marker)[0].rstrip() + "\n"
s += '''
/* v1.2.1 — retratos coerentes + correção de sobreposição mobile */
.hero-portrait {
  background-image:url("/hero-portraits-v121.webp") !important;
  background-size:400% 300% !important;
  background-repeat:no-repeat;
  overflow:hidden;
}
@media (max-width:760px) {
  .workspace { padding-bottom:calc(118px + env(safe-area-inset-bottom)); }
  .workspace:has(.command-grid[data-mobile-view="mission"]) { padding-bottom:calc(190px + env(safe-area-inset-bottom)); }
  .workspace:has(.command-grid[data-mobile-view="team"]) { padding-bottom:calc(118px + env(safe-area-inset-bottom)); }
  .command-grid[data-mobile-view="team"] .launch-row {
    position:static;
    margin-top:16px;
    padding:12px 0 0;
    border-top:1px solid #536054;
    background:transparent;
    box-shadow:none;
  }
  .command-grid[data-mobile-view="team"] .launch-row > div { display:none; }
  .command-grid[data-mobile-view="team"] .launch-row .primary-launch { width:100%; }
  .command-grid[data-mobile-view="mission"] .launch-row {
    position:fixed;
    left:0; right:0;
    bottom:calc(72px + env(safe-area-inset-bottom));
  }
  .game-tabs [data-slot="tabs-content"] { scroll-margin-bottom:110px; }
}
'''
css.write_text(s, encoding="utf-8")

pkg = ROOT / "package.json"
s = pkg.read_text(encoding="utf-8").replace('"version": "1.2.0"', '"version": "1.2.1"')
pkg.write_text(s, encoding="utf-8")

sw = ROOT / "public" / "sw.js"
lines = sw.read_text(encoding="utf-8").splitlines()
lines[0] = 'const CACHE = "cronicas-da-guilda-standalone-v1-2-1";'
lines[1] = 'const CORE = ["/", "/guild-favicon.svg", "/manifest.webmanifest", "/hero-portraits-v121.webp", "/ui/guild-night.webp", "/ui/battle-night.webp", "/enemies/wolf.webp", "/enemies/bandit.webp", "/enemies/skeleton.webp"];'
sw.write_text("\n".join(lines) + "\n", encoding="utf-8")

changelog = ROOT / "docs" / "CHANGELOG_STANDALONE_V1_2.md"
existing = changelog.read_text(encoding="utf-8")
if "v1.2.1" not in existing:
    changelog.write_text(existing + """

## v1.2.1
- corrige a associação grotesca de retratos: heróis iniciais agora têm arte coerente com identidade/raça;
- heróis recrutados e rivais usam fallback visual por raça;
- corrige a barra de ação cobrindo a formação no mobile;
- mantém os retratos específicos de inimigos já existentes.
""", encoding="utf-8")
