# Bloco 13 — Interface profissional das habilidades (laboratório isolado)

Branch exclusiva: `laboratorio-combate-2d-fluido-20261020`. **Não alterar `main`, não fazer deploy nem substituir a produção.**

## 13A — identidade tática e disponibilidade
- 17 efeitos reais do motor classificados por família, ícone, cor e alvo.
- Recarga vem exclusivamente de `abilityCooldownRemaining`; `ability.cooldown` serve apenas para a proporção gráfica da recarga.
- Estados: pronta, em recarga, ordem preparada, processando, alvo indisponível.
- Supremas com recarga 9999 recebem o texto adequado; não inventar contador de usos.
- O catálogo e o salvamento continuam intactos.

## 13B — interface
- Barra rápida de cinco slots: ícones por efeito, número/atalho, anel de recarga, alvo legível, foco/ordem preparada.
- Grimório expandido: cartões com estado, descrição, previsão de alvo e botão de confirmação.
- Seleção de aliados para proteção/cura; sem alterar comportamento automático das demais habilidades.
- Acessibilidade: teclas, foco visível, 44px de área mínima, movimento reduzido e Android.

## 13C — auditoria
- Testes do fluxo real de seleção, recarga e ordem, Chromium Android/desktop, regressão em 6 telas, vídeo e screenshots.
- Distinguir resultado de testes de experiência estética final.
