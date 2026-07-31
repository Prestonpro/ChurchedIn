import { describe, it, expect } from "vitest";
import { canSendMessage, canViewConversation, unreadCountFor, shouldNotifyByEmail } from "@/lib/messaging";
import { CONNECTION_STATUS } from "@/lib/constants";

describe("canSendMessage", () => {
  it("is true only for ACCEPTED and not blocked", () => {
    expect(canSendMessage(CONNECTION_STATUS.ACCEPTED, false)).toBe(true);
  });

  it("is false for ACCEPTED when the pair is blocked", () => {
    expect(canSendMessage(CONNECTION_STATUS.ACCEPTED, true)).toBe(false);
  });

  it("is false for PENDING, DECLINED, and ENDED", () => {
    expect(canSendMessage(CONNECTION_STATUS.PENDING, false)).toBe(false);
    expect(canSendMessage(CONNECTION_STATUS.DECLINED, false)).toBe(false);
    expect(canSendMessage(CONNECTION_STATUS.ENDED, false)).toBe(false);
  });
});

describe("canViewConversation", () => {
  it("is true for ACCEPTED and ENDED (read-only history)", () => {
    expect(canViewConversation(CONNECTION_STATUS.ACCEPTED, false)).toBe(true);
    expect(canViewConversation(CONNECTION_STATUS.ENDED, false)).toBe(true);
  });

  it("is false for PENDING and DECLINED (never messaged, nothing to view)", () => {
    expect(canViewConversation(CONNECTION_STATUS.PENDING, false)).toBe(false);
    expect(canViewConversation(CONNECTION_STATUS.DECLINED, false)).toBe(false);
  });

  it("is false whenever the pair is blocked, even for ACCEPTED/ENDED history", () => {
    expect(canViewConversation(CONNECTION_STATUS.ACCEPTED, true)).toBe(false);
    expect(canViewConversation(CONNECTION_STATUS.ENDED, true)).toBe(false);
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
