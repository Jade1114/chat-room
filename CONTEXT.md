# Context Glossary

This file defines the domain language for the project. It is a glossary, not an implementation spec.

## Project

The project is an organization-centered communication platform. Its primary purpose is to help people discover organizations, understand their activities, and communicate in organization-related channels.

The first concrete scenarios are campuses and online communities, but the core model is not limited to formal education.

The first version uses a dashboard as the post-login entry. The dashboard keeps a global left-side route layout and uses the main area to guide users toward the core actions: enter the Public Square channel, create their own organization, explore organizations, and view organization activity schedules.

The left sidebar uses a two-section layout. One section contains operational routes such as Dashboard, Organization Hall, My Organizations, Activity Schedule, and Create Organization. The other section contains all organizations the user has already joined. Joined organizations in this section act as entry points to their default channels in the MVP.

The joined-organization section in the sidebar is a fast channel-entry surface. The My Organizations page is an organization-relationship management surface: it shows which organizations the user has joined, whether the user is a normal member or Organizer, and provides entry points for channel access or organization management.

The Organization Hall page lists public organizations for discovery. In the first version it supports keyword search, tag filtering, and public organization cards. Each organization card should help users quickly judge whether to inspect or join the organization, showing information such as name, introduction, tags, member count, recent or upcoming activity summary, whether the user has joined, and either a join or enter-channel action.

The Organization Detail page helps non-members decide whether to join, helps members enter the channel and inspect activities, and helps Organizers maintain the organization. In the first version it shows organization name, introduction, tags, member count, organizer/creator, public activity list, membership status, and either a join or enter-channel action. For Organizers it also exposes actions to edit organization information, publish activities, view members, and view or generate the organization invitation/application code.

The Activity Schedule page has two first-version views: Discover Activities and My Schedule. Discover Activities shows public activities from public organizations so that users can discover organizations through activities. My Schedule shows activities from organizations the user has joined. Because the first version has no registration or RSVP workflow, My Schedule means "activities from my joined organizations", not "activities I signed up for".

The first-version core data model is intentionally small: User, Organization, OrganizationMember, Channel, Activity, and InvitationCode. Channel access is derived from OrganizationMember in the MVP. The first version does not require ChannelMember, ActivityRegistration, OrganizationJoinRequest, ModerationAction, or Notification entities.

## User

A person using the platform.

A user may discover organizations, participate in public communication, join organizations, and communicate in channels they are allowed to access.

## Organization

A group that gathers people around a shared identity, interest, activity, or purpose.

Examples include anime clubs, Go clubs, game communities, military-interest groups, campus societies, and online hobby groups.

An organization is the core domain object of the product. It must have outward-facing display content, such as a name and introduction, so that users can understand what the group is before joining or interacting with it.

An organization has members and activities.

Organizations can have visibility state in the domain model. In the first version, newly created organizations are public by default so that the organization hall has useful discovery content. Later safety work may expand this into private, draft, review, or moderation states.

Organizations can also have a join policy in the domain model. In the first version, public organizations are open to direct joining by logged-in users. Later safety work may expand this into approval-required, invite-only, banned-member, or other controlled membership states.

In the first version, any logged-in user may create an organization. The creator becomes an Organizer, joins the organization automatically, and receives access to the organization's default channel.

## Activity

A public or organization-scoped arrangement published by an organization.

An activity represents something people may want to know about or participate in, such as a meeting, event, game session, club recruitment, or discussion plan.

Activities are part of the reason an organization exists and one of the main things users inspect when deciding whether to participate.

In the first version, an Activity is an independent lightweight display entity, not a full event-management workflow. It may have a title, description, time, location or link, organization owner, and visibility. The first version does not include registration, RSVP, attendance, capacity limits, cancellation workflows, or activity-specific notifications.

## Channel

A communication space where users exchange messages.

A channel is the communication carrier for an organization. Its meaning comes from supporting organization members and interested users in communication, activity publishing, and discussion.

An organization may have multiple channels in the domain model. In the current MVP, each organization has one default primary channel.

An organization contains its channels. A channel belongs to one organization.

A channel is not an isolated chat room. It belongs to a product context such as an organization.

## Public Square

The default organization maintained by the platform team.

A user joins the Public Square organization automatically when they create an account. Its default channel is visible to users by default.

The Public Square is used for open conversation, organization discovery, activity promotion, and finding people with shared interests.

It also acts as the best example organization for users who want to create and maintain their own organizations.

## Membership

The relationship between a user and an organization.

Membership means the user has joined the organization. It is separate from organization visibility.

A user may be able to see a public organization and inspect its public profile or public activities without being a member.

Membership determines whether the user belongs to the organization and may affect which organization channels or activities the user can access.

A new user starts as a member of only the platform-maintained Public Square organization. Before joining any other organization, they are not subscribed to any other organization channels.

Users can discover or join organizations through several paths: using an organization-bound invitation/application code, finding organizations through the Public Square, or searching public organizations in the organization hall.

When users say they "join a channel" in the MVP, the domain meaning is that they join the organization and therefore receive access to that organization's default channel.

## Organizer

A user responsible for maintaining an organization’s public information, activities, and organization-related communication spaces.

In the first version, an Organizer may edit organization profile information, publish/edit/delete lightweight activities, view the organization member list, and generate or view the organization invitation/application code.

In the first version, an Organizer does not manage complex moderation or governance workflows such as kicking members, muting members, transferring ownership, creating multiple subchannels, defining custom channel permissions, or configuring approval workflows.

## Admin

A platform-level operator with authority to manage platform data and resolve administrative needs across organizations.
