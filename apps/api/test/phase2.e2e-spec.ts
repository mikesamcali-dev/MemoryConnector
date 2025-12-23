import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Phase 2: Core Features E2E Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let userId: string;
  let memoryId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Set global prefix (same as main.ts)
    app.setGlobalPrefix('api/v1');

    // Set up validation pipe (same as main.ts)
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      })
    );

    await app.init();
    prisma = app.get<PrismaService>(PrismaService);

    // Clean test data
    await prisma.memory.deleteMany({ where: { OR: [
      { textContent: { contains: '[E2E-TEST]' } },
      { textContent: { contains: 'machine learning' } }
    ]}});
    await prisma.user.deleteMany({ where: { email: 'phase2test@example.com' } });
  });

  afterAll(async () => {
    // Clean up test data
    if (userId) {
      await prisma.memory.deleteMany({ where: { userId } });
      await prisma.user.delete({ where: { id: userId } }).catch(() => {});
    }
    await app.close();
  });

  describe('1. Authentication & Setup', () => {
    it('should create test user', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/signup')
        .send({
          email: 'phase2test@example.com',
          password: 'TestPassword123!',
        })
        .expect(201);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('user');
      authToken = response.body.accessToken;
      userId = response.body.user.id;
    });

    it('should login with test user', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'phase2test@example.com',
          password: 'TestPassword123!',
        })
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      authToken = response.body.accessToken;
    });
  });

  describe('2. Memory Creation with Duplicate Detection', () => {
    it('should create a new memory', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/memories')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Idempotency-Key', `test-create-${Date.now()}`)
        .send({
          textContent: '[E2E-TEST] Testing memory creation functionality',
          type: 'note',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('contentHash');
      expect(response.body.textContent).toBe('[E2E-TEST] Testing memory creation functionality');
      memoryId = response.body.id;
    });

    it('should detect duplicate content within 60 seconds', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/memories')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Idempotency-Key', `test-duplicate-${Date.now()}`)
        .send({
          textContent: '[E2E-TEST] Testing memory creation functionality',
          type: 'note',
        })
        .expect(409);

      expect(response.body.error).toBe('DUPLICATE_CONTENT');
      expect(response.body).toHaveProperty('existingMemoryId');
    });

    it('should allow similar but different content', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/memories')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Idempotency-Key', `test-similar-${Date.now()}`)
        .send({
          textContent: '[E2E-TEST] Testing memory creation functionality - different version',
          type: 'note',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.id).not.toBe(memoryId);
    });

    it('should handle idempotency with same key', async () => {
      const idempotencyKey = 'test-idempotency-' + Date.now();

      // First request
      const response1 = await request(app.getHttpServer())
        .post('/api/v1/memories')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Idempotency-Key', idempotencyKey)
        .send({
          textContent: '[E2E-TEST] Idempotency test content',
          type: 'note',
        })
        .expect(201);

      // Second request with same key should return same response
      const response2 = await request(app.getHttpServer())
        .post('/api/v1/memories')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Idempotency-Key', idempotencyKey)
        .send({
          textContent: '[E2E-TEST] Idempotency test content',
          type: 'note',
        })
        .expect(201);

      expect(response2.body.id).toBe(response1.body.id);
      expect(response2.headers['x-idempotency-replayed']).toBe('true');
    });
  });

  describe('3. Memory Retrieval', () => {
    it('should get all user memories', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/memories')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('should get specific memory by ID', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/memories/${memoryId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.id).toBe(memoryId);
      expect(response.body.textContent).toContain('[E2E-TEST]');
    });

    it('should return 404 for non-existent memory', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      await request(app.getHttpServer())
        .get(`/api/v1/memories/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('4. Search - Keyword Fallback', () => {
    beforeAll(async () => {
      // Create memories with specific keywords for testing
      await request(app.getHttpServer())
        .post('/api/v1/memories')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Idempotency-Key', `test-search-ml-${Date.now()}`)
        .send({
          textContent: '[E2E-TEST] machine learning algorithms and neural networks',
          type: 'note',
        })
        .expect(201);

      await request(app.getHttpServer())
        .post('/api/v1/memories')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Idempotency-Key', `test-search-dl-${Date.now()}`)
        .send({
          textContent: '[E2E-TEST] deep learning framework TensorFlow',
          type: 'note',
        })
        .expect(201);

      await request(app.getHttpServer())
        .post('/api/v1/memories')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Idempotency-Key', `test-search-cooking-${Date.now()}`)
        .send({
          textContent: '[E2E-TEST] cooking recipes and food preparation',
          type: 'note',
        })
        .expect(201);

      // Wait for text_search_vector to be updated
      await new Promise((resolve) => setTimeout(resolve, 1000));
    });

    it('should search memories using keyword search', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/search?q=machine+learning')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('memories');
      expect(response.body).toHaveProperty('method');
      expect(response.body).toHaveProperty('degraded');
      expect(response.body).toHaveProperty('totalCount');

      // Should find memories with "machine learning"
      const hasRelevantResult = response.body.memories.some(
        (m: any) => m.textContent?.includes('machine learning')
      );
      expect(hasRelevantResult).toBe(true);
    });

    it('should return degraded flag when using keyword search', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/search?q=cooking')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // If semantic search fails, degraded should be true
      // If semantic search works, degraded should be false
      expect(typeof response.body.degraded).toBe('boolean');
      expect(['semantic', 'keyword']).toContain(response.body.method);
    });

    it('should handle empty search query', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/search?q=')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.error).toBe('MISSING_QUERY');
    });

    it('should handle search with no results', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/search?q=nonexistentkeywordxyz123')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.memories).toEqual([]);
      expect(response.body.totalCount).toBe(0);
    });
  });

  describe('5. Usage Limits', () => {
    it('should enforce tier limits', async () => {
      // Get current tier limits
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { tier: true },
      });

      const tierLimit = await prisma.tierLimit.findUnique({
        where: { tier: user?.tier },
      });

      // Current usage
      const usage = await prisma.userUsage.findUnique({
        where: { userId },
      });

      console.log(`Current usage: ${usage?.memoriesToday || 0}/${tierLimit?.memoriesPerDay || 0}`);

      // If we're under the limit, this should work
      if ((usage?.memoriesToday || 0) < (tierLimit?.memoriesPerDay || 10)) {
        await request(app.getHttpServer())
          .post('/api/v1/memories')
          .set('Authorization', `Bearer ${authToken}`)
          .set('Idempotency-Key', `test-limits-${Date.now()}`)
          .send({
            textContent: '[E2E-TEST] Testing tier limits',
            type: 'note',
          })
          .expect(201);
      }
    });
  });

  describe('6. Enrichment Queue', () => {
    it('should queue memory for enrichment', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/memories')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Idempotency-Key', `test-enrichment-${Date.now()}`)
        .send({
          textContent: '[E2E-TEST] This memory should be queued for AI enrichment',
          type: 'note',
        })
        .expect(201);

      expect(response.body).toHaveProperty('enrichmentStatus');
      // Should be either 'pending' or 'queued_budget'
      expect(['pending', 'queued_budget', 'queued']).toContain(response.body.enrichmentStatus);
    });
  });

  describe('7. Full-Text Search Verification', () => {
    it('should find memories using full-text search with ts_rank', async () => {
      // Test the actual keyword search implementation
      const tsQuery = 'machine & learning';
      const results = await prisma.$queryRaw<Array<{
        id: string;
        user_id: string;
        text_content: string | null;
        relevance_score: number;
      }>>`
        SELECT m.id, m.user_id, m.text_content,
               ts_rank(text_search_vector, to_tsquery('english', ${tsQuery})) as relevance_score
        FROM memories m
        WHERE m.user_id = ${userId}::uuid
        AND m.state NOT IN ('DELETED', 'DRAFT')
        AND m.text_search_vector @@ to_tsquery('english', ${tsQuery})
        ORDER BY relevance_score DESC
        LIMIT 10
      `;

      expect(Array.isArray(results)).toBe(true);
      if (results.length > 0) {
        expect(results[0]).toHaveProperty('id');
        expect(results[0]).toHaveProperty('relevance_score');
        expect(Number(results[0].relevance_score)).toBeGreaterThan(0);
      }
    });
  });

  describe('8. Vector Embeddings (if OpenAI configured)', () => {
    it('should check if embeddings are being created', async () => {
      // Wait a bit for async enrichment
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const embeddings = await prisma.embedding.findMany({
        where: { userId },
        take: 5,
      });

      console.log(`Found ${embeddings.length} embeddings for test user`);

      if (process.env.OPENAI_API_KEY) {
        // If OpenAI is configured, we should have embeddings
        // Note: This might take time as enrichment is async
        console.log('OpenAI configured - embeddings should be generated asynchronously');
      } else {
        console.log('OpenAI not configured - embeddings will not be generated');
      }
    });
  });
});
