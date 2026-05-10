export interface Message {
  message_id: string;
  message_type: 'user' | 'agent';
  content: string;
}

export interface MessageResponse {
  chat_id: string;
  messages: Message[];
}
