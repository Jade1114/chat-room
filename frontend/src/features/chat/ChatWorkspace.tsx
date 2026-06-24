import { useAtom, useAtomValue } from 'jotai';
import { useEffect, useMemo, useState } from 'react';
import { useChatRoom } from '../../hooks/useChatRoom';
import {
  activeChannelDetailAtom,
  canSendAtom,
  channelIdAtom,
  channelsAtom,
  draftAtom,
  isConnectedAtom,
  loadingChannelDetailAtom,
  loadingChannelsAtom,
  lobbyErrorAtom,
  timelineAtom
} from '../../state/chatAtoms';
import type { ChannelType } from '../../types/chat';
import { ChannelSidebar, type ChannelGroup } from './components/ChannelSidebar';
import { MessageComposer } from './components/MessageComposer';
import { MessageHeader } from './components/MessageHeader';
import { MessageTimeline } from './components/MessageTimeline';
import { OnlineMemberList } from './components/OnlineMemberList';
import { OrganizationChannelContextPanel } from './components/OrganizationChannelContextPanel';
import type { OrganizationActivity, OrganizationMemberPreview } from '../organizations/organizationViewModel';

const channelTypeOrder: ChannelType[] = ['ORGANIZATION'];

interface ChatWorkspaceProps {
  initialChannelId?: string;
  organizationContext?: {
    activities: OrganizationActivity[];
    id: string;
    memberCount: number;
    members: OrganizationMemberPreview[];
    name: string;
  };
  organizationId?: string;
}

export function ChatWorkspace({ initialChannelId = '', organizationContext, organizationId }: ChatWorkspaceProps = {}) {
  const [draft, setDraft] = useAtom(draftAtom);
  const channelId = useAtomValue(channelIdAtom);
  const channels = useAtomValue(channelsAtom);
  const activeChannelDetail = useAtomValue(activeChannelDetailAtom);
  const loadingChannels = useAtomValue(loadingChannelsAtom);
  const loadingChannelDetail = useAtomValue(loadingChannelDetailAtom);
  const lobbyError = useAtomValue(lobbyErrorAtom);
  const timeline = useAtomValue(timelineAtom);
  const isConnected = useAtomValue(isConnectedAtom);
  const canSend = useAtomValue(canSendAtom);
  const { pickChannel, refreshLobby, sendChat } = useChatRoom({ initialChannelId });

  const [showMembers, setShowMembers] = useState(false);

  const visibleChannels = useMemo(
    () => organizationId
      ? channels.filter((channel) => channel.organizationId === organizationId)
      : channels,
    [channels, organizationId]
  );

  useEffect(() => {
    if (initialChannelId && initialChannelId !== channelId) {
      pickChannel(initialChannelId);
    }
  }, [channelId, initialChannelId, pickChannel]);

  const activeChannel = activeChannelDetail || visibleChannels.find((channel) => channel.id === channelId) || null;
  const groups: ChannelGroup[] = channelTypeOrder
    .map((type) => ({ type, channels: visibleChannels.filter((channel) => channel.type === type) }))
    .filter((group) => group.channels.length > 0);

  const onlineCount = activeChannelDetail?.onlineCount ?? 0;
  const onlineUsers = activeChannelDetail?.onlineUsers || [];

  return (
    <div className="grid h-screen overflow-hidden grid-cols-[minmax(220px,272px)_minmax(0,1fr)] 2xl:grid-cols-[272px_minmax(0,1fr)_minmax(180px,292px)] max-md:grid-cols-[minmax(0,1fr)]">
      <ChannelSidebar
        activeChannelId={channelId}
        error={lobbyError}
        groups={groups}
        loading={loadingChannels}
        organizationName={organizationContext?.name}
        onPickChannel={pickChannel}
        onRefresh={refreshLobby}
      />

      <section className="grid h-screen min-w-0 grid-rows-[64px_minmax(0,1fr)_auto] overflow-hidden bg-content">
        <MessageHeader
          channel={activeChannel}
          onlineCount={onlineCount}
          organizationName={organizationContext?.name}
          onToggleMembers={() => setShowMembers((prev) => !prev)}
        />
        <MessageTimeline channel={activeChannel} connected={isConnected} items={timeline} />
        <MessageComposer
          canSend={canSend}
          channelName={activeChannel?.name || channelId}
          connected={isConnected}
          draft={draft}
          onDraftChange={setDraft}
          onSend={sendChat}
        />
      </section>

      {/* Always-visible panel on 2xl+ */}
      {organizationContext ? (
        <OrganizationChannelContextPanel
          activities={organizationContext.activities}
          memberCount={organizationContext.memberCount}
          members={organizationContext.members}
          onlineCount={onlineCount}
          onlineUsers={onlineUsers}
          loadingOnlineMembers={loadingChannelDetail}
        />
      ) : (
        <OnlineMemberList
          count={onlineCount}
          loading={loadingChannelDetail}
          users={onlineUsers}
        />
      )}

      {/* Slide-out overlay on non-2xl */}
      {showMembers && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/30 transition-opacity 2xl:hidden"
            onClick={() => setShowMembers(false)}
          />
          <div className="fixed right-0 top-0 z-50 h-full w-80 overflow-y-auto border-l border-divider bg-sidebar shadow-2xl 2xl:hidden" style={{ animation: 'slideInRight 0.2s ease-out' }}>
            <div className="flex items-center justify-between border-b border-divider px-4 py-3">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-faint">活动与成员</p>
              <button
                type="button"
                onClick={() => setShowMembers(false)}
                className="grid size-8 place-items-center rounded-lg text-subtle transition hover:bg-hover hover:text-primary"
              >
                <svg aria-hidden="true" className="size-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12" /></svg>
              </button>
            </div>
            {organizationContext ? (
              <OrganizationChannelContextPanel
                activities={organizationContext.activities}
                memberCount={organizationContext.memberCount}
                members={organizationContext.members}
                onlineCount={onlineCount}
                onlineUsers={onlineUsers}
                loadingOnlineMembers={loadingChannelDetail}
                sidebar={false}
              />
            ) : (
              <OnlineMemberList count={onlineCount} loading={loadingChannelDetail} users={onlineUsers} sidebar={false} />
            )}
          </div>
        </>
      )}
    </div>
  );
}
