import { createId } from "@/domain/task";
import {
  taskFlowDatabase,
  type DeliveryRecord,
} from "@/infrastructure/taskflow-db";
import { isNativeRuntime } from "@/infrastructure/runtime";

const EVENT_SCHEMA_VERSION = 1;
const SESSION_KEY = "taskflow_session_v1";

export interface FeedbackInput {
  type: "like" | "idea" | "bug";
  rating: number;
  content: string;
  email: string;
}

function sessionId(): string {
  if (typeof window === "undefined") return createId("session");
  try {
    const existing = window.sessionStorage.getItem(SESSION_KEY);
    if (existing) return existing;
    const created = createId("session");
    window.sessionStorage.setItem(SESSION_KEY, created);
    return created;
  } catch {
    return createId("session");
  }
}

class TelemetryClient {
  private flushing: Promise<void> | null = null;

  async track(
    name: string,
    properties: Record<string, unknown> = {},
  ): Promise<void> {
    if (isNativeRuntime()) return;
    try {
      const anonymousId = await taskFlowDatabase.getClientId();
      await taskFlowDatabase.queueDelivery("/api/events", {
        id: createId("event"),
        anonymousId,
        sessionId: sessionId(),
        name,
        properties,
        occurredAt: Date.now(),
        schemaVersion: EVENT_SCHEMA_VERSION,
      });
      void this.flush();
    } catch (error) {
      console.warn("QuietDo telemetry could not be queued", error);
    }
  }

  async submitFeedback(input: FeedbackInput): Promise<void> {
    if (isNativeRuntime()) {
      throw new Error("原生版当前未配置反馈服务");
    }
    const anonymousId = await taskFlowDatabase.getClientId();
    await taskFlowDatabase.queueDelivery("/api/feedback", {
      id: createId("feedback"),
      anonymousId,
      type: input.type,
      rating: input.rating,
      content: input.content.trim(),
      email: input.email.trim(),
      occurredAt: Date.now(),
      schemaVersion: EVENT_SCHEMA_VERSION,
    });
    await this.track("feedback_submit", {
      type: input.type,
      rating: input.rating,
      hasContent: Boolean(input.content.trim()),
    });
    void this.flush();
  }

  startAutoFlush(): () => void {
    if (typeof window === "undefined" || isNativeRuntime()) {
      return () => undefined;
    }
    const onOnline = () => void this.flush();
    const onVisible = () => {
      if (document.visibilityState === "visible") void this.flush();
    };
    window.addEventListener("online", onOnline);
    document.addEventListener("visibilitychange", onVisible);
    void this.flush();
    return () => {
      window.removeEventListener("online", onOnline);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }

  flush(): Promise<void> {
    if (isNativeRuntime()) return Promise.resolve();
    if (this.flushing) return this.flushing;
    this.flushing = this.flushPending()
      .catch((error) => {
        console.warn("QuietDo delivery queue could not be flushed", error);
      })
      .finally(() => {
        this.flushing = null;
      });
    return this.flushing;
  }

  private async flushPending(): Promise<void> {
    if (typeof window === "undefined" || !window.navigator.onLine) return;
    const deliveries = await taskFlowDatabase.pendingDeliveries();
    for (const delivery of deliveries) {
      const delivered = await this.deliver(delivery);
      if (!delivered) break;
    }
  }

  private async deliver(delivery: DeliveryRecord): Promise<boolean> {
    try {
      const response = await fetch(delivery.endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(delivery.payload),
        keepalive: true,
      });
      if (!response.ok) {
        await taskFlowDatabase.recordDeliveryAttempt(delivery);
        return false;
      }
      await taskFlowDatabase.completeDelivery(delivery.id);
      return true;
    } catch {
      await taskFlowDatabase.recordDeliveryAttempt(delivery);
      return false;
    }
  }
}

export const telemetry = new TelemetryClient();
