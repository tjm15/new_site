#!/usr/bin/env bash
# Deploy The Planner's Assistant to Google Cloud Run (europe-west1)
# Safe, repeatable deployment using Secret Manager for GEMINI_API_KEY.
# This script is intentionally ignored by git (added to .gitignore).

set -euo pipefail

PROJECT_ID="the-planners-assistant"
REGION="europe-west1"
SERVICE="planners-assistant"
IMAGE="gcr.io/${PROJECT_ID}/${SERVICE}"
SECRET_NAME="gemini-api-key"
SERVICE_ACCOUNT="${PROJECT_ID_NUMBER:-}" # Optional override if you export PROJECT_ID_NUMBER

log() { printf "\n[deploy] %s\n" "$*"; }
err() { printf "\n[error] %s\n" "$*" >&2; exit 1; }

require_cmd() { command -v "$1" >/dev/null 2>&1 || err "Required command '$1' not found."; }

require_cmd gcloud
require_cmd npm

# Ensure gcloud is authenticated and project set
CURRENT_PROJECT=$(gcloud config get-value project 2>/dev/null || true)
[ "$CURRENT_PROJECT" = "$PROJECT_ID" ] || log "Setting gcloud project to $PROJECT_ID" && gcloud config set project "$PROJECT_ID" >/dev/null

gcloud services enable run.googleapis.com cloudbuild.googleapis.com secretmanager.googleapis.com >/dev/null || true

# 1. Build frontend
# Build now happens inside the Docker multi-stage; local build skipped
log "Skipping local build (performed in Docker multi-stage)"

# 2. Ensure Secret exists (do NOT create if missing without key)
if ! gcloud secrets describe "$SECRET_NAME" >/dev/null 2>&1; then
  if [ -z "${GEMINI_API_KEY:-}" ]; then
    err "Secret '$SECRET_NAME' does not exist and GEMINI_API_KEY env var not set. Export GEMINI_API_KEY before running."
  fi
  log "Creating secret '$SECRET_NAME' in Secret Manager"
  printf "%s" "$GEMINI_API_KEY" | gcloud secrets create "$SECRET_NAME" --data-file=- >/dev/null
fi

# 3. Build & push container (Cloud Build)
log "Submitting image build to Cloud Build: $IMAGE"
gcloud builds submit --tag "$IMAGE"

# 4. Grant secret accessor role to Cloud Run service account
# Retrieve project number
PROJECT_NUMBER=$(gcloud projects describe "$PROJECT_ID" --format="value(projectNumber)")
RUNTIME_SA="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"
log "Granting secret accessor role to service account $RUNTIME_SA"
 gcloud secrets add-iam-policy-binding "$SECRET_NAME" \
  --member="serviceAccount:${RUNTIME_SA}" \
  --role="roles/secretmanager.secretAccessor" >/dev/null || true

# 5. Deploy to Cloud Run
log "Deploying service '$SERVICE' to region '$REGION'"
gcloud run deploy "$SERVICE" \
  --image "$IMAGE" \
  --platform managed \
  --region "$REGION" \
  --allow-unauthenticated \
  --clear-env-vars \
  --set-secrets GEMINI_API_KEY=${SECRET_NAME}:latest

URL=$(gcloud run services describe "$SERVICE" --region "$REGION" --format='value(status.url)')
log "Deployment complete: $URL"
