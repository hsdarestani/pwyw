# Isolated STRATO deployment

Production domain: https://pwyw.smarbiz.sbs
Source repo: hsdarestani/pwyw
Execution: dedicated GitHub Actions workflow in hsdarestani/publisher. SSH secrets remain in the Publisher repo; do not copy secrets into this source repository.

PWYW uses independent Docker Compose project named pwyw, its own /opt/pwyw directory and /opt/pwyw/data persistence, limits CPU and memory, does NOT publish ports and joins the existing Publisher Docker network as pwyw-web. Host Caddy serves only pwyw.smarbiz.sbs to pwyw-web:8080. Existing Publisher and Reimflow containers must never be recreated or restarted for PWYW.

Workflow must perform SSH host preflight, Docker network discovery, snapshot PWYW state, build isolated container, Caddy config validation, reload only (no restart) and live HTTP health checks. It must fail safely without modifying the shared proxy if validation fails. Preserve a matching route in Publisher source Caddyfile to survive a future Publisher release. All existing Caddy sites should remain unchanged.

AI is optional. If enabled, set PWYW_OPENAI_API_KEY from a GitHub Actions secret on the server side, never embed it in the client. Model copy generation is capped at 3 per tenant/day.
