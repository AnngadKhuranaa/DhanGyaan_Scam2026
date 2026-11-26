import request from 'supertest';
import { registerUser, resetState, startTestServer, stopTestServer } from './helpers/setup.js';

let app;
let fake;

beforeAll(async () => {
  ({ app, fake } = await startTestServer());
});
afterAll(stopTestServer);
beforeEach(() => resetState(fake));

const refreshCookie = (res) => (res.headers['set-cookie'] || []).find((c) => c.startsWith('refreshToken='));

describe('auth flow', () => {
  test('register returns user + access token, sets an httpOnly refresh cookie, never returns the password', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'Asha_01', email: 'Asha@Example.com', password: 'secret123' });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ success: true, message: 'Account created' });
    expect(res.body.data.accessToken).toEqual(expect.any(String));
    expect(res.body.data.user).toMatchObject({ username: 'asha_01', email: 'asha@example.com', balance: 1_000_000 });
    expect(JSON.stringify(res.body)).not.toMatch(/password|\$2[aby]\$/);

    const cookie = refreshCookie(res);
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/Path=\/api\/auth/);
  });

  test('duplicate username or email is a 409', async () => {
    await registerUser(app, { username: 'dupe', email: 'dupe@example.com' });
    const res = await request(app).post('/api/auth/register').send({ username: 'DUPE', email: 'other@example.com', password: 'secret123' });
    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/username/i);
  });

  test('register validates every field and returns per-field errors', async () => {
    const res = await request(app).post('/api/auth/register').send({ username: 'a', email: 'nope', password: 'short', phone: '12' });
    expect(res.status).toBe(400);
    const fields = res.body.data.errors.map((e) => e.field);
    expect(fields).toEqual(expect.arrayContaining(['username', 'email', 'password', 'phone']));
  });

  test('login works with username or email; wrong password is a generic 401', async () => {
    const { user, password } = await registerUser(app);
    const byName = await request(app).post('/api/auth/login').send({ identifier: user.username, password });
    const byEmail = await request(app).post('/api/auth/login').send({ identifier: user.email.toUpperCase(), password });
    const wrong = await request(app).post('/api/auth/login').send({ identifier: user.username, password: 'wrong-pass1' });
    const unknown = await request(app).post('/api/auth/login').send({ identifier: 'nobody', password: 'whatever1' });

    expect(byName.status).toBe(200);
    expect(byEmail.status).toBe(200);
    expect(wrong.status).toBe(401);
    expect(unknown.status).toBe(401);
    expect(wrong.body.message).toBe(unknown.body.message); // no account enumeration
  });

  test('NoSQL injection in login is rejected', async () => {
    await registerUser(app);
    const res = await request(app).post('/api/auth/login').send({ identifier: { $ne: null }, password: 'secret123' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('/me requires a valid access token', async () => {
    const { auth, user } = await registerUser(app);
    expect((await request(app).get('/api/auth/me')).status).toBe(401);
    expect((await request(app).get('/api/auth/me').set('Authorization', 'Bearer not-a-jwt')).status).toBe(401);
    const ok = await request(app).get('/api/auth/me').set(auth);
    expect(ok.status).toBe(200);
    expect(ok.body.data.user.id).toBe(user.id);
  });

  test('refresh issues a new access token from the cookie; logout revokes old refresh tokens', async () => {
    const { agent } = await registerUser(app);

    const refreshed = await agent.post('/api/auth/refresh');
    expect(refreshed.status).toBe(200);
    const oldCookie = refreshCookie(refreshed).split(';')[0];

    // The new access token works.
    const me = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${refreshed.body.data.accessToken}`);
    expect(me.status).toBe(200);

    expect((await agent.post('/api/auth/logout')).status).toBe(200);

    // A refresh cookie captured before logout must no longer work (tokenVersion bumped).
    const replay = await request(app).post('/api/auth/refresh').set('Cookie', oldCookie);
    expect(replay.status).toBe(401);
  });

  test('refresh without a cookie is a 401', async () => {
    expect((await request(app).post('/api/auth/refresh')).status).toBe(401);
  });

  test('demo login creates the demo account once and reuses it', async () => {
    const a = await request(app).post('/api/auth/demo');
    const b = await request(app).post('/api/auth/demo');
    expect(a.status).toBe(200);
    expect(a.body.data.user).toMatchObject({ username: 'demo', isDemo: true });
    expect(b.body.data.user.id).toBe(a.body.data.user.id);
  });
});

describe('platform', () => {
  test('health endpoint reports the database', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ status: 'ok', db: 'connected' });
  });

  test('unknown routes return the JSON envelope, not HTML', async () => {
    const res = await request(app).get('/api/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ success: false, data: null, message: expect.stringMatching(/Route not found/) });
  });

  test('malformed JSON is a clean 400', async () => {
    const res = await request(app).post('/api/auth/login').set('Content-Type', 'application/json').send('{bad');
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Malformed JSON body');
  });
});
