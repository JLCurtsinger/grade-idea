#!/usr/bin/env bash
set -euo pipefail

# === CONFIG ===
DEP="https://grade-idea-justins-projects-0ad7195b.vercel.app"
TOKEN="u7yH2bXqPzK9LmQe5sRaW3nYcV8dJfTg"
HDR=(-H "x-vercel-protection-bypass: $TOKEN" -H "Content-Type: application/json")

echo "Deployment: $DEP"
echo "Token len: ${#TOKEN}"

# --- 1) GET health checks ---
echo -e "\n[GET] /api/email/welcome"
curl -sS -i -L "$DEP/api/email/welcome" "${HDR[@]}"

echo -e "\n[GET] /api/email/report-ready"
curl -sS -i -L "$DEP/api/email/report-ready" "${HDR[@]}"

echo -e "\n[GET] /api/email/token-confirmation"
curl -sS -i -L "$DEP/api/email/token-confirmation" "${HDR[@]}"

# --- 2) POST tests ---

# 2a) Welcome
echo -e "\n[POST] /api/email/welcome"
curl -sS -i -L -X POST "$DEP/api/email/welcome" \
  "${HDR[@]}" \
  -d '{"uid":"testUid1","email":"you@example.com","name":"Justin Tester"}'

# 2b) Report Ready
echo -e "\n[POST] /api/email/report-ready"
read -r -d '' JSON_REPORT <<'EOF'
{
  "uid": "testUid1",
  "ideaId": "testIdea1",
  "email": "you@example.com",
  "ideaTitle": "AI idea validator",
  "reportUrl": "https://www.gradeidea.cc/app/ideas/testIdea1"
}
EOF
curl -sS -i -L -X POST "$DEP/api/email/report-ready" \
  "${HDR[@]}" \
  -d "$JSON_REPORT"

# 2c) Token Confirmation (required keys)
echo -e "\n[POST] /api/email/token-confirmation"
RAND="$(date +%s)"
read -r -d '' JSON_TOKEN <<EOF
{
  "sessionId": "cs_test_${RAND}",
  "uid": "testUid-${RAND}",
  "email": "you@example.com",
  "tokensAdded": 10
}
EOF
echo "[DEBUG] Payload:"; echo "$JSON_TOKEN"
curl -sS -i -L -X POST "$DEP/api/email/token-confirmation" \
  "${HDR[@]}" \
  -d "$JSON_TOKEN"

echo -e "\nDone."
