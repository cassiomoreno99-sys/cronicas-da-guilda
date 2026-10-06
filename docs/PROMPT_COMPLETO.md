Quero continuar o projeto **Crônicas da Guilda**, um simulador de gerenciamento de uma guilda de aventureiros de RPG inspirado na dinâmica de Brasfoot. Anexei o ZIP com o código completo e editável. Use esse projeto como base e preserve suas funcionalidades e a campanha existente.

**Primeiro passo**
Extraia o ZIP e leia `LEIA_ME_TRANSFERENCIA.md`, este prompt e os arquivos principais. Confira o que realmente está implementado antes de alterar. Se o projeto original estiver disponível pelo Sites, recupere a versão atual dele e compare com o pacote. Informe brevemente que carregou o projeto e aguarde minha próxima melhoria. Quando eu pedir uma mudança, implemente, teste e publique no mesmo jogo, se houver acesso. Não afirme que algo foi publicado quando só houve uma edição local.

**Identificação e tecnologia**
- Nome: Crônicas da Guilda. Base de transferência: v0.7.
- Jogo: https://cronicas-da-guilda-moreno.cassiomoreno99.chatgpt.site
- Sites project_id: `appgprj_6ac3f2c205448191a1492929172d0ffd`, também presente em `.openai/hosting.json`.
- Este pacote v0.7 foi editado/testado localmente sobre a publicação v0.5. Não presuma que a v0.7 já está online; publique no mesmo Site quando houver acesso.
- Aplicativo web em português brasileiro, jogável no navegador do celular e no computador. Não há APK, aplicativo nativo ou funcionamento offline implementados.
- React 19, TypeScript, Vinext/Vite, Tailwind 4, componentes Shadcn/Radix, Cloudflare Worker e banco D1/SQLite. Use os arquivos de dependências e lockfiles fornecidos.
- Campanhas salvas no servidor por usuário autenticado. A API usa uma revisão para evitar sobrescrever mudanças feitas em outra aba. Preserve autenticação, isolamento por usuário, validações no servidor e tratamento do conflito 409.
- O ZIP contém código, imagens, configurações, SQL e testes. Não contém a campanha que está no banco online nem credenciais. Para preservar meu progresso, mantenha o mesmo Site e seu banco. Criar outro Site não transfere automaticamente a campanha.

**Conceito e campanha**
Sou o administrador da guilda: escolho a equipe, missões, táticas, treinamentos, equipamentos, contratações e decisões do conselho. O foco é administração e simulação acompanhada ao vivo.
- Temporadas contínuas de 28 dias, sem um limite fixo de temporadas.
- Progressão de dificuldade, ouro, renome, classificação, salários semanais, manutenção, descanso, energia, experiência e ferimentos.
- Quatro regiões: Vale de Valen, Terras de Brumavale, Ruínas de Ashen e Fronteira dos Dragões.
- Chefes no fim da temporada, com habilidades diferentes, recompensas e desbloqueio de regiões.
- Crônicas registram acontecimentos; o tesouro registra entradas e despesas. Evite ouro excessivo e mantenha a venda de saques como parte importante da economia.

**Heróis e evolução**
- Retratos visuais dos heróis já incluídos em `public/hero-portraits.png`, com seleção pelo código de retratos.
- Equipe de quatro aventureiros distintos; limite de 12 heróis na guilda.
- Atributos, nível, experiência, energia, salário, valor, características, ferimentos e equipamentos.
- Dez classes: Guerreiro, Mago, Curandeira, Ladino, Arqueira, Paladino, Monge, Necromante, Druida e Bardo. Cada classe tem função e efeitos reais no combate.
- Cada classe tem uma árvore de evolução com três caminhos principais: Poder, Cura e Defesa. No nível 4 o caminho é escolhido; no nível 7 ele se divide em duas ramificações exclusivas; no nível 10 a ramificação vira Ultimate. As escolhas são permanentes e os bônus/recursos afetam o jogo.
- Treinamento individual para desenvolver um herói de nível baixo e alcançar os veteranos. Custa 90 ouro, consome 15 energia e avança um dia. Dá 90 XP mais 35 XP por nível de diferença em relação à média da guilda, até quatro níveis de diferença.
- Treinamento da equipe: 200 ouro, 65 XP para cada escalado, consumo de energia e avanço de um dia.
- Trocar a composição deve ser viável recrutando e treinando novas classes. Não diga que há mudança direta da classe de um herói: isso não foi implementado.

