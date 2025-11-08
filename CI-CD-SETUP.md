# GitHub Actions CI/CD Setup

This document explains how to set up automated deployments to Google Cloud Run using GitHub Actions.

## What's Configured

- **Workflow**: `.github/workflows/deploy-frontend.yml`
- **Triggers**: Automatic deployment on push to `main` branch (only when frontend or design-system changes)
- **Service Account**: `github-actions@canada-gpt-ca.iam.gserviceaccount.com`
- **Permissions**: Cloud Run Admin, Service Account User, Artifact Registry Writer

## Setup Steps

### 1. Add GitHub Secrets

Go to your GitHub repository: **Settings → Secrets and variables → Actions → New repository secret**

Add these three secrets:

#### `GCP_SA_KEY`
The entire JSON service account key (copy everything from the key file)

#### `NEXT_PUBLIC_SUPABASE_URL`
```
https://pbxyhcdzdovsdlsyixsk.supabase.co
```

#### `NEXT_PUBLIC_SUPABASE_ANON_KEY`
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBieHloY2R6ZG92c2Rsc3lpeHNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIyNzc2ODUsImV4cCI6MjA3Nzg1MzY4NX0.zR_b05FSY35hm0TvJHWtzmQqI5hlpBbbw5rZjLOnWpI
```

### 2. Commit and Push the Workflow

```bash
git add .github/workflows/deploy-frontend.yml
git commit -m "Add GitHub Actions CI/CD workflow"
git push origin main
```

This will trigger your first automated deployment!

## How It Works

1. **You push to main** → GitHub Actions workflow starts
2. **Workflow authenticates** to Google Cloud using the service account
3. **Builds Docker image** with your latest code
4. **Pushes to Artifact Registry** (tagged with commit SHA)
5. **Deploys to Cloud Run** → Live on https://canadagpt.ca in ~5 minutes

## Monitoring Deployments

- **GitHub**: Go to **Actions** tab to see deployment logs
- **Cloud Run**: Visit [Cloud Run Console](https://console.cloud.google.com/run?project=canada-gpt-ca)
- **Live Site**: https://canadagpt.ca

## Workflow Triggers

The workflow only runs when you change:
- `packages/frontend/**` (frontend code)
- `packages/design-system/**` (shared design system)
- `.github/workflows/deploy-frontend.yml` (workflow itself)

Changes to other packages (data-pipeline, graph-api, etc.) won't trigger frontend deployments.

## Rollback

If a deployment fails or has issues:

```bash
# List recent deployments
gcloud run revisions list --service=canadagpt-frontend --region=us-central1

# Rollback to a specific revision
gcloud run services update-traffic canadagpt-frontend \
  --to-revisions=canadagpt-frontend-00001-xyz=100 \
  --region=us-central1
```

## Manual Deployment (Optional)

You can still deploy manually if needed:

```bash
./scripts/deploy-frontend-cloudrun.sh
```

## Security Notes

- Service account key is stored securely in GitHub Secrets
- Only has permissions for Cloud Run, Artifact Registry, and Service Account usage
- Cannot access other GCP resources
- Key file has been deleted locally after setup

## Cost

- **GitHub Actions**: Free for public repos, 2000 minutes/month for private repos
- **Cloud Run**: ~$5-10/month with current configuration (scale-to-zero enabled)
- **Artifact Registry**: ~$0.10/GB/month for stored images

## Troubleshooting

**Deployment fails with "permission denied":**
- Check that all three GitHub secrets are set correctly
- Ensure the service account key JSON is valid

**Workflow doesn't trigger:**
- Make sure you're pushing to the `main` branch
- Check that your changes are in the monitored directories

**Build succeeds but deployment fails:**
- Check Cloud Run logs in GCP Console
- Verify environment variables are set correctly
