# Über das Script

Das Repo beinhalten ein Script welches Parkplatzdaten aus der [Parkplatz Transform App](https://app.xtransform.org/) auf administrativer Ebene (z.B. Berliner Planungsräume) auswertet und mit verschiedenen öffentlichen Daten verschneidet. Die berechneten Daten werde als CSV [hier](./data/out/PLR_analysed.csv) abgelegt. 

## Installation

```bash
npm install
```

## Development

Die Datei [PLR_status.csv](./data/in/PLR_status.csv) definiert welche PLanungräume ausgewertet werden sollen.

Zum ausführen des Scripts:

```bash
node index.js
```

## Methode

Folgende Annahmen werden beim Auswerten der Daten getroffen: 
- Ein Parkplatz parallel zur Straße nimmt 5.2m der Straßenlänge ein
- Ein Parkplatz quer zur Straße nimmt 2.6m der Straßenlänge ein
- Ein Parkplatz ist 12.5m² groß
- Liniensegemnte aus den Rohdaten sind immer Teil des Straßenraumes
- Polygone aus den Rohdaten sind nur Teil des Straßenraumes, wenn sie im Straßenraum liegen. Wenn sie maximal 10m² herausragen, sind sie auch Teil des Straßenraumes. Damit werden Ungenauigkeiten beim Erfassen der Flächen berücksichtigt.
- Da beim Eintragen der Daten in der App kleine Ungenauigkeiten entstanden sein können werden Linien bzw. Polygone, welche 15m bzw. 10m² über einem administrativen Gebiet herausragen, diesem Gebiet vollständig zugeschrieben. 


## Quellen

- Planungsräume (PLR, 448)

  - Quelle: Amt für Statistik Berlin-Brandenburg / Planungsräume
  - Stand: 01.01.2019
  - Link: https://stadtentwicklung.berlin.de/planen/basisdaten_stadtentwicklung/lor/de/download.shtml
  - Data: https://stadtentwicklung.berlin.de/planen/basisdaten_stadtentwicklung/lor/download/LOR_SHP_2019.zip

- Grünanlagen & Spielplätze

  - Quelle: <a href='https://fbinter.stadt-berlin.de/fb/index.jsp?loginkey=zoomStart&mapId=gris_oeffgruen@senstadt&bbox=387353,5817003,393662,5821204'>Geoportal Berlin / Darstellung aller Öffentlichen Grünanlagen (einschließlich Spielplätze)</a>
  - Aktualisiert am: 11.05.2021
  - Link: https://fbinter.stadt-berlin.de/fb/index.jsp?loginkey=zoomStart&mapId=gris_oeffgruen@senstadt&bbox=387353,5817003,393662,5821204

- Straßenverkehr

  - Quelle: <a href='https://fbinter.stadt-berlin.de/fb/index.jsp?loginkey=zoomStart&mapId=wmsk_alkis@senstadt&bbox=389308,5819154,391017,5820292'>Geoportal Berlin / ALKIS (Straßenverkehr && Plätze)<a>
  - Description: ALKIS Berlin Tatsächliche Nutzung (Amtliches Liegenschaftskatasterinformationssystem)
  - Link: https://fbinter.stadt-berlin.de/fb/index.jsp?loginkey=zoomStart&mapId=wmsk_alkis@senstadt&bbox=389308,5819154,391017,5820292
  - Erzeugt am: 07.01.2022
  - Filter used: "BEZEICH" = 'AX_Strassenverkehr' OR "BEZEICH" = 'AX_Platz'
  - Infos: „Straßenverkehr“ umfasst alle für die bauliche Anlage Straße erforderlichen Flächen und, die dem Straßenverkehr dienenden bebauten und unbebauten Flächen. „Platz“ ist eine Verkehrsfläche in Ortschaften oder eine ebene, befestigte oder unbefestigte Fläche, die bestimmten Zwecken dient. Quelle: https://www.stadtentwicklung.berlin.de/service/gesetzestexte/de/download/geoinformation/liegenschaftskataster/fuehrung/ALKIS-OK_Berlin.pdf

- Kfz-Bestand auf LOR-Ebene
  - Quelle: © Amt für Statistik Berlin-Brandenburg, Potsdam, 2020: „Melderechtlich registrierte Einwohnerinnen und Einwohner am Ort der Hauptwohnung in Berlin am 30.06.2020 nach Planungsräumen und KfZ-Bestand“ – Vervielfältigung und Verbreitung, auch auszugsweise, mit Quellenangabe gestattet
  - Link : https://supaplexosm.github.io/strassenraumkarte-neukoelln/parkraumkarte/data
  - Veröffentlicht: 30.06.2020

## Charts

Im der Datei [data/extra](./data/extra.zip) befinden sich Geodaten für verschiedene Flächennutzungen auf Planungsraum- und Bezirksebene. 

Auswahl an Charts die mit den Daten aus dem Repo erstellt wurden:

- Status

  - Karte : https://www.datawrapper.de/_/mpool/

- Anzahl an Parkplätzen mit Konfidenzbereich

  - Barchart: https://www.datawrapper.de/_/AMvHd/

- Anteil der Parkplatzfläche am Straßenraum

  - Karte: https://www.datawrapper.de/_/G9cdj/

- Parkplatzflächen und Spielplatzfläche

  - Barchart: https://www.datawrapper.de/_/ewcoz/
  - Bullet chart: https://www.datawrapper.de/_/bofpY/

- Verteilung an Parkplatz- Grünanlagen- und Spielplatzflächen

  - Tabelle: https://www.datawrapper.de/_/K3DQm/

- Parkplätze und Grünflächen
  - Karte: https://www.datawrapper.de/_/nkvez/

## Chart Farben

- Spielplätze #f4c262
- Parkplätze #e347a1
- Grün #09bb9f
- Neutral #1d81a2
- Strassenfläche #e347a1



