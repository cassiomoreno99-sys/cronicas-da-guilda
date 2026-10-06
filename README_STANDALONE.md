# Crônicas da Guilda — Standalone v1.2

Esta edição é independente do ChatGPT para jogar. Não usa login do ChatGPT, ChatGPT Sites nem banco D1 da OpenAI. A campanha fica salva no próprio navegador por `localStorage` e pode ser protegida por backup JSON.

**Base de conteúdo:** Crônicas da Guilda v0.8.

## Novidades visuais da v1.2

- nova skin **Dark Fantasy Videogame**, com painéis, abas, botões e recursos em estilo de RPG;
- novo atlas leve de heróis em arte 3D estilizada;
- retratos 3D dos inimigos, incluindo lobo, bandido, esqueleto, cultista, aranha, troll, espectros, guardiões e dracos;
- batalha com enquadramento visual mais forte e retratos maiores;
- fundo temático da guilda otimizado em WebP;
- assets comprimidos para preservar o carregamento rápido no PC e no celular;
- nenhuma alteração no formato do save: campanhas da v1.1 continuam compatíveis.

## O que existe nesta versão

Além de todo o conteúdo da Standalone v1.0/v0.7, a v1.1 incorpora o conjunto de sistemas da v0.8:

- 6 árvores raciais, com 3 caminhos por raça e 18 habilidades raciais;
- 10 técnicas próprias de classe;
- 10 histórias pessoais de herói, cada uma em 3 etapas: treino, prova e desafio final;
- habilidade especial liberada ao concluir a história pessoal;
- viagens de 3, 5 ou 7 dias sem paralisar a sede da guilda;
- XP recebido a cada dia da viagem;
- bônus de recuperação para heróis abaixo do nível do grupo;
- decisões durante a viagem: **Acampamento**, **Exploração** e **Atalho**.

Continuam preservados:

- Combate 2.0;
- formação Frente/Retaguarda;
- liga com 100 guildas;
- evolução ramificada das 10 classes;
- retratos dos adversários;
- imagens dos objetos;
- equipamentos de ataque e defesa por raça;
- save local, exportação e importação de backup.

## Independência do ChatGPT

- nenhuma assinatura do ChatGPT é necessária para jogar;
- nenhum login é necessário;
- a campanha é salva automaticamente neste aparelho/navegador;
- o jogo pode ser hospedado em Cloudflare, GitHub Pages, Netlify, Vercel ou outra hospedagem estática;
- depois da primeira visita, o service worker guarda os arquivos usados e pode permitir reabrir o jogo sem conexão, desde que o navegador não tenha limpado os dados do site.

## Desenvolvimento

Requer Node.js 22+.

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

O site pronto fica em `dist/`.

## Publicar no Cloudflare

1. Crie uma conta gratuita em Cloudflare.
2. Instale as dependências e gere o build.
3. Faça login pelo Wrangler:

```bash
npx wrangler login
```

4. Publique:

```bash
npm run deploy
```

O Wrangler exibirá o endereço público `*.workers.dev`.

## Backup do save

No jogo, abra **Guilda** e use **Baixar backup**. Guarde o arquivo JSON fora do navegador. Para recuperar em outro aparelho, use **Importar backup**.

## Migração da campanha antiga

A edição Standalone não lê diretamente o banco do ChatGPT Sites. Use o processo descrito em `MIGRAR_CAMPANHA_ATUAL.md` para exportar a campanha antiga e importar o JSON aqui.

## Observação sobre a atualização v0.8

O pacote editável separado da v0.8 não estava disponível na Biblioteca. Por isso, os sistemas v0.8 foram portados para a Standalone a partir da versão publicada e do registro funcional do projeto. A lógica foi reimplementada sobre a base v0.7, preservando compatibilidade com saves e os sistemas anteriores.
