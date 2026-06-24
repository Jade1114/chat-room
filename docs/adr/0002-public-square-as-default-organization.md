# ADR 0002: Model the Public Square as the Default Organization

## Status

Accepted

## Context

The product needs a default public communication space where new users can talk, discover interests, promote organizations, and see how an organization should be maintained.

One option was to model this as a platform-level channel outside the organization model. That would keep the public square separate from user-created organizations, but it would also introduce a special channel type that does not belong to an organization.

The product direction is organization-centered, so having the most visible default space be outside the organization model would weaken the core product metaphor.

## Decision

The Public Square is modeled as a default organization maintained by the platform team.

When a user creates an account, they automatically join this organization. Its default channel is therefore available to new users immediately.

The Public Square organization serves two purposes:

- It is the default open communication space for all users.
- It is the best example organization for users who want to create and maintain their own organizations.

## Consequences

All ordinary communication channels can be understood through the organization model.

The system needs a default membership creation rule during account registration: every new user becomes a member of the Public Square organization.

The Public Square should have real organization display content, members, activities, and a default channel, rather than being treated as a hidden technical exception.

Future organization creation and organization profile design can use the Public Square as the canonical example.
