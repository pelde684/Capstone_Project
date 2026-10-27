# Student Luggage Management System – Backend

Node.js + Express + MySQL REST API, with Cloudinary for item photographs.
Works with the team database **`luggage_management_system`** (tables: roles, users, categories,
storage_locations, items, qr_codes, transactions, item_status_history).

## Setup
1. `npm install`
2. Have the database in MySQL (import the teammate's export, or run `database/schema.sql` for an identical empty one).
   **Existing database from before the drop-off change? Run `database/migration_drop_offs.sql` once.**
3. `.env` → copy `.env.example`; set `DB_NAME=luggage_management_system`, DB user/password, `JWT_SECRET`, Cloudinary keys, `CLIENT_URL`
4. If `DB_USER` is not `root`: `GRANT ALL PRIVILEGES ON luggage_management_system.* TO 'your_user'@'localhost';`
5. `npm run seed` – adds missing roles/categories/location and the first admin (never overwrites existing rows)
6. `npm run dev` → http://localhost:5000/api  (health: `/api/health`)

## Roles (API names: Student / Operator / Admin – the DB may store STUDENT or Student, both work)
| Role | Can do |
|------|--------|
| Student | register belongings (with photo), view own items, get QR, cancel an item not yet deposited |
| Operator | scan QR, deposit / store / mark ready / hand over / reject, view all items & transactions |
| Admin | everything an operator can + manage users, categories, storage locations |

No public sign-up: the Admin creates accounts (`POST /api/users`).

## Item lifecycle (items.status)
`REGISTERED → DEPOSITED → STORED → READY_FOR_COLLECTION → COLLECTED`  (or `CANCELLED`)

| transactions.action | from | to | notes |
|---|---|---|---|
| DEPOSIT | REGISTERED | DEPOSITED | verification PENDING |
| STORAGE_VERIFICATION | DEPOSITED | STORED | needs `locationId` (capacity checked), verification APPROVED |
| COLLECTION_REQUEST | STORED | READY_FOR_COLLECTION | verification PENDING |
| COLLECTION | STORED / READY | COLLECTED | body must include `"verificationStatus":"APPROVED"` |
| REJECTION | any open status | (unchanged) | `remarks` required; logged as REJECTED |
| CANCELLATION | REGISTERED / DEPOSITED | CANCELLED | QR is deactivated |

Every status change writes a `transactions` row (who/when) and an `item_status_history` row in one DB transaction.

## Endpoints  (all except login need `Authorization: Bearer <token>`)
| Method & path | Who | Notes |
|---|---|---|
| POST `/auth/login` | public | `{identifier, password}` – email or student ID |
| GET `/auth/me`, POST `/auth/change-password` | any | |
| GET/POST `/users`, PUT `/users/:id`, PATCH `/users/:id/status`, POST `/users/:id/reset-password` | Admin | create: `{name,email,password,role,studentId?,phone?}` |
| GET `/categories`, `/locations` | any | POST/PUT: Admin |
| POST `/items` | Student | `multipart/form-data`: `name, categoryId, quantity, description, photo` |
| GET `/items/mine` | Student | |
| GET `/items` | Operator/Admin | `?status=&q=&ownerId=&locationId=&page=` |
| GET `/items/:id` | owner / staff | staff also get status history |
| GET `/items/:id/qr` | owner / staff | QR of the item's drop-off (JSON data-URL, or `?format=png`) |
| POST `/items/:id/cancel` | owner / Admin | cancels ONE item while REGISTERED |
| POST `/drop-offs` | Student | **one QR for several items** – multipart: `items` (JSON list) + `photo_0`, `photo_1` … |
| GET `/drop-offs/mine` | Student | each drop-off with its items and `qrValue` (`?includeCancelled=1`) |
| GET `/drop-offs/:id` | owner / staff | items with status and `allowedActions` |
| GET `/drop-offs/:id/qr` | owner / staff | JSON data-URL, or `?format=png` (printable label) |
| PUT `/drop-offs/:id` | owner / Admin | edit while every item is REGISTERED – same QR kept |
| POST `/drop-offs/:id/cancel` | owner / Admin | cancels the whole drop-off while REGISTERED |
| POST `/scan` | Operator/Admin | `{qrValue}` → `dropOff` (owner), `items` (each with photo, status, `allowedActions`), union `allowedActions` |
| POST `/transactions` | Operator/Admin | `{action, verificationStatus?, locationId?, remarks?}` + **one of** `itemId`, `itemIds:[…]`, `dropOffId` |
| GET `/transactions` | Operator/Admin | `?itemId=&operatorId=&action=&from=&to=` |
| GET `/stats` | Operator/Admin | dashboard counts |

JSON field names are camelCase (`ownerName`, `categoryName`, `photographUrl` …) regardless of the snake_case columns.

## Notes
- The items table has a single photo column (`photograph_path`); it stores the Cloudinary public id and the API returns a signed `photographUrl`.
- Statuses/actions are the team's UPPERCASE enums. There is no delete endpoint: cancelling keeps the history.

## Drop-offs (one QR, several items)
A student registers everything they hand in as **one drop-off** and gets **one QR** for it.

`POST /drop-offs` – `multipart/form-data`:
- `items` = JSON text, e.g. `[{"name":"Bucket","categoryId":1,"quantity":2,"description":"blue"},{"name":"Mirror","categoryId":1,"quantity":1}]`
- `photo_0`, `photo_1` … = one image file per item, same order as the list (JPG/PNG/WebP, max 5 MB, max 20 items)
- returns `{ id, qrValue, itemIds }` – draw the QR with `qrcode.react` from `qrValue`, or use `GET /drop-offs/:id/qr`.

`PUT /drop-offs/:id` – same multipart format. An entry **with** `id` updates that item (send a new `photo_N` only to replace its photo),
an entry **without** `id` adds an item (photo required), and existing items left out of the list are removed (kept as CANCELLED).
The QR never changes, so the printed label stays valid. Editing is refused once any item has been deposited.

Operators scan the QR once and then act on **one item** (`itemId`), **chosen items** (`itemIds`) or **everything that can take the action** (`dropOffId`).
With `dropOffId`, items that cannot take the action are returned in `skipped`; a storage action is refused as a whole if the location lacks capacity.
Each item still gets its own `transactions` and `item_status_history` rows.

`POST /items` (single item) still works – it creates a drop-off containing one item.

## Test console
Open http://localhost:5000 after starting the server for a simple page covering login, item registration, QR scanning and the handover actions (demo/testing only; the real frontend is a separate project).
