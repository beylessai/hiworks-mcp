declare module 'node-pop3' {
  interface Pop3Config {
    user: string;
    password: string;
    host: string;
    port: number;
    tls: boolean;
    timeout?: number;
  }

  export default class Pop3Command {
    constructor(config: Pop3Config);
    STAT(): Promise<[number, number]>;
    LIST(): Promise<[number, string][]>;
    RETR(index: number): Promise<string>;
    QUIT(): Promise<void>;
    UIDL(): Promise<[string, string][]>;
    UIDL(msgNum: string | number): Promise<[string, string][]>;
    TOP(msgNum: number, n: number): Promise<string>;
  }
} 