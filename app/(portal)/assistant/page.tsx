"use client";

import {
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { useSearchParams } from "next/navigation";
import { IconButton } from "@/components/ui/button";
import { Icons } from "@/components/ui/icons";
import { Skeleton } from "@/components/ui/states";
import { answer, STARTER_PROMPTS } from "@/lib/demo/assistant";
import { useCurrentEmployee } from "@/lib/hooks/use-auth";
import { cn } from "@/lib/utils/cn";

interface Message {
  id: string;
  from: "ai" | "user";
  text: string;
  followUps?: string[];
}

export default function AssistantPage() {
  return (
    <Suspense fallback={<Skeleton className="h-[70vh] w-full" />}>
      <AssistantView />
    </Suspense>
  );
}

function AssistantView() {
  const employee = useCurrentEmployee();
  const params = useSearchParams();
  const scroller = useRef<HTMLDivElement>(null);
  const seeded = useRef(false);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      from: "ai",
      text: `Hello ${employee.name.split(" ")[0]} — I'm Connect AI. I answer from your live workspace data: attendance, leave, tasks, your calendar and the company handbook. Ask me in English or Arabic.`,
      followUps: STARTER_PROMPTS.slice(0, 3),
    },
  ]);
  const [draft, setDraft] = useState("");
  const [thinking, setThinking] = useState(false);

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || thinking) return;

      setMessages((current) => [
        ...current,
        { id: `u-${Date.now()}`, from: "user", text: trimmed },
      ]);
      setDraft("");
      setThinking(true);

      // A short, deliberate pause: the answer is computed locally, but a reply
      // that appears instantly reads as canned rather than considered.
      await new Promise((resolve) => setTimeout(resolve, 480));
      const reply = answer(trimmed, employee);
      // Never offer back the question that was just asked.
      const followUps = reply.followUps.filter(
        (prompt) => prompt.toLowerCase() !== trimmed.toLowerCase(),
      );

      setMessages((current) => [
        ...current,
        { id: `a-${Date.now()}`, from: "ai", text: reply.text, followUps },
      ]);
      setThinking(false);
    },
    [employee, thinking],
  );

  // A prompt can arrive from the dashboard as ?q=…
  useEffect(() => {
    const initial = params.get("q");
    if (initial && !seeded.current) {
      seeded.current = true;
      send(initial);
    }
  }, [params, send]);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [messages, thinking]);

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    send(draft);
  }

  return (
    <div className="mx-auto flex h-[calc(100dvh-10.5rem)] max-w-3xl flex-col overflow-hidden rounded-card border border-line bg-surface shadow-soft lg:h-[calc(100dvh-8rem)]">
      <header className="flex items-center gap-3 border-b border-line px-5 py-4">
        <span className="grid size-10 flex-none place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-teal-accent text-white">
          <Icons.sparkles className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="text-base font-semibold text-ink">Connect AI</h1>
          <p className="flex items-center gap-1.5 text-xs text-muted">
            <span aria-hidden className="size-1.5 rounded-full bg-emerald-500" />
            Ready · answers from your workspace · English &amp; العربية
          </p>
        </div>
      </header>

      <div className="scroll-slim flex gap-2 overflow-x-auto border-b border-line px-5 py-3">
        {STARTER_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            type="button"
            onClick={() => send(prompt)}
            disabled={thinking}
            dir="auto"
            className="flex-none rounded-full border border-line bg-subtle px-3 py-1.5 text-xs text-ink-soft transition hover:border-brand-500/50 hover:text-ink disabled:opacity-50 focus-ring"
          >
            {prompt}
          </button>
        ))}
      </div>

      <div ref={scroller} className="scroll-slim flex-1 space-y-5 overflow-y-auto px-5 py-5">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn("flex gap-3", message.from === "user" && "flex-row-reverse")}
          >
            <span
              aria-hidden
              className={cn(
                "grid size-8 flex-none place-items-center rounded-lg text-[10px] font-semibold",
                message.from === "ai"
                  ? "bg-gradient-to-br from-brand-500 to-teal-accent text-white"
                  : "bg-ink text-canvas",
              )}
            >
              {message.from === "ai" ? <Icons.sparkles className="size-4" /> : "You"}
            </span>
            <div className={cn("min-w-0 max-w-[85%]", message.from === "user" && "text-right")}>
              <p
                dir="auto"
                className={cn(
                  "inline-block whitespace-pre-line rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                  message.from === "ai"
                    ? "rounded-tl-sm bg-subtle text-ink-soft"
                    : "rounded-tr-sm bg-brand-500 text-white",
                )}
              >
                {message.text}
              </p>
              {message.followUps?.length ? (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {message.followUps.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      dir="auto"
                      onClick={() => send(prompt)}
                      disabled={thinking}
                      className="rounded-full border border-line px-2.5 py-1 text-[11px] text-muted transition hover:border-brand-500/50 hover:text-ink disabled:opacity-50 focus-ring"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        ))}

        {thinking ? (
          <div className="flex gap-3" aria-live="polite">
            <span
              aria-hidden
              className="grid size-8 flex-none place-items-center rounded-lg bg-gradient-to-br from-brand-500 to-teal-accent text-white"
            >
              <Icons.sparkles className="size-4" />
            </span>
            <span className="inline-flex items-center gap-1 rounded-2xl rounded-tl-sm bg-subtle px-4 py-3">
              <span className="sr-only">Connect AI is thinking</span>
              {[0, 1, 2].map((index) => (
                <span
                  key={index}
                  aria-hidden
                  className="size-1.5 animate-pulse rounded-full bg-muted"
                  style={{ animationDelay: `${index * 140}ms` }}
                />
              ))}
            </span>
          </div>
        ) : null}
      </div>

      <form onSubmit={onSubmit} className="border-t border-line p-4">
        <div className="flex items-end gap-2">
          <label htmlFor="assistant-input" className="sr-only">
            Message Connect AI
          </label>
          <textarea
            id="assistant-input"
            value={draft}
            dir="auto"
            rows={1}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                send(draft);
              }
            }}
            placeholder="Ask about leave, tasks, attendance or a policy…"
            className="max-h-32 min-h-11 flex-1 resize-none rounded-lg border border-line bg-subtle px-3.5 py-3 text-sm text-ink placeholder:text-muted/70 focus-ring"
          />
          <IconButton
            label="Send message"
            variant="primary"
            type="submit"
            disabled={!draft.trim() || thinking}
            size="lg"
          >
            <Icons.send className="size-5" />
          </IconButton>
        </div>
        <p className="mt-2 text-center text-[11px] text-muted">
          Demo assistant · answers are generated locally from your workspace data. No external
          service is called.
        </p>
      </form>
    </div>
  );
}
