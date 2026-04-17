# Auth, Migracions i Logout Frontend

## Migracio actual

La primera migracio de `auth` i auditoria es:

- `202604110001_AddAuthSessionsAndAudit`

Cobreix:

- `usersessions`
- `users.supabaseauthuserid`
- `deletedby` a `users`, `plants` i `photos`
- extensio conservadora de `photo_types`
- extensio conservadora de `roles`

## Aplicacio de migracions

```powershell
dotnet tool restore
dotnet ef database update --project src\GreenLytics.V3.Infrastructure\GreenLytics.V3.Infrastructure.csproj --startup-project src\GreenLytics.V3.Api\GreenLytics.V3.Api.csproj
```

## Logout funcional

El backend invalida la sessio local a `POST /auth/logout`.

Per tancar tambe la sessio de Supabase, el frontend ha de fer aquest ordre:

1. Cridar `POST /auth/logout` amb el bearer token actual.
2. Si la resposta es `200`, executar `supabase.auth.signOut()`.
3. Netejar tokens locals, estat d'usuari i caches de dades sensibles.

## Endpoints de Plants + Photos preparats per protegir

Els següents endpoints ja estan preparats per protegir-se amb `AuthorizationPolicies.Authenticated` al seguent pas:

- `POST /api/public/plants/analyze-photos`
- `POST /api/public/plants/with-photos`
