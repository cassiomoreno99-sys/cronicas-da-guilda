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
