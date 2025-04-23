import Pop3Command from 'node-pop3';
import { Config } from '../types/config.js';

const config: Config = {
  pop3: {
    host: "pop3s.hiworks.com",
    port: 995,
    ssl: true
  },
  smtp: {
    host: "smtps.hiworks.com",
    port: 465,
    secure: true
  }
};

export class Pop3Client {
  private client: Pop3Command;

  constructor(username: string, password: string) {
    this.client = new Pop3Command({
      user: username,
      password: password,
      host: config.pop3.host,
      port: config.pop3.port,
      tls: config.pop3.ssl,
      timeout: 60000 // 60초 timeout 설정
    });
  }

  async getEmailCount(): Promise<number> {
    try {
      const [count] = await this.client.STAT();
      return count;
    } catch (error) {
      console.error('Failed to get email count:', error);
      throw error;
    }
  }

  async getEmailList(): Promise<[number, string][]> {
    try {
      return await this.client.LIST();
    } catch (error) {
      console.error('Failed to get email list:', error);
      throw error;
    }
  }

  async getEmail(index: number): Promise<string> {
    try {
      return await this.client.RETR(index);
    } catch (error) {
      console.error(`Failed to get email at index ${index}:`, error);
      throw error;
    }
  }

  async close(): Promise<void> {
    try {
      await this.client.QUIT();
    } catch (error) {
      console.error('Failed to close POP3 connection:', error);
      throw error;
    }
  }
} 