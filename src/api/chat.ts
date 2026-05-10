import { fetchEventSource } from '@microsoft/fetch-event-source';
import type { ChatRequest, ChatResponse } from '../types/chat';

export interface StreamChatOptions {
  chatId: string;
  body: ChatRequest;
  onMessage: (data: ChatResponse) => void;
  onError?: (err: Error) => void;
  onClose?: () => void;
  signal?: AbortSignal;
}

export function streamChat(options: StreamChatOptions) {
  const token = localStorage.getItem('user_token') || '';
  const baseURL = import.meta.env.APP_API_BASE_URL || '';

  return fetchEventSource(`${baseURL}/chat/stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'user-token': token,
      'chat-id': options.chatId,
    },
    body: JSON.stringify(options.body),
    signal: options.signal,
    async onopen(response) {
      const contentType = response.headers.get('content-type');
      if (contentType && !contentType.includes('text/event-stream')) {
        const text = await response.text();
        let errMsg = '请求失败';
        try {
          const json = JSON.parse(text);
          errMsg = json.message || json.msg || json.detail || json.error || text;
        } catch {
          errMsg = text || `HTTP ${response.status}`;
        }
        throw new Error(errMsg);
      }
    },
    onmessage(msg) {
      if (msg.event === 'message' || msg.event === '') {
        try {
          const data: ChatResponse = JSON.parse(msg.data);
          options.onMessage(data);
        } catch {
          console.warn('SSE 消息解析失败:', msg.data);
        }
      }
    },
    onerror(err) {
      options.onError?.(err);
      throw err;
    },
    onclose() {
      options.onClose?.();
    },
  });
}
