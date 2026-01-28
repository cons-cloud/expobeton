// Type declarations for Deno environment
declare namespace Deno {
  export namespace env {
    export function get(key: string): string | undefined;
  }
}

declare module 'https://deno.land/std@0.177.0/http/server.ts' {
  export function serve(handler: (req: Request) => Promise<Response>): void;
}

declare module 'https://deno.land/x/nodemailer@v1.0.0/mod.ts' {
  export interface Transporter {
    sendMail(mailOptions: MailOptions): Promise<MailResponse>;
  }
  
  export interface MailOptions {
    from?: string;
    to: string | string[];
    subject: string;
    text?: string;
    html?: string;
  }
  
  export interface MailResponse {
    messageId: string;
  }
  
  export function createTransport(config: SMTPConfig): Transporter;
  
  export interface SMTPConfig {
    host: string;
    port: number;
    secure?: boolean;
    auth: {
      user: string;
      pass: string;
    };
  }
}
