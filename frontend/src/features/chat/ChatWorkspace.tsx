import { useAtom, useAtomValue } from 'jotai';
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

const channelTypeOrder: ChannelType[] = ['SCHOOL', 'DEPARTMENT', 'CLASS', 'COURSE'];

export function ChatWorkspace() {
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
  const { pickChannel, refreshLobby, sendChat } = useChatRoom();

  const activeChannel = activeChannelDetail || channels.find((channel) => channel.id === channelId) || null;
  const groups: ChannelGroup[] = channelTypeOrder
    .map((type) => ({ type, channels: channels.filter((channel) => channel.type === type) }))
    .filter((group) => group.channels.length > 0);

  return (
    <div className="grid min-h-screen grid-cols-[minmax(220px,272px)_minmax(0,1fr)] 2xl:grid-cols-[272px_minmax(0,1fr)_292px] max-md:grid-cols-[minmax(0,1fr)]">
      <ChannelSidebar
        activeChannelId={channelId}
        error={lobbyError}
        groups={groups}
        loading={loadingChannels}
        onPickChannel={pickChannel}
        onRefresh={refreshLobby}
      />

      <section className="grid min-h-screen min-w-0 grid-rows-[64px_minmax(0,1fr)_auto] bg-content">
        <MessageHeader channel={activeChannel} />
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

      <OnlineMemberList
        count={activeChannelDetail?.onlineCount ?? 0}
        loading={loadingChannelDetail}
        users={activeChannelDetail?.onlineUsers || []}
      />
    </div>
  );
}
