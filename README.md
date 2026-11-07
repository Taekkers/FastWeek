# FastWeek som webapp (gratis)

FastWeek er en webapp, som alle kan åbne i telefonens browser og lægge på hjemmeskærmen. Hver person opretter sig selv med et **navn og en kode** og får sin egen private ugeplan, sit eget lager, sine egne retter og sine egne indkøb. Ingen kan se hinandens data. Ugens tilbud og priser deles af alle.

Det hele kører på gratis tjenester: **Firebase** (login og data), **GitHub Pages** (selve appen) og **GitHub Actions** (ugentlig påmindelse). Du skal bruge en Google-konto og en GitHub-konto. Det tager ca. 30 minutter første gang.

> Alt det tekniske kan du gøre i browseren. Du skal ikke installere noget.

---

## Det kan appen (version 5)

- **Én butik eller flere?** Indkøb viser den billigste enkeltbutik, de bedste to og tre butikker, hvor meget hver ekstra butik sparer, og en anbefaling. Under Indstillinger vælger du, hvad en ekstra butik er værd for dig (standard 50 kr): kun hvis den sparer mere, anbefales den. Tallene er overslag ud fra normalpriser, butiksindeks og de tilbud, der ligger i `data/offers.json`.

### Version 3

- **Hvem spiser med:** antal voksne og børn (et barn regnes som 0,6 voksen i mængderne).
- **Foretrukne mærker:** vælg mærker pr. vare (knappen "+ Mærke" på indkøbslisten, eller i varens indstillinger under Lager). De huskes fra uge til uge, og for de varer tæller kun tilbud på dine mærker med i prisregnestykket.
- **11 butikker:** Bilka, Netto, Rema 1000, Coop 365, Lidl, Føtex, SuperBrugsen, Kvickly, Meny, Spar og Løvbjerg. Priserne er regnet ud fra Rema 1000 + ugens tilbud; Løvbjergs prisniveau er et skøn.
- **Madbudget** pr. uge eller pr. måned: planen vælger billigere retter, og indkøbslisten viser, om du holder budgettet.
- **Kost og allergener:** kun vegetarretter, hurtige hverdagsretter (højst 30 min.) og 11 allergener, der holdes ude af madplanen. Allergenerne gættes ud fra ingrediensernes navne, så tjek altid varedeklarationen.
- **Indkøbslisten** samles automatisk ud fra madplanens ingredienser.
- **Tilbud i webversionen** ligger i `data/offers.json` og opdateres hver fredag med den nye uges tilbud fra alle butikkerne. Løvbjerg har ingen læsbare tilbud (pdf-avis), så den regnes på normalpris.

## Det kan appen (version 2)

- **Vurdér retten**, når den er lavet: 1-5 stjerner og om den skal med i en senere ugemenu (ja, måske eller nej). Appen bruger det i næste uges plan.
- **Favoritter:** ved første login vælger man sine favoritretter, og appen lærer smagen af dem. Favoritterne kommer ikke hver uge. Man kan ændre dem under *Mine retter → Favoritter*.
- **Vegetar** kan vælges i den ugentlige forespørgsel, ligesom fisk, fjerkræ, okse og svin.
- **Økologi og frilands** er to separate valg for kød, fisk og æg (og to priser pr. vare). Sæt kryds ved en eller begge.
- **Rester på tværs af uger:** vælger man dobbelt portion om søndagen, er mandag i næste uge automatisk rester.
- **Egne retter med fremgangsmåde:** 14 nye retter med fuld opskrift følger med, og man kan skrive sine egne. Opskriften kan åbnes fra ugeplanen.

---

## Del 1. Firebase: login og data (ca. 10 min)

