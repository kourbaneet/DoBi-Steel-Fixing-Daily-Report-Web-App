import { Resend } from "resend";
import config from "@/config";

// Initialize Resend only if API key is available
let resend: Resend | null = null;

if (process.env.RESEND_API_KEY) {
  resend = new Resend(process.env.RESEND_API_KEY);
} else {
  console.warn("RESEND_API_KEY is not set - email sending will be mocked");
}

export interface EmailOptions {
  to: string | string[];
  subject: string;
  text: string;
  html: string;
  replyTo?: string | string[];
  attachments?: {
    filename: string;
    content: Buffer;
    contentType: string;
  }[];
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send email with retries and better error handling
 */
export const sendEmail = async (options: EmailOptions): Promise<EmailResult> => {
  const { to, subject, text, html, replyTo, attachments } = options;

  // Mock email sending if no API key
  if (!resend) {
    console.log("📧 Mock Email Sent:", {
      to: Array.isArray(to) ? to.join(', ') : to,
      subject,
      attachments: attachments?.length || 0
    });

    return {
      success: true,
      messageId: `mock-email-${Date.now()}`
    };
  }

  const maxRetries = 3;
  let lastError: any = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`📧 Sending email (attempt ${attempt}/${maxRetries}):`, {
        to: Array.isArray(to) ? to.join(', ') : to,
        subject
      });

      const emailData: any = {
        from: config.resend.fromAdmin,
        to,
        subject,
        text,
        html,
        ...(replyTo && { replyTo }),
      };

      // Add attachments if provided
      if (attachments && attachments.length > 0) {
        emailData.attachments = attachments;
      }

      const { data, error } = await resend.emails.send(emailData);

      if (error) {
        throw new Error(`Resend API error: ${error.message}`);
      }

      console.log(`✅ Email sent successfully:`, data?.id);
      return {
        success: true,
        messageId: data?.id
      };

    } catch (error) {
      lastError = error;
      console.error(`❌ Email sending failed (attempt ${attempt}/${maxRetries}):`,
        error instanceof Error ? error.message : error);

      // Don't retry on certain errors
      if (error instanceof Error) {
        const errorMessage = error.message.toLowerCase();
        if (errorMessage.includes('invalid email') ||
            errorMessage.includes('unauthorized') ||
            errorMessage.includes('forbidden')) {
          console.error(`💀 Fatal email error, not retrying:`, error.message);
          break;
        }
      }

      // Wait before retrying (exponential backoff)
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
        console.log(`⏳ Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  // All retries failed
  const errorMessage = lastError instanceof Error ? lastError.message : 'Unknown email error';
  console.error(`💥 Email sending failed after ${maxRetries} attempts:`, errorMessage);

  return {
    success: false,
    error: errorMessage
  };
};

/**
 * Send email with PDF attachment
 */
export const sendEmailWithPDF = async (
  emailOptions: Omit<EmailOptions, 'attachments'>,
  pdfBuffer: Buffer,
  pdfFilename: string
): Promise<EmailResult> => {
  return sendEmail({
    ...emailOptions,
    attachments: [
      {
        filename: pdfFilename,
        content: pdfBuffer,
        contentType: 'application/pdf'
      }
    ]
  });
};
