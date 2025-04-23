export interface ReadEmailParams {
  username?: string;
  password?: string;
  messageId: string;
}

export interface SearchEmailParams {
  username?: string;
  password?: string;
  query?: string;
  limit?: number;
}

export interface EmailHeader {
  id: string;
  subject: string;
  from: string;
  to: string;
  date: string;
}

export interface Email extends EmailHeader {
  content?: string;
  html?: string;
}

export interface SearchEmailResponse {
  success: boolean;
  emails: Email[];
  error?: string;
}

export interface ReadEmailResponse {
  success: boolean;
  email?: Email;
  error?: string;
}

export interface SendEmailParams {
  username?: string;
  password?: string;
  to: string;
  subject: string;
  text?: string;
  html?: string;
  cc?: string[];
  bcc?: string[];
  attachments?: Array<{
    filename: string;
    content: string | Buffer;
  }>;
}

export interface SendEmailResponse {
  success: boolean;
  messageId?: string;
  error?: string;
} 