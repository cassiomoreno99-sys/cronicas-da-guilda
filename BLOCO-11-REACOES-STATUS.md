# Bloco 11 — Reações aos danos e estados (somente laboratório)

**Política:** manter `main` e versão pública intactas. Cada etapa em commit próprio na branch `laboratorio-combate-2d-fluido-20261020`.

## 11A: lógica visual
- Reação a dano, crítico, queda, escudo que absorve dano, esquiva, atordoamento, veneno, sangramento, regeneração e cura.
- Extrair estados existentes (16 tipos) da lista real `fighter.statuses` e textos reais do `battle.log`.
- Nenhum estado extra, efeito de dano inventado ou alteração de `lib/game.ts`.
- Evitar repetição de animação antiga após carregar um save.

## 11B: integração
- Sobreposição leve de ícones e efeitos persistentes em sprites compatíveis.
- Transformação de reação independente do deslocamento de quem ataca. Preservar o nó original e HUD.
- Reações breves para estados sem lançador, como escudo absorvendo dano e esquiva.
- Sem flashes excessivos nem animações repetidas em movimento reduzido/Android leve.

## 11C: auditoria
- Casos unitários, teste React/CSS, Chromium Android e PC, verificação 4x4 e arquivos de capturas.
- Critério: nenhum cálculo de HP, turno, cooldown ou inventário alterado.
- Aprovação técnica não substitui revisão estética humana.
