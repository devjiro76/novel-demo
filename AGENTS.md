# Agents Configuration

## Default Agent: Claude Code (Solo Mode)

이 프로젝트는 Solo 모드로 운영됩니다.
Claude Code가 계획, 구현, 검증을 모두 수행합니다.

### Workflow

1. `/plan-with-agent` — Plans.md에 작업 계획 수립
2. `/work` — Plans.md의 태스크를 순차 실행
3. `/verify` — 빌드 검증 및 에러 복구

### Task Markers

| Marker | Status | Description |
|--------|--------|-------------|
| `cc:TODO` | 미착수 | 실행 예정 |
| `cc:WIP` | 작업중 | 구현 중 |
| `cc:DONE` | 완료 | 구현 완료 |
| `cc:blocked` | 블록 | 의존 태스크 대기 |
