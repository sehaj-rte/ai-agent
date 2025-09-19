import { type User, type InsertUser, type Conversation, type InsertConversation, type Message, type InsertMessage } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getConversation(id: string): Promise<Conversation | undefined>;
  createConversation(conversation: InsertConversation): Promise<Conversation>;
  updateConversationStatus(id: string, status: string): Promise<void>;
  endConversation(id: string): Promise<void>;
  
  getMessages(conversationId: string): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private conversations: Map<string, Conversation>;
  private messages: Map<string, Message>;

  constructor() {
    this.users = new Map();
    this.conversations = new Map();
    this.messages = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getConversation(id: string): Promise<Conversation | undefined> {
    return this.conversations.get(id);
  }

  async createConversation(insertConversation: InsertConversation): Promise<Conversation> {
    const id = randomUUID();
    const conversation: Conversation = {
      id,
      userId: null,
      agentId: insertConversation.agentId,
      connectionType: insertConversation.connectionType || "webrtc",
      status: "disconnected",
      startedAt: new Date(),
      endedAt: null,
    };
    this.conversations.set(id, conversation);
    return conversation;
  }

  async updateConversationStatus(id: string, status: string): Promise<void> {
    const conversation = this.conversations.get(id);
    if (conversation) {
      conversation.status = status;
      this.conversations.set(id, conversation);
    }
  }

  async endConversation(id: string): Promise<void> {
    const conversation = this.conversations.get(id);
    if (conversation) {
      conversation.status = "disconnected";
      conversation.endedAt = new Date();
      this.conversations.set(id, conversation);
    }
  }

  async getMessages(conversationId: string): Promise<Message[]> {
    return Array.from(this.messages.values()).filter(
      (message) => message.conversationId === conversationId,
    );
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = randomUUID();
    const message: Message = {
      id,
      conversationId: insertMessage.conversationId || null,
      content: insertMessage.content,
      sender: insertMessage.sender,
      timestamp: new Date(),
    };
    this.messages.set(id, message);
    return message;
  }
}

export const storage = new MemStorage();
