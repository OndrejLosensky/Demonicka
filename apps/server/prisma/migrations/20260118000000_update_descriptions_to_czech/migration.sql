-- Update Role descriptions to Czech
UPDATE "Role" SET description = 'Super administrátor s plným přístupem k systému' WHERE name = 'SUPER_ADMIN';
UPDATE "Role" SET description = 'Operátor, který může spravovat události, které vytvořil' WHERE name = 'OPERATOR';
UPDATE "Role" SET description = 'Běžný uživatel se standardními oprávněními' WHERE name = 'USER';
UPDATE "Role" SET description = 'Účastník bez přístupu k přihlášení' WHERE name = 'PARTICIPANT';

-- Update Permission descriptions to Czech
UPDATE "Permission" SET description = 'Vytvářet nové události' WHERE name = 'CREATE_EVENT';
UPDATE "Permission" SET description = 'Upravovat existující události' WHERE name = 'UPDATE_EVENT';
UPDATE "Permission" SET description = 'Mazat události' WHERE name = 'DELETE_EVENT';
UPDATE "Permission" SET description = 'Zobrazit všechny události v systému' WHERE name = 'VIEW_ALL_EVENTS';
UPDATE "Permission" SET description = 'Zobrazit události, kterých je uživatel součástí nebo které vytvořil' WHERE name = 'VIEW_OWN_EVENTS';
UPDATE "Permission" SET description = 'Spravovat uživatele v událostech' WHERE name = 'MANAGE_EVENT_USERS';
UPDATE "Permission" SET description = 'Spravovat sudy v událostech' WHERE name = 'MANAGE_EVENT_BARRELS';
UPDATE "Permission" SET description = 'Nastavit událost jako aktivní' WHERE name = 'SET_EVENT_ACTIVE';
UPDATE "Permission" SET description = 'Ukončit událost' WHERE name = 'END_EVENT';
UPDATE "Permission" SET description = 'Spravovat všechny uživatele' WHERE name = 'MANAGE_USERS';
UPDATE "Permission" SET description = 'Vytvářet nové uživatele' WHERE name = 'CREATE_USER';
UPDATE "Permission" SET description = 'Upravovat existující uživatele' WHERE name = 'UPDATE_USER';
UPDATE "Permission" SET description = 'Mazat uživatele' WHERE name = 'DELETE_USER';
UPDATE "Permission" SET description = 'Zobrazit všechny uživatele v systému' WHERE name = 'VIEW_ALL_USERS';
UPDATE "Permission" SET description = 'Spravovat účastníky' WHERE name = 'MANAGE_PARTICIPANTS';
UPDATE "Permission" SET description = 'Vytvářet nové účastníky' WHERE name = 'CREATE_PARTICIPANT';
UPDATE "Permission" SET description = 'Upravovat existující účastníky' WHERE name = 'UPDATE_PARTICIPANT';
UPDATE "Permission" SET description = 'Mazat účastníky' WHERE name = 'DELETE_PARTICIPANT';
UPDATE "Permission" SET description = 'Spravovat všechny sudy' WHERE name = 'MANAGE_BARRELS';
UPDATE "Permission" SET description = 'Vytvářet nové sudy' WHERE name = 'CREATE_BARREL';
UPDATE "Permission" SET description = 'Upravovat existující sudy' WHERE name = 'UPDATE_BARREL';
UPDATE "Permission" SET description = 'Mazat sudy' WHERE name = 'DELETE_BARREL';
UPDATE "Permission" SET description = 'Přidávat pivo do událostí' WHERE name = 'ADD_BEER';
UPDATE "Permission" SET description = 'Odebírat pivo z událostí' WHERE name = 'REMOVE_BEER';
UPDATE "Permission" SET description = 'Zobrazit data o pivu' WHERE name = 'VIEW_BEERS';
UPDATE "Permission" SET description = 'Spravovat všechna data o pivu' WHERE name = 'MANAGE_BEERS';
UPDATE "Permission" SET description = 'Zobrazit přehled' WHERE name = 'VIEW_DASHBOARD';
UPDATE "Permission" SET description = 'Zobrazit systémový přehled' WHERE name = 'VIEW_SYSTEM_DASHBOARD';
UPDATE "Permission" SET description = 'Spravovat systémová nastavení' WHERE name = 'MANAGE_SYSTEM';
UPDATE "Permission" SET description = 'Zobrazit systémové statistiky' WHERE name = 'VIEW_SYSTEM_STATS';
UPDATE "Permission" SET description = 'Spravovat systémové zálohy' WHERE name = 'MANAGE_BACKUPS';
UPDATE "Permission" SET description = 'Zobrazit žebříček' WHERE name = 'VIEW_LEADERBOARD';
UPDATE "Permission" SET description = 'Spravovat úspěchy' WHERE name = 'MANAGE_ACHIEVEMENTS';
UPDATE "Permission" SET description = 'Zobrazit úspěchy' WHERE name = 'VIEW_ACHIEVEMENTS';

-- Update FeatureFlag descriptions to Czech
UPDATE "FeatureFlag" SET description = 'Zobrazuje smazané uživatele s možností obnovení' WHERE "key" = 'SHOW_DELETED_USERS';
UPDATE "FeatureFlag" SET description = 'Zobrazuje výběr historie událostí na stránkách přehledu, žebříčku, uživatelů a sudů' WHERE "key" = 'SHOW_EVENT_HISTORY';
UPDATE "FeatureFlag" SET description = 'Zobrazuje funkčnost historie událostí specificky pro stránku uživatelů' WHERE "key" = 'SHOW_USER_HISTORY';
UPDATE "FeatureFlag" SET description = 'Povoluje funkčnost aktivní události' WHERE "key" = 'ACTIVE_EVENT_FUNCTIONALITY';
UPDATE "FeatureFlag" SET description = 'Povoluje funkčnost stránky historie zobrazující minulé aktivity a události' WHERE "key" = 'HISTORY_PAGE';
UPDATE "FeatureFlag" SET description = 'Přidává možnost filtrování podle roku do žebříčku' WHERE "key" = 'LEADERBOARD_YEAR_FILTER';
UPDATE "FeatureFlag" SET description = 'Zobrazuje smazané sudy s možností obnovení' WHERE "key" = 'SHOW_DELETED_BARRELS';
UPDATE "FeatureFlag" SET description = 'Povoluje tlačítko přepínání stavu na položkách sudů' WHERE "key" = 'BARREL_STATUS_TOGGLE';
UPDATE "FeatureFlag" SET description = 'Zobrazuje funkčnost historie událostí specificky pro stránku sudů' WHERE "key" = 'SHOW_BARRELS_HISTORY';
UPDATE "FeatureFlag" SET description = 'Zobrazuje smazané účastníky s možností obnovení' WHERE "key" = 'SHOW_DELETED_PARTICIPANTS';
UPDATE "FeatureFlag" SET description = 'Povoluje funkčnost čištění' WHERE "key" = 'CLEANUP_FUNCTIONALITY';
