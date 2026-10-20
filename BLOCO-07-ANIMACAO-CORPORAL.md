# Bloco 07 — Articulação corporal experimental

**Objetivo:** animar regiões de cabeça, tronco, braços e pernas de imagens aprovadas, **sem alterar o motor de combate**.

**Limitações reais:** não existem sprites separados com ossos/rigs no repositório. O experimento utiliza duplicações recortadas da mesma imagem, portanto não substitui desenhos originais de cada membro nem garante articulação perfeita. Somente artes humanoides de corpo inteiro e com transparência podem entrar. Retratos, animais, fundos opacos e modo leve do Android continuam usando o sprite estável original.

**Política de entrega:** cada etapa salva apenas na branch `laboratorio-combate-2d-fluido-20261020`, sem alteração da `main`, sem deploy de produção e sem mesclagem automática.

- 07A: especificação do rig, validação dos candidatos e verificação de fundo transparente.
- 07B: integração visual, poses para ataque, conjuração, dano e repouso.
- 07C: testes em navegador com fotos e vídeo, acessibilidade, modo leve e integridade do save.

Critério de aprovação: imagem de fallback íntegra; sem erro de console; nenhum novo cálculo de HP, turno, XP ou saldo; não recriar nós de imagem durante golpe; estabilidade 4×4 e no Android.
