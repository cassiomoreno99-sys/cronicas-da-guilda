# Bloco 15 — Otimização avançada Android (laboratório)

**Segurança:** salvar etapas em commits separados na branch `laboratorio-combate-2d-fluido-20261020`. Nunca alterar `main`, mesclar ou publicar.

## 15A — perfil de qualidade
- Inspecionar capacidade no cliente: largura, número real de combatentes, ponteiro, núcleos/indicativo de RAM quando disponíveis, economia de dados e preferência por movimento reduzido.
- Quatro perfis: **completo**, **equilibrado**, **econômico** e **estático**.
- Não assumir que FPS de CI representa o desempenho de um telefone físico. Os valores são limites de trabalho, não promessa de 60 FPS.
- Orçamento de partículas: 12/6/3/0; estados simultâneos: 4/2/1/1; impactos em área: 4/4/3/0.
- O motor de batalha e os nove quadros centrais do deslocamento não mudam.

## 15B — otimização no React/CSS
- Evitar montagem de nós de partículas além do orçamento no evento, em vez de apenas ocultá-los.
- Suspender animações contínuas, recortes de rig e sombra de câmera em modo econômico, mas manter imagens/posição e efeitos de impacto essenciais.
- Aplicar orçamento somente no componente visual. Nunca em dados da campanha.
- Oferecer controle reversível da qualidade nesta tela, sem persistência.

## 15C — verificações
- Testes puros de budget, integração, browser Android (320/390) e desktop, estresse DOM com até 8 unidades, regressão 6 telas, capturas e vídeos.
- Medir número de nós, animações ativas e tempo amostrado de frames em **Chromium emulando viewport**; documentar a limitação.
- Manter `main` e Vercel intactas. Revisão estética/telefone real ainda necessária.

## 15B — implementação efetiva
- A arena escolhe a qualidade por largura, combatentes ativos e sinais de hardware disponíveis, com atualização em orientação/movimento reduzido.
- Controle acessível **Visual**: alterna automático/completo/equilibrado/econômico; a preferência de movimento reduzido prevalece.
- `particleBudget` é aplicado na criação real de nós DOM de quatro camadas (arma, magia, suprema e efeito genérico); não apenas `display:none`.
- `areaBudget` limita marcas secundárias de área sem tocar a lista verdadeira de alvos do motor.
- Status e recortes do rig não são montados além do orçamento; a imagem original permanece sempre.
- No econômico, aura/bestiário/idle contínuos não animam, sombra e filtros pesados são desligados, mantendo os quadros oficiais de coreografia para não perder timing e colisão.
- Tremor de câmera apenas no modo completo; HUD, danos, cooldowns e objetos não alterados.

## 15C — stress Chromium e preservação da campanha
- Android emulado 320×750, Android emulado 390×844 e desktop 1440×900.
- Comparar **quantidade de recortes montados e animações CSS ativas** em uma arena real e ensaio separado de 8 sprites. Não manipular salvamento para simular 4×4.
- Alternar visual Auto → Completo → Equilibrado → Econômico → Auto; conferir ausência de alteração da formação, HUD e da arena aprovada.
- Movimento reduzido força perfil `static` mesmo após interação manual.
- Medir 90 intervalos de frames (`requestAnimationFrame`) em Chromium e documentar mediana/p95 sem extrapolar para FPS em celular real. Evidência em `visual-report/bloco15-medidas-chromium.json`.
- Capturas `bloco15-completo-*.png`, `bloco15-economico-*.png`, `bloco15-8personagens-*.png`.
- A qualidade estética e velocidade em telefones reais continuam pendentes para a auditoria final.
