# MIGRATION VALIDATION PLAN

## Non-Code Verification Guide for pwAutoTesnets Local Testing

**Complete testing guide without implementation code. Practical checklist format for validation after all changes.**

---

## DOCUMENT STRUCTURE

This plan is organized into 14 major sections covering all aspects of the system:

1. **PRE-FLIGHT CHECKS** - Environment and dependency validation
2. **INFRASTRUCTURE BOOTSTRAP** - Docker services startup and verification
3. **API SERVER STARTUP** - HTTP server initialization
4. **WORKER STARTUP** - Worker process initialization
5. **DATABASE & QUEUE** - Run creation and queue operations
6. **PLAYWRIGHT DEBUG - MetaMask** - Selector validation with PWDEBUG=1
7. **PLAYWRIGHT DEBUG - Rabby** - Rabby-specific validation
8. **LOCK LIFECYCLE** - Distributed lock verification
9. **QUEUE & RETRY FLOW** - Task execution and retry logic
10. **ARTIFACTS & TRACING** - Artifact capture verification
11. **DASHBOARD LIVE UPDATES** - Real-time update polling
12. **SECURITY & CLEANUP** - Security and resource cleanup
13. **END-TO-END FLOW** - Complete lifecycle test
14. **COMMON ISSUES & RECOVERY** - Troubleshooting guide

---

## QUICK REFERENCE

**Total validation time**: ~2 hours (can be split into phases)

**Key commands**:
- API: `npm run dev`
- Worker: `npm run worker`
- Debug: `PWDEBUG=1 npm run worker`
- Infrastructure: `docker-compose up -d`

**Key URLs**:
- Health: http://localhost:3000/health
- Runs API: http://localhost:3000/api/runs
- Artifacts: http://localhost:3000/api/runs/<runId>/artifacts

**Key files to monitor**:
- Logs: stdout from Terminal 1 (API) and Terminal 3 (Worker)
- Artifacts: ./artifacts/<runId>/
- Locks: ~/.testnets-locks/
- Database: `docker exec postgres psql -U user -d playwrightautomation`

---

## ENTRY POINTS

**For operations/DevOps**:
→ Start with QUICK_START_CHECKLIST.md (5 min overview)
→ Then follow PRE-FLIGHT CHECKS and INFRASTRUCTURE BOOTSTRAP

**For developers**:
→ Start with PROJECT_STATUS.md (understand what's delivered)
→ Follow API SERVER STARTUP and WORKER STARTUP
→ Debug wallet selectors with PLAYWRIGHT DEBUG sections

**For QA**:
→ Use this entire guide as test plan
→ LOCK LIFECYCLE, QUEUE & RETRY FLOW, ARTIFACTS & TRACING are critical
→ COMMON ISSUES & RECOVERY for troubleshooting

**For DevOps/Release**:
→ SECURITY & CLEANUP section mandatory
→ END-TO-END FLOW to validate production readiness
→ MIGRATION_VALIDATION_PLAN.md section 14 for recovery procedures

---

## WHAT THIS IS NOT

- ❌ No code snippets (implementation is already done)
- ❌ No shell scripts (manual validation ensures understanding)
- ❌ No framework setup (assumes existing project structure)
- ❌ No new tooling (uses existing npm scripts and docker-compose)

---

## HOW TO USE

**Before testing**:
1. Review PROJECT_STATUS.md to understand what's been delivered
2. Review FINAL_STAFF_REVIEW.md to know known issues
3. Skim QUICK_START_CHECKLIST.md for quick reference

**During testing**:
1. Start with PRE-FLIGHT CHECKS (ensure environment is ready)
2. Follow sections 2-5 in order (infrastructure, API, worker)
3. Create a test run (section 5)
4. Validate basic functionality (sections 8-11)
5. If wallet available: test selectors (sections 6-7)
6. If issues occur: check COMMON ISSUES & RECOVERY (section 14)

**After testing**:
1. Document any issues found
2. Cross-reference with FINAL_STAFF_REVIEW.md
3. Create tickets for any new issues
4. Proceed to DEPLOYMENT READINESS assessment

---

## KEY CHECKPOINTS

Must verify BEFORE launch:
- ✅ API server starts without errors
- ✅ Worker connects to database and queue
- ✅ First run created successfully
- ✅ Artifacts captured for any execution
- ✅ Status transitions work correctly
- ✅ Dashboard receives live updates
- ✅ No orphaned resources on shutdown

Nice to verify:
- ✅ MetaMask selectors work (if testing)
- ✅ Rabby selectors work (if testing)
- ✅ Concurrent runs handled correctly
- ✅ Error retry flow works
- ✅ Locks prevent concurrent access

---

## CRITICAL ISSUES TO KNOW ABOUT

See FINAL_STAFF_REVIEW.md for details, but know:
1. Some silent error catches need comments
2. Wallet popup detection may need redesign
3. ProfileLock has potential race condition
4. Test mocks don't reflect real Playwright
5. Queue item validation missing

These are documented and have workarounds, but should be fixed before production.

---

## NEXT STEP

**→ Open QUICK_START_CHECKLIST.md to begin (5 minutes)**

Then follow through sections in order as needed.
