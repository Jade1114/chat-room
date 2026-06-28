# ADR 0005: Use Dual Identity Fields for User and Local Session

## Status

Accepted

## Context

Activity-first flows now allow a browser-local **Local Session** to act before login:

- express Activity Interest;
- initiate Activity;
- receive anonymous real-time Interest hints;
- later become associated with a logged-in User in the same browser.

A Local Session is not a User account. It is a temporary browser identity stored locally by the frontend.

The implementation must represent both stable User identity and temporary Local Session identity without confusing the two.

A tempting shortcut is to put `localSessionId` into existing `userId` / `created_by` fields and later overwrite it with the account id after login. That would reduce schema changes but would blur the domain model.

## Decision

Use explicit dual fields for identities instead of storing Local Session ids in User id fields.

For Activity initiators:

```text
created_by_user_id
created_by_local_session_id
```

For Activity Interest:

```text
user_id
local_session_id
```

Rules:

- User id fields contain only real `app_user.id` values.
- Local Session id fields contain only browser-local session ids.
- New implementation uses Local Session names directly: `localSessionId`, `local_session_id`, `created_by_local_session_id`, `X-Local-Session-Id`, and `chat_room_local_session_id`.
- Do not add compatibility for old visitor naming in the new Activity Interest implementation.
- A Local Session initiated Activity or Interest may later be associated with a logged-in User by filling the User id field.
- Association does not erase the Local Session id; it remains as origin/same-browser traceability.
- A Local Session id is never inserted into `app_user.id` fields.

## Consequences

### Positive

- User identity and Local Session identity remain semantically clean.
- Foreign keys from User id fields to `app_user(id)` remain meaningful.
- Authorization code can clearly distinguish stable account ownership from same-browser local-session access.
- LocalSession-to-User Association can fill a User id without losing the original local-session origin.
- Interview explanation is cleaner: Local Session is a temporary identity, not a fake user.

### Negative

- Schema and mapper changes are larger than reusing `created_by`.
- Queries must handle two identity branches.
- Existing seed/migration code must be rebaselined from `created_by` to explicit identity fields.

## Alternatives considered

### Store localSessionId in `userId` / `created_by`

Rejected.

It would overload a single field with two incompatible meanings:

```text
user id OR local session id
```

That breaks foreign-key semantics, makes authorization harder to reason about, and makes login association look like overwriting identity rather than associating a temporary identity with a stable account.

### Use polymorphic fields: `initiator_type` + `initiator_id`

Rejected for the first version.

It is flexible, but it prevents a clean foreign key to `app_user(id)` and pushes more type branching into every query. Dual fields are more explicit and easier for this codebase.

### Create Local Session rows in `app_user`

Rejected.

A Local Session is not a User account. Creating fake users for browser sessions would pollute user semantics and make metrics/account flows misleading.
