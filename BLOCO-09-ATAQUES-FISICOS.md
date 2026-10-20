# Bloco 09 — Ataques físicos avançados (laboratório isolado)

**Branch exclusiva:** `laboratorio-combate-2d-fluido-20261020`. Proibido alterar `main` ou lançar em produção sem autorização.

## 09A — identificação do golpe

- Reconhecer a arma realmente equipada no baú da campanha pelo catálogo existente, sem criar arma fictícia.
- 10 estilos: espada, machado, lança, martelo, adagas, arco, garras, mordida, cauda e desarmado.
- Inimigos usam seus nomes de espécie para distinguir ataques. Heróis sem arma elegível usam estilo visual da classe.
- Três variantes determinísticas por sequência de ação; a coreografia nunca altera dados do combate.
- Cura, conjuração, eventos sem dano e magias não são tratados como golpes físicos.

## 09B — apresentação
Implementar preparação, trilha específica por arma, trajetória da flecha, contato sincronizado em 54% da ação, reação ao crítico e recuperação; conciliar com movimento do bloco 08 e rig do bloco 07.

## 09C — testes
Validar a batalha real Android e desktop, regressão 4×4 em seis tamanhos, modo leve, acessibilidade, integridade de recursos e vídeos. As capturas são para revisão; testes automatizados **não** equivalem à aprovação estética.
