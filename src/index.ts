import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { ReadEmailParams, ReadEmailResponse, SearchEmailParams, SearchEmailResponse, Email, SendEmailParams, SendEmailResponse } from './types/mail.js';
import Pop3Command from 'node-pop3';
import { simpleParser } from 'mailparser';
import { Config } from './types/config.js';
import nodemailer from 'nodemailer';

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

// 날짜를 ISO 문자열로 변환하는 함수
function formatDate(date: Date): string {
  return date.toISOString();
}

const server = new McpServer({
  name: 'hiworks-mcp',
  version: '1.0.0',
  capabilities: {
    resources: {},
    tools: {},
  }
});

const emailSchema = {
  username: z.string().default(process.env['HIWORKS_USERNAME'] || ''),
  password: z.string().default(process.env['HIWORKS_PASSWORD'] || '')
};

const searchEmailSchema = {
  ...emailSchema,
  query: z.string().optional(),
  limit: z.number().optional()
};

const readEmailSchema = {
  ...emailSchema,
  messageId: z.string()
};

async function connectPOP3(username: string, password: string): Promise<Pop3Command> {
  const pop3Config = {
    user: username,
    password: password,
    host: config.pop3.host,
    port: config.pop3.port,
    tls: config.pop3.ssl,
    timeout: 60000
  };
  console.error('Creating POP3 client with config:', pop3Config);
  
  const client = new Pop3Command(pop3Config);
  return client;
}

// SMTP 클라이언트 생성 함수
async function createSMTPTransporter(username: string, password: string) {
  return nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.secure,
    auth: {
      user: username,
      pass: password
    }
  });
}

server.tool(
  'read_username',
  '하이웍스 username을 읽어옵니다.',
  emailSchema,
  async ({ username, password }) => {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            username: username,
            password: password
          })
        }
      ]
    };
  }
);

server.tool(
  'search_email',
  '하이웍스 이메일을 검색합니다.',
  searchEmailSchema,
  async ({ username, password, query, limit = 10 }) => {
    try {
      console.error('POP3 Config:', config.pop3);
      const client = await connectPOP3(username, password);
      
      // STAT으로 메일박스 상태 확인
      const stat = await client.STAT();
      console.error(`\nMailbox status (STAT):
  - STAT messages: ${stat[0]}
  - STAT total size: ${stat[1]} bytes`);

      // LIST로 각 메일의 크기 확인 (메시지 번호는 1부터 시작)
      const messageList = await client.LIST();
      const totalMessages = messageList.length;  // LIST 결과로 전체 메시지 수 계산
      console.error('\nMessage list (LIST):');
      console.error(`  - Total messages from LIST: ${totalMessages}`);
      messageList.forEach(([num, size], index) => {
        if (index < 5 || index > messageList.length - 6) {
          console.error(`  - Message ${num}: ${size} bytes`);
        } else if (index === 5) {
          console.error('  ...');
        }
      });

      // UIDL로 메일의 고유 ID 확인
      const uidList = await client.UIDL();
      console.error('\nMessage UIDs (UIDL):');
      console.error(`  - Total UIDs: ${uidList.length}`);
      uidList.forEach(([num, uid], index) => {
        if (index < 5 || index > uidList.length - 6) {
          console.error(`  - Message ${num}: ${uid}`);
        } else if (index === 5) {
          console.error('  ...');
        }
      });

      const emails = [];
      const messagesToFetch = [];

      // 최신 메일 5개 선택 (가장 높은 번호부터)
      const startIndex = Math.min(totalMessages, messageList[messageList.length - 1][0]);
      for (let i = startIndex; i > Math.max(1, startIndex - limit); i--) {
        if (messageList.some(([num]) => Number(num) === i)) {
          messagesToFetch.push(i);
        }
      }

      console.error('\nFetching messages:', messagesToFetch.join(', '));

      // 선택된 메일들의 정보 가져오기
      for (const msgNum of messagesToFetch) {
        try {
          console.error(`\nProcessing message ${msgNum}:`);
          // 먼저 TOP으로 헤더만 가져오기
          const messageTop = await client.TOP(msgNum, 0);
          const parsed = await simpleParser(messageTop);
          
          // 메시지 정보 로깅
          const uid = uidList.find(([num]) => Number(num) === msgNum)?.[1] || '';
          const size = messageList.find(([num]) => Number(num) === msgNum)?.[1] || '0';
          console.error(`  - UID: ${uid}
  - Size: ${size} bytes
  - Date: ${parsed.date}
  - Subject: ${parsed.subject}
  - From: ${Array.isArray(parsed.from) ? parsed.from[0]?.text : parsed.from?.text}
  - To: ${Array.isArray(parsed.to) ? parsed.to[0]?.text : parsed.to?.text}`);

          emails.push({
            id: parsed.messageId || String(msgNum),
            subject: parsed.subject || '(제목 없음)',
            from: Array.isArray(parsed.from) ? parsed.from[0]?.text || '' : parsed.from?.text || '',
            to: Array.isArray(parsed.to) ? parsed.to[0]?.text || '' : parsed.to?.text || '',
            date: parsed.date ? formatDate(parsed.date) : new Date().toISOString()
          });
        } catch (err) {
          console.error(`Error processing message ${msgNum}:`, err);
        }
      }

      await client.QUIT();

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              success: true,
              emails
            } as SearchEmailResponse)
          }
        ]
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              success: false,
              emails: [],
              error: error.message
            } as SearchEmailResponse)
          }
        ]
      };
    }
  }
);

