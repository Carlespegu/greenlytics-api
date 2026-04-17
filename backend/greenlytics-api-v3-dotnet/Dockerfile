FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY Directory.Build.props ./
COPY GreenLytics.V3.sln ./
COPY src/GreenLytics.V3.Shared/GreenLytics.V3.Shared.csproj src/GreenLytics.V3.Shared/
COPY src/GreenLytics.V3.Domain/GreenLytics.V3.Domain.csproj src/GreenLytics.V3.Domain/
COPY src/GreenLytics.V3.Application/GreenLytics.V3.Application.csproj src/GreenLytics.V3.Application/
COPY src/GreenLytics.V3.Infrastructure/GreenLytics.V3.Infrastructure.csproj src/GreenLytics.V3.Infrastructure/
COPY src/GreenLytics.V3.Api/GreenLytics.V3.Api.csproj src/GreenLytics.V3.Api/

RUN dotnet restore ./src/GreenLytics.V3.Api/GreenLytics.V3.Api.csproj

COPY . .
RUN dotnet publish ./src/GreenLytics.V3.Api/GreenLytics.V3.Api.csproj -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app

ENV ASPNETCORE_URLS=http://0.0.0.0:10000
EXPOSE 10000

COPY --from=build /app/publish .

ENTRYPOINT ["dotnet", "GreenLytics.V3.Api.dll"]
