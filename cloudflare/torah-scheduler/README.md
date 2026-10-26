# CTI scheduled publishing integration

This is an integration plan, not a deployed Worker. Preserve the existing cti-admin-api Worker.

One release record controls both the Reader Edition and Friday Email Edition. Default Eastern publication time is 9:30 PM on Fridays with evening services and 3:00 PM otherwise. An administrator can override the date and time.

The Worker must persist a release, publish the approved Reader revision, verify the deployed Reader, then send the email with an idempotency key. Use server-side subscriber records and Resend credentials; never put secrets or addresses in the public website.

The existing Worker source is required before implementing routes or deploying. Do not replace its existing fetch handler.
