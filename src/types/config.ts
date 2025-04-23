export interface Config {
  pop3: {
    host: string;
    port: number;
    ssl: boolean;
  };
  smtp: {
    host: string;
    port: number;
    secure: boolean;
  };
} 