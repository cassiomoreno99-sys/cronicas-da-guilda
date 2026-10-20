# Bloco 07 — Articulação corporal experimental

**Escopo:** somente a branch `laboratorio-combate-2d-fluido-20261020`. Proibido publicar, mesclar automaticamente ou editar `main`.

## Partes registradas
- **07A:** `lib/combat-body-rig.ts` e teste puro. Identifica seis regiões articuláveis (cabeça, tronco, dois braços, duas pernas), filtra retratos, feras e sprites incompatíveis, valida transparência.
- **07B:** `app/body-rig.tsx` e CSS da arena. Cada região usa a mesma imagem em cache com máscara de recorte, movimentando-se independentemente em repouso, golpe, conjuração e dano. O PNG/WebP original continua carregado e intacto.
- **07C:** teste automatizado Chromium nos tamanhos Android 390×844 e desktop 1440×900. Verifica poses, membros, alternativa integral, acessibilidade, modo leve e que simular poses não muda o save.

## Critérios e limitações
Esse método não cria desenhos de membros que não existem. Com algumas artes, articulações por recorte podem produzir bordas visíveis; por isso a liberação é experimental e restrita às artes com transparência verificável. Não aplicar o recorte a uma imagem com fundo opaco. A versão pública conserva todos os arquivos originais.

A incorporação futura depende de revisão visual humana das capturas e, idealmente, de sprites em camadas realmente desenhados para cada personagem. O script verifica animações e integridade, **não substitui aprovação estética**.

## Comandos do laboratório
```sh
node --experimental-strip-types scripts/test-combat-body-rig.ts
node scripts/test-combat-body-rig-ui.mjs
npm run build
# com npm run dev -- --host 127.0.0.1, Playwright instalado:
node scripts/test-body-rig-browser.mjs
```
