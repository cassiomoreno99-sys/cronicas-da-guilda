import type {MissionKind} from "./game.ts";

/** Contratos autorais das regiões 2–12.
 * Cada capítulo tem seis missões e um confronto regional próprios.
 * Os nomes de inimigos pertencem ao elenco existente de WORLD_REGIONS.
 * Os quatro sistemas de objetivo são os do motor real: masmorra, caça,
 * escolta e defesa — não há objetivos ou recompensas fictícios. */
export type RegionalContract={
  title:string;description:string;kind:MissionKind;enemy:string;
  specialty:string;flavor:string;count:3|4;
};
export type RegionalChapter={
  contracts:readonly RegionalContract[];
  guardian:{title:string;description:string;flavor:string};
};
const quest=(title:string,description:string,kind:MissionKind,enemy:string,specialty:string,flavor:string,count:3|4=4):RegionalContract=>({
  title,description,kind,enemy,specialty,flavor,count
});

/** Chaves indexadas pelo índice do mapa. Região 0 (Vale de Valen) é intocada. */
export const REGIONAL_CHAPTERS:Record<number,RegionalChapter>={
  1:{
    contracts:[
      quest("O Rastro dos Desaparecidos","Rastreie os batedores perdidos antes que os emboscadores desapareçam na névoa.", "hunt","Emboscador","ranger","Arqueiros rastreiam alvos velozes; a caçada tem limite de rodadas.",3),
      quest("Ninhos de Seda Negra","Atravesse as teias na mata fechada e elimine a colônia de aranhas ancestrais.", "dungeon","Aranha ancestral","rogue","Assassinos abrem caminho entre as teias e surpreendem os aracnídeos.",4),
      quest("A Ponte dos Peregrinos","Escolte sobreviventes pela ponte coberta de bruma enquanto panteras bloqueiam o caminho.", "escort","Pantera das brumas","paladin","Cavaleiros resistem aos ataques; mantenha a caravana protegida.",3),
      quest("A Última Clareira","Defenda a barricada dos guardas florestais contra emboscadores que atacam de todos os lados.", "defense","Emboscador","warrior","Guerreiros seguram a linha de frente enquanto a barricada resiste.",4),
      quest("O Coração Enredado","Desça à gruta das raízes e vença as aranhas que guardam a fonte da névoa.", "dungeon","Aranha ancestral","mage","Magos são úteis em corredores tomados por criaturas da floresta.",4),
      quest("A Garganta do Troll","Cace o troll que dominou o desfiladeiro antes que a trilha seja perdida.", "hunt","Troll","ranger","A caçada é limitada no tempo; explore o controle e a precisão dos arqueiros.",4)
    ],
    guardian:{title:"O Vigia da Névoa",description:"Enfrente o troll ancestral que mantém Brumavale mergulhada em silêncio e medo.",flavor:"Chefe de Brumavale: resistência alta e pressão constante na linha de frente."}
  },
  2:{
    contracts:[
      quest("Cinzas sob o Campanário","Entre no campanário destruído e elimine os cultistas que ocupam as ruínas.", "dungeon","Cultista","mage","Feitiços interrompem a concentração dos cultistas entre as ruínas.",3),
      quest("Vozes na Torre Partida","Persiga os espectros que roubam a memória dos vigias da antiga Ashen.", "hunt","Espectro","ranger","Caçadores velozes não podem permitir que os espectros escapem.",3),
      quest("A Marcha dos Refugiados","Escolte um grupo de refugiados pela estrada das cinzas diante de guardiões despertos.", "escort","Guardião antigo","paladin","Proteja os refugiados; a sobrevivência da caravana é a prioridade.",4),
      quest("O Portão do Juramento","Segure o portão da última fortaleza de Ashen contra sentinelas de pedra.", "defense","Guardião antigo","warrior","Guarneça a barricada com guerreiros e suporte de cura.",4),
      quest("As Criptas Sem Nome","Explore as sepulturas abertas e expulse os espectros presos ao subterrâneo.", "dungeon","Espectro","healer","Sacerdotes ajudam a equipe a atravessar o assédio espiritual.",4),
      quest("O Último Cavaleiro de Ashen","Abra caminho pelo salão do trono e desafie os cavaleiros espectrais.", "dungeon","Cavaleiro espectral","paladin","Cavaleiros sustentam o confronto contra os guardiões mortos.",4)
    ],
    guardian:{title:"O Cavaleiro das Cinzas",description:"Derrote o comandante espectral que comanda a ruína e impede a reconstrução de Ashen.",flavor:"Chefe de Ashen: inimigos incorpóreos pressionam mesmo os melhores defensores."}
  },
  3:{
    contracts:[
      quest("Marcas nas Trilhas de Lava","Cace os dracos que atacam os caminhos de pedra entre rios de fogo.", "hunt","Draco selvagem","ranger","A caça tem limite de tempo; prefira mobilidade e precisão.",3),
      quest("O Comboio das Escamas","Escolte os ferreiros das montanhas sob ataques de salteadores dracônicos.", "escort","Salteador dracônico","warrior","Mantenha uma vanguarda forte protegendo o comboio.",3),
      quest("A Forja sob Cerco","Segure a barricada da forja contra guerreiros dracos que avançam pelo vale.", "defense","Guerreiro draco","paladin","A defesa exige resistência prolongada junto à barricada.",4),
      quest("Túneis do Basalto Negro","Entre nos túneis vulcânicos e elimine os sentinelas de obsidiana.", "dungeon","Guardião de obsidiana","rogue","Explore velocidade e cobertura nas passagens estreitas.",4),
      quest("Asas sobre o Desfiladeiro","Rastreie um bando de dracos até o ninho nas fendas da montanha.", "hunt","Draco selvagem","ranger","Caçadores são valiosos contra alvos que escapam rapidamente.",4),
      quest("O Portão de Obsidiana","Penetre na cidadela negra e abra caminho pelo destacamento dos guardiões.", "dungeon","Guardião de obsidiana","mage","Magos e cavaleiros ajudam contra a armadura dos guardiões.",4)
    ],
    guardian:{title:"O Coração da Fortaleza Obsidiana",description:"Derrube o guardião final da fortaleza para libertar a passagem das montanhas dracônicas.",flavor:"Chefe da Fronteira: combate de elite contra uma sentinela fortificada."}
  },
  4:{
    contracts:[
      quest("Sombras ao Meio-Dia","Localize e cace escorpiões gigantes que surgem sob as dunas escaldantes.", "hunt","Escorpião gigante","ranger","A caçada exige velocidade antes que as criaturas se enterrem.",3),
      quest("A Caravana do Último Poço","Escolte um comboio de água cercado por saqueadores do deserto.", "escort","Saqueador do deserto","paladin","Proteger a caravana evita que o último suprimento se perca.",3),
      quest("A Tumba Sob a Areia","Entre no mausoléu soterrado e derrote as múmias reais que o protegem.", "dungeon","Múmia real","healer","Sacerdotes são úteis contra as ameaças da antiga tumba.",4),
      quest("O Cerco do Oásis","Segure as defesas do oásis enquanto saqueadores investem contra os portões.", "defense","Saqueador do deserto","warrior","Guerreiros devem preservar a barricada contra a pressão dos invasores.",4),
      quest("A Voz da Ampulheta","Explore o santuário enterrado onde um djinn corrompido escraviza antigas almas.", "dungeon","Djinn corrompido","mage","Um grupo com poder mágico enfrenta melhor as forças da areia.",4),
      quest("O Julgamento das Dunas","Cace um djinn errante antes que a tempestade apague seu rastro.", "hunt","Djinn corrompido","ranger","O limite de rodadas exige uma equipe de ação rápida.",4)
    ],
    guardian:{title:"O Trono de Areia Eterna",description:"Enfrente o soberano corrompido das dunas e encerre a maldição do deserto de Sahir.",flavor:"Chefe de Sahir: um djinn poderoso guarda a passagem do deserto."}
  },
  5:{
    contracts:[
      quest("Corpos na Maré Baixa","Explore os cais abandonados e vença os afogados que emergem das águas escuras.", "dungeon","Afogado","healer","Sacerdotes auxiliam os feridos durante o avanço pelos cais.",3),
      quest("Vento de Saque","Persiga piratas que atacam as embarcações antes que alcancem o mar aberto.", "hunt","Pirata","rogue","Assassinos e arqueiros aproveitam a curta janela de perseguição.",3),
      quest("Travessia dos Faróis","Escolte os navegantes da costa apesar da ameaça das serpentes marinhas.", "escort","Serpente marinha","paladin","Mantenha a escolta viva enquanto as feras atacam a passagem.",4),
      quest("A Muralha contra a Ressaca","Proteja a barricada do porto diante de afogados vindos da maré.", "defense","Afogado","warrior","Resistir às ondas de inimigos protege as defesas do porto.",4),
      quest("Os Sinos Submersos","Explore as ruínas do forte alagado dominado por corsários espectrais.", "dungeon","Corsário espectral","mage","Magos são valiosos no combate às aparições do forte.",4),
      quest("A Bandeira do Navio Fantasma","Cace os corsários fantasmas antes que a frota desapareça nas brumas.", "hunt","Corsário espectral","ranger","A caçada termina em poucas rodadas; concentre dano.",4)
    ],
    guardian:{title:"O Almirante Sem Porto",description:"Vença o corsário espectral que comanda a frota amaldiçoada de Namar.",flavor:"Chefe da Costa: o comandante fantasma mantém os portos sob bloqueio."}
  },
  6:{
    contracts:[
      quest("Raízes que Sangram","Explore os troncos ocos e elimine entes corrompidos próximos ao santuário.", "dungeon","Ent corrompido","mage","Magia auxilia a equipe contra a defesa das árvores antigas.",3),
      quest("A Trilha do Caçador Perdido","Rastreie o caçador feérico que embosca os vigias da floresta.", "hunt","Caçador feérico","ranger","Os arqueiros conhecem as trilhas e aproveitam a perseguição curta.",3),
      quest("O Cortejo das Sementes","Escolte os guardiões das sementes durante a migração de feras lunares.", "escort","Fera lunar","healer","Manter o grupo vivo é essencial para concluir a escolta.",4),
      quest("O Círculo Lunar","Defenda a barricada do círculo élfico dos ataques das feras da lua.", "defense","Fera lunar","paladin","A defesa prolongada exige proteção e cura.",4),
      quest("O Juramento das Árvores","Penetre no círculo ancestral e enfrente espíritos que perderam a memória.", "dungeon","Espírito selvagem","mage","Habilidades arcanas ajudam na batalha contra espíritos.",4),
      quest("Sangue da Lua Nova","Cace a fera lunar que rompeu o pacto dos clãs do bosque.", "hunt","Fera lunar","ranger","Velocidade decide a perseguição sob a lua nova.",4)
    ],
    guardian:{title:"O Último Guardião Verde",description:"Enfrente o espírito primordial que se voltou contra os protetores de Elarin.",flavor:"Chefe de Elarin: batalha contra o antigo espírito protetor do bosque."}
  },
  7:{
    contracts:[
      quest("Ecos nas Minas Profundas","Explore galerias abandonadas tomadas por rebeldes das minas.", "dungeon","Rebelde das minas","rogue","Assassinos aproveitam as galerias e os túneis estreitos.",3),
      quest("Garras na Neve Eterna","Cace os yetis que bloquearam o acesso aos refúgios da montanha.", "hunt","Yeti","ranger","A perseguição na neve pede uma equipe rápida.",3),
      quest("Caravana de Ferronúcleo","Escolte os carregamentos da forja anã atacados por rebeldes.", "escort","Rebelde das minas","warrior","A guarda pesada deve proteger o carregamento até o destino.",4),
      quest("O Bastião da Geada","Resista junto à barricada contra golems que avançam sobre a fortaleza.", "defense","Golem de pedra","paladin","Cavaleiros e curandeiros ajudam a segurar o forte.",4),
      quest("A Câmara das Sete Runas","Desça à câmara ancestral e derrote os golems que guardam suas portas.", "dungeon","Golem de pedra","mage","Magos contribuem contra as criaturas de pedra.",4),
      quest("Asas de Gelo","Rastreie um dragão de gelo pelas trilhas do pico antes da nevasca.", "hunt","Dragão de gelo","ranger","A caçada tem tempo limitado; use ataques precisos.",4)
    ],
    guardian:{title:"O Trono do Gelo Partido",description:"Derrube o dragão de gelo que domina as fortalezas de Kharum.",flavor:"Chefe de Kharum: o dragão é a ameaça final da cordilheira."}
  },
  8:{
    contracts:[
      quest("Marcas sob as Águas Negras","Cace os carniçais que espreitam as margens do pântano.", "hunt","Carniçal","ranger","A caça exige velocidade para impedir novas emboscadas.",3),
      quest("O Caldeirão Envenenado","Explore a cabana amaldiçoada e derrote as bruxas do pântano.", "dungeon","Bruxa do pântano","mage","Magos podem enfrentar os feitiços das bruxas.",3),
      quest("A Travessia dos Barqueiros","Escolte barqueiros pela água tomada por limos ancestrais.", "escort","Limo ancestral","paladin","Mantenha o comboio protegido durante a travessia.",4),
      quest("O Último Dique","Resista atrás da barricada ao ataque de hidras jovens vindas do brejo.", "defense","Hidra jovem","warrior","Guerreiros precisam sustentar a linha defensiva.",4),
      quest("O Ninho das Hidras","Desça às cavernas alagadas e vença as hidras que defendem a desova.", "dungeon","Hidra jovem","healer","O apoio de cura importa contra inimigos resistentes.",4),
      quest("O Canto da Bruxa Negra","Persiga uma bruxa que conduz os carniçais através da névoa venenosa.", "hunt","Bruxa do pântano","ranger","Ataques rápidos são importantes antes que a presa escape.",4)
    ],
    guardian:{title:"A Fome do Lodo Ancestral",description:"Destrua o limo primordial que consome as raízes e os caminhos do pântano.",flavor:"Chefe de Morn: o ancestral do lodo ameaça engolir toda a região."}
  },
  9:{
    contracts:[
      quest("Deserção no Distrito de Ferro","Persiga legionários rebeldes pelas ruas antes que cheguem aos quartéis.", "hunt","Legionário","ranger","Perseguição urbana exige controle e precisão.",3),
      quest("Mensageiros do Cerco","Escolte emissários através de postos militares hostis.", "escort","Legionário","paladin","A caravana de emissários deve sobreviver à travessia.",3),
      quest("O Estandarte Roubado","Entre no arsenal imperial e enfrente os carrascos que o vigiam.", "dungeon","Carrasco","rogue","Assassinos abrem caminho por corredores ocupados.",4),
      quest("A Muralha Interior","Defenda as portas da cidade livre contra golems de guerra.", "defense","Golem de guerra","warrior","Os golems exigem uma linha de frente durável.",4),
      quest("A Academia das Chamas","Explore os laboratórios imperiais controlados por magos hostis.", "dungeon","Mago imperial","mage","O domínio arcano é decisivo contra magos imperiais.",4),
      quest("O Julgamento do Carrasco","Cace o carrasco responsável pelas execuções do distrito ocupado.", "hunt","Carrasco","ranger","Encerre a perseguição antes do limite de rodadas.",4)
    ],
    guardian:{title:"A Máquina do Imperador",description:"Derrote o maior golem de guerra do império e abra os portões de Solkar.",flavor:"Chefe de Solkar: máquina de cerco construída para destruir exércitos."}
  },
  10:{
    contracts:[
      quest("A Ponte dos Sussurros","Escolte os últimos exploradores pela ponte de pedra cercada por demônios.", "escort","Demônio menor","paladin","Proteger o grupo é essencial para atravessar o abismo.",3),
      quest("O Vazio Atrás da Porta","Explore o templo sem luz e enfrente arautos vindos da fenda.", "dungeon","Arauto do vazio","mage","Magia ajuda a conter a ofensiva dos arautos.",3),
      quest("O Caminho Sem Retorno","Cace devoradores que perseguem os sobreviventes nas passagens da fenda.", "hunt","Devorador","ranger","A caçada é curta e não permite hesitação.",4),
      quest("A Última Lâmpada","Defenda a barricada dos guardiões da luz contra os demônios do abismo.", "defense","Demônio menor","healer","Cura e linha de frente devem sustentar o último refúgio.",4),
      quest("Os Nomes Apagados","Atravesse o arquivo esquecido e destrua os arautos que guardam seus segredos.", "dungeon","Arauto do vazio","rogue","O controle da retaguarda ajuda na exploração.",4),
      quest("O Coração do Devorador","Persiga o devorador ancestral pelas galerias que colapsam.", "hunt","Devorador","ranger","Dano concentrado antes do limite da caça é essencial.",4)
    ],
    guardian:{title:"O Cavaleiro do Fim",description:"Enfrente o campeão do abismo que guarda o caminho para a Coroa do Mundo.",flavor:"Chefe de Nhal: o confronto final na fenda exige a equipe inteira."}
  },
  11:{
    contracts:[
      quest("Ecos do Primeiro Reino","Explore as ruínas celestes e derrote os serafins caídos que ocupam o templo.", "dungeon","Serafim caído","mage","Magos e sacerdotes enfrentam os guardiões das alturas.",3),
      quest("A Escalada Impossível","Escolte o último grupo de alpinistas entre os titãs do gelo.", "escort","Titã de gelo","paladin","A escolta só vence se seus companheiros chegarem vivos.",3),
      quest("O Círculo da Geada","Defenda o último santuário montanhês contra os titãs que despertaram.", "defense","Titã de gelo","warrior","Segure a barricada até o fim do cerco.",4),
      quest("Coração da Tempestade","Cace o dragão ancião que ronda o cume acima das nuvens.", "hunt","Dragão ancião","ranger","A grande caçada tem limite de rodadas e exige alto dano.",4),
      quest("O Templo da Queda","Entre no templo da última estrela e derrote os serafins caídos.", "dungeon","Serafim caído","healer","A resistência da equipe será testada no templo.",4),
      quest("O Último Caminho","Rastreie o dragão ancião na trilha que conduz ao trono final.", "hunt","Dragão ancião","ranger","É a derradeira caçada antes do chefe lendário.",4)
    ],
    guardian:{title:"Rei sem Nome · O Último Juramento",description:"Enfrente o Rei sem Nome no ponto mais alto do mundo e decida o destino da guilda.",flavor:"Confronto final da campanha: o soberano lendário não cederá facilmente."}
  }
};
