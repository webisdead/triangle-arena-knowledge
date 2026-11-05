# Triangle Arena knowledge base

Static GitHub Pages dashboard with a Python/GitHub Actions collector. No ChatGPT
tasks, LLM calls, backend account or external JavaScript dependencies.

## What is archived

- Exact public leaderboard observations: stable bot ID, name, rank, rating, wins and matches.
- Available public strategy summaries/taglines, content hashes and first/last observed timestamps.
- Available public replay seeds, recorded moves and published scores/rankings.
- Source URL, capture health and GitHub run provenance.

The feed rotates its visible matches and descriptions. Missing descriptions stay
missing. Match samples are not representative. No bot source code is claimed.
No additional replay metrics are invented. History uses observed points only.
Public participant owner names are deliberately omitted; bot names and IDs remain.

## Activate GitHub Pages and collection

Create an empty **public** repository named `triangle-arena-knowledge`, then give
the GitHub connection write access. Put this package on its default `main` branch.
In **Settings → Pages → Build and deployment → Source**, choose **GitHub Actions**.
Enable Actions if required by repository policy. Manually run
**Collect metrics and publish knowledge base** once under **Actions**.

The same workflow collects, commits data and deploys Pages every 15 minutes
(UTC minutes 7, 22, 37 and 52). No repository secrets are required. GITHUB_TOKEN
uses standard short-lived Actions permissions: contents write, Pages write, OIDC.
An archive commit made by GITHUB_TOKEN does not recursively trigger a new run.
GitHub can delay scheduled jobs and may disable schedules in inactive public
repositories after 60 days; check Actions if collection stops. Existing account
usage limits and policies apply; no paid service or plan is provisioned.

Source errors keep successful archive data intact, publish health information
and leave the workflow failing after deploying the last valid data. A first run
with no usable data fails the build rather than publishing an invented ranking.

## Local commands

```sh
python3 -m unittest discover -s tests -v
python3 scripts/collect.py
python3 scripts/build.py
```

Publish `_site/`. The expected URL after enabling Pages for that repository is
`https://webisdead.github.io/triangle-arena-knowledge/` (not live until deployment).

## Data contract

`data/latest.json`: latest observed leaderboard. `data/history/index.json`: available
UTC day files and snapshot counts. `data/history/YYYY-MM-DD.json`: chronological
observations for that day. `data/snapshots/YYYY-MM-DD/<timestamp>.json`: immutable
individual observations. `data/strategies.json`: bot map with text versions.
`data/replays.json`: index whose hashed keys point to `data/replays/<hash>.json`.
`data/status.json`: most recent collection outcome, collection time and run URL.

Historical snapshots and strategy observations imported from earlier research
retain their original observation timestamps; imports are not new measurements.
