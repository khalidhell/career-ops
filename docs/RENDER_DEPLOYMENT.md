# Deploying a private CareerOps web dashboard on Render

## What this deployment does

- Runs the existing Next.js dashboard as a Node web service.
- Protects every page and application API route with HTTP Basic Authentication.
- Fails closed in production if authentication is not configured.
- Stores CareerOps data under `/var/data`, a persistent Render disk.
- Leaves the original upstream repository unchanged.

The Render service has a public network address, but the dashboard requires the
configured username and password. This is not a Render Private Service: a
Private Service is only reachable from Render's private network and cannot be
opened directly from a normal browser on the public internet.

## Deploy

1. In Render, choose **New → Blueprint** and connect your fork
   `khalidhell/career-ops`.
2. Select branch `codex/render-private-deployment`.
3. Render reads the repository-root `render.yaml`. Review the service name,
   1 CPU / 2 GB plan, and 1 GB persistent disk before creating it.
4. Set the two prompted secret values:
   - `CAREER_OPS_WEB_AUTH_USER`: choose a username.
   - `CAREER_OPS_WEB_AUTH_PASSWORD`: use a unique password of at least 16
     characters. Do not reuse a GitHub or email password.
5. Create the service and wait for the health check to pass.

The 1 CPU / 2 GB service plan and persistent disk are paid Render resources. Check the
current price in Render before confirming creation.

## Data and secrets

- Do not commit CVs, application records, passwords, API keys, or personal
  documents to GitHub.
- The app's data root is `/var/data`; it survives deploys and restarts while
  the disk remains attached.
- Back up the disk regularly. A persistent disk is not a backup.
- Render generates a separate `CAREER_OPS_GPT_API_KEY` for the optional
  Custom GPT Actions integration. Copy it from the Render Environment page
  only when configuring that action; never commit or share it publicly.
- Keep the repository private if you do not want its source code public.
  Website authentication and GitHub repository visibility are separate.
- HTTP Basic Authentication is safe only over HTTPS. Use the Render HTTPS URL.
- Health check `/healthz` returns only a fixed liveness status and no user data.

## Current limitations

This config hosts the existing web dashboard. It does not yet provide a
ChatGPT custom GPT / MCP connection, OAuth, background job scheduling, or a
multi-user database. The app's local CLI execution features may depend on
programs and credentials that are not installed in Render. Do not enable
remote job execution until its command allowlist and execution environment have
been reviewed for hosted use.
