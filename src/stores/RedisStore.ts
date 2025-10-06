import Store from "./Store.ts";
import type { Redis } from "https://deno.land/x/redis@v0.27.0/mod.ts";
import { SessionData } from "../Session.ts";

export default class RedisStore implements Store {
  keyPrefix: string;
  db: Redis;

  constructor(db: Redis, keyPrefix = "session_") {
    this.keyPrefix = keyPrefix;
    this.db = db;
  }

  async getSessionById(sessionId: string) {
    const sessionString = await this.db.get(this.keyPrefix + sessionId);

    if (sessionString) {
      const value = JSON.parse(String(sessionString)) as SessionData;
      return value;
    } else {
      return null;
    }
  }

  async createSession(sessionId: string, initialData: SessionData) {
    const key = this.keyPrefix + sessionId;
    await this.db.set(key, JSON.stringify(initialData));

    // Set TTL if session has expiration (microservice optimization)
    if (initialData._expire) {
      const expireTime = new Date(initialData._expire);
      const ttlSeconds = Math.max(
        0,
        Math.floor((expireTime.getTime() - Date.now()) / 1000),
      );
      if (ttlSeconds > 0) {
        await this.db.expire(key, ttlSeconds);
      }
    }
  }

  async deleteSession(sessionId: string) {
    await this.db.del(this.keyPrefix + sessionId);
  }

  async persistSessionData(sessionId: string, sessionData: SessionData) {
    const key = this.keyPrefix + sessionId;
    await this.db.set(key, JSON.stringify(sessionData));

    // Set TTL if session has expiration
    if (sessionData._expire) {
      const expireTime = new Date(sessionData._expire);
      const ttlSeconds = Math.max(
        0,
        Math.floor((expireTime.getTime() - Date.now()) / 1000),
      );
      if (ttlSeconds > 0) {
        await this.db.expire(key, ttlSeconds);
      }
    }
  }
}
