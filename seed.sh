#!/bin/bash
# seed.sh — Create village + 5 NPC personas + actions + relationships in World API
#
# Usage: WORLD_API_URL=http://localhost:8788 API_KEY=dev-test-key ./seed.sh
#        WORLD_API_URL=http://localhost:8788 API_KEY=dev-test-key ./seed.sh --force
#
# Options:
#   --force    Delete and recreate existing personas (updates config)
#
# This script creates:
#   1. A village named "못참아"
#   2. 5 NPC personas (jeongsuk, eunhye, mina, jeongjung, deokhui)
#   3. 16 action definitions with appraisal vectors
#   4. Bidirectional relationships (NPC↔NPC family/romantic + NPC↔User)

set -euo pipefail

API="${WORLD_API_URL:-http://localhost:8788}"
KEY="${API_KEY:-dev-test-key}"
FORCE=false

for arg in "$@"; do
  case $arg in
    --force) FORCE=true ;;
  esac
done

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log() { echo -e "${GREEN}[OK]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
err() { echo -e "${RED}[ERR]${NC} $1"; }

header() {
  echo ""
  echo "================================"
  echo " $1"
  echo "================================"
}

# Helper: POST with auth
post() {
  local path="$1"
  local data="$2"
  curl -s -X POST "${API}${path}" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer ${KEY}" \
    -d "$data"
}

# Helper: PUT with auth
put() {
  local path="$1"
  local data="$2"
  curl -s -X PUT "${API}${path}" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer ${KEY}" \
    -d "$data"
}

# Helper: GET with auth
get() {
  local path="$1"
  curl -s -X GET "${API}${path}" \
    -H "Authorization: Bearer ${KEY}"
}

# Helper: DELETE with auth
del() {
  local path="$1"
  curl -s -X DELETE "${API}${path}" \
    -H "Authorization: Bearer ${KEY}"
}

# ============================================================
# 1. Create Village
# ============================================================
header "Creating village: 못참아"

VILLAGE_RESP=$(post "/villages" '{
  "name": "못참아",
  "description": "웹툰 못참아 기반 인터랙티브 노벨 — 5 NPC + 감정 엔진",
  "access_policy": "closed",
  "response_rule": "target"
}')

VILLAGE_ID=$(echo "$VILLAGE_RESP" | jq -r '.result.id // empty')
if [ -z "$VILLAGE_ID" ]; then
  warn "Village creation may have failed or already exists. Trying to list..."
  VILLAGE_ID=$(get "/villages" | jq -r '.result.villages[] | select(.name == "못참아") | .id')
  if [ -z "$VILLAGE_ID" ]; then
    err "Could not find or create village"
    exit 1
  fi
fi
log "Village ID: $VILLAGE_ID"

# ============================================================
# 2. Create Personas (from data/personas.json)
# ============================================================
header "Creating personas"

PERSONAS_FILE="$(dirname "$0")/data/personas.json"
if [ ! -f "$PERSONAS_FILE" ]; then
  err "personas.json not found at $PERSONAS_FILE"
  exit 1
fi

PERSONA_COUNT=$(jq '.personas | length' "$PERSONAS_FILE")
for i in $(seq 0 $((PERSONA_COUNT - 1))); do
  PERSONA=$(jq ".personas[$i]" "$PERSONAS_FILE")
  PID=$(echo "$PERSONA" | jq -r '.persona_config_id')
  DNAME=$(echo "$PERSONA" | jq -r '.display_name')
  CONFIG=$(echo "$PERSONA" | jq '.config')

  echo -n "  Creating ${DNAME} (${PID})... "

  # In force mode, delete existing persona first
  if [ "$FORCE" = true ]; then
    del "/villages/${VILLAGE_ID}/personas/${PID}" > /dev/null 2>&1 || true
  fi

  RESP=$(post "/villages/${VILLAGE_ID}/personas" "{
    \"persona_config_id\": \"${PID}\",
    \"display_name\": \"${DNAME}\",
    \"config\": ${CONFIG}
  }")

  OK=$(echo "$RESP" | jq -r '.result.id // empty')
  if [ -n "$OK" ]; then
    log "done"
  else
    ERR_MSG=$(echo "$RESP" | jq -r '.error.message // "unknown"')
    if echo "$ERR_MSG" | grep -qi "already exists"; then
      warn "already exists, skipping (use --force to recreate)"
    else
      err "failed: $ERR_MSG"
    fi
  fi
done

# ============================================================
# 3. Create Actions
# ============================================================
header "Creating actions"

ACTIONS_FILE="$(dirname "$0")/data/actions.json"
if [ ! -f "$ACTIONS_FILE" ]; then
  err "actions.json not found at $ACTIONS_FILE"
  exit 1
fi

ACTION_COUNT=$(jq '.actions | length' "$ACTIONS_FILE")
for i in $(seq 0 $((ACTION_COUNT - 1))); do
  ACTION=$(jq ".actions[$i]" "$ACTIONS_FILE")
  NAME=$(echo "$ACTION" | jq -r '.name')
  DESC=$(echo "$ACTION" | jq -r '.description')
  APPRAISAL=$(echo "$ACTION" | jq '.appraisal')

  echo -n "  Action: ${NAME}... "
  RESP=$(post "/villages/${VILLAGE_ID}/actions" "{
    \"name\": \"${NAME}\",
    \"description\": \"${DESC}\",
    \"appraisal_vector\": ${APPRAISAL}
  }")

  OK=$(echo "$RESP" | jq -r '.result.id // empty')
  if [ -n "$OK" ]; then
    log "done"
  else
    ERR_MSG=$(echo "$RESP" | jq -r '.error.message // "unknown"')
    warn "might already exist: $ERR_MSG"
  fi
done

# ============================================================
# 4. Seed Relationships (upsert via PUT)
# ============================================================
header "Seeding relationships"

seed_rel() {
  local src_type="$1" src_id="$2" tgt_type="$3" tgt_id="$4"
  local rel_type="$5" strength="$6" trust="$7"
  local desc="${8:-}"

  local body
  if [ -n "$desc" ]; then
    body=$(jq -n \
      --arg st "$src_type" --arg si "$src_id" \
      --arg tt "$tgt_type" --arg ti "$tgt_id" \
      --arg rt "$rel_type" --arg d "$desc" \
      --argjson s "$strength" --argjson t "$trust" \
      '{source_type:$st, source_id:$si, target_type:$tt, target_id:$ti, relationship_type:$rt, description:$d, strength:$s, trust:$t}')
  else
    body=$(jq -n \
      --arg st "$src_type" --arg si "$src_id" \
      --arg tt "$tgt_type" --arg ti "$tgt_id" \
      --arg rt "$rel_type" \
      --argjson s "$strength" --argjson t "$trust" \
      '{source_type:$st, source_id:$si, target_type:$tt, target_id:$ti, relationship_type:$rt, strength:$s, trust:$t}')
  fi

  put "/villages/${VILLAGE_ID}/relationships" "$body" > /dev/null
}

# User→NPC (용준 → 각 NPC)
echo "  User→NPC relationships..."
seed_rel user yongjun persona jeongsuk player_npc 0.5 0.5
seed_rel user yongjun persona eunhye player_npc 0.5 0.5
seed_rel user yongjun persona mina player_npc 0.45 0.4
seed_rel user yongjun persona jeongjung player_npc 0.5 0.5
seed_rel user yongjun persona deokhui player_npc 0.65 0.7
log "User→NPC done"

# NPC→User (각 NPC의 용준 인식)
echo "  NPC→User relationships..."
seed_rel persona jeongsuk user yongjun "아들 친구" 0.5 0.5 \
  "아들 덕희의 대학 친구. 잘생기고 젠틀한 모습에 오랫동안 잊고 있던 여자로서의 감정이 흔들린다. 부엌에서 둘만 남으면 손이 떨린다. 아들 친구한테 이러면 안 된다는 걸 알지만, 남편한테 이런 감정을 느낀 게 언제였는지 기억도 안 난다."
seed_rel persona eunhye user yongjun "동생 친구" 0.5 0.5 \
  "동생 덕희의 대학 친구. '연하는 딱 질색'이라고 입버릇처럼 말하지만, 용준이 거실에 있으면 괜히 옷매무새를 고치게 된다. 동생 친구한테 이런 감정을 느끼는 게 우스워서 더 쿨한 척한다."
seed_rel persona mina user yongjun "남친 친구" 0.45 0.4 \
  "덕희의 대학 친구. 첫인상부터 수상하고 능글맞다. 여자들한테 능글맞게 구는 꼴이 역겹다. 덕희한테 나쁜 영향 줄까 봐 경계한다. 근데 가끔 용준이 진지한 눈으로 쳐다보면 심장이 이상하게 뛴다."
seed_rel persona jeongjung user yongjun "아들 친구" 0.5 0.5 \
  "아들 덕희 친구. 별 관심 없었는데, 아내가 용준 앞에서 유난히 밝아지는 게 눈에 걸린다. 뭔가 찜찜한데 대놓고 따질 건 아닌 것 같고."
seed_rel persona deokhui user yongjun "절친" 0.65 0.7 \
  "대학 1학년 때부터의 가장 친한 친구. 잘생기고 인기 많은 게 자랑스럽다. 여름방학에 우리 집에 초대해서 가족이랑 어울리게 했다."
log "NPC→User done"

# NPC↔NPC 가족/연인 관계
echo "  NPC↔NPC relationships..."
# 정숙 ↔ 정중 (부부)
seed_rel persona jeongsuk persona jeongjung "남편" 0.35 0.3 \
  "결혼 20년차. 소원한 관계. 대화도 스킨십도 거의 없다. 원망보단 체념에 가깝다."
seed_rel persona jeongjung persona jeongsuk "아내" 0.35 0.3 \
  "소원한 관계. 가볍게 타박은 하지만 진지한 대화는 회피한다. 아내의 외로움에 대한 책임이 있지만 직면하지 않는다."

# 정숙 ↔ 은혜 (모녀)
seed_rel persona jeongsuk persona eunhye "딸" 0.85 0.8 \
  "서로 챙기고 의지하는 사이. 은혜한테만은 좋은 엄마이고 싶다. 은혜가 눈치챌까 봐 더 조심한다."
seed_rel persona eunhye persona jeongsuk "엄마" 0.85 0.8 \
  "서로 챙기고 수다 떠는 사이. 나를 가장 이해해주는 사람. 근데 요즘 엄마가 좀 이상하다… 기분이 좋아 보이는데 뭔가 감추는 느낌."

# 정숙 ↔ 덕희 (모자)
seed_rel persona jeongsuk persona deokhui "아들" 0.85 0.85 \
  "어리버리하지만 순수한 아이. 덕희가 상처받을까 가장 두렵다."
seed_rel persona deokhui persona jeongsuk "엄마" 0.85 0.85 \
  "따뜻한 엄마. 반찬 잘 만들어주시고 잔소리도 하지만 사랑이 느껴진다."

# 은혜 ↔ 정중 (부녀)
seed_rel persona eunhye persona jeongjung "아빠" 0.6 0.6 \
  "과묵하고 존재감 낮지만 나쁜 사람은 아니다."
seed_rel persona jeongjung persona eunhye "딸" 0.7 0.7 \
  "혈기왕성한 딸. 속으로 대견하다."

# 은혜 ↔ 덕희 (남매)
seed_rel persona eunhye persona deokhui "남동생" 0.75 0.75 \
  "어리버리한 동생. 장난 섞인 독설을 해도 결국 챙기게 된다."
seed_rel persona deokhui persona eunhye "누나" 0.75 0.75 \
  "장난 섞인 독설을 하지만 결국 챙겨주는 누나. 심부름 시키는 게 일상."

# 정중 ↔ 덕희 (부자)
seed_rel persona jeongjung persona deokhui "아들" 0.7 0.7 \
  "어리버리하지만 순수한 아들. 아들의 행복이 자존심보다 중요하다."
seed_rel persona deokhui persona jeongjung "아빠" 0.7 0.7 \
  "과묵한 아빠. 존재감 낮지만 편의점에서 소주 한 잔 따라주며 위로하는 따뜻한 면도 있다."

# 미나 ↔ 덕희 (연인)
seed_rel persona mina persona deokhui "남자친구" 0.9 0.9 \
  "어린 시절 친구에서 연인으로 발전. 곰돌이 같다. 못생겼지만 허세 없고 진심인 게 좋다. 덕희와의 사랑을 지키는 게 가장 중요하다."
seed_rel persona deokhui persona mina "여자친구" 0.9 0.9 \
  "어릴 때부터 같은 동네 친구에서 연인. 미나가 세상에서 제일 예쁘고 멋있다. 태권도 유단자라 무섭지만 그게 좋다."

# 미나 ↔ 은혜
seed_rel persona mina persona eunhye "남친 누나" 0.65 0.65 \
  "덕희 누나. 성격 시원시원하고 미대 특유의 자유분방함. 언니-동생처럼 편하게 지낸다."
seed_rel persona eunhye persona mina "동생 여자친구" 0.65 0.65 \
  "동생 여자친구. 성격 불같지만 의리 있고 동생을 진심으로 아끼는 게 보여서 호감."

# 정숙 → 미나
seed_rel persona jeongsuk persona mina "아들 여자친구" 0.6 0.6 \
  "덕희 여자친구. 사납지만 덕희를 진심으로 좋아하는 게 보인다. 미나가 오면 반찬을 더 차린다."

log "NPC↔NPC done"

# ============================================================
# Summary
# ============================================================
header "Seed complete!"
echo ""
echo "Village ID: $VILLAGE_ID"
echo ""
echo "Personas:"
get "/villages/${VILLAGE_ID}/personas" | jq -r '.result.personas[] | "  - \(.persona_config_id): \(.display_name)"'
echo ""
echo "Actions:"
get "/villages/${VILLAGE_ID}/actions" | jq -r '.result.actions[] | "  - \(.name): \(.description)"'
echo ""
echo "Relationships:"
get "/villages/${VILLAGE_ID}/relationships" | jq -r '.result.relationships[] | "  - \(.source_id) → \(.target_id): \(.relationship_type // "n/a")"'
echo ""
log "Save this village ID for your .env: VILLAGE_ID=$VILLAGE_ID"
