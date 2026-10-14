# Biblioteca de artes — Crônicas da Guilda

A estrutura está pronta para **84 retratos individuais** e **84 artes de corpo inteiro para combate 2D**. A identidade de cada herói usa **raça + classe + sexo**, sem reutilização de retratos de outra combinação.

## Como adicionar

Coloque **cada imagem em seu próprio arquivo** no diretório indicado; não envie colagens.

Retrato (retrato vertical 2:3 aprovado, recomendado 1024 × 1536 px):

`public/heroes/portraits/<raça>/<classe>-<sexo>.webp`

Arte de batalha (personagem inteiro, preferencialmente transparente, recomendado WebP):

`public/heroes/battle/<raça>/<classe>-<sexo>.webp`

Extensões aceitas: WebP, PNG, JPG, JPEG e AVIF; recomendamos WebP para velocidade. A arte de batalha deve ser realmente de corpo inteiro, **não uma ampliação/corte do retrato**. A arena mantém as sprites canônicas enquanto os novos arquivos de batalha não chegam. Personagens sem arte oficial não recebem retratos de outra raça/sexo/classe: recebem placeholder neutro identificado.

Raças (chaves exatas): `human`, `elf`, `dwarf`, `orc`, `beastkin`, `umbral`.
A categoria atual **Bestial/Dracônico = beastkin** no código. Para diferenciar sublinhagens bestiais e dracônicas no futuro será necessária uma expansão da classificação; não crie diretório `draconic` enquanto não existir a raça separada.
Classes: `warrior` (guerreiro), `paladin` (cavaleiro), `ranger` (arqueiro), `rogue` (assassino), `mage` (mago), `healer` (sacerdote), `bard` (pierrô).
Sexo: `male` (masculino), `female` (feminino).

Por exemplo:
- `public/heroes/portraits/dwarf/mage-female.webp`
- `public/heroes/portraits/beastkin/rogue-male.webp`
- `public/heroes/battle/dwarf/mage-female.webp`

O script `scripts/generate-hero-art-manifest.mjs` roda automaticamente antes de `npm run dev` e `npm run build`. Ele valida a estrutura, acusa arquivos repetidos e faz o jogo reconhecer as artes adicionadas. Não é necessário alterar código nem declarar imagens manualmente. A inclusão de arquivos no repositório GitHub e uma nova publicação do site continuam sendo necessárias; imagens geradas na conversa **não entram no jogo automaticamente**.

A geração/recrutamento nomeia novas personagens de acordo com raça e sexo. Salvos antigos preservam nome, nível, classe, raça, inventário e progresso; a identidade visual ausente é adicionada com segurança durante a leitura do save.
