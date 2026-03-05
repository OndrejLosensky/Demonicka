# Excel exports

Export format is stable for **v4 import** (event import, user import). Do not change sheet names or column keys without documenting and supporting them in import.

- **Event detail** (`EventDetailExportBuilder`): sheets `Event`, `Users`, `Barrels`, `Beer_log_1` (paged), `BeerPong_teams`, `BeerPong_events`, `Aggregates`.
- **System export** (`SystemExportBuilder`): sheet `Events` (summary), `Users` (all), then per-event `Event_N`, `Users_N`, `Barrels_N`, etc. with same column layout as event detail.
- **Users export** (`UsersExportBuilder`): sheet `Users` with stable columns (id, username, role, …).

Filename encoding: UTF-8 via RFC 5987 `Content-Disposition` so Czech and other non-ASCII characters are preserved in downloaded filenames.
