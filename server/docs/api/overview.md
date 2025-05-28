# API Dokumentace

## Přehled

API Démonické aplikace je postaveno na REST architektuře a poskytuje kompletní přístup ke všem funkcím systému. Všechny endpointy jsou prefixovány `/api/v1/`.

## Autentizace

### Přihlášení
```http
POST /auth/login
Content-Type: application/json

{
  "username": "string",
  "password": "string"
}

Response:
{
  "token": "string",
  "refreshToken": "string",
  "user": {
    "id": "string",
    "username": "string",
    "email": "string",
    "roles": ["string"]
  }
}
```

### Registrace
```http
POST /auth/register
Content-Type: application/json

{
  "username": "string",
  "password": "string",
  "email": "string"
}

Response:
{
  "id": "string",
  "username": "string",
  "email": "string"
}
```

## Autorizace

### Bearer Token
Všechny autentizované požadavky musí obsahovat Bearer token v hlavičce:

```http
Authorization: Bearer <token>
```

### Refresh Token
Pro obnovení přístupového tokenu:

```http
POST /auth/refresh-token
Content-Type: application/json

{
  "refreshToken": "string"
}

Response:
{
  "token": "string",
  "refreshToken": "string"
}
```

## Formáty odpovědí

### Úspěšná odpověď
```json
{
  "data": {
    // Response data
  },
  "message": "string"
}
```

### Chybová odpověď
```json
{
  "error": {
    "code": "string",
    "message": "string"
  }
}
```

## Stavové kódy

- `200 OK` - Úspěšný požadavek
- `201 Created` - Úspěšné vytvoření
- `400 Bad Request` - Neplatný požadavek
- `401 Unauthorized` - Chybějící nebo neplatná autentizace
- `403 Forbidden` - Nedostatečná oprávnění
- `404 Not Found` - Zdroj nenalezen
- `500 Internal Server Error` - Chyba serveru

## Paginace

Pro endpointy vracející seznamy:

```http
GET /api/v1/resource?page=1&limit=10

Response:
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "pages": 10
  }
}
```

## Filtrování

Podporované parametry filtrování:

```http
GET /api/v1/resource?field=value&sort=field:desc&search=term
```

### Operátory
- `eq` - Rovná se
- `ne` - Nerovná se
- `gt` - Větší než
- `lt` - Menší než
- `gte` - Větší nebo rovno
- `lte` - Menší nebo rovno
- `in` - V seznamu
- `nin` - Není v seznamu

Příklad:
```http
GET /api/v1/events?startDate[gte]=2024-01-01&status[in]=active,planned
```

## Rate Limiting

API používá rate limiting pro omezení počtu požadavků:

- 100 požadavků za minutu pro autentizované uživatele
- 20 požadavků za minutu pro neautentizované uživatele

Hlavičky odpovědi:
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 99
X-RateLimit-Reset: 1640995200
```

## Verze API

Aktuální verze API je `v1`. Verze je specifikována v URL:

```http
/api/v1/...
```

### Zpětná kompatibilita
- Významné změny jsou oznámeny předem
- Staré verze jsou podporovány minimálně 6 měsíců
- Deprecation warning v hlavičkách odpovědi

## CORS

API podporuje CORS pro specifikované domény:

```http
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
Access-Control-Max-Age: 86400
```

## Doporučení

### Cachování
- Používejte ETag hlavičky
- Respektujte Cache-Control direktivy
- Implementujte lokální cache

### Chyby
- Zpracovávejte všechny chybové stavy
- Implementujte exponential backoff
- Logujte chyby pro debugging

### Bezpečnost
- Používejte HTTPS
- Validujte vstupní data
- Implementujte timeout
- Ošetřete CSRF 