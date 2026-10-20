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

## 11B — integração visual
- O próprio sprite carrega a aura de estado, sem alterar coordenadas ou recriar retratos.
- O alvo recebe `reactionFrames` em vez de recuo uniforme: crítico, cura, veneno, sangramento, escudo, resistência e queda ficam visualmente distintos.
- Eventos `status` finais de escudo, esquiva, atordoamento e efeito periódico geram movimento temporário mesmo quando não há agressor no log.
- O HUD original mantém os nomes e a duração; elementos novos são decorativos, sem leitura dupla por acessibilidade.
- Modo leve desliga partículas e halos secundários, movimento reduzido desativa flashes e rotações contínuas.

## 11C — testes de navegador e regressão
- Chromium Android (390x844) e desktop (1440x900) no combate real.
- Observação dos flashes e estados reais que surgirem no log, sem fabricar eventos ou alterar a campanha.
- Ensaio visual isolado de três estados (escudo, veneno, atordoamento) e reação crítica, para não depender do sorteio da missão inicial.
- Movimento reduzido e modo leve avaliados com CSS computado; salvamentos livres de efeitos de apresentação.
- Capturas `visual-report/bloco11-*.png`; a aprovação estética continua dependente de revisão humana.
