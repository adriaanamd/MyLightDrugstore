# MyLightDrugstore

Legacy pharmacy inventory and sales application. The original code dates from
2009-2012 and was written by my aunt and Mr. March Jig Tala; I have been
refactoring it.

## Project layout

- `MyLightDrugstore/` is the main legacy copy. It has separate `administrator/`
  and `staff/` areas, with `index.php` as the login page.
- `pharmacy/` is a separate legacy copy with its operational pages directly in
  that folder.
- `backend/` is the Laravel modular monolith being built for the React FSD
  frontend. Its API is documented in [`API-DOCS.md`](API-DOCS.md).

Each folder is a standalone PHP application. To serve one locally, point a PHP
web server at that folder and open its `index.php` page.

## Requirements

- For the legacy copies: a web server with PHP support, such as Apache, and a
  MySQL-compatible `dbmedicine` schema.
- For the backend: PHP 8.3.36+, 8.4.27+, or 8.5.12+ on the matching branch, Composer, SQLite for local tests, and MySQL 8 or
  MariaDB for deployment and migration checks.

The legacy pages still require a runtime that provides the removed `mysql_*`
functions. The Laravel backend does not use that legacy database API.

## Backend development

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
composer test
composer run analyse
```

The backend uses `/api/v1`, session authentication, encrypted AES-256-GCM
transport, encrypted sensitive fields, and module-specific application and
infrastructure layers. CI runs the Unit, Architecture, FeatureFoundation,
FeatureBusiness, and FeatureTransport suites plus PHPStan level 9.
The PHP runtime policy rejects releases vulnerable to PHP2Shell (CVE-2026-109618
and CVE-2026-109619), and CI is pinned to PHP 8.5.12. Restart all PHP workers
after upgrading the runtime.

## Database setup

The application connects to the database through `conf.php` files. Connection
settings are repeated in several locations under each app folder, so update the
copies used by the selected app to match your local database.

Database dumps are excluded from this repository because they contain account
or transaction data. A fresh checkout therefore does not include an importable
schema or seed data. Obtain or create a sanitized schema locally before trying
to run the application; do not commit live database dumps.

## Current status

The two legacy app folders still contain overlapping pages and assets. New
backend behavior belongs under `backend/` and must preserve the contracts in
`API-DOCS.md`.