**Missões, renome e combate**
- Até cinco missões no quadro. As três primeiras são acessíveis; a quarta exige 120 de renome e Mapa Secreto; a quinta exige 260 de renome e Chave Antiga. Os itens de acesso permanecem no baú.
- Missões mais fortes têm maiores recompensas e riscos. Dificuldade cresce conforme a campanha.
- Objetivos distintos: escolta, defesa de aldeia, exploração de masmorra e caça a monstros. Velocidade favorece escoltas, resistência protege estruturas, ladinos ajudam contra armadilhas, e a composição influencia o resultado.
- Derrotas e certas decisões reduzem o renome; vitórias e ajuda às aldeias podem aumentá-lo.
- Simulação ao vivo com tempo passando, turnos, barras de vida, dano, cura, quedas e narração gradual. Não deve terminar instantaneamente por padrão.
- Formação de quatro heróis em Frente/Retaguarda: a frente recebe bônus defensivo e concentra ataques; a retaguarda recebe bônus ofensivo/velocidade, mas inimigos podem flanquear.
- Cada uma das dez classes possui habilidade ativa básica. A ramificação do nível 7 libera uma segunda habilidade. O combate possui sangramento, veneno, atordoamento, escudo, regeneração, provocação, inspiração e vulnerabilidade, além de recargas e alvos.
- Pausar, retomar e velocidades 1×, 2× e 4×.
- Táticas Equilibrada, Ofensiva e Defensiva, com diferenças reais em dano, proteção e energia. Mudanças durante a batalha valem no próximo turno.
- Poções curam 70 PV de um herói vivo, no próximo turno, com limite de duas por combate.
- Retirada com consequência no renome e opção de concluir automaticamente.
- Combate e resultado são persistidos. Reabrir deve permitir retomar uma batalha ativa. A recompensa só pode ser concedida uma vez.

**Eventos e decisões**
Existe um conselho com eventos e escolhas que têm efeitos reais:
- Aldeia pede ajuda: cobrar rende ouro; ajudar gratuitamente aumenta renome; ignorar tem consequência.
- Herói recebe proposta de outra guilda: negociar sua permanência, aceitar sua saída ou recusar a proposta.
- Cartógrafo oferece acesso ao Mapa Secreto.
- Carga encontrada na estrada: devolver, vender ou ajudar a comunidade.
Preserve custos, benefícios, restrições e registro das decisões. Um aventureiro que sai deve passar a pertencer a uma guilda rival de verdade.

**Baú, equipamentos e comércio**
- Um único baú compartilhado.
- Saques de missões: armas, armaduras, acessórios, consumíveis, itens de acesso e tesouros.
- Raridades de comum a lendária.
- Equipar e desequipar heróis com controle de propriedade: o mesmo item não pode estar em dois heróis simultaneamente.
- Loja para comprar e vender. Tesouros e equipamentos vendidos ajudam a financiar a guilda.
- Itens semelhantes agrupados; filtros e paginação no celular. Aviso antes de vender itens importantes de acesso.

**Liga com 100 guildas e recrutamento de rivais**
A v0.7 amplia a liga criada na v0.5:
- Liga com 100 participantes ao todo: minha guilda e 99 guildas simuladas pelo jogo. Não é multiplayer.
- Rivais têm nomes, força, pontos, vitórias e elencos persistentes. Cada um começa com cinco aventureiros: 495 heróis rivais iniciais.
- Classificação e força dos rivais consideram os aventureiros que eles realmente possuem.
- Liga paginada, com atalhos Líderes, Minha guilda e Prêmios. Clicar em uma rival abre seu elenco.
- Há um confronto direto de liga por dia, calendário de adversários e retrospecto de vitórias/empates/derrotas.
- A competição tem três divisões: Liga Bronze, Liga Prata e Liga Ouro. Top 10 sobe de divisão quando possível; últimos 10 caem quando possível. As divisões superiores pagam prêmios maiores e têm rivais mais fortes.
- Copa das Guildas em mata-mata nos dias 7, 14, 21 e 28, com premiações próprias.
- Rivalidade cresce ao contratar aventureiros de outras guildas. A partir de 30/100 o confronto vira clássico; tensões altas podem gerar contra-ataque da rival tentando levar um dos seus heróis.
- Prêmios por posição: 1º 800 ouro; 2º 550; 3º 380; 4º–10º 300; 11º–25º 240; 26º–50º 180; 51º–75º 140; 76º–100º 100.
- Taverna com aventureiros sem contrato e mercado de guildas rivais, busca por nome e detalhes de nível, classe, talentos, atributos e lealdade.
- Três formas de contratar: negociar transferência garantida; oferecer contrato melhor com chance de recusa; aliciar em segredo com menor preço e perda de renome.
- Mostrar preço, chance, salário, renome necessário, taxa de recusa e risco antes da confirmação.
- Transferência cobra o preço integral e aumenta o salário em 2; contrato melhor custa 80% do preço e aumenta o salário em 5; aliciamento custa 60% e aumenta o salário em 3.
- Oferta recusada cobra apenas 45 ouro; aliciamento recusado cobra 60. Aliciamento perde 15 de renome no sucesso ou 8 na recusa, sem deixar renome negativo.
- Até três propostas por semana e uma proposta por aventureiro na semana. Não avançam o dia; são bloqueadas durante combate ativo.
- Ouro, renome e capacidade da guilda são validados no servidor.
- Na contratação, o mesmo aventureiro sai do elenco rival e entra no meu, preservando identidade, classe, nível, atributos e evolução. A rival recebe um novato; sua força muda.
- Heróis transferidos para rivais podem ser contratados de volta.
- Migração de campanhas antigas adiciona as novas guildas e campos sem apagar meus heróis, ouro, pontuação, inventário ou histórico.

