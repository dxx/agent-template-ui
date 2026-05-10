export type RequestMsgType = 'normal' | 'decision';

export type ResponseMsgType = 'normal' | 'process' | 'approve' | 'error';

export interface ApproveItem {
  name: string;
  description: string;
  decisions: string[];
}

export interface Approve {
  approve_id: string;
  items: ApproveItem[];
}

export interface DecisionItem {
  decision_type: string;
  description: string;
}

export interface Decision {
  decision_id: string;
  items: DecisionItem[];
}

export interface ChatRequest {
  msg_type: RequestMsgType;
  content: string;
  decision?: Decision | null;
}

export interface ChatResponse {
  msg_id: string;
  msg_type: ResponseMsgType;
  content?: string | null;
  approve?: Approve | null;
  created: number;
}
