import { type User, type InsertUser, type Conversation, type InsertConversation, type Message, type InsertMessage } from "@shared/schema";
import { users, conversations, messages } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

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

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getConversation(id: string): Promise<Conversation | undefined> {
    const [conversation] = await db.select().from(conversations).where(eq(conversations.id, id));
    return conversation || undefined;
  }

  async createConversation(insertConversation: InsertConversation): Promise<Conversation> {
    const [conversation] = await db
      .insert(conversations)
      .values({
        agentId: insertConversation.agentId,
        connectionType: insertConversation.connectionType || "webrtc",
      })
      .returning();
    return conversation;
  }

  async updateConversationStatus(id: string, status: string): Promise<void> {
    await db
      .update(conversations)
      .set({ status })
      .where(eq(conversations.id, id));
  }

  async endConversation(id: string): Promise<void> {
    await db
      .update(conversations)
      .set({ 
        status: "disconnected",
        endedAt: new Date()
      })
      .where(eq(conversations.id, id));
  }

  async getMessages(conversationId: string): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(messages.timestamp);
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const [message] = await db
      .insert(messages)
      .values({
        conversationId: insertMessage.conversationId,
        content: insertMessage.content,
        sender: insertMessage.sender,
      })
      .returning();
    return message;
  }
}

export const storage = new DatabaseStorage();