**Interface para celular**
- Tema medieval em azul escuro e dourado, textos legíveis e botões confortáveis para toque.
- Navegação inferior fixa: Missões, Heróis, Baú, Taverna e Guilda.
- Subabas e painéis compactos para evitar descer a página inteira para chegar às informações.
- Detalhes de herói em Atributos, Talentos e Equipamento; gestão da guilda em painéis.
- Testar especialmente larguras de 360, 390 e 430 px, além do computador.
- Foi corrigido o problema da imagem que enviei: a janela de batalha aparecia cortada, deslocada para o lado e com controles fora da tela. No celular, o diálogo de combate deve ocupar a tela inteira, sem transformação de centralização nem animação que o desloque. Cabeçalho e ações precisam continuar acessíveis, com rolagem no conteúdo.
- `docs/mobile-battle.jpg` registra a verificação da correção; `docs/mobile-interface.jpg` registra a interface anterior.

**Arquivos e validação**
- `lib/game.ts`: regras, ações, combate, eventos, inventário, treinamento, liga e migração.
- `lib/battle-playback.ts`: relógio e apresentação gradual do combate.
- `lib/portraits.ts`: retratos.
- `app/game-client.tsx`: interface principal e comunicação com a API.
- `app/game-dynamics.tsx`: eventos, baú, equipamentos, treinamento e especializações.
- `app/guild-market.tsx`: classificação, prêmios e recrutamento de rivais.
- `app/globals.css`: estilos e adaptação ao celular.
- `app/api/game/route.ts` e `db/campaign.ts`: autenticação, armazenamento e concorrência.
- `drizzle/`: SQL; `.openai/hosting.json`: vínculo com o Site existente.
- Testes: `node --experimental-strip-types scripts/check-game.mjs` e `node --experimental-strip-types scripts/check-league.mjs`.
- Tipagem: `./node_modules/.bin/tsc --noEmit --incremental false`. Build independente: `pnpm build`; usando Sites, siga o fluxo do plugin.
- Testes anteriores cobriram combate, salvamento, objetivos, itens, três temporadas, dez classes, 30 caminhos principais, 60 ramificações de nível 7, 100 guildas, migração, pagamentos e negociações. Isso não comprova que todo o equilíbrio está perfeito; novas melhorias devem ser verificadas com evidência.
- Não deixar páginas temporárias de teste, autenticação simulada ou campanhas de demonstração no ambiente publicado.
- Preserve o código existente, os retratos, o banco, os acessos e o progresso. Explique brevemente o que mudou, como verificou e o que ficou pendente.


## Atualização visual e racial v0.7

- Os inimigos exibem retratos próprios no combate, substituindo o ícone genérico de caveira.
- Todos os itens definidos em `ITEMS` possuem imagem local em `public/items/`.
- Raças oficiais: Humano, Elfo, Anão, Orc, Bestial e Sombrio.
- Heróis e rivais recebem raça de forma determinística e campanhas antigas são migradas sem apagar progresso.
- Cada raça tem uma arma e uma armadura exclusivas. O servidor bloqueia equipar item racial em raça incompatível.
- A loja semanal gira equipamentos raciais e vitórias podem gerar saque compatível com uma das raças da equipe escalada.
- Ao publicar, preserve o `project_id` atual e o banco/campanhas do Site. Não crie um novo Site.
