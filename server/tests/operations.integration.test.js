const request = require('supertest');
const { createApp } = require('../app');

describe('Pruebas de Integracion API /api/operations', () => {
  let app;
  let closeDatabase;

  beforeAll(() => {
    const instance = createApp({ dbPath: ':memory:' });
    app = instance.app;
    closeDatabase = instance.closeDatabase;
  });

  afterAll(async () => {
    await closeDatabase();
  });

  test('GET retorna lista vacia inicialmente', async () => {
    const response = await request(app).get('/api/operations');

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });

  test('POST crea operacion valida para no socio en DVD venta', async () => {
    const payload = {
      title: 'Rocky 2',
      year: '2001',
      format: 'DVD',
      operation: 'venta',
      memberName: '',
    };

    const postResponse = await request(app).post('/api/operations').send(payload);

    expect(postResponse.status).toBe(201);
    expect(postResponse.body).toMatchObject({
      title: payload.title,
      year: payload.year,
      format: payload.format,
      operation: payload.operation,
      memberName: payload.memberName,
      isMember: false,
    });
    expect(postResponse.body.id).toBeDefined();
    expect(postResponse.body.createdAt).toBeDefined();

    const getResponse = await request(app).get('/api/operations');
    expect(getResponse.status).toBe(200);
    expect(getResponse.body.length).toBe(1);
    expect(getResponse.body[0]).toMatchObject({
      title: payload.title,
      year: payload.year,
      format: payload.format,
      operation: payload.operation,
      memberName: payload.memberName,
    });
  });

  test('POST rechaza anio invalido', async () => {
    const payload = {
      title: 'Terminator',
      year: '20',
      format: 'DVD',
      operation: 'venta',
      memberName: '',
    };

    const response = await request(app).post('/api/operations').send(payload);

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('El anio debe tener exactamente 4 digitos numericos.');
  });

  test('POST rechaza no socio rentando DVD', async () => {
    const payload = {
      title: 'Matrix',
      year: '2004',
      format: 'DVD',
      operation: 'renta',
      memberName: '',
    };

    const response = await request(app).post('/api/operations').send(payload);

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Un no socio solamente puede comprar DVDs.');
  });

  test('POST rechaza socio comprando Xbox', async () => {
    const payload = {
      title: 'Halo Reach',
      year: '2012',
      format: 'Xbox',
      operation: 'venta',
      memberName: 'JUAN PEREZ',
    };

    const response = await request(app).post('/api/operations').send(payload);

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Un socio solo puede rentar juegos Xbox.');
  });
});

describe('Pruebas de Integracion API con falla de base de datos', () => {
  test('GET retorna 500 cuando la base esta cerrada', async () => {
    const instance = createApp({ dbPath: ':memory:' });
    await instance.closeDatabase();

    const response = await request(instance.app).get('/api/operations');

    expect(response.status).toBe(500);
    expect(response.body.message).toBe('No se pudieron obtener las operaciones.');
  });

  test('POST retorna 500 cuando la base esta cerrada', async () => {
    const instance = createApp({ dbPath: ':memory:' });
    await instance.closeDatabase();

    const payload = {
      title: 'Rocky 3',
      year: '2002',
      format: 'DVD',
      operation: 'venta',
      memberName: '',
    };

    const response = await request(instance.app).post('/api/operations').send(payload);

    expect(response.status).toBe(500);
    expect(response.body.message).toBe('No se pudo guardar la operacion.');
  });
});