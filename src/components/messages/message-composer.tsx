"use client";

import { useState } from "react";

export function MessageComposer({
  disabled,
  onSend,
}: {
  disabled: boolean;
  onSend: (content: string) => Promise<boolean>;
}) {
  const [content, setContent] = useState("");
  const [isSending, setIsSending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextContent = content.trim();

    if (!nextContent || disabled || isSending) {
      return;
    }

    setIsSending(true);

    try {
      const sent = await onSend(nextContent);

      if (sent) {
        setContent("");
      }
    } finally {
      setIsSending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="border-t border-slate-200 bg-white p-3">
      <label className="sr-only" htmlFor="message-composer">
        Message
      </label>
      <div className="flex flex-col gap-3 sm:flex-row">
        <textarea
          id="message-composer"
          value={content}
          onChange={(event) => setContent(event.target.value)}
          disabled={disabled || isSending}
          placeholder="Write a message..."
          rows={2}
          maxLength={4000}
          className="min-h-12 flex-1 resize-none rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-4 focus:ring-teal-100 disabled:cursor-not-allowed disabled:bg-slate-50"
        />
        <button
          type="submit"
          disabled={disabled || isSending || !content.trim()}
          className="rounded-lg bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {isSending ? "Sending..." : "Send"}
        </button>
      </div>
    </form>
  );
}
