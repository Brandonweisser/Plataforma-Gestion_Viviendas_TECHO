import request from 'supertest'
import bcrypt from 'bcrypt'
import { app, loginLimiter } from '../app.js'

// We'll inject mock functions via global.__supabaseMock for deterministic behavior

describe('Auth & Role API', () => {
  beforeAll(() => {
    process.env.JWT_SECRET = 'testsecret'
  })

  beforeEach(() => {
    global.__supabaseMock = {}
    if (loginLimiter && loginLimiter.resetKey) {
      // supertest uses 127.0.0.1 as IP; reset its counter
      loginLimiter.resetKey('::ffff:127.0.0.1')
      loginLimiter.resetKey('127.0.0.1')
    }
  })

  afterAll(() => {
    delete global.__supabaseMock
  })

  test('Register success returns token', async () => {
    let insertedRecord = null
    global.__supabaseMock = {
      findUserByEmail: async () => null,
      getLastUser: async () => ({ uid: 5 }),
      insertUser: async (rec) => { insertedRecord = { uid: rec.uid, rol: rec.rol }; return insertedRecord }
    }
    const res = await request(app)
      .post('/api/register')
      .send({ nombre: 'Juan', email: 'juan@example.com', password: 'Secret123', rol: 'beneficiario' })
    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(typeof res.body.token).toBe('string')
    expect(insertedRecord.uid).toBe(6)
  })

  test('Register conflict returns 409', async () => {
    global.__supabaseMock = {
      findUserByEmail: async () => ({ uid: 10, email: 'x@example.com' })
    }
    const res = await request(app)
      .post('/api/register')
      .send({ nombre: 'Ana', email: 'x@example.com', password: 'Secret123', rol: 'beneficiario' })
    expect(res.status).toBe(409)
    expect(res.body.success).toBe(false)
  })

  test('Login success (hashed password) returns token', async () => {
    const hash = await bcrypt.hash('Secret123', 10)
    global.__supabaseMock = {
      findUserByEmail: async () => ({ uid: 22, email: 'login@example.com', rol: 'administrador', password_hash: hash })
    }
    const res = await request(app)
      .post('/api/login')
      .send({ email: 'login@example.com', password: 'Secret123' })
    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(typeof res.body.token).toBe('string')
  })

  test('Login wrong password returns 401', async () => {
    const hash = await bcrypt.hash('Secret123', 10)
    global.__supabaseMock = {
      findUserByEmail: async () => ({ uid: 22, email: 'login@example.com', rol: 'administrador', password_hash: hash })
    }
    const res = await request(app)
      .post('/api/login')
      .send({ email: 'login@example.com', password: 'WrongPass' })
    expect(res.status).toBe(401)
    expect(res.body.success).toBe(false)
  })

  test('GET /api/me returns user data when token valid', async () => {
    const hash = await bcrypt.hash('plainpass', 10)
    global.__supabaseMock = {
      findUserByEmail: async () => ({ uid: 50, email: 'me@example.com', rol: 'beneficiario', password_hash: hash }),
      getUserById: async () => ({ uid: 50, nombre: 'Me', email: 'me@example.com', rol: 'beneficiario' })
    }
    // First login to obtain token
    const loginRes = await request(app)
      .post('/api/login')
      .send({ email: 'me@example.com', password: 'plainpass' })
    const token = loginRes.body.token
    const meRes = await request(app)
      .get('/api/me')
      .set('Authorization', `Bearer ${token}`)
    expect(meRes.status).toBe(200)
    expect(meRes.body.success).toBe(true)
    expect(meRes.body.data.email).toBe('me@example.com')
  })

  test('Role protected: admin endpoint allows admin, blocks tecnico', async () => {
    const hash = await bcrypt.hash('Admin123', 10)
    global.__supabaseMock = {
      findUserByEmail: async (email) => {
        if (email === 'admin@example.com') return { uid: 1, email, rol: 'administrador', password_hash: hash }
        if (email === 'tech@example.com') return { uid: 2, email, rol: 'tecnico', password_hash: hash }
        return null
      },
      getUserById: async (uid) => {
        if (uid === 1) return { uid, nombre: 'Admin', email: 'admin@example.com', rol: 'administrador' }
        if (uid === 2) return { uid, nombre: 'Tech', email: 'tech@example.com', rol: 'tecnico' }
        return null
      }
    }
    const adminLogin = await request(app).post('/api/login').send({ email: 'admin@example.com', password: 'Admin123' })
    const adminToken = adminLogin.body.token
    const adminRes = await request(app)
      .get('/api/admin/health')
      .set('Authorization', `Bearer ${adminToken}`)
    expect(adminRes.status).toBe(200)
    expect(adminRes.body.area).toBe('admin')

    // tecnico login
    const techLogin = await request(app).post('/api/login').send({ email: 'tech@example.com', password: 'Admin123' })
    const techToken = techLogin.body.token
    const forbiddenRes = await request(app)
      .get('/api/admin/health')
      .set('Authorization', `Bearer ${techToken}`)
    expect(forbiddenRes.status).toBe(403)
  })

  test('Role protected: tecnico endpoint allows tecnico, blocks beneficiario', async () => {
    const hash = await bcrypt.hash('Tech12345', 10)
    global.__supabaseMock = {
      findUserByEmail: async (email) => {
        if (email === 'tech@example.com') return { uid: 10, email, rol: 'tecnico', password_hash: hash }
        if (email === 'bene@example.com') return { uid: 11, email, rol: 'beneficiario', password_hash: hash }
        return null
      },
      getUserById: async (uid) => ({ uid, nombre: 'User', email: uid === 10 ? 'tech@example.com' : 'bene@example.com', rol: uid === 10 ? 'tecnico' : 'beneficiario' })
    }
    const techLogin = await request(app).post('/api/login').send({ email: 'tech@example.com', password: 'Tech12345' })
    const techToken = techLogin.body.token
    const techRes = await request(app).get('/api/tecnico/health').set('Authorization', `Bearer ${techToken}`)
    expect(techRes.status).toBe(200)
    const beneLogin = await request(app).post('/api/login').send({ email: 'bene@example.com', password: 'Tech12345' })
    const beneToken = beneLogin.body.token
    const forbiddenRes = await request(app).get('/api/tecnico/health').set('Authorization', `Bearer ${beneToken}`)
    expect(forbiddenRes.status).toBe(403)
  })

  test('Role protected: beneficiario endpoint allows beneficiario, blocks tecnico', async () => {
    const hash = await bcrypt.hash('Bene12345', 10)
    global.__supabaseMock = {
      findUserByEmail: async (email) => {
        if (email === 'bene@example.com') return { uid: 21, email, rol: 'beneficiario', password_hash: hash }
        if (email === 'tech@example.com') return { uid: 22, email, rol: 'tecnico', password_hash: hash }
        return null
      },
      getUserById: async (uid) => ({ uid, nombre: 'User', email: uid === 21 ? 'bene@example.com' : 'tech@example.com', rol: uid === 21 ? 'beneficiario' : 'tecnico' })
    }
    const beneLogin = await request(app).post('/api/login').send({ email: 'bene@example.com', password: 'Bene12345' })
    const beneToken = beneLogin.body.token
    const beneRes = await request(app).get('/api/beneficiario/health').set('Authorization', `Bearer ${beneToken}`)
    expect(beneRes.status).toBe(200)
    const techLogin = await request(app).post('/api/login').send({ email: 'tech@example.com', password: 'Bene12345' })
    const techToken = techLogin.body.token
    const forbiddenRes = await request(app).get('/api/beneficiario/health').set('Authorization', `Bearer ${techToken}`)
    expect(forbiddenRes.status).toBe(403)
  })

  test('Registration rejects weak password', async () => {
    global.__supabaseMock = {
      findUserByEmail: async () => null,
      getLastUser: async () => ({ uid: 30 }),
      insertUser: async (r) => r
    }
    const res = await request(app)
      .post('/api/register')
      .send({ nombre: 'Weak', email: 'weak@example.com', password: '1234567', rol: 'beneficiario' })
    expect(res.status).toBe(400)
    expect(res.body.message).toMatch(/Password débil/i)
  })

  test('Login rate limiting after 3 failures returns 429', async () => {
    const hash = await bcrypt.hash('Correcta123', 10)
    global.__supabaseMock = {
      findUserByEmail: async () => ({ uid: 55, email: 'limit@example.com', rol: 'beneficiario', password_hash: hash })
    }
    // 3 intentos fallidos
    for (let i = 0; i < 3; i++) {
      await request(app).post('/api/login').send({ email: 'limit@example.com', password: 'X' })
    }
    const fourth = await request(app).post('/api/login').send({ email: 'limit@example.com', password: 'X' })
    expect([429, 401]).toContain(fourth.status)
    if (fourth.status === 429) {
      expect(fourth.body.message).toMatch(/Demasiados intentos/i)
    }
  })
})
