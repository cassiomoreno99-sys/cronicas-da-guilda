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
