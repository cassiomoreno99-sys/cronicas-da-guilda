# Bloco 14 — Bestiário visual, laboratório isolado

**Branch:** `laboratorio-combate-2d-fluido-20261020`. Sem merge na `main` nem publicação na Vercel.

## Inventário 14A
- As oito primeiras regiões já têm sprites PNG de corpo inteiro. Todos preservados.
- As regiões **Pântano de Morn, Império de Solkar, Abismo de Nhal e Coroa do Mundo** possuem 4 criaturas comuns e 1 chefe regional cada (20 lacunas ao todo).
- As imagens atuais desses 20 nomes são de criaturas aproximadas, não representações próprias.
- `bestiary-visual-plan.ts` exige correspondência EXATA com nomes canônicos, inclusive o nome distinto do chefe final e do inimigo comum Rei sem Nome.
- 14A: catálogo tipado, 20 nomes/arquivos distintos, classificação de movimento.
- 14B: 20 desenhos vetoriais originais (SVG), integração de src e identidade animada por tipo em sprites reais, mantendo fallback.
- 14C: verificar XML/SVG, carregamento das 20 imagens, PNG preexistentes, quatro regiões, Chrome Android e PC; revisão visual humana antes de produção.

**Natureza dos desenhos:** ilustrações vetoriais 2D experimentais, não arte pintada definitiva. A auditoria automática pode validar identidade e carregamento, mas a qualidade estética depende de aprovação explícita.

## 14B — sprites e movimento entregues
- 20 sprites vetoriais SVG de corpo inteiro, exclusivos das quatro últimas regiões (5 por região), sem dependências externas.
- O catálogo escolhe o arquivo por nome exato. PNGs antigos continuam preservados, com miniaturas clássicas como fallback em falha de carregamento.
- O rig humanoide não fragmenta os SVGs novos; animações decorativas leves são específicas para humanoide, monstro, limo, construto e entidade flutuante.
- Movimento reduzido e modo leve desligam animações e halos.
- A qualidade final de pintura/anatomia dos desenhos vetoriais precisa ser avaliada por uma pessoa antes da aprovação estética.
