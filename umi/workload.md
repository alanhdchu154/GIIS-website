# Umi Workload

This is the small active board for Umi-managed GIIS work. Keep it focused. If there are more than 5 active items, Alan is probably carrying too much at once.

## Now

- Confirm whether Alan wants this fix pushed/deployed, then verify live `/login` calls `https://api.genesisideas.school/api/auth/login`.

## Next

- Continue the live customer path after login is fixed: apply/payment -> parent/student account -> first course.
- Decide whether to add a small production smoke checklist for login/API-base after every deploy.

## Waiting

- Alan confirmation before any external deploy/push verification workflow.

## Done

- 2026-05-22: Fixed production API-base fallback and login wrong-response guards for student/admin and parent portals. `npm run build` passed.
- 2026-05-21: Created the first Command Center structure for inbox, workload, decisions, handoffs, and reviews.
