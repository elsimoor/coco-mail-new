import nodemailer from 'nodemailer';
import mailchimp from '@mailchimp/mailchimp_marketing';
import axios from 'axios';
import { DomainService } from './domainService';

/**
 * MailService encapsulates email sending and receiving logic. For free users it
 * sends email via SMTP using nodemailer or an SMTP testing API (smtp.dev). For
 * pro users it sends email using the Mailchimp Transactional API. Receiving
 * email is implemented for the free tier via the smtp.dev API. Inbound email
 * for premium users is left as a stub.
 */
export class MailService {
  private domainService: DomainService;
  constructor() {
    // Configure Mailchimp client on construction. Only runs once.
    const mailchimpApiKey = process.env.MAILCHIMP_API_KEY;
    const mailchimpServerPrefix = process.env.MAILCHIMP_SERVER_PREFIX;
    if (mailchimpApiKey && mailchimpServerPrefix) {
      mailchimp.setConfig({
        apiKey: mailchimpApiKey,
        server: mailchimpServerPrefix,
      });
    }

    // Instantiate a DomainService to manage free tier domain rotation. This
    // service handles retrieving domains from MongoDB and tracking
    // per‑domain usage counts. It is declared here so that a single
    // instance can be reused across calls to sendEmail().
    this.domainService = new DomainService();
  }

  /**
   * Send an email. Uses nodemailer for free users and Mailchimp for pro users.
   * @param user The authenticated user sending the email. The user's roles
   * determine whether to use the free SMTP route or premium Mailchimp.
   * @param message Email message parameters including to, subject, text and html.
   */
  async sendEmail(
    user: { id: string; roles?: string[] },
    message: { to: string; subject: string; text?: string; html?: string }
  ): Promise<any> {
    const { to, subject, text, html } = message;
    // Determine if user is pro. If roles array contains 'pro', use Mailchimp.
    const isPro = Array.isArray(user.roles) && user.roles.includes('pro');
    if (isPro) {
      // Premium: use Mailchimp Transactional API to send email
      if (!process.env.MAILCHIMP_API_KEY || !process.env.MAILCHIMP_SERVER_PREFIX) {
        throw new Error('Mailchimp API key and server prefix must be provided for premium email sending');
      }
      const fromEmail = process.env.SENDER_EMAIL || 'no-reply@cocoinbox.app';
      // @ts-ignore
      const response = await mailchimp.messages.send({
        message: {
          from_email: fromEmail,
          subject,
          text: text || undefined,
          html: html || undefined,
          to: [{ email: to, type: 'to' }],
        },
      } as any);
      return response;
    }
    // Free tier: send email using one of the configured domains managed by
    // DomainService. The service rotates through domains based on
    // per‑domain usage limits. If all domains are exhausted, fall back to
    // any SMTP credentials defined in environment variables. Finally, if
    // smtp.dev credentials are provided, use that as a last resort.
    // 1. Attempt to find an available domain from the database
    try {
      const domain = await this.domainService.getNextAvailableDomain();
      if (domain) {
        // Create a nodemailer transport using the domain's credentials
        const transporter = nodemailer.createTransport({
          host: domain.host,
          port: domain.port,
          secure: domain.secure,
          auth: {
            user: domain.username,
            pass: domain.password,
          },
        });
        const info = await transporter.sendMail({
          from: domain.from,
          to,
          subject,
          text: text || undefined,
          html: html || undefined,
        });
        // Record the usage count for this domain. This updates the
        // per‑domain window and ensures the next call sees the updated
        // count.
        await this.domainService.recordUsage(domain.id);
        return info;
      }
    } catch (e) {
      // Log error but continue to fallback transports
      console.error('Error sending via configured domain:', e);
    }

    // 2. Fallback: use SMTP credentials from environment variables if provided
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = process.env.SMTP_PORT;
    const smtpUser = process.env.SMTP_USERNAME;
    const smtpPass = process.env.SMTP_PASSWORD;
    const fromEmail = process.env.SENDER_EMAIL || 'no-reply@cocoinbox.app';
    if (smtpHost && smtpPort && smtpUser && smtpPass) {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: parseInt(smtpPort, 10),
        secure: parseInt(smtpPort, 10) === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });
      const info = await transporter.sendMail({
        from: fromEmail,
        to,
        subject,
        text: text || undefined,
        html: html || undefined,
      });
      return info;
    }

    // 3. Final fallback: use smtp.dev API if configured. Useful for
    // development/testing when no real SMTP server is available.
    const smtpDevApiKey = process.env.SMTPDEV_API_KEY;
    const smtpDevAccountId = process.env.SMTPDEV_ACCOUNT_ID;
    const smtpDevMailboxId = process.env.SMTPDEV_MAILBOX_ID;
    if (smtpDevApiKey && smtpDevAccountId && smtpDevMailboxId) {
      const response = await axios.post(
        `https://api.smtp.dev/accounts/${smtpDevAccountId}/mailboxes/${smtpDevMailboxId}/messages`,
        {
          to,
          from: fromEmail,
          subject,
          text: text || '',
          html: html || '',
        },
        {
          headers: {
            'X-API-KEY': smtpDevApiKey,
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data;
    }
    // If we reach this point, there are no configured domains or fallback
    // transports available. Throw an error instructing the user to
    // configure SMTP credentials or add free tier domains.
    throw new Error('No email transport configured or free tier quota exhausted. Please add domains or upgrade to premium.');
  }

  /**
   * Receive emails. For free users this fetches messages via smtp.dev API. For
   * pro users this is a stub as inbound email processing would require
   * additional setup (e.g. Mailchimp Inbound processing or IMAP). Returns an
   * array of messages or an empty array if none are available or no inbound
   * mechanism is configured.
   * @param user The authenticated user requesting messages.
   */
  async receiveEmails(user: { id: string; roles?: string[] }): Promise<any[]> {
    const isPro = Array.isArray(user.roles) && user.roles.includes('pro');
    // Pro users: inbound email via Mailchimp is not implemented in this version
    if (isPro) {
      return [];
    }
    // Free users: use smtp.dev API to fetch inbox messages
    const smtpDevApiKey = process.env.SMTPDEV_API_KEY;
    const smtpDevAccountId = process.env.SMTPDEV_ACCOUNT_ID;
    const smtpDevMailboxId = process.env.SMTPDEV_MAILBOX_ID;
    if (smtpDevApiKey && smtpDevAccountId && smtpDevMailboxId) {
      const response = await axios.get(
        `https://api.smtp.dev/accounts/${smtpDevAccountId}/mailboxes/${smtpDevMailboxId}/messages`,
        {
          headers: {
            'X-API-KEY': smtpDevApiKey,
            Accept: 'application/json',
          },
        }
      );
      // Return the list of message resources
      return response.data.member || [];
    }
    return [];
  }
}
