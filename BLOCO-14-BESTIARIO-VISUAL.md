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
