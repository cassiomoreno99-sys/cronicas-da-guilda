# Crônicas da Guilda — combate 2D oficial

## Especificação aprovada

- **Única interface de batalha da campanha:** `app/arena-2d.tsx`.
- Cenário fotorrealista aprovado: `public/battle/arena-aprovada.webp`.
- Bonecos 2D de corpo inteiro, animados individualmente: `public/battle/sprite-*.webp`.
- Animações de ação, golpe, impacto e magia vinculadas ao registro do motor real de combate.
- PV, habilidades, itens consumíveis, táticas, dano, vitórias, derrotas, saques e salvamentos continuam no motor `lib/game.ts`.
- Interfaces clássica, cinematográfica e demonstração antiga retiradas.
- Monstros sem arte individual própria podem utilizar **provisoriamente** bonecos aprovados; substituir somente quando o usuário pedir melhorias.
- Qualquer alteração no visual aprovado requer autorização do usuário.

## Testes

- `npm run build` — testes do jogo, TypeScript, build e offline.
- `scripts/test-single-battle-integration.ts` — preservação dos resultados e estado da campanha.
- `scripts/test-single-battle-ui.mjs` — verificação real em Chromium desktop e celular.

Referência de aprovação: arena realista do laboratório 2D.
