export type RequestMsgType = 'normal' | 'decision';

export type ResponseMsgType = 'normal' | 'process' | 'approve' | 'error';

export interface TextBlock {
  type: 'text';
  text: string;
}

export interface ImageBlock {
  type: 'image_url';
  imageUrl: Record<string, unknown>;
}

export interface VideoBlock {
  type: 'video_url';
  videoUrl: Record<string, unknown>;
}

export type MultimodalBlock = TextBlock | ImageBlock | VideoBlock;

export type ChatContent = string | MultimodalBlock[];

export interface ApproveItem {
  name: string;
  description: string;
  decisions: string[];
}

export interface Approve {
  approveId: string;
  items: ApproveItem[];
}

export interface DecisionItem {
  decisionType: string;
  description: string;
}

export interface Decision {
  decisionId: string;
  items: DecisionItem[];
}

export interface ChatRequest {
  msgType: RequestMsgType;
  content: ChatContent;
  decision?: Decision | null;
}

export interface ChatResponse {
  msgId: string;
  msgType: ResponseMsgType;
  content?: string | null;
  approve?: Approve | null;
  created: number;
}
