"use client";

import { useEffect, useRef, useState } from "react";
import type { ChatMessage } from "@/types";
import Markdown from "./Markdown";

const STORAGE_KEY = "apprentice-tutor:messages";
const SESSION_KEY = "apprentice-tutor:sessionId";

function getSessionId(): string {
  if (typeof window === "undefined") return "";
  let id = window.localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    window.localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

export default function ChatPanel({
  questSlug,
  questTitle,
}: {
  questSlug: string;
  questTitle: string;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const sessionIdRef = useRef<string>("");
  const messagesRef = useRef<HTMLDivElement>(null);

  // 初期化：localStorage から復元
  useEffect(() => {
    sessionIdRef.current = getSessionId();
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) setMessages(JSON.parse(saved) as ChatMessage[]);
    } catch {
      /* noop */
    }
  }, []);

  // 永続化
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {
      /* noop */
    }
  }, [messages]);

  // 末尾へスクロール
  useEffect(() => {
    messagesRef.current?.scrollTo({ top: messagesRef.current.scrollHeight });
  }, [messages]);

  async function send() {
    const text = input.trim();
    if (!text || busy) return;

    const nextMessages: ChatMessage[] = [
      ...messages,
      { role: "user", content: text },
    ];
    setMessages(nextMessages);
    setInput("");
    setBusy(true);

    // ストリーミング先のアシスタントメッセージを先に用意
    setMessages((m) => [...m, { role: "assistant", content: "" }]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages,
          questSlug,
          sessionId: sessionIdRef.current,
        }),
      });

      if (!res.ok || !res.body) {
        throw new Error(`HTTP ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setMessages((m) => {
          const copy = [...m];
          copy[copy.length - 1] = { role: "assistant", content: acc };
          return copy;
        });
      }
    } catch (err) {
      console.error(err);
      setMessages((m) => {
        const copy = [...m];
        copy[copy.length - 1] = {
          role: "assistant",
          content:
            "通信エラーが発生しました。少し待って再度お試しください。",
        };
        return copy;
      });
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    setMessages([]);
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* noop */
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      void send();
    }
  }

  return (
    <>
      <div className="pane-header">
        <h1>AI 学習アシスタント</h1>
        <span className="tag">対象: {questTitle}</span>
        <button className="reset-btn" onClick={reset} type="button">
          会話をリセット
        </button>
      </div>

      <div className="chat-messages" ref={messagesRef}>
        {messages.length === 0 ? (
          <div className="chat-empty">
            つまずいている点を聞かせてください。
            <br />
            答えは渡しませんが、考え方やヒントで一緒に解いていきます。
            <br />
            <small>（Ctrl/⌘ + Enter で送信）</small>
          </div>
        ) : (
          messages.map((m, i) => (
            <div key={i} className={`msg ${m.role}`}>
              {m.role === "assistant" ? (
                <Markdown>{m.content || "…"}</Markdown>
              ) : (
                <div>{m.content}</div>
              )}
            </div>
          ))
        )}
      </div>

      <div className="chat-input">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="例：パスワードマネージャーで追記がうまくいきません。どこを確認すべき？"
          disabled={busy}
        />
        <button onClick={() => void send()} disabled={busy || !input.trim()} type="button">
          {busy ? "考え中…" : "送信"}
        </button>
      </div>
    </>
  );
}
