import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './Chat.scss';
import './Markdown.scss';
import reactIcon from '../assets/react.svg';
import { createChat, getAllChats, deleteChat } from '../api/message';
import { streamChat } from '../api/chat';
import { useMessage } from '../components/Message';
import type { MessageResponse } from '../types/message';
import type { Approve, Decision, ChatRequest } from '../types/chat';

interface HandleItem {
  type: 'process' | 'error';
  content: string;
}

// 单条消息结构
interface UIMessage {
  id: string;
  text: string;
  isUser: boolean;
  handleList: HandleItem[];
}

// 对话会话结构，包含多个消息
interface ChatItem {
  chatId: string;
  title: string;
  messages: UIMessage[];
}

function HandleList({ items, autoCollapse = false }: { items: HandleItem[]; autoCollapse?: boolean }) {
  const [isExpanded, setIsExpanded] = useState(!autoCollapse);

  useEffect(() => {
    if (autoCollapse) {
      setIsExpanded(false);
    }
  }, [autoCollapse]);

  if (items.length === 0) return null;

  return (
    <div className="handle-list">
      {isExpanded && items.length > 1 && (
        <div className="handle-collapse" onClick={() => setIsExpanded(false)}>
          <span className="handle-arrow">▼</span>
          <span>收起</span>
        </div>
      )}
      {isExpanded && items.map((item, idx) => (
        <div key={idx} className={`handle-item ${item.type}`}>
          <span className="handle-icon">{item.type === 'process' ? '🔧' : '❌'}</span>
          <span className="handle-content">{item.content}</span>
        </div>
      ))}
      {!isExpanded && (
        <div className="handle-summary" onClick={() => setIsExpanded(true)}>
          <span className="handle-arrow">▶</span>
          <span>处理过程 ({items.length} 条隐藏)</span>
        </div>
      )}
    </div>
  );
}

// 根据首条用户消息生成对话标题
function generateTitle(messages: UIMessage[]): string {
  if (messages.length === 0) return '新对话';
  const firstUserMsg = messages.find(m => m.isUser);
  if (!firstUserMsg) return '新对话';
  const content = firstUserMsg.text;
  return content.length > 50 ? content.slice(0, 50) : content;
}

// 将 API 响应转换为本地 ChatItem 格式
function convertResponseToChatItem(response: MessageResponse): ChatItem {
  const messages: UIMessage[] = response.messages
    .filter(msg => msg.content && !/^[\s\n]+$/.test(msg.content))
    .map(msg => ({
      id: msg.message_id,
      text: msg.content.trim(),
      isUser: msg.message_type === 'user',
      handleList: [],
    }));
  return {
    chatId: response.chat_id,
    title: generateTitle(messages),
    messages,
  };
}

