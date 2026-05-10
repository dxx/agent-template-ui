import request from './request';
import type { MessageResponse, Message } from '../types/message';

export async function createChat(): Promise<string> {
  return request.post('/message/chat/create').then((res: any) => res.data);
}

export async function getAllChats(): Promise<MessageResponse[]> {
  return request.get('/message/all').then((res: any) => res.data);
}

export async function getChatMessages(chatId: string): Promise<Message[]> {
  return request.get(`/message/chat/${chatId}`).then((res: any) => res.data);
}

export async function deleteChat(chatId: string): Promise<boolean> {
  return request.delete(`/message/chat/${chatId}`).then((res: any) => res.data);
}

export async function deleteAllChats(): Promise<boolean> {
  return request.delete('/message/all').then((res: any) => res.data);
}
