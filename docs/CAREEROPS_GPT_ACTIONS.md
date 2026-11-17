# Connect CareerOps to a Custom GPT

This integration uses a dedicated bearer API key. It is separate from the
website's Basic Auth password and exposes only the documented `/api/gpt/*`
operations.

## After the Render service is deployed

1. In Render, open the `career-ops-private` service → **Environment**.
2. Find `CAREER_OPS_GPT_API_KEY` (Render generates a long random value).
3. Copy the value privately. Never put it in GitHub, chat messages, or a public
   document.
4. Open the OpenAPI file `docs/careerops-gpt-actions.yaml` and replace
   `https://YOUR-RENDER-SERVICE.onrender.com` with the actual HTTPS service URL.
5. In the GPT editor, add an Action and import the updated OpenAPI schema.
6. Configure authentication as **API Key → Bearer** and paste the
   `CAREER_OPS_GPT_API_KEY` value.
7. Test `getCareerPipeline`. The status update action is marked consequential
   and should require confirmation before it changes a tracker row.

## Available actions

- `getCareerPipeline`: read the inbox and tracked applications.
- `updateCareerApplicationStatus`: update an existing tracker row's status
  using the existing lock-safe CareerOps writer. It does not submit applications.

The Actions API does not expose local command execution, arbitrary file access,
CV downloads, or a generic shell. The website itself remains protected by its
own username/password.
