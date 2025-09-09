# 📝 Notes on Multi-Tenant Migrations with TypeORM and Postgres

When building a **multi-tenant application** where each tenant has its
own **Postgres schema**, migrations must always be **schema-aware**.
Otherwise, you'll run into issues like invalid references or syntax
errors (especially when tenant schema names contain special characters
such as `-`).

## 1. Always use `schema` in your migrations

Every time you create or alter a table, make sure you prefix it with the
current tenant's schema:

``` ts
await queryRunner.query(
  `CREATE TABLE "${schema}"."users" (...)`
);
```

This ensures tables are created **inside the tenant schema**, not the
default `public`. and don't forget unique keys too

await queryRunner.query(
  `ALTER TABLE "${schema}"."roles" ADD CONSTRAINT "UQ_${schema}_roles_name" UNIQUE ("name")`
);


## 2. Apply `schema` to foreign keys too

A common mistake is to reference tables without schema:

❌ Wrong

``` sql
REFERENCES "users"("id")
```

✅ Correct

``` sql
REFERENCES "${schema}"."users"("id")
```

Every reference must explicitly point to the tenant schema to avoid
"relation does not exist" errors.

## 3. Quote schema and table names

If your schema contains special characters (like `-`), Postgres will
fail unless you **quote identifiers**:

``` sql
"${schema}"."table_name"
```

Without quotes, Postgres interprets `tenant-company-1` as
`tenant_company` minus `1`.

## 4. Normalize schema names (optional but recommended)

To avoid quoting headaches, normalize tenant schema names when creating
them:

``` ts
const safeSchema = slug.replace(/[^a-zA-Z0-9_]/g, "_");
```

So `company-2` → `company_2`.\
This makes migrations simpler and more portable.

## 5. Consistency is key

-   Tables, columns, constraints, foreign keys → **all must include
    `${schema}`**.\
-   Stick to one approach (either quote carefully everywhere, or
    sanitize tenant slugs up front).

------------------------------------------------------------------------

## ✅ TL;DR (Your Quick Reminder)

-   **Always use `"${schema}"."tablename"` in migrations.**\
-   **Foreign keys must also include schema.**\
-   **Sanitize tenant schema names** (replace `-` with `_`) to make life
    easier.\
-   Quoting identifiers is required if you don't sanitize.
