const request = require('supertest');
const app = require('../index');

// 테스트용 사용자 ID
const TEST_USER_ID = 'test-user-123';
const TEST_USER_EMAIL = 'test@example.com';

// 테스트용 헤더
const testHeaders = {
  'X-User-ID': TEST_USER_ID,
  'X-User-Email': TEST_USER_EMAIL
};

describe('API Health Tests', () => {
  // 1. 기본 API 엔드포인트 테스트
  describe('Basic API Health', () => {
    test('GET /api/health - 헬스체크', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body).toHaveProperty('status');
      expect(response.body.status).toBe('OK');
      expect(response.body).toHaveProperty('timestamp');
    });

    test('GET /api/characters - 캐릭터 목록 조회', async () => {
      const response = await request(app)
        .get('/api/characters')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    test('GET /api/characters/recommended - 추천 캐릭터 조회', async () => {
      const response = await request(app)
        .get('/api/characters/recommended')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    test('GET /api/characters/types - 캐릭터 타입 목록', async () => {
      const response = await request(app)
        .get('/api/characters/types')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    test('GET /api/characters/hashtags - 해시태그 목록', async () => {
      const response = await request(app)
        .get('/api/characters/hashtags')
        .expect(200);

      expect(typeof response.body).toBe('object');
      expect(response.body).toHaveProperty('성격');
    });
  });

  // 2. 인증 테스트
  describe('Authentication Tests', () => {
    test('GET /api/characters/my - 인증 필요 (401 without header)', async () => {
      await request(app)
        .get('/api/characters/my')
        .expect(401);
    });

    test('GET /api/characters/my - 인증 성공 (200 with header)', async () => {
      const response = await request(app)
        .get('/api/characters/my')
        .set(testHeaders)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  // 3. 에러 핸들링 테스트
  describe('Error Handling', () => {
    test('GET /api/characters/invalid-id - 존재하지 않는 캐릭터 (404)', async () => {
      await request(app)
        .get('/api/characters/invalid-character-id')
        .expect(404);
    });

    test('POST /api/characters - 이름 없이 캐릭터 생성 (400)', async () => {
      const invalidData = {
        age: '25',
        gender: 'female'
        // name 필드 누락
      };

      const response = await request(app)
        .post('/api/characters')
        .set(testHeaders)
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Name is required');
    });
  });
}); 