1. Gå til **console.firebase.google.com** og log ind med din Google-konto.
2. Tryk **Opret projekt**. Kald det fx `fastweek`. Slå Google Analytics fra. Tryk **Opret**.
3. Vælg **Build → Authentication → Kom i gang → Sign-in method → E-mail/adgangskode**. Slå den første kontakt **til** og tryk **Gem**. (Appen bruger ingen rigtige e-mails. Navnet laves internt om til en skjult adresse.)
4. Vælg **Build → Firestore Database → Opret database**. Vælg placering **eur3 (Europa)** og **Start i produktionstilstand**.
5. Åbn fanen **Regler**. Slet alt, og indsæt hele indholdet af filen **firestore.rules**. Tryk **Publicer**. *Det er reglerne, der sørger for, at hver bruger kun kan se sine egne data. Spring det ikke over.*
6. Tryk på tandhjulet ved **Projektoversigt → Projektindstillinger → Generelt**. Under **Dine apps** trykker du på web-ikonet **</>**. Giv appen et navn, og lad **Firebase Hosting** være slået fra. Tryk **Registrer app**.
7. Du får en blok med `apiKey`, `authDomain`, `projectId` og `appId`. Åbn filen **config.js** i en teksteditor (Notesblok eller TextEdit), og erstat de fire værdier. Gem filen. Nøglerne er ikke hemmelige.

## Del 2. Læg appen online med GitHub Pages (ca. 10 min)

1. Opret en gratis konto på **github.com**.
2. Tryk **New repository**. Navn: `fastweek`. Vælg **Public**. Tryk **Create repository**.
3. Tryk **uploading an existing file**. Træk **alle filer og mapper** fra denne mappe ind (ikke selve mappen, men det, der ligger i den, så `index.html` kommer øverst). Tryk **Commit changes**.
4. Gå til **Settings → Pages**. Under **Branch** vælger du `main` og mappen `/ (root)`. Tryk **Save**.
5. Efter 1-2 minutter står adressen øverst: `https://DITBRUGERNAVN.github.io/fastweek/`. Det er den, du sender til dem, der skal bruge appen.
6. Åbn adressen. Tryk **Ny her? Opret en bruger**, og lav din egen bruger.

**På telefonen:** iPhone (Safari): tryk på Del og **Føj til hjemmeskærm**. Android (Chrome): menu og **Installer app**.

*Alternativ uden GitHub:* gå til **app.netlify.com/drop** og træk mappen derind. Så får du en adresse med det samme (opret en gratis konto for at beholde den). Den ugentlige påmindelse i del 3 kræver dog GitHub.

## Del 3. Notifikationer: ugentlig påmindelse (valgfri, ca. 10 min)

Hver fredag kl. 18-19 får alle, der har slået det til, en besked om at lave ugens madplan.

1. Dobbeltklik på **tools/vapid.html** og tryk **Lav nøgler**. Du får en offentlig og en privat nøgle.
2. Indsæt den **offentlige** nøgle i **config.js** ved `vapidPublicKey`. Gå ind på filen i GitHub (ikonet med blyant), indsæt, og tryk **Commit changes**.
3. I Firebase: tandhjul → **Projektindstillinger → Tjenestekonti → Generer ny privat nøgle**. Du henter en JSON-fil. Den er **hemmelig**, så del den ikke.
4. I dit GitHub-repo: **Settings → Secrets and variables → Actions → New repository secret**. Opret tre:
   - `FIREBASE_SERVICE_ACCOUNT`: hele indholdet af JSON-filen
   - `VAPID_PRIVATE_KEY`: den private nøgle fra trin 1
   - `VAPID_SUBJECT`: `mailto:din@mail.dk`
5. Tryk **Add file → Create new file**. Skriv navnet `.github/workflows/weekly-push.yml` (med punktummet foran). Indsæt hele indholdet af filen **github-workflow/weekly-push.yml**, og tryk **Commit**.
6. Test: **Actions → Ugentlig påmindelse → Run workflow**. Sæt kryds i **Tørkørsel** første gang. I loggen står *Brugere med notifikationer: …*. Kør den bagefter uden kryds for at sende en rigtig besked.
7. I appen: **tandhjulet → Notifikationer → Slå notifikationer til**.

