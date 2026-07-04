FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY Enterprise/Enterprise.csproj Enterprise/
RUN dotnet restore Enterprise/Enterprise.csproj
COPY Enterprise/ Enterprise/
RUN dotnet publish Enterprise/Enterprise.csproj -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY --from=build /app/publish .
ENV ASPNETCORE_URLS=http://+:8083
EXPOSE 8083
ENTRYPOINT ["dotnet", "Enterprise.dll"]
