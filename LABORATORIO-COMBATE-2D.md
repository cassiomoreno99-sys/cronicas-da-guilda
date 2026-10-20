# Laboratório de evolução do combate 2D — desenvolvimento isolado

**Ramificação:** `laboratorio-combate-2d-fluido-20261020`

**Regra inegociável:** NÃO publicar em produção, NÃO mesclar em `main`, NÃO alterar o jogo em uso ou seus salvamentos sem aprovação do proprietário.

## Etapas salvas separadamente

1. **Coreografia:** módulo `lib/combat-choreography.ts` com aceleração, antecipação, pausa de impacto, recuo e retorno; sem modificar `lib/game.ts`.
2. **Efeitos:** `app/arena-vfx.tsx` + CSS, com origens de conjuração, trilha, impacto e partículas por classe e regras de acessibilidade.
3. **Habilidades:** atalhos, indicação de recarga, alvos reais e painel expandido ligado a `battle-ability`; não cria recursos ou regras imaginárias.
4. **Polimento e auditoria:** números legíveis, foco por teclado, desempenho Android e verificação de imagens na arena 4×4 em seis tamanhos de tela.

## Verificação

- `node --experimental-strip-types scripts/test-combat-choreography.ts`
- `node --experimental-strip-types scripts/test-combat-vfx.ts`
- `node --experimental-strip-types scripts/test-habilidades-laboratorio.ts`
- `npm run build` (inclui regressões de estado, combate, conteúdo e offline)
- `node scripts/test-excelencia-2d-browser.mjs` com servidor Vite em `http://127.0.0.1:5173` e Chromium

A workflow `.github/workflows/laboratorio-combate-2d.yml` roda exclusivamente nesta ramificação e guarda capturas como artefatos internos de CI.

## Antes de qualquer lançamento

Revisar visualmente as capturas, comparar no aparelho Android, verificar desempenho e ergonomia, aprovar explicitamente. Só então considerar integração. **Não promover a produção automaticamente.**
