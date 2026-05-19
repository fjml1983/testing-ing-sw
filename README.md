# IS-26 Testing - Pruebas de integración incluidas en frontend y backend.

Proyecto que integra tecnologías de pruebas para realizar pruebas de integración.

## Stack

- Frontend: React + Vite
- Backend: Express
- Base de datos: SQLite (archivo local `server/store.sqlite`)

# Tecnologías de  prueba

Prueba del frontend
- VITEST + OpenAPI + Mock(MSW)
- Frontend (Simulamos el backend)

Prueba del backend
- JEST + SUPERTEST
- Backend (Simulamos el frontend)

## Regla para socio/no socio

Para esta primera version se usa la siguiente regla:

- Si `Nombre del socio` tiene texto, se considera **Socio**.
- Si `Nombre del socio` esta vacio, se considera **No socio**.

## Reglas de negocio implementadas

1. El anio debe tener exactamente 4 digitos (si capturas menos de 4, no se completa automaticamente).
2. Un socio puede comprar o rentar DVDs.
3. Un socio puede rentar juegos Xbox.
4. Un no socio solamente puede comprar DVDs.

## Validaciones del formulario

- `Titulo`: alfanumerico con espacios, maximo 25 caracteres, obligatorio.
- `Anio`: numerico de 4 digitos, obligatorio.
- `Formato`: opciones `DVD` o `Xbox`, obligatorio.
- `Operacion`: opciones `venta` o `renta`, obligatorio.
- `Nombre del socio`: alfanumerico con espacios (si va vacio => no socio).

## Ejecutar las pruebas del proyecto

Abrir 2 terminales:

### 1) Backend

```bash
cd server
npm run test
```

### 2) Frontend

```bash
cd client
npm run test
```

## Ejecutar el proyecto

Abrir 2 terminales:

### 1) Backend

```bash
cd server
npm run dev
```

Backend en `http://localhost:3001`

### 2) Frontend

```bash
cd client
npm run dev
```

Frontend en `http://localhost:5173`

## Endpoints

- `GET /api/operations` - Lista las ultimas operaciones
- `POST /api/operations` - Registra una operacion