**iPhone:** notifikationer virker kun, når appen er lagt på hjemmeskærmen og åbnet derfra (iOS 16.4 eller nyere).

## Del 4. Ugens tilbud

Tilbud ligger i filen **data/offers.json** og gælder for alle brugere. Uden friske tilbud regner appen med normalpriser og viser ikke tilbud for den uge.

- **Hver uge (1 minut):** bed Claude i projektet om at hente ugens tilbud som en ny `offers.json`. I GitHub trykker du på `data/offers.json` → blyant → indsæt → **Commit**. Appen henter den nye fil, næste gang den åbnes.
- **Fuldt automatisk:** forbind din GitHub-konto til Claude, så den planlagte opgave kan lægge filen i dit repo selv. Det er ikke sat op endnu.

## Scanning af kogebøger

Under **Mine retter** er der en knap, **Scan kogebog**. Skriv kogebogens navn, og tag et billede af hver opskrift (**Tag billede**) eller vælg flere billeder på én gang (**Vælg billeder**). Appen læser titel, tid, antal personer, ingredienser og sidetal, hvis det er med på billedet. Hver opskrift bliver et **udkast** under *Til gennemsyn*. Åbn et udkast, ret navn, side og mængder, og tryk **Gem ret**. Først da kommer retten med i madplanen og i lagerberegningen. Mængderne omregnes til 2 personer.

Teksten læses på telefonen (gratis, ingen billeder sendes nogen steder). Første gang hentes tekstlæseren og en dansk sprogfil, så det kræver net og kan tage lidt. Læsningen er ikke perfekt: tjek altid mængder og navne, før du gemmer. Skarpt lys, et fladt billede og hele ingredienslisten i billedet giver det bedste resultat. Sidetal bliver kun fundet, hvis de står tydeligt. Fremgangsmåden gemmes ikke. Appen henviser til kogebogen og siden.

## Ting du skal vide

- **Koden kan ikke nulstilles**, fordi der ikke er en e-mail. Glemmer nogen koden, må de oprette en ny bruger med et nyt navn. Du kan som ejer slette en bruger under *Authentication* i Firebase.
- **Navne er delt:** to personer kan ikke have det samme navn. Brug en kode på mindst 8 tegn, så den er svær at gætte.
- **Som ejer af Firebase-projektet kan du teknisk set se alles data** i konsollen. Sig det til dem, der bruger appen.
- **Gratis grænser:** Firestore giver ca. 50.000 læsninger og 20.000 skrivninger om dagen. Det rækker til en god håndfuld ugentlige brugere, men ikke til tusindvis. Går grænsen, stopper appen til næste dag. Der kommer aldrig en regning, så længe du holder dig på gratisplanen (Spark).
- **Ingen rigtige madbilleder:** retterne får en tegnet illustration. Billeder af egne retter kan ikke gemmes i den gratis udgave.
- Appen er testet med en simuleret Firebase, ikke med dit rigtige projekt. Hvis noget driller, så se herunder.

## Fejlfinding

| Det du ser | Det betyder |
|---|---|
| *Appen er ikke sat op endnu* | `config.js` er ikke udfyldt eller ikke uploadet (del 1, trin 7) |
| *Login med navn og kode er ikke slået til* | Del 1, trin 3 mangler |
| *Ingen forbindelse til databasen* | Reglerne er ikke publiceret (del 1, trin 5), eller du har ikke net |
| *Navnet er optaget* | Nogen har allerede det navn. Vælg et andet |
| Notifikationer kan ikke slås til | iPhone: læg appen på hjemmeskærmen først. Ellers: tjek at nøglen står i `config.js` |
| Ændringer vises ikke efter en opdatering | Luk appen helt og åbn den igen |

## Opdater appen

Upload de nye filer til GitHub på samme måde som i del 2. Brugernes data ligger i Firebase og påvirkes ikke. Eksisterende brugere får de nye startretter ved at trykke *Hent startretter* under *Mine retter*, og de nye priser hentes automatisk.