server.tool(
  'read_email',
  '하이웍스 이메일을 읽어옵니다.',
  readEmailSchema,
  async ({ username, password, messageId }) => {
    try {
      const client = await connectPOP3(username, password);
      const stat = await client.STAT();
      const totalMessages = stat[0];
      let email: Email | undefined;

      for (let i = totalMessages; i >= 1; i--) {
        try {
          const rawEmail = await client.RETR(i);
          const parsed = await simpleParser(rawEmail);
          
          if (parsed.messageId === messageId || String(i) === messageId) {
            email = {
              id: parsed.messageId || String(i),
              subject: parsed.subject || '(제목 없음)',
              from: Array.isArray(parsed.from) ? parsed.from[0]?.text || '' : parsed.from?.text || '',
              to: Array.isArray(parsed.to) ? parsed.to[0]?.text || '' : parsed.to?.text || '',
              date: parsed.date?.toISOString() || new Date().toISOString(),
              content: parsed.text || '',
              html: parsed.html || undefined
            };
            break;
          }
        } catch (err) {
          console.error(`Error processing email ${i}:`, err);
          continue;
        }
      }

      await client.QUIT();

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              success: true,
              email
            } as ReadEmailResponse)
          }
        ]
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              success: false,
              error: error.message
            } as ReadEmailResponse)
          }
        ]
      };
    }
  }
);

server.tool(
  'send_email',
  '하이웍스 이메일을 전송합니다.',
  {
    ...emailSchema,
    to: z.string(),
    subject: z.string(),
    text: z.string().optional(),
    html: z.string().optional(),
    cc: z.array(z.string()).optional(),
    bcc: z.array(z.string()).optional(),
    attachments: z.array(z.object({
      filename: z.string(),
      content: z.union([z.string(), z.instanceof(Buffer)])
    })).optional()
  },
  async ({ username, password, to, subject, text, html, cc, bcc, attachments }) => {
    try {
      console.error('Creating SMTP transporter...');
      const transporter = await createSMTPTransporter(username, password);

      const mailOptions = {
        from: username,
        to,
        subject,
        text,
        html,
        cc,
        bcc,
        attachments
      };

      console.error('Sending email...');
      const info = await transporter.sendMail(mailOptions);
      console.error('Email sent successfully:', info.messageId);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              success: true,
              messageId: info.messageId
            } as SendEmailResponse)
          }
        ]
      };
    } catch (error: any) {
      console.error('Error sending email:', error);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              success: false,
              error: error.message
            } as SendEmailResponse)
          }
        ]
      };
    }
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Hiworks MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});