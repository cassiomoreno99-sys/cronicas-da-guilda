# Bloco 09 — Ataques físicos avançados (laboratório isolado)

**Branch exclusiva:** `laboratorio-combate-2d-fluido-20261020`. Proibido alterar `main` ou lançar em produção sem autorização.

## 09A — identificação do golpe

- Reconhecer a arma realmente equipada no baú da campanha pelo catálogo existente, sem criar arma fictícia.
- 10 estilos: espada, machado, lança, martelo, adagas, arco, garras, mordida, cauda e desarmado.
- Inimigos usam seus nomes de espécie para distinguir ataques. Heróis sem arma elegível usam estilo visual da classe.
- Três variantes determinísticas por sequência de ação; a coreografia nunca altera dados do combate.
- Cura, conjuração, eventos sem dano e magias não são tratados como golpes físicos.

## 09B — apresentação integrada
O componente `PhysicalStrikeFX` substitui a camada genérica quando o log relata dano físico. Os arcos, flechas, golpes animais, ondas e partículas mudam conforme o equipamento/espécie e uma entre três variantes. O instante de contato coincide com 54% da coreografia dos blocos 07/08. O rig recebe gestos por arma. Nenhum dado de turno, vida ou inventário é modificado.

## 09C — testes
Validar a batalha real Android e desktop, regressão 4×4 em seis tamanhos, modo leve, acessibilidade, integridade de recursos e vídeos. As capturas são para revisão; testes automatizados **não** equivalem à aprovação estética.
