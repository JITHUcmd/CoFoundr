import { describe, expect, it } from "vitest";
import {
  notificationIdParamsSchema,
  notificationListQuerySchema
} from "@/validators/notification.validators";

describe("notification validators", () => {
  it("validates notification ids", () => {
    expect(notificationIdParamsSchema.parse({
      id: "11111111-1111-1111-1111-111111111111"
    })).toEqual({
      id: "11111111-1111-1111-1111-111111111111"
    });
  });

  it("validates strict list query filters", () => {
    expect(notificationListQuerySchema.parse({
      type: "NEW_MESSAGE",
      unreadOnly: "true",
      limit: "25"
    })).toEqual({
      type: "NEW_MESSAGE",
      unreadOnly: true,
      limit: 25
    });
  });

  it("rejects unknown fields and invalid notification types", () => {
    expect(() => notificationListQuerySchema.parse({
      type: "MESSAGE",
      extra: "field"
    })).toThrow();
  });

  it("rejects ambiguous pagination direction", () => {
    expect(() => notificationListQuerySchema.parse({
      before: "11111111-1111-1111-1111-111111111111",
      after: "22222222-2222-2222-2222-222222222222"
    })).toThrow();
  });
});
