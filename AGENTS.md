# Guidelines for Future AI / Antigravity Agent Sessions

## 1. Core Principles
* **DO NOT REBUILD OR REGENERATE**: Always inspect existing code first. The project already has a complete, working Spring Boot 3 + Oracle XE backend with 15 controllers and JDBC repositories.
* **PRESERVE ORACLE XE COMPATIBILITY**: The database is Oracle Database 10g/XE running locally on `localhost:1521:XE`. Never switch to H2, MySQL, PostgreSQL, or SQLite. Do not perform destructive schema or drop table commands.
* **OFFLINE RUNTIME REQUIREMENT**: The system must run completely offline without relying on external CDN scripts, remote fonts, or internet APIs. All CSS, JS, and fonts must be local.
* **SECURITY AND INTEGRITY**:
  * Financial transactions must use server-side validation, JDBC atomic transactions (`@Transactional`), and pessimistic locking (`FOR UPDATE`).
  * Balances must NEVER be calculated or updated purely in the frontend.
  * Never log or display sensitive credentials, PINs, CVVs, or database passwords in the console or UI.
* **INCREMENTAL CHANGES**: Focus on one small, coherent task at a time. Compile, test, and verify before marking complete.
* **KEEP HANDOFF FILES UPDATED**: At the end of every session or task completion, update `PROJECT_HANDOFF.md` and `TASKS.md` with what was completed and what remains.

## 2. Environment Quick Reference
* **Maven Path**: `C:\Users\kanch\apache-maven-3.9.9\bin\mvn.cmd`
* **Java**: Eclipse Adoptium JDK 17 (`C:\Program Files\Eclipse Adoptium\jdk-17.0.20.101-hotspot\bin\java.exe`)
* **Oracle SQL*Plus**: `C:\oraclexe\app\oracle\product\10.2.0\server\BIN\sqlplus.exe`
* **Application URL**: `http://localhost:8081`
* **Default Admin Credentials**: `admin` / `admin123`
* **Frontend Sync**: Frontend source is in `frontend/`. When building with maven (`mvn test-compile` or `mvn package`), resources are automatically synced to `backend/src/main/resources/static/` via the maven-resources-plugin configured in `pom.xml`.
