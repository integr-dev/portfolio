---
tagline: Macht aus einem Ordner voller Markdown eine schnelle, durchsuchbare Doku-Seite, bereit für Leser, Suchmaschinen und KI-Agenten.
why: Ein komplettes Produkt, das ich unter einer eigenen Organisation entworfen habe und pflege. Auf npm als clay-doc veröffentlicht, inzwischen in Version 5, und die eigene Dokumentation ist eine Clay-Seite.
built:
  problem: Die meisten Doku-Tools verlangen, dass ein Projekt einen Static Site Generator, ein Theme und einen eigenen Build übernimmt.
  solution: 'Clay ist ein einziges npm-Paket mit Kommandozeile. Ein Repository nimmt es als Dev-Abhängigkeit auf, schreibt Markdown in docs/ und eine clay.yaml, und clay build rendert jede Seite vorab zu einer statischen Website, mit Suchindex, Sitemap, Vorschaubildern und einer Markdown-Kopie jeder Seite für KI-Agenten. Derselbe Build prüft Links und Einstellungen.'
alts:
- Die Startseite der Clay-Dokumentation mit Seitenleiste, einer Codegruppe im Terminal-Stil und dem Seitenmenü
- Eine OpenAPI-Seite der Clay-Dokumentation mit einer Anfragezelle zum Ausprobieren des Endpunkts und einer Beispielantwort
- Die Suchpalette im dunklen Theme mit Treffern nach Seite gruppiert und nach Abschnitt gefiltert
---
Seiten sind einfaches Markdown in `docs/`, mit Tabs, Schritten, Karten, Diagrammen, Formeln und OpenAPI-Seiten in derselben Syntax. `clay dev` zeigt jede Änderung sofort an, und mit `clay edit`, `clay check` und `clay search` überarbeiten Menschen und Coding-Agenten die Doku direkt im Terminal. Versionen, Übersetzungen, Themes und Analytics ohne Cookies stehen in `clay.yaml`.
