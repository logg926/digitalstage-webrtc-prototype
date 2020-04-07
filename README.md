# Aufführung ohne Versammlung

Konzerte, Theater und andere Aufführungen können derzeit vor allem in Form von Aufzeichnungen im Internet angeboten werden. Live funktionieren sie deswegen kaum, weil die meisten Angebote im Internet wegen der angestrebten Datenreduktion keine echte Zusammenschaltung von Mikrophonen anbieten, sondern nur von Kameras. Dabei verursacht das Audiostreaming viel weniger Volumen. Es fehlt aber an Angeboten, die echte Mehrkanalverbindungen ohne automatisierte Stummschaltung oder Ausfälle anbieten.

Eine Lösung des Problems könnte echte Live-online-Theateraufführungen und -Konzerte ermöglichen, in denen z.B. ein Ensemble einzeln von verschiedenen Orten zugeschaltet werden kann, und das Publikum alle Aufführenden gleich gut und gleich laut hören kann. Dies würde es Theatergruppen und Musikensembles erlauben, online live Aufführungen anzubieten. Auch eine Lösung nur für Proben (ohne Publikum) wäre bereits eine Hilfe.

# Kurzfassung
Die "digitale Bühne" ist eine Möglichkeit für Ensembles, Chöre und Theater(gruppen), im Internet proben und live auf einer digitalen Bühne gemeinsam vor Publikum auftreten zu können. Die üblichen Konferenz-Videoschaltungen sind nicht für mehr als 4 Mitwirkende geeignet; wir entwickeln eine neuartige technische Lösung für größere Ensembles.

# Aktueller Stand

Dies ist eine einfache Machbarkeitsstudie, welche die Orchestrierung von verschiedenen Akteuren mittels eines Regisseurs verdeutlicht.

# Installation

## Installation und Konfiguration der Umgebung

Repo klonen und per

    npm run dev
    
alle benötigten Packages installieren.

Das Projekt benötigt Firebase.
Hierfür musst Du für den Client die öffentlichen Firebase-Variablen und für den Server die Admin SDK Variablen festlegen.
Erstelle ein neues Firebase-Projekt und navigiere zu folgender Seite:
    
    https://console.firebase.google.com/project/<deine-projekt-id>/settings/serviceaccounts/adminsdk
    
Dort klicke auf 'Neuen Schlüssel generieren' und speichere die erzeugte Datei unter dem Dateinamen

    server/firebase-adminsk.json
    
Nun navigiere zur folgenden Seite

    https://console.firebase.google.com/project/<deine-projekt-id>/settings/general/

und wähle unten unter 'Firebase-SDK-Snippet' die Option 'Konfiguration' aus.

Die dort gezeigten Variablen musst Du nun händisch in die die

    .env.example
    
übertragen und diese Datei danach in

    .env
    
umbenennen.
Solltest Du zeit.co nutzen, kannst Du sie zusätzlich per now secrets in Deinem now-Deployment sicher hinterlegen. Mehr hierzu findest Du hier: https://zeit.co/docs/v2/build-step#using-environment-variables-and-secrets 


Jetzt kann es los gehen!

## Anwendung und Server lokal ausführen

### Lokaler Start des Servers

    cd server
    npm install
    npm run dev

Nach einiger Zeit erscheint die Meldung, dass der Server unter dem Port 3001 läuft.

Sobald der Server läuft, kannst Du den node.js-Server für die Client-Anwendung starten.
Wechsle hierfür in das Rootverzeichnis des Projektes und führe folgendes aus:

    npm run dev

Nun öffne den Browser und rufe 

    http://localhost:3000
    
auf.

# Mehr Informationen

https://devpost.com/software/id0265-auffuhrung-ohne-versammlung-025-kultur-air-z206
