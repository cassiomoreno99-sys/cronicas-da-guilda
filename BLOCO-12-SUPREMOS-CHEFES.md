# Bloco 12 — Habilidades supremas e chefes (isolado)

**Branch:** `laboratorio-combate-2d-fluido-20261020`. Nenhuma operação em `main`, nenhuma publicação ou merge automático.

## 12A — identidade dos eventos
- Usar os **14 grimórios CG-301 a CG-314 e 7 imperiais** já implementados em `lib/supreme-abilities.ts`.
- Supremos aparecem somente quando uma habilidade real `effect: supreme` cujo id pertence ao catálogo for acionada pelo log.
- Especiais de chefes aparecem somente na missão `kind: boss`, no evento real do chefe `enemy-0`: Vigia/guardião (onda), Matriarca/guardião (cura drenante), guardião (invasão da retaguarda).
- A barreira de alguns chefes não registra lançamento no log; manter apenas aura de escudo efetivamente existente (bloco 11), sem fabricar aviso de ação.
- A pressão visual opcional reflete **percentual de PV**, jamais uma nova fase da IA.
- Não editar `lib/game.ts`.

## 12B — efeitos no jogo
- Direção, formas e partículas diferentes entre supremos de lâmina, tempestade, luz, sombras, natureza, aço, astral e harmonia.
- Chefes: onda de choque, drenagem e ataque à retaguarda. Evitar duplicação com magia e ataques físicos.
- Captura apenas do que foi realmente registrado pelo motor, sem conceder habilidades.
- Preservar cenário, personagens, HUD e formação 4×4.

## 12C — provas
- Testes unitários de 21 livros e padrões reais de chefes, integração, Chromium Android/desktop e vídeo.
- Distinguir claramente teste de demonstração isolada de observação de evento real.
- Não confundir aprovação automatizada com validação estética definitiva.

## 12B — integração
- Cena exclusiva para o grimório supremo lançado ou ação de chefe confirmada pelo log; sem VFX normal simultâneo.
- Padrões por escola: ondas, esmagamento, luz, escudo, drenagem e partículas, sincronizados ao impacto.
- Halos em chefes `enemy-0` de missão `boss` derivados apenas de PV; não há fases adicionais de IA.
- Todas as artes originais e a arena 4×4 ficam intactas.

## 12C — auditoria automatizada
- Testes puros dos 21 grimórios, três ataques de chefes com log real e restrição a missões `boss`.
- Integração com efeitos anteriores exclusiva, regressão 4x4 em seis resoluções, build e Node.
- Chromium em Android 390x844 e desktop 1440x900: cenário real intacto; fixture VISUAL separada testa animações e estilos de supremo/chefe sem modificar campanha.
- A missão inicial não prova execução real de uma suprema ou missão de chefe. A automação registra essa limitação explicitamente.
- Movimento reduzido, Android leve, integridade do save, capturas de tela. Revisão estética e teste de campanha avançada continuam necessários antes de qualquer publicação.