export default function Chat() {
  const navigate = useNavigate();
  const { showMessage } = useMessage();
  const [chatList, setChatList] = useState<ChatItem[]>([]);
  const [activeChatId, setActiveChatId] = useState<string>('');
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [input, setInput] = useState('');
  const [isScrollable, setIsScrollable] = useState(false);
  const [userMenuVisible, setUserMenuVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingApprove, setPendingApprove] = useState<Approve | null>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortCtrlRef = useRef<AbortController | null>(null);
  const currentReplyIdRef = useRef<string>('');

  const activeChat = chatList.find(chat => chat.chatId === activeChatId);
  const messages = activeChat?.messages || [];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const MESSAE_MAX_LEN = 100;

  useEffect(() => {
    scrollToBottom();
  }, [messages, pendingApprove]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuVisible(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleGetAllChats = async () => {
      getAllChats()
        .then((data) => {
          const items = (data || []).map(convertResponseToChatItem);
          setChatList(items);
          if (items.length > 0) {
            setActiveChatId(items[0].chatId);
          }
        })
        .catch(() => {
          setChatList([]);
        });
    }
    handleGetAllChats()
  }, []);

  // 发起流式对话请求
  const startStream = (chatId: string, body: ChatRequest) => {
    setIsLoading(true);
    setPendingApprove(null);

    // 首次消息时，创建空消息占位用于后续流式更新
    if (body.msg_type === 'normal') {
      const replyId = String(Date.now()) + '_reply';
      currentReplyIdRef.current = replyId;
      setChatList(prev => prev.map(chat => {
        if (chat.chatId !== chatId) return chat;
        return { ...chat, messages: [...chat.messages, { id: replyId, text: '', isUser: false, handleList: [] }] };
      }));
    }

    abortCtrlRef.current = new AbortController();

    streamChat({
      chatId,
      body,
      signal: abortCtrlRef.current.signal,
      // 处理流式返回的消息
      onMessage(data) {
        if (data.msg_type === 'normal' || data.msg_type === 'process' || data.msg_type === 'error') {
          setChatList(prev => prev.map(chat => {
            if (chat.chatId !== chatId) return chat;
            return {
              ...chat,
              messages: chat.messages.map(m => {
                if (m.id === currentReplyIdRef.current) {
                  const content = data.content || '';
                  // process/error 类型追加到处理过程列表
                  if (data.msg_type === 'process' || data.msg_type === 'error') {
                    const display = content.length > MESSAE_MAX_LEN ?
                      content.slice(0, MESSAE_MAX_LEN) + '...' : content;
                    return { ...m, handleList: [...(m.handleList || []), { type: data.msg_type as 'process' | 'error', content: display }] };
                  }
                  // normal 类型累加文本内容
                  const newText = m.text ? m.text + content : content;
                  return { ...m, text: newText };
                }
                return m;
              }),
            };
          }));
        } else if (data.msg_type === 'approve') {
          // 需要用户审批
          if (data.approve) {
            setPendingApprove(data.approve);
          }
        }
      },
      // 流式请求出错
      onError(err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        setChatList(prev => prev.map(chat => {
          if (chat.chatId !== chatId) return chat;
          return {
            ...chat,
            messages: chat.messages.map(m => {
              if (m.id === currentReplyIdRef.current) {
                return { ...m, handleList: [...m.handleList, { type: 'error' as const, content: errorMsg }] };
              }
              return m;
            }),
          };
        }));
        setIsLoading(false);
      },
      // 流式请求结束
      onClose() {
        setIsLoading(false);
      },
    });
  };

  // 取消正在进行的流式请求
  const handleCancel = () => {
    if (abortCtrlRef.current) {
      const chatId = activeChatId;
      abortCtrlRef.current.abort();
      if (chatId) {
        setChatList(prev => prev.map(chat => {
          if (chat.chatId !== chatId) return chat;
          return {
            ...chat,
            messages: chat.messages.map(m => {
              if (m.id === currentReplyIdRef.current) {
                return { ...m, handleList: [...m.handleList, { type: 'error' as const, content: '处理已被取消' }] };
              }
              return m;
            }),
          };
        }));
      }
      setIsLoading(false);
    }
  };

  // 用户提交审批决策（同意/拒绝）
  const handleApproveDecision = (decisionType: string, description: string) => {
    if (!pendingApprove || !activeChatId) return;
    const decision: Decision = {
      decision_id: pendingApprove.approve_id,
      items: pendingApprove.items.map(() => ({
        decision_type: decisionType,
        description,
      })),
    };
    setPendingApprove(null);
    startStream(activeChatId, { msg_type: 'decision', content: '', decision });
  };

  // 发送消息
  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const text = input.trim();
    setInput('');
    // 重置输入框高度
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      setIsScrollable(false);
    }

    let targetChatId = activeChatId;

    // 没有选中对话时，先创建新对话
    if (!targetChatId) {
      try {
        targetChatId = await createChat();
        const newChat: ChatItem = {
          chatId: targetChatId,
          title: '新对话',
          messages: [],
        };
        setChatList(prev => [newChat, ...prev]);
        setActiveChatId(targetChatId);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        showMessage('error', msg || '创建会话失败');
        return;
      }
    }

    // 添加用户消息到列表
    const newMessage: UIMessage = { id: String(Date.now()), text, isUser: true, handleList: [] };
    setChatList(prev => prev.map(chat => {
      if (chat.chatId !== targetChatId) return chat;
      const updatedMessages = [...chat.messages, newMessage];
      // 首次消息时更新对话标题
      const title = chat.title === '新对话' ? generateTitle(updatedMessages) : chat.title;
      return { ...chat, messages: updatedMessages, title };
    }));

    // 发起流式请求
    startStream(targetChatId, { msg_type: 'normal', content: text });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const textarea = e.target;
    textarea.style.height = 'auto';
    const newHeight = textarea.scrollHeight;
    textarea.style.height = `${newHeight}px`;
    setIsScrollable(newHeight > 72);
  };

  // 创建新对话
  const handleNewChat = async () => {
    try {
      const chatId = await createChat();
      const newChat: ChatItem = {
        chatId,
        title: '新对话',
        messages: [],
      };
      setChatList(prev => [newChat, ...prev]);
      setActiveChatId(chatId);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      showMessage('error', msg || '创建会话失败');
    }
  };

  // 删除指定对话
  const handleDeleteChat = async (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteChat(chatId);
      showMessage('success', '删除成功');
      setChatList(prev => {
        const filtered = prev.filter(c => c.chatId !== chatId);
        // 删除当前选中对话时，自动切换到其他对话
        if (activeChatId === chatId && filtered.length > 0) {
          setActiveChatId(filtered[0].chatId);
        } else if (filtered.length === 0) {
          setActiveChatId('');
        }
        return filtered;
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      showMessage('error', msg || '删除失败');
    }
  };

  return (
    <div className={`chat-layout`}>
      {/* 左侧边栏 */}
      <aside className={`chat-sidebar ${sidebarVisible ? '' : 'collapsed'}`}>
        <div className="sidebar-header">
          <h1 className="brand-name">Agent Template UI</h1>
        </div>

        <button className="new-chat-btn" onClick={handleNewChat}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" />
          </svg>
          <span>新建对话</span>
        </button>

        <nav className="sidebar-nav">
          <div className="chat-list-header">
            <span className="chat-list-title">最近对话</span>
          </div>
          <div className="chat-list">
            {chatList.length === 0 ? (
              <div className="chat-empty">暂无对话</div>
            ) : (
              chatList.map(chat => (
                <div
                  key={chat.chatId}
                  className={`chat-item ${chat.chatId === activeChatId ? 'active' : ''}`}
                  onClick={() => setActiveChatId(chat.chatId)}
                >
                  <span className="chat-title">{chat.title}</span>
                  <button
                    className="chat-delete-btn"
                    onClick={(e) => handleDeleteChat(chat.chatId, e)}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    </svg>
                  </button>
                </div>
              ))
            )}
          </div>
        </nav>

        <div className="sidebar-footer">
          <a className="footer-text" href="https://github.com/dxx/agent-template" target="_blank" rel="noopener noreferrer">关于 Agent Template</a>
        </div>
      </aside>

      {/* 主内容区 */}
      <main className={`chat-main`}>
        <div className="expand-sidebar" onClick={() => setSidebarVisible(!sidebarVisible)}>
          <svg viewBox="0 0 24 24" width="20" height="20" style={{ overflow: 'hidden', cursor: 'pointer' }}>
            <rect x="4" y="4" width="16" height="16" rx="3" ry="3" fill="none" stroke="currentColor" strokeWidth="1.5"/>
            <line x1="9" y1="4" x2="9" y2="20" stroke="currentColor" strokeWidth="1.5"/>
            {sidebarVisible ? (
              <polyline points="15,9 11.5,12 15,15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            ) : (
              <polyline points="11.5,9 15,12 11.5,15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            )}
          </svg>
        </div>
        <div className="main-header">
          <div className="header-spacer"></div>
          <div className="user-info">
            <span
              className="user-name"
              onClick={() => setUserMenuVisible(!userMenuVisible)}
            >
              Hi, 你好
            </span>
            {userMenuVisible && (
              <div className="user-dropdown" ref={userMenuRef}>
                <button onClick={() => {
                  localStorage.removeItem('user_token');
                  navigate('/login');
                }}>退出登录</button>
              </div>
            )}
          </div>
        </div>
        {/* 消息区域 */}
        <div className="chat-messages">
          {messages.length === 0 ? (
            <div className="welcome-screen">
              <div className="welcome-logo">
                <img src={reactIcon} width="100%" height="100%" />
              </div>
              <h2 className="welcome-title">你好，有什么可以帮你的？</h2>
            </div>
          ) : (
            <>
              {messages.map((msg) => (
                <div key={msg.id} className={`message ${msg.isUser ? 'user' : 'assistant'}`}>
                  <div className={`message-content ${msg.isUser ? '' : 'markdown-body'}`}>
                    {msg.isUser ? (
                      msg.text
                    ) : (
                      <>
                        {msg.handleList && msg.handleList.length > 0 && (
                          <HandleList items={msg.handleList} autoCollapse={!isLoading && msg.handleList.length > 3} />
                        )}
                        {msg.text ? (
                          <div className="markdown-content">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.text}</ReactMarkdown>
                          </div>
                        ) : isLoading ? (
                          <div className="markdown-content">处理中...</div>
                        ) : null}
                      </>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && !pendingApprove && (
                <div className="message assistant loading-message">
                  <div className="message-content">
                    <span className="loading-dot" />
                    <span className="loading-dot" />
                    <span className="loading-dot" />
                  </div>
                </div>
              )}
              {pendingApprove && (
                <div className="approve-card">
                  <div className="approve-title">需要审批</div>
                  {pendingApprove.items.map((item, idx) => (
                    <div key={idx} className="approve-item">
                      <div className="approve-name">{item.name}</div>
                      <div className="approve-desc markdown-body">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{item.description}</ReactMarkdown>
                      </div>
                    </div>
                  ))}
                  <div className="approve-actions">
                    <button className="approve-btn approve" onClick={() => handleApproveDecision('approve', '同意')}>
                      同意
                    </button>
                    <button className="approve-btn reject" onClick={() => handleApproveDecision('reject', '拒绝')}>
                      拒绝
                    </button>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* 输入区域 */}
        <div className="chat-input-area">
          <div className="input-container">
            <textarea
              id="chat-input"
              ref={textareaRef}
              value={input}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              placeholder="向智能体提问"
              disabled={isLoading || !!pendingApprove}
              className={`chat-input ${isScrollable ? 'scrollable' : ''}`}
            />
            <button className={`send-btn ${isLoading ? 'loading' : input.trim() ? 'active' : ''}`}
              onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
              onClick={isLoading ? handleCancel : handleSend}
              disabled={!!pendingApprove && !isLoading}>
              {isLoading ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="6" width="12" height="12" rx="2" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" >
                  <path d="M10.6254 20.3752V6.69549L5.47304 11.8478C4.93607 12.3848 4.0647 12.3848 3.52773 11.8478C2.99076 11.3109 2.99076 10.4395 3.52773 9.90252L11.0277 2.40252L11.1322 2.30877C11.6723 1.86801 12.4695 1.89901 12.973 2.40252L20.473 9.90252L20.5668 10.007C21.0075 10.5471 20.9766 11.3443 20.473 11.8478C19.9695 12.3513 19.1723 12.3823 18.6322 11.9416L18.5277 11.8478L13.3754 6.69549V20.3752C13.3754 21.1346 12.7598 21.7502 12.0004 21.7502C11.241 21.7502 10.6254 21.1346 10.6254 20.3752Z" fill="currentColor"></path>
                </svg>
              )}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
