import type { MessageItem } from "./message.types";
import { formatDateTime, formatMatchType } from "./message-utils";

function readLabel(message: MessageItem, currentUserId: string) {
  const otherReceipts = message.readReceipts.filter((receipt) => receipt.userId !== currentUserId);

  if (!otherReceipts.length) {
    return "Sent";
  }

  return "Read";
}

export function MessageBubble({ message, currentUserId }: { message: MessageItem; currentUserId: string }) {
  const isOwn = message.senderId === currentUserId;
  const senderName = message.sender.name ?? message.sender.username;
  const body =
    message.deletedAt
      ? "Message deleted."
      : message.type === "TEXT"
        ? message.content
        : `${formatMatchType(message.type)} message`;

  return (
    <article className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-lg px-4 py-3 shadow-sm sm:max-w-[70%] ${
          isOwn ? "bg-slate-950 text-white" : "border border-slate-200 bg-white text-slate-950"
        }`}
      >
        {!isOwn ? <p className="mb-1 text-xs font-semibold text-teal-700">{senderName}</p> : null}
        <p className={`whitespace-pre-wrap text-sm leading-6 ${message.deletedAt ? "italic opacity-70" : ""}`}>{body}</p>
        <div className={`mt-2 flex items-center justify-end gap-2 text-[11px] ${isOwn ? "text-slate-300" : "text-slate-500"}`}>
          <time dateTime={message.createdAt}>{formatDateTime(message.createdAt)}</time>
          {isOwn ? <span>{readLabel(message, currentUserId)}</span> : null}
        </div>
      </div>
    </article>
  );
}
