# ADR 0001: Reframe the Product Around Organizations

## Status

Accepted

## Context

The project was previously described as a高校类 Discord 教学协作平台. That direction centered the model around schools, departments, classes, courses, teachers, students, and assignments.

The product direction has now changed. The project should be an organization-centered communication platform. Its first realistic scenarios are campuses and online communities, but its core model should support organizations such as anime clubs, Go clubs, game communities, military-interest groups, campus societies, and other hobby or interest groups.

## Decision

The project’s main product line is redefined as an organization-centered communication platform.

The core domain objects are now:

- User
- Organization
- Activity
- Channel
- Membership
- Organizer
- Admin

Education-specific concepts such as course, class, teacher, student, and assignment are no longer the main product model. They may appear later only as specialized scenarios or extensions of organizations.

## Consequences

The existing product documents and channel model need to be revised:

- `docs/features/product-scope.md` should no longer define the project as a teaching collaboration platform.
- `docs/channel-model.md` should move away from `SCHOOL`, `DEPARTMENT`, `CLASS`, and `COURSE` as the main channel taxonomy.
- Channel access should be derived from public visibility, organization ownership, and membership rather than course/class membership.
- The MVP should prioritize organization discovery, public communication, organization profiles, activity visibility, and organization channel access.
