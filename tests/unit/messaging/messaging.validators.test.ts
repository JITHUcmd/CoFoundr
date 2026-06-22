import { describe, expect, it } from "vitest";
import {
  messageCreateSchema,
  messageUpdateSchema,
  messagingPaginationSchema
} from "@/validators/messaging.validators";

const uuidOne = "00000000-0000-0000-0000-000000000001";
const uuidTwo = "00000000-0000-0000-0000-000000000002";

describe("messaging validators", () => {
  it("accepts text messages and defaults the message type", () => {
    const result = messageCreateSchema.safeParse({
      content: "Hello"
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data).toEqual({
        type: "TEXT",
        content: "Hello"
      });
    }
  });

  it("accepts image and file message types", () => {
    expect(messageCreateSchema.safeParse({
      type: "IMAGE",
      content: "https://cdn.example.com/image.png"
    }).success).toBe(true);

    expect(messageCreateSchema.safeParse({
      type: "FILE",
      content: "https://cdn.example.com/file.pdf"
    }).success).toBe(true);
  });

  it("rejects system messages from client-created payloads", () => {
    const result = messageCreateSchema.safeParse({
      type: "SYSTEM",
      content: "Internal event"
    });

    expect(result.success).toBe(false);
  });

  it("rejects unknown message fields and blank content", () => {
    const result = messageCreateSchema.safeParse({
      content: "   ",
      hidden: true
    });

    expect(result.success).toBe(false);
  });

  it("validates edit payloads strictly", () => {
    expect(messageUpdateSchema.safeParse({
      content: "Updated"
    }).success).toBe(true);

    expect(messageUpdateSchema.safeParse({
      content: "Updated",
      type: "TEXT"
    }).success).toBe(false);
  });

  it("parses cursor pagination and rejects conflicting cursors", () => {
    const result = messagingPaginationSchema.safeParse({
      before: uuidOne,
      limit: "25"
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.limit).toBe(25);
    }

    expect(messagingPaginationSchema.safeParse({
      before: uuidOne,
      after: uuidTwo
    }).success).toBe(false);
  });
});
