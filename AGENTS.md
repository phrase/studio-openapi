# AGENTS.md

Guidance for agents working in this repo. `README.md` has the layout, commands and the rules CI enforces; don't duplicate them here.

## What this repo is

The public OpenAPI description of the external API (`/v1`), implemented in `phrase-studio-api` under `src/controllers/external/v1/`. Merging to `main` publishes `schemas/projects.json` to developer-hub, so the spec must describe what the API really does.

## Cross-surface changes

- **The spec follows the code.** Change `spec/` in the same round as the endpoint in `phrase-studio-api`, and check the real behavior (validation, status codes, ownership 403/404, charges) in the controller and service rather than from memory.
- **Check the other surfaces of the same endpoint.** The Studio UI and the external API share services, so a rule documented here must also hold for the UI path; if they intentionally differ, say so in the PR body. Endpoints called by `studio-microservices` (e.g. `POST /v1/projects` redirecting to the upload service) need the upload service's README to agree.
- **Document what a caller must know:** allowed values, limits, what a call costs or changes, who may call it. Never put account, organization, identity or owner ids in a schema or example (CI rejects it).
- **Merge timing:** open the PR against `main` together with the API PR, but merge it only after the API change is in production, because `main` publishes to developer-hub. Never edit developer-hub by hand.
- **Never edit `schemas/projects.json` by hand.** Edit `spec/`, run `npm run validate`, commit the regenerated file with the source.
