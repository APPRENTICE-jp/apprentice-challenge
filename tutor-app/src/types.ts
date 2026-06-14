export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatRequestBody {
  messages: ChatMessage[];
  /** 現在開いている教材の slug（分析タグ＆AIの焦点化に使用） */
  questSlug?: string | null;
  /** 匿名のブラウザセッションID */
  sessionId: string;
}

export interface QuestionLogRow {
  id: number;
  created_at: string;
  session_id: string;
  quest_slug: string | null;
  user_message: string;
  assistant_excerpt: string | null;
  model: string;
}
