export interface Message {
  message_id: string;
  message_type: 'user' | 'agent';
  content: string;
  created: number;
}

export interface MessageResponse {
  chat_id: string;
  messages: Message[];
}
