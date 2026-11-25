# CineMax backend (Laravel 12 + MySQL)

REST API for the React front end in the parent folder. The database structure is **`../database/schema.sql`**
(20 tables, see `../database/erd.html`). There are no Eloquent models and no migrations on purpose:
every query is written out as SQL in the controllers (`DB::select / insert / update / delete`).

## Set up

```
1. Start MySQL in XAMPP
2. mysql -u root < ../database/schema.sql      (creates the database "cinemasystem" and its 20 tables)
3. composer install
4. copy .env.example .env   &&   php artisan key:generate     (.env already points to MySQL, user root, no password)
5. php artisan db:seed                          (3 cinemas + demo accounts, password demo1234)
6. php artisan serve                            -> http://localhost:8000/api
7. php artisan test                             (feature tests; they roll back everything they write)
```

The React app talks to `http://localhost:8000/api` (change with `VITE_API_URL`).

## Modules

| # | Module | Tables | Status |
|---|--------|--------|--------|
| 1 | Users & Security | `user_account`, `audit_log` (+ `cinema` for the branch) | done |
| 2 | Movie catalogue | `genre`, `movie`, `movie_genre`, `movie_review` | next |
| 3-6 | Infrastructure, scheduling, booking/payment, food | remaining tables | later |

### Module 1 endpoints

| Method | URL | Who | What |
|--------|-----|-----|------|
| POST | `/api/auth/login` | public | e-mail + password -> `{ token, user }` |
| POST | `/api/auth/register` | public | creates a CUSTOMER -> `{ token, user }` |
| POST | `/api/auth/forgot-password` | public | stores a hashed one-time token (60 min); the link is e-mailed (mail log) |
| POST | `/api/auth/reset-password` | public | `{ email, token, password }` |
| GET | `/api/auth/me` | signed in | current user |
| POST | `/api/auth/logout` | signed in | (stateless, the browser drops the token) |
| PUT | `/api/auth/profile` | signed in | name, phone |
| PUT | `/api/auth/password` | signed in | current + new password -> fresh token |
| GET / POST | `/api/users` | ADMIN | list / create |
| PUT / DELETE | `/api/users/{id}` | ADMIN | update (role, branch, status) / delete (blocked by foreign keys when history exists) |
| POST | `/api/users/{id}/reset-password` | ADMIN | random temporary password, shown once |
| GET | `/api/audit-logs` | ADMIN | latest 1000 audit rows |

Where to look: `routes/api.php`, `app/Http/Controllers/AuthController.php`, `UserController.php`, `AuditLogController.php`.

### How sign-in works

* Passwords are stored as bcrypt in `user_account.password_hash`.
* The API token is stateless: `base64(payload).HMAC-SHA256(payload, APP_KEY)` with the user id, a 7-day expiry and a
  fingerprint of the password hash (`app/Support/ApiToken.php`). No session table is needed.
* `AuthenticateToken` reads the user from `user_account` on every request, so suspending an account or changing
  its password ends existing sessions immediately. `RequireRole` limits routes to roles (`role:ADMIN`).
* Forgot-password stores only `SHA-256(token)` and an expiry in `reset_token_hash` / `reset_token_expires_at`.
  While `APP_DEBUG=true` the API also returns the link so it can be tested without a mail server.
* Staff sign-ins, password changes/resets and all user changes are written to `audit_log`.

## Changing the database

1. Edit `../database/schema.sql` and apply the same change to the live database (`ALTER TABLE ...`).
2. Regenerate the ERD: `node ../database/build_erd.cjs`
3. Update the seeders / controllers.
