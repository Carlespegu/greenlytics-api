# GreenLytics V3 (.NET) - Fase 1

Aquest directori conté l'esquelet inicial de la `V3` del backend en `.NET`, pensat per conviure amb la `V2` actual en Python.

## Objectiu de la fase 1

- Una sola aplicació desplegable
- Arquitectura per capes preparada per separar després `Public API` i `Internal API`
- Components reutilitzables a `Shared`, `Application` i `Infrastructure`
- Mateixa base de dades PostgreSQL
- Integracions privades només des del backend:
  - OpenAI
  - Supabase Storage
  - email / alerts

## Estructura

- `GreenLytics.V3.Api`
  - Punt d'entrada HTTP
  - Controladors públics
  - Auth, CORS, Swagger
- `GreenLytics.V3.Application`
  - Casos d'ús
  - DTOs
  - Contracts per infra
- `GreenLytics.V3.Domain`
  - Entitats i enums
- `GreenLytics.V3.Infrastructure`
  - EF Core
  - Persistència
  - Storage / OpenAI / serveis externs
- `GreenLytics.V3.Shared`
  - Envoltoris comuns
  - Excepcions reutilitzables

## Patró de separació Public / Internal

En aquesta fase encara és una sola app, però ja queda preparada així:

- `api/public/...`
  - contractes externs
  - consumits per frontend, sensors o tercers
- casos d'ús a `Application`
- serveis externs i BBDD a `Infrastructure`

En una fase posterior, la mateixa separació es pot convertir en dos processos o dos serveis sense reescriure el domini.

## Primers mòduls ja esbossats

- plantes
- fotos
- storage privat de Supabase
- anàlisi de planta amb 3 fotos

## Notes importants

1. Aquí no s'ha pogut executar `dotnet new` ni compilar perquè el SDK no està instal·lat en aquest entorn.
2. La integració d'OpenAI està deixada com a punt d'extensió a `OpenAiPlantAnalysisService`.
3. El controlador públic de plantes ja modela el flux objectiu:
   - `POST /api/public/plants/analyze-photos`
   - `POST /api/public/plants/with-photos`

## Variables esperades

- `ConnectionStrings__DefaultConnection`
- `Supabase__Url`
- `Supabase__ServiceRoleKey`
- `Supabase__Bucket`

## Següent pas recomanat

1. Instal·lar `.NET 8 SDK`
2. Obrir la solució
3. Compilar
4. Implementar:
   - auth real
   - OpenAI real
   - repositoris/queries per plantes, fotos i thresholds
   - control de concurrència optimista com a la V2
