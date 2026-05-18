# Performance Tests

Este directorio contiene el stress test con `k6` para la API de `api/operations`.

## Requisitos

- Tener el backend levantado en `http://localhost:3002`.
- Tener instalado Docker Desktop.
- Ejecutar los comandos desde esta carpeta: `tests/performance`.

## Levanta la infraestructura:
Desde tu terminal en la raíz del proyecto, ejecuta:

```bash
docker compose up -d influxdb grafana
```

Usa el código con precaución.Esto dejará corriendo la base de datos y el panel visual.
Configura Grafana (solo la primera vez):
1. Entra en http://localhost:3001.Ve a Connections > Data Sources > Add data source.Selecciona InfluxDB. En URL pon: http://influxdb:8086. En Database pon: k6. Haz clic en Save & Test.
2. Importa un Dashboard:Ve a Dashboards > New > Import. Pega el ID 2587 (es el dashboard estándar de k6) y dale a Load.

## Ejecutar el stress test

1. Ir a la carpeta de performance:

```bash
cd tests/performance
```

2. Ejecutar `k6` con Docker Compose:

```bash
docker compose run --rm k6 run /scripts/stress-test.js
```

## URL del backend

El script usa por defecto:

```text
http://host.docker.internal:3002
```

Si necesitas cambiar la base URL, puedes usar la variable de entorno `API_BASE_URL`:

```bash
docker compose run --rm -e API_BASE_URL=http://host.docker.internal:3002 k6 run /scripts/stress-test.js
```

## Qué valida el test

- `POST /api/operations`
- Código esperado: `201`
- Campos esperados:
  - `title`
  - `year`
  - `format`
  - `operation`
  - `memberName`

## Notas

- El backend actual expone `GET /api/operations` y `POST /api/operations`.
- La base de datos usada por el servidor es SQLite local.