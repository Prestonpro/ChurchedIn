import { describe, it, expect } from "vitest";
import { canSendMessage, canViewConversation, unreadCountFor, shouldNotifyByEmail } from "@/lib/messaging";
import { REQUEST_STATUS } from "@/lib/constants";

describe("canSendMessage", () => {
  it("is true only for CLAIMED and not blocked", () => {
    expect(canSendMessage(REQUEST_STATUS.CLAIMED, false)).toBe(true);
  });

  it("is false for CLAIMED when the pair is blocked", () => {
    expect(canSendMessage(REQUEST_STATUS.CLAIMED, true)).toBe(false);
  });

  it("is false for PENDING, OPEN, DECLINED, COMPLETED, and CANCELLED", () => {
    expect(canSendMessage(REQUEST_STATUS.PENDING, false)).toBe(false);
    expect(canSendMessage(REQUEST_STATUS.OPEN, false)).toBe(false);
    expect(canSendMessage(REQUEST_STATUS.DECLINED, false)).toBe(false);
    expect(canSendMessage(REQUEST_STATUS.COMPLETED, false)).toBe(false);
    expect(canSendMessage(REQUEST_STATUS.CANCELLED, false)).toBe(false);
  });
});

describe("canViewConversation", () => {
  it("is true for CLAIMED, COMPLETED, and CANCELLED (read-only history)", () => {
    expect(canViewConversation(REQUEST_STATUS.CLAIMED, false)).toBe(true);
    expect(canViewConversation(REQUEST_STATUS.COMPLETED, false)).toBe(true);
    expect(canViewConversation(REQUEST_STATUS.CANCELLED, false)).toBe(true);
  });

  it("is false for PENDING, OPEN, and DECLINED (never messaged, nothing to view)", () => {
    expect(canViewConversation(REQUEST_STATUS.PENDING, false)).toBe(false);
    expect(canViewConversation(REQUEST_STATUS.OPEN, false)).toBe(false);
    expect(canViewConversation(REQUEST_STATUS.DECLINED, false)).toBe(false);
  });

  it("is false whenever the pair is blocked, even for CLAIMED/COMPLETED/CANCELLED history", () => {
    expect(canViewConversation(REQUEST_STATUS.CLAIMED, true)).toBe(false);
    expect(canViewConversation(REQUEST_STATUS.COMPLETED, true)).toBe(false);
    expect(canViewConversation(REQUEST_STATUS.CANCELLED, true)).toBe(false);
  });
});

describe("unreadCountFor", () => {
  it("counts only messages from the other party with no readAt", () => {
    const messages = [
      { senderId: "me", readAt: null },
      { senderId: "them", readAt: null },
      { senderId: "them", readAt: new Date() },
      { senderId: "them", readAt: null },
    ];
    expect(unreadCountFor(messages, "me")).toBe(2);
  });

  it("is zero when there are no messages", () => {
    expect(unreadCountFor([], "me")).toBe(0);
  });

  it("is zero when every message from the other party is already read", () => {
    const messages = [{ senderId: "them", readAt: new Date() }];
    expect(unreadCountFor(messages, "me")).toBe(0);
  });
});

describe("shouldNotifyByEmail", () => {
  it("notifies when the recipient had no prior unread messages in this thread", () => {
    expect(shouldNotifyByEmail(0)).toBe(true);
  });

  it("does not notify again if the recipient already has an unread message waiting", () => {
    expect(shouldNotifyByEmail(1)).toBe(false);
    expect(shouldNotifyByEmail(5)).toBe(false);
  });
});
