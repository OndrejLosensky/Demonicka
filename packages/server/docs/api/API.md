# API Dokumentace

## Přehled

Tento dokument poskytuje kompletní dokumentaci API endpointů Démonické aplikace. Všechny API cesty začínají prefixem `/api/v1/`.

## Autentizace

### Přihlášení
```
POST /auth/login
```
Tělo požadavku:
```json
{
  "username": "string",
  "password": "string"
}
```

### Registrace
```
POST /auth/register
```
Tělo požadavku:
```json
{
  "username": "string",
  "password": "string",
  "email": "string"
}
```

## Události

### Seznam událostí
```
GET /events
```

### Detail události
```
GET /events/:id
```

### Vytvoření události
```
POST /events
```
Tělo požadavku:
```json
{
  "name": "string",
  "description": "string",
  "startDate": "string (ISO datum)"
}
```

### Ukončení události
```
POST /events/:id/end
```

### Aktivace události
```
POST /events/:id/activate
```

## Účastníci

### Seznam účastníků
```
GET /participants
```

### Přidání účastníka
```
POST /participants
```
Tělo požadavku:
```json
{
  "name": "string",
  "gender": "string"
}
```

## Sudy

### Seznam sudů
```
GET /barrels
```

### Přidání sudu
```
POST /barrels
```
Tělo požadavku:
```json
{
  "size": "number",
  "orderNumber": "string"
}
```

## Dashboard

### Získání statistik
```
GET /dashboard/stats
```

### Získání žebříčku
```
GET /dashboard/leaderboard
```

## Formáty odpovědí

Všechny úspěšné odpovědi mají tento formát:
```json
{
  "data": {
    // Data odpovědi
  },
  "message": "string"
}
```

Chybové odpovědi:
```json
{
  "error": {
    "code": "string",
    "message": "string"
  }
}
``` 