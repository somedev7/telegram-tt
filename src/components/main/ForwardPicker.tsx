import React, {
  FC, useMemo, useState, memo, useRef, useEffect, useCallback,
} from '../../lib/teact/teact';
import { withGlobal } from '../../lib/teact/teactn';

import { GlobalActions } from '../../global/types';
import { ApiChat, MAIN_THREAD_ID } from '../../api/types';

import { IS_MOBILE_SCREEN } from '../../util/environment';
import {
  getCanPostInChat, getChatTitle, isChatPrivate, sortChatIds,
} from '../../modules/helpers';
import searchWords from '../../util/searchWords';
import { pick } from '../../util/iteratees';
import useInfiniteScroll from '../../hooks/useInfiniteScroll';
import useLang from '../../hooks/useLang';
import useKeyboardListNavigation from '../../hooks/useKeyboardListNavigation';

import Loading from '../ui/Loading';
import Modal from '../ui/Modal';
import InputText from '../ui/InputText';
import Button from '../ui/Button';
import InfiniteScroll from '../ui/InfiniteScroll';
import ListItem from '../ui/ListItem';
import PrivateChatInfo from '../common/PrivateChatInfo';
import GroupChatInfo from '../common/GroupChatInfo';

import './ForwardPicker.scss';

export type OwnProps = {
  isOpen: boolean;
};

type StateProps = {
  chatsById: Record<number, ApiChat>;
  activeListIds?: number[];
  archivedListIds?: number[];
  orderedPinnedIds?: number[];
  currentUserId?: number;
  serverTimeOffset: number;
};

type DispatchProps = Pick<GlobalActions, 'setForwardChatId' | 'exitForwardMode' | 'loadMoreChats'>;

// Focus slows down animation, also it breaks transition layout in Chrome
const FOCUS_DELAY_MS = 500;
const MODAL_HIDE_DELAY_MS = 300;

const ForwardPicker: FC<OwnProps & StateProps & DispatchProps> = ({
  chatsById,
  activeListIds,
  archivedListIds,
  currentUserId,
  serverTimeOffset,
  isOpen,
  setForwardChatId,
  exitForwardMode,
  loadMoreChats,
}) => {
  const [filter, setFilter] = useState('');
  // eslint-disable-next-line no-null/no-null
  const inputRef = useRef<HTMLInputElement>(null);

  const lang = useLang();

  useEffect(() => {
    if (isOpen) {
      if (!IS_MOBILE_SCREEN) {
        setTimeout(() => {
          requestAnimationFrame(() => {
            if (inputRef.current) {
              inputRef.current.focus();
            }
          });
        }, FOCUS_DELAY_MS);
      }
    } else {
      if (inputRef.current) {
        inputRef.current.blur();
      }

      setTimeout(() => {
        setFilter('');
      }, MODAL_HIDE_DELAY_MS);
    }
  }, [isOpen]);

  const chatIds = useMemo(() => {
    const listIds = [
      ...activeListIds || [],
      ...archivedListIds || [],
    ];

    return sortChatIds([
      ...listIds.filter((id) => {
        const chat = chatsById[id];
        if (!chat) {
          return true;
        }

        if (!getCanPostInChat(chat, MAIN_THREAD_ID)) {
          return false;
        }

        if (!filter) {
          return true;
        }

        return searchWords(getChatTitle(lang, chatsById[id], undefined, id === currentUserId), filter);
      }),
    ], chatsById, undefined, currentUserId ? [currentUserId] : undefined, serverTimeOffset);
  }, [activeListIds, archivedListIds, chatsById, currentUserId, filter, lang, serverTimeOffset]);

  const [viewportIds, getMore] = useInfiniteScroll(loadMoreChats, chatIds, Boolean(filter));

  const handleFilterChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFilter(e.currentTarget.value);
  }, []);

  // eslint-disable-next-line no-null/no-null
  const containerRef = useRef<HTMLDivElement>(null);
  const handleKeyDown = useKeyboardListNavigation(containerRef, isOpen, (index) => {
    if (viewportIds) {
      setForwardChatId({ id: viewportIds[index] });
    }
  }, '.ListItem-button', true);

  const modalHeader = (
    <div className="modal-header" dir={lang.isRtl ? 'rtl' : undefined}>
      <Button
        round
        color="translucent"
        size="smaller"
        ariaLabel={lang('Close')}
        onClick={exitForwardMode}
      >
        <i className="icon-close" />
      </Button>
      <InputText
        ref={inputRef}
        value={filter}
        onChange={handleFilterChange}
        onKeyDown={handleKeyDown}
        placeholder={lang('ForwardTo')}
      />
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={exitForwardMode}
      className="ForwardPicker"
      header={modalHeader}
    >
      {viewportIds && viewportIds.length ? (
        <InfiniteScroll
          className="picker-list custom-scroll"
          items={viewportIds}
          onLoadMore={getMore}
          noScrollRestore={Boolean(filter)}
          ref={containerRef}
          onKeyDown={handleKeyDown}
        >
          {viewportIds.map((id) => (
            <ListItem
              key={id}
              className="chat-item-clickable force-rounded-corners"
              onClick={() => setForwardChatId({ id })}
            >
              {isChatPrivate(id) ? (
                <PrivateChatInfo status={id === currentUserId ? lang('SavedMessagesInfo') : undefined} userId={id} />
              ) : (
                <GroupChatInfo chatId={id} />
              )}
            </ListItem>
          ))}
        </InfiniteScroll>
      ) : viewportIds && !viewportIds.length ? (
        <p className="no-results">Sorry, nothing found.</p>
      ) : (
        <Loading />
      )}
    </Modal>
  );
};

export default memo(withGlobal<OwnProps>(
  (global): StateProps => {
    const {
      serverTimeOffset,
      chats: {
        byId: chatsById,
        listIds,
      },
      currentUserId,
    } = global;

    return {
      chatsById,
      activeListIds: listIds.active,
      archivedListIds: listIds.archived,
      currentUserId,
      serverTimeOffset,
    };
  },
  (setGlobal, actions): DispatchProps => pick(actions, ['setForwardChatId', 'exitForwardMode', 'loadMoreChats']),
)(ForwardPicker));
