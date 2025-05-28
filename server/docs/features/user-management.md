# Správa uživatelů

## Přehled

Systém správy uživatelů v aplikaci Démonická poskytuje komplexní řešení pro autentizaci, autorizaci a správu uživatelských účtů.

## Uživatelské role

### Administrátor
- Plný přístup ke všem funkcím systému
- Správa uživatelů a rolí
- Správa událostí
- Přístup k systémovým nastavením

### Organizátor
- Správa událostí
- Správa účastníků
- Přístup ke statistikám
- Omezený přístup k systémovým nastavením

### Účastník
- Zobrazení vlastního profilu
- Přístup k žebříčkům
- Zobrazení statistik
- Základní interakce

## Autentizace

### Přihlášení
- Přihlášení pomocí uživatelského jména a hesla
- JWT tokeny pro autentizaci
- Refresh token mechanismus
- Zabezpečené sessions

### Registrace
- Registrace nových uživatelů
- Validace údajů
- Potvrzení emailu
- Přiřazení výchozí role

## Správa profilů

### Uživatelský profil
- Základní informace
- Profilový obrázek
- Historie aktivit
- Osobní statistiky

### Nastavení účtu
- Změna hesla
- Aktualizace kontaktních údajů
- Nastavení notifikací
- Předvolby zobrazení

## Bezpečnost

### Zabezpečení účtu
- Silná hesla
- Dvoufaktorová autentizace (2FA)
- Historie přihlášení
- Detekce podezřelé aktivity

### Oprávnění
- Granulární systém oprávnění
- Role-based access control (RBAC)
- Dynamická oprávnění
- Audit log

## API Endpointy

### Autentizace
```
POST   /api/v1/auth/login          # Přihlášení
POST   /api/v1/auth/register       # Registrace
POST   /api/v1/auth/refresh-token  # Obnovení tokenu
POST   /api/v1/auth/logout         # Odhlášení
```

### Správa uživatelů
```
GET    /api/v1/users               # Seznam uživatelů
GET    /api/v1/users/:id          # Detail uživatele
PUT    /api/v1/users/:id          # Úprava uživatele
DELETE /api/v1/users/:id          # Smazání uživatele
```

### Správa rolí
```
GET    /api/v1/roles               # Seznam rolí
POST   /api/v1/roles              # Vytvoření role
PUT    /api/v1/roles/:id          # Úprava role
DELETE /api/v1/roles/:id          # Smazání role
```

## Příklady použití

### 1. Přihlášení uživatele

```typescript
const login = async (username: string, password: string) => {
  try {
    const response = await authService.login(username, password);
    if (response.token) {
      setAuthToken(response.token);
      setUser(response.user);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Login failed:', error);
    return false;
  }
};
```

### 2. Správa rolí

```typescript
// Přidání role uživateli
const addRole = async (userId: string, roleId: string) => {
  await userService.addRole(userId, roleId);
};

// Odebrání role
const removeRole = async (userId: string, roleId: string) => {
  await userService.removeRole(userId, roleId);
};
```

### 3. Aktualizace profilu

```typescript
const updateProfile = async (userId: string, data: UpdateProfileDto) => {
  try {
    const updatedUser = await userService.updateProfile(userId, data);
    setUser(updatedUser);
    showNotification('Profil byl úspěšně aktualizován');
  } catch (error) {
    showError('Aktualizace profilu selhala');
  }
};
```

## Bezpečnostní doporučení

### Hesla
- Minimální délka 8 znaků
- Kombinace velkých a malých písmen
- Čísla a speciální znaky
- Pravidelná změna hesla

### Přístup
- Omezení počtu pokusů o přihlášení
- Automatické odhlášení po neaktivitě
- Kontrola IP adres
- Logování přístupů

### Data
- Šifrování citlivých údajů
- Bezpečné ukládání hesel (bcrypt)
- Pravidelné zálohy
- Ochrana proti úniku dat 