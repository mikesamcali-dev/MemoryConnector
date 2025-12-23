# Operational Runbooks

## RB-001: AI Cost Spike

**Trigger**: Slack alert - AI spend at 80% or 100% of daily budget

### Immediate Actions (< 5 minutes)

1. **Check admin dashboard**: https://admin.memoryconnector.com/ai-costs
   - Current spend vs budget
   - Circuit breaker status
   - Top users by usage

2. **Assess the cause**:
   - Normal traffic growth?
   - Single user abuse?
   - Bug causing repeated API calls?

### If Abuse Detected

3. **Rate-limit the user**:
   ```bash
   curl -X POST https://api.memoryconnector.com/admin/users/{userId}/rate-limit \
     -H "Authorization: Bearer $ADMIN_TOKEN" \
     -d '{"ai_calls_per_day": 10}'
   ```

4. **Review user activity**:
   ```sql
   SELECT operation, COUNT(*), SUM(cost_cents)
   FROM ai_cost_tracking
   WHERE user_id = '{userId}' AND date = CURRENT_DATE
   GROUP BY operation;
   ```

### If Legitimate Traffic

5. **Consider options**:
   - Accept queue mode until midnight
   - Temporarily increase daily budget (requires manager approval)
   - Enable local classification fallback

6. **Increase budget if approved**:
   ```bash
   redis-cli SET ai:daily:budget 15000  # $150
   ```

### Post-Incident

7. **Create incident report** with:
   - Root cause
   - Impact (memories in queue, user experience)
   - Prevention measures

8. **Review budget allocation**:
   - Adjust perUserDailyClassifications if too generous
   - Consider pricing tier changes

---

## RB-002: Queue Backlog

**Trigger**: Slack alert - Queue depth > 5000 messages

### Immediate Actions (< 5 minutes)

1. **Check Redis queue depth**:
   ```bash
   redis-cli LLEN enrichment:queue
   redis-cli LLEN enrichment:queue:deferred
   ```

2. **Check worker health**:
   ```bash
   # Check if worker process is running
   ps aux | grep worker
   # Check logs
   docker logs memory-connector-worker
   ```

### If Workers Down

3. **Restart worker service**:
   ```bash
   docker restart memory-connector-worker
   # Or if using process manager
   pm2 restart worker
   ```

4. **Check logs for errors**:
   ```bash
   docker logs --tail 100 memory-connector-worker
   ```

### If Workers Slow

5. **Check downstream dependencies**:
   - OpenAI API status: https://status.openai.com
   - Database connections: Check connection pool metrics
   - Redis connectivity

6. **Scale workers if needed**:
   ```bash
   # Increase worker instances
   docker-compose up -d --scale worker=5
   ```

### Monitoring Recovery

7. **Watch drain rate**:
   ```bash
   watch -n 30 'redis-cli LLEN enrichment:queue'
   ```

8. **Expected recovery**: Queue should drain within 30 minutes of fix

---

## RB-003: pgvector Performance Regression

**Trigger**: Search P95 latency > 500ms for 10+ minutes

### Immediate Actions (< 5 minutes)

1. **Check database metrics**:
   - CPU utilization
   - Free memory
   - Database connections
   - IOPS

2. **Check for long-running queries**:
   ```sql
   SELECT pid, now() - pg_stat_activity.query_start AS duration, query
   FROM pg_stat_activity
   WHERE (now() - pg_stat_activity.query_start) > interval '5 minutes'
   AND state != 'idle';
   ```

### Diagnostics

3. **Check index health**:
   ```sql
   SELECT schemaname, relname, indexrelname, idx_scan, idx_tup_read
   FROM pg_stat_user_indexes
   WHERE relname LIKE 'embeddings%'
   ORDER BY idx_scan DESC;
   ```

4. **Check for bloat**:
   ```sql
   SELECT relname, n_dead_tup, n_live_tup, 
          round(n_dead_tup * 100.0 / nullif(n_live_tup, 0), 2) as dead_pct
   FROM pg_stat_user_tables
   WHERE relname LIKE 'embeddings%';
   ```

5. **Run VACUUM if needed**:
   ```sql
   VACUUM ANALYZE embeddings;
   ```

### If Index Not Being Used

6. **Check query plan**:
   ```sql
   EXPLAIN ANALYZE SELECT memory_id, 1 - (vector <=> '[...]') as similarity
   FROM embeddings WHERE user_id = '...'
   ORDER BY vector <=> '[...]' LIMIT 20;
   ```

7. **Verify HNSW settings**:
   ```sql
   SHOW hnsw.ef_search;  -- Should be 40
   ```

8. **Reindex if needed** (causes brief lock):
   ```sql
   REINDEX INDEX CONCURRENTLY idx_embeddings_p0_hnsw;
   ```

### Enable Fallback

9. **Force keyword search via feature flag**:
   ```bash
   # Set environment variable to force keyword search
   export FORCE_KEYWORD_SEARCH=true
   # Restart API service
   ```

### Escalation

10. **If not resolved in 30 minutes**: Page database on-call

