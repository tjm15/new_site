#!/usr/bin/env bash
# Hardened deployment script for The Planner's Assistant -> Cloud Run
# Features:
# - Multi-stage Docker build (no local dist dependency)
# - Dedicated minimal service account (optional first run)
# - Secret Manager integration for GEMINI_API_KEY
# - Strong nginx security headers
# - Configurable resource limits & concurrency
# - Automatic rollback on failed deployment (keeps previous revision serving)
# - Idempotent (safe to re-run)

set -euo pipefail

PROJECT_ID="the-planners-assistant"
REGION="europe-west1"
SERVICE="planners-assistant"
IMAGE="gcr.io/${PROJECT_ID}/${SERVICE}"
SECRET_NAME="gemini-api-key"
SA_NAME="planners-assistant-run"
SA_EMAIL="${SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"
CPU="1"
MEMORY="512Mi"
CONCURRENCY="80"
MAX_INSTANCES="10"
MIN_INSTANCES="0" # Set >0 if you need warm instances

log() { printf "\n[secure-deploy] %s\n" "$*"; }
err() { printf "\n[error] %s\n" "$*" >&2; exit 1; }
require() { command -v "$1" >/dev/null 2>&1 || err "Missing required command: $1"; }

require gcloud
require npm

CURRENT_PROJECT=$(gcloud config get-value project 2>/dev/null || true)
if [[ "$CURRENT_PROJECT" != "$PROJECT_ID" ]]; then
  log "Setting gcloud project to $PROJECT_ID"
  gcloud config set project "$PROJECT_ID" >/dev/null
fi

log "Ensuring required services are enabled"
gcloud services enable run.googleapis.com cloudbuild.googleapis.com secretmanager.googleapis.com iam.googleapis.com >/dev/null

log "Ensuring service account exists: $SA_EMAIL"
if ! gcloud iam service-accounts describe "$SA_EMAIL" >/dev/null 2>&1; then
  gcloud iam service-accounts create "$SA_NAME" --display-name "Planner Assistant Run SA" >/dev/null
fi

log "Granting Secret Accessor to service account"
gcloud secrets add-iam-policy-binding "$SECRET_NAME" \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/secretmanager.secretAccessor" >/dev/null || true

# Optional: grant logging viewer for better diagnostics (read-only)
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/logging.viewer" >/dev/null || true

log "Checking secret existence"
if ! gcloud secrets describe "$SECRET_NAME" >/dev/null 2>&1; then
  [[ -z "${GEMINI_API_KEY:-}" ]] && err "Secret '$SECRET_NAME' missing. Export GEMINI_API_KEY before first run."
  printf "%s" "$GEMINI_API_KEY" | gcloud secrets create "$SECRET_NAME" --data-file=- >/dev/null
  log "Secret created: $SECRET_NAME"
fi

log "Submitting multi-stage Docker build"
gcloud builds submit --tag "$IMAGE"

log "Deploying to Cloud Run (region: $REGION)"
set +e
DEPLOY_OUTPUT=$(gcloud run deploy "$SERVICE" \
  --image "$IMAGE" \
  --region "$REGION" \
  --platform managed \
  --service-account "$SA_EMAIL" \
  --cpu "$CPU" \
  --memory "$MEMORY" \
  --concurrency "$CONCURRENCY" \
  --max-instances "$MAX_INSTANCES" \
  --min-instances "$MIN_INSTANCES" \
  --allow-unauthenticated \
  --clear-env-vars \
  --set-secrets GEMINI_API_KEY=${SECRET_NAME}:latest 2>&1)
EXIT_CODE=$?
set -e

if [[ $EXIT_CODE -ne 0 ]]; then
  log "Deployment failed. Output:\n$DEPLOY_OUTPUT"
  log "Previous revision should still be serving. Investigate logs: gcloud logs read --project $PROJECT_ID --region $REGION --service $SERVICE"
  exit $EXIT_CODE
fi

URL=$(gcloud run services describe "$SERVICE" --region "$REGION" --format='value(status.url)')
log "Deployment successful: $URL"
log "Recommended post-deploy: configure Cloud Armor + Monitoring alerts."

