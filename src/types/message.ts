export interface Message {
  messageId: string;
  messageType: 'user' | 'agent';
  content: string;
  created: number;
}

export interface MessageResponse {
  chatId: string;
  messages: Message[];
}
