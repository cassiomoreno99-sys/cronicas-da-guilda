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
