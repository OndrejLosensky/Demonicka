# Plán vylepšení zabezpečení

Tento dokument popisuje krok za krokem vylepšení zabezpečení pro frontend i backend autentizačního systému.

## Vylepšení backendu

### 1. Správa tokenů
- [x] ~~Implementace mechanismu refresh tokenů~~
  - [x] ~~Přidání generování refresh tokenů v auth službě~~
  - [x] ~~Vytvoření endpointu pro refresh token~~
  - [x] ~~Implementace rotace tokenů~~
  - [x] ~~Přidání databázové tabulky/entity pro refresh tokeny~~
  - [x] ~~Přidání blacklistu tokenů pro odhlášení~~

### 2. Rate Limiting
- [ ] Implementace rate limiting middlewaru
  - [ ] Přidání rate limitingu pro pokusy o přihlášení
  - [ ] Přidání rate limitingu pro registraci
  - [ ] Přidání rate limitingu pro reset hesla
  - [ ] Konfigurace různých limitů pro různé endpointy

### 3. CSRF ochrana
- [ ] Přidání CSRF ochrany
  - [ ] Implementace generování CSRF tokenů
  - [ ] Přidání CSRF middlewaru
  - [ ] Přidání validace CSRF tokenů
  - [ ] Konfigurace expirace CSRF tokenů

### 4. Zabezpečení hesel
- [x] ~~Vylepšení zabezpečení hesel~~
  - [x] ~~Implementace požadavků na složitost hesla~~
  - [x] ~~Přidání hashování hesel pomocí bcrypt~~
  - [x] ~~Přesunutí DTO do vlastních souborů~~
  - [x] ~~Přidání validace hesel v DTO a entitě~~
  - [ ] Přidání historie hesel pro prevenci opakovaného použití
  - [ ] Implementace funkcionality pro reset hesla
  - [ ] Přidání politiky expirace hesel

### 5. Zabezpečení cookies
- [x] ~~Implementace bezpečného zacházení s cookies~~
  - [x] ~~Přechod z Authorization hlavičky na HTTP-only cookies~~
  - [x] ~~Konfigurace bezpečnostních možností cookies~~
  - [x] ~~Implementace SameSite cookie politiky~~
  - [ ] Přidání šifrování cookies

## Vylepšení frontendu

### 1. Správa tokenů
- [x] ~~Implementace bezpečné správy tokenů~~
  - [x] ~~Přechod z localStorage na HTTP-only cookies~~
  - [x] ~~Přidání automatického mechanismu obnovy tokenů~~
  - [x] ~~Implementace zpracování expirace tokenů~~
  - [ ] Přidání bezpečného ukládání tokenů pro vývoj

### 2. Zabezpečení formulářů
- [ ] Vylepšení zabezpečení formulářů
  - [ ] Přidání sanitizace vstupů
  - [ ] Implementace validace formulářů
  - [ ] Přidání ochrany proti vícenásobnému odeslání
  - [ ] Implementace správného resetu formulářů

### 3. UI/UX Bezpečnost
- [ ] Přidání vylepšení UI zaměřených na bezpečnost
  - [ ] Přidání stavů načítání pro bezpečnostní operace
  - [ ] Implementace správné zpětné vazby pro bezpečnostní akce
  - [ ] Přidání indikátorů bezpečnostního stavu
  - [ ] Implementace bezpečné navigace

## Prioritizace

### Vysoká priorita
1. ~~Správa tokenů (FE i BE)~~
2. ~~Zabezpečení hesel (FE i BE)~~
3. CSRF ochrana (FE i BE)
4. ~~Zabezpečení cookies (BE)~~

### Střední priorita
1. Rate Limiting (BE)
2. Bezpečnostní hlavičky (FE i BE)
3. Správa sessions (FE)
4. Validace požadavků (BE)

### Nízká priorita
1. Logování a monitoring (BE)
2. UI/UX Bezpečnost (FE)
3. Testování
4. Dokumentace
5. Zabezpečení nasazení

## Poznámky
- Každé vylepšení by mělo být důkladně implementováno a otestováno před přechodem na další
- Některá vylepšení mohou vyžadovat změny jak ve frontendu, tak v backendu
- Vylepšení by měla být implementována podle priority
- Každé vylepšení otestovat ve vývojovém prostředí před nasazením do produkce
- Udržovat dokumentaci zabezpečení aktuální při implementaci vylepšení 