
## Notification service

This service helps with the usual "check out" workflow.

When "signature checking" is enabled in a project, joining a crowdtainer project requires an e-mail confirmation.

This service reads entries from the redis database and dispaches the respective e-mail along with the user's "one time password" code.


