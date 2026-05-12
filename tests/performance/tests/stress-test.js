import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.API_BASE_URL || 'http://host.docker.internal:3002';

export const options = {
  stages: [
    { duration: '1m', target: 10 },  // Rampa de subida: de 0 a 10 usuarios
    { duration: '2m', target: 20 },  // Carga constante: 20 usuarios (punto crítico para SQLite)
    { duration: '1m', target: 50 },  // Stress: subir a 50 para forzar el bloqueo
    { duration: '1m', target: 0 },   // Rampa de bajada
  ],
  thresholds: {
    http_req_failed: ['rate<0.05'], // Falla si más del 5% de los inserts dan error
    http_req_duration: ['p(95)<1000'], // El 95% de los inserts deben ser < 1s
  },
};

export default function () {
  const url = `${BASE_URL}/api/operations`;
  const payload = JSON.stringify({
    title: `Item ${Math.floor(Math.random() * 1000000)}`,
    year: '2025',
    format: 'DVD',
    operation: 'venta',
    memberName: '',
  });

  const params = {
    headers: { 'Content-Type': 'application/json' },
  };

  const res = http.post(url, payload, params);

  check(res, {
    'insert exitoso (201)': (r) => r.status === 201,
    'db no bloqueada': (r) => !r.body.includes('database is locked'),
  });

  // El "sleep" corto es clave para no matar al servidor de inmediato
  sleep(0.1); 
}
