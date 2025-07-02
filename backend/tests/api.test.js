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

describe('API Integration Tests', () => {
  let createdCharacterId;
  let createdPersonaId;
  let createdConversationId;

  // 1. 캐릭터 생성 → DB저장 → 목록조회 테스트
  describe('Character Flow', () => {
    test('POST /api/characters - 캐릭터 생성', async () => {
      const characterData = {
        name: '테스트 캐릭터',
        age: '25',
        gender: 'female',
        characterType: '순수창작 캐릭터',
        description: '테스트용 캐릭터입니다',
        firstImpression: '친근하고 따뜻한 첫인상',
        basicSetting: '테스트 환경에서 활동하는 캐릭터',
        isPublic: true
      };

      const response = await request(app)
        .post('/api/characters')
        .set(testHeaders)
        .send(characterData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe(characterData.name);
      expect(response.body.age).toBe(characterData.age);
      
      createdCharacterId = response.body.id;
    });

    test('GET /api/characters - 모든 캐릭터 목록 조회', async () => {
      const response = await request(app)
        .get('/api/characters')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      
      // 방금 생성한 캐릭터가 목록에 있는지 확인
      const createdCharacter = response.body.find(char => char.id === createdCharacterId);
      expect(createdCharacter).toBeDefined();
      expect(createdCharacter.name).toBe('테스트 캐릭터');
    });

    test('GET /api/characters/my - 내 캐릭터 목록 조회', async () => {
      const response = await request(app)
        .get('/api/characters/my')
        .set(testHeaders)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      
      // 방금 생성한 캐릭터가 내 목록에 있는지 확인
      const myCharacter = response.body.find(char => char.id === createdCharacterId);
      expect(myCharacter).toBeDefined();
    });
  });

  // 2. 페르소나 생성 → DB저장 → 목록조회 테스트
  describe('Persona Flow', () => {
    test('POST /api/personas - 페르소나 생성', async () => {
      const personaData = {
        name: '테스트 페르소나',
        age: '30',
        gender: 'male',
        job: '개발자',
        basicInfo: '테스트를 좋아하는 개발자',
        habits: '코드를 자주 리뷰함'
      };

      const response = await request(app)
        .post('/api/personas')
        .set(testHeaders)
        .send(personaData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe(personaData.name);
      expect(response.body.job).toBe(personaData.job);
      
      createdPersonaId = response.body.id;
    });

    test('GET /api/personas - 모든 페르소나 목록 조회', async () => {
      const response = await request(app)
        .get('/api/personas')
        .set(testHeaders)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      
      // 방금 생성한 페르소나가 목록에 있는지 확인
      const createdPersona = response.body.find(persona => persona.id === createdPersonaId);
      expect(createdPersona).toBeDefined();
      expect(createdPersona.name).toBe('테스트 페르소나');
    });

    test('GET /api/personas/my - 내 페르소나 목록 조회', async () => {
      const response = await request(app)
        .get('/api/personas/my')
        .set(testHeaders)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      
      // 방금 생성한 페르소나가 내 목록에 있는지 확인
      const myPersona = response.body.find(persona => persona.id === createdPersonaId);
      expect(myPersona).toBeDefined();
    });
  });

  // 3. 대화 생성 → DB저장 → 목록조회 테스트
  describe('Conversation Flow', () => {
    test('POST /api/conversations - 대화 생성', async () => {
      const conversationData = {
        characterId: createdCharacterId,
        personaId: createdPersonaId
      };

      const response = await request(app)
        .post('/api/conversations')
        .set(testHeaders)
        .send(conversationData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.characterId).toBe(createdCharacterId);
      expect(response.body.personaId).toBe(createdPersonaId);
      expect(response.body).toHaveProperty('character');
      expect(response.body).toHaveProperty('persona');
      
      createdConversationId = response.body.id;
    });

    test('GET /api/conversations - 모든 대화 목록 조회', async () => {
      const response = await request(app)
        .get('/api/conversations')
        .set(testHeaders)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      
      // 방금 생성한 대화가 목록에 있는지 확인
      const createdConversation = response.body.find(conv => conv.id === createdConversationId);
      expect(createdConversation).toBeDefined();
    });

    test('GET /api/conversations?characterId=X - 특정 캐릭터의 대화 목록 조회', async () => {
      const response = await request(app)
        .get(`/api/conversations?characterId=${createdCharacterId}`)
        .set(testHeaders)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      
      // 모든 대화가 해당 캐릭터와 연결되어 있는지 확인
      response.body.forEach(conversation => {
        expect(conversation.characterId).toBe(createdCharacterId);
      });
    });

    test('GET /api/conversations?personaId=X - 특정 페르소나의 대화 목록 조회', async () => {
      const response = await request(app)
        .get(`/api/conversations?personaId=${createdPersonaId}`)
        .set(testHeaders)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      
      // 모든 대화가 해당 페르소나와 연결되어 있는지 확인
      response.body.forEach(conversation => {
        expect(conversation.personaId).toBe(createdPersonaId);
      });
    });
  });

  // 4. 예외 처리 및 밸리데이션 테스트
  describe('Error Handling & Validation', () => {
    test('POST /api/characters - 이름 없이 캐릭터 생성 시 400 에러', async () => {
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

    test('POST /api/personas - 이름 없이 페르소나 생성 시 400 에러', async () => {
      const invalidData = {
        age: '30',
        gender: 'male'
        // name 필드 누락
      };

      const response = await request(app)
        .post('/api/personas')
        .set(testHeaders)
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Name is required');
    });

    test('POST /api/conversations - 캐릭터 ID 없이 대화 생성 시 400 에러', async () => {
      const invalidData = {
        personaId: createdPersonaId
        // characterId 필드 누락
      };

      const response = await request(app)
        .post('/api/conversations')
        .set(testHeaders)
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Character ID is required');
    });

    test('API 호출 시 사용자 ID 없으면 401 에러', async () => {
      await request(app)
        .get('/api/characters/my')
        // 헤더 없이 요청
        .expect(401);

      await request(app)
        .get('/api/personas/my')
        .expect(401);

      await request(app)
        .get('/api/conversations')
        .expect(401);
    });
  });
}); 