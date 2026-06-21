export type RequestMsgType = 'normal' | 'decision';

export type ResponseMsgType = 'normal' | 'process' | 'approve' | 'error';

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
  content: string;
  decision?: Decision | null;
}

export interface ChatResponse {
  msgId: string;
  msgType: ResponseMsgType;
  content?: string | null;
  approve?: Approve | null;
  created: number;
}
