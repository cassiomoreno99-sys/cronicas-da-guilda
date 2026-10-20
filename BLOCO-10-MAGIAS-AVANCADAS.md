# Bloco 10 — Magias avançadas, laboratório isolado

- **Branch**: `laboratorio-combate-2d-fluido-20261020`.
- **Jamais** modificar a `main`, conectar o laboratório à produção ou alterar o motor `lib/game.ts`.
- 10A — Plano de efeitos derivado das habilidades reais; tipos de magia, movimento, modo leve e múltiplos alvos.
- 10B — Efeitos por escola: conjuração, selos, projéteis, raio, fogo, gelo, sombras/drenagem, natureza, cura e proteção. Contato no mesmo ponto (54%) dos blocos 08/09.
- 10C — Validação no Chromium e nos testes existentes, vídeo Android/desktop, acessibilidade e salvamento.

**Atenção:** gelo será mostrado somente quando uma habilidade real possuir tema de frio, não como uma magia nova inventada no combate. Os efeitos avançados são CSS/React, sem imagens adicionais e sem custos de dano.

## 10B — efeitos e integração concluídos em código
- `AdvancedSpellFX`: um único compositor por evento real, exclusivo em relação aos VFX anteriores.
- Escolas com gestos próprios: fogo (explosão), tempestade (raios), gelo quando existe habilidade de frio (cristais), sombras (drenagem), cura e natureza (auras), proteção (cúpula), ressonância (ondas), arcano (projéteis).
- Selo duplo na origem, canalização, projétil opcional, partículas e explosão sincronizados ao instante de contato dos blocos anteriores.
- Magias de área usam apenas posições válidas de alvos reais registradas no combate, limitadas a quatro.
- Em modo leve/movimento reduzido, camadas extras desligadas. Nenhum novo feitiço nem mudança de `lib/game.ts`.

## 10C — auditoria
- Teste puro de todas as escolas e classes de movimento mágico.
- Teste de integração exige exclusividade entre camadas físicas, genéricas e novas.
- Chromium Android 390×844 e desktop 1440×900, comparando paleta, animação, modo reduzido e não persistência.
- Tenta observar conjuração real de uma habilidade presente na equipe; registra explicitamente se a campanha inicial não oferecer magia dentro de 17 turnos, sem simular dano.
- Capturas `magia10-*.png`, além do vídeo do laboratório. A aprovação estética é posterior e manual.
