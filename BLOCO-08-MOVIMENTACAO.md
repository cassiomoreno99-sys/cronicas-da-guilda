# Bloco 08 — Movimentação fluida (laboratório, sem publicação)

**Branch exclusiva:** `laboratorio-combate-2d-fluido-20261020`. Não editar `main`, não fazer deploy nem promover antes da aprovação visual.

## 08A — motor visual de trajetória
- Aproximação calculada com tamanho REAL do alvo, para não atravessar o personagem.
- Partida com antecipação, corrida acelerada, salto/elevação, freada, contato com pausa e recuo à formação.
- Formas diferentes: investida, salto de fera, esquiva do ladino, preparação de arqueiro/mago.
- Obstáculos do time ou de inimigos restringem avanço; nenhuma mudança de formação é persistida.
- Sombra móvel acompanha o chão e não o salto vertical.
- Testes em 6 larguras, dois sentidos, 9 escolas, colisões e retorno.

## Próximas etapas
08B: integração efetuada com o log do motor real, movimentação WAAPI na sprite e sombra independente, sem modificar posições ou HUD; sincronizada com as poses do rig 07. 08C: testes reais de navegador, 4×4, Android, acessibilidade, vídeo e salvamentos.

## 08C — auditoria da arena real
- Verifica diretamente o movimento WAAPI do sprite e de sua sombra durante uma ação de combate.
- Compara contato e pausa no mesmo ponto, retorno à formação, HUD estável, sprites carregados e IDs não duplicados.
- Verifica modo leve, movimento reduzido e ausência da coreografia no arquivo de salvamento.
- Produz `visual-report/rig08-movimento-390.png` e `rig08-movimento-1440.png`, além dos vídeos do laboratório.
- Testa com Chromium em Android 390×844 e desktop 1440×900, mantendo auditoria 4×4 nas seis resoluções anteriores.

A prova automatizada **não substitui** avaliação de fluidez estética no aparelho real. O jogo em produção não é alterado.
