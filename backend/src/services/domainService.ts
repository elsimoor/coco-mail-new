import { connectToDatabase } from '../db';
import { ObjectId } from 'mongodb';

/**
 * Interface describing the SMTP domain configuration. Each entry represents
 * one outbound email domain that free users can send through. Fields like
 * host, port, username and password correspond to the credentials needed by
 * nodemailer to connect to the SMTP server. The `from` field defines the
 * default sender address used when sending mail through this domain. The
 * `limit` field defines the maximum number of messages that may be sent
 * through this domain within a one‑hour rolling window. The `order` field
 * determines the priority of the domain; lower numbers are tried first.
 */
export interface DomainConfig {
  id: string;
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password: string;
  from: string;
  limit: number;
  order: number;
  created_at: string;
}

/**
 * Interface describing the usage record for a domain. Each domain has an
 * associated document in the `smtp_domain_usage` collection which tracks
 * how many messages have been sent in the current one‑hour window and when
 * that window started. When the window expires (i.e. an hour has elapsed
 * since `window_start`), the count is reset. The `domain_id` field is a
 * reference to the `_id` of the domain configuration document.
 */
interface DomainUsage {
  _id?: ObjectId;
  domain_id: ObjectId;
  window_start: Date;
  count: number;
}

/**
 * DomainService manages SMTP domain configuration and usage. It allows
 * administrators to add new domains, retrieve the list of configured
 * domains, and handle per‑domain send limits. The send limit logic is
 * implemented via the `getNextAvailableDomain` and `incrementUsage` methods.
 */
export class DomainService {
  /**
   * Returns all configured SMTP domains sorted by their `order` field. If no
   * domains exist, an empty array is returned. The returned documents are
   * mapped into `DomainConfig` objects where the MongoDB `_id` is converted
   * to a string `id` property.
   */
  async getDomains(): Promise<DomainConfig[]> {
    const db = await connectToDatabase();
    const domains = await db
      .collection('smtp_domains')
      .find()
      .sort({ order: 1 })
      .toArray();
    return domains.map((doc: any) => ({
      id: doc._id.toString(),
      host: doc.host,
      port: doc.port,
      secure: doc.secure,
      username: doc.username,
      password: doc.password,
      from: doc.from,
      limit: doc.limit,
      order: doc.order,
      created_at: doc.created_at,
    })) as DomainConfig[];
  }

  /**
   * Inserts a new SMTP domain configuration into the `smtp_domains`
   * collection. The caller must supply all required fields. The `order`
   * defaults to the next available integer (i.e. the number of existing
   * documents) unless explicitly provided. On success the newly created
   * DomainConfig is returned; otherwise null is returned.
   */
  async addDomain(config: Omit<DomainConfig, 'id' | 'created_at' | 'order'> & { order?: number }): Promise<DomainConfig | null> {
    try {
      const db = await connectToDatabase();
      // Determine default order if not provided. This ensures new domains
      // are appended to the end of the priority list by default.
      let order = config.order;
      if (order === undefined) {
        const count = await db.collection('smtp_domains').countDocuments();
        order = count;
      }
      const doc = {
        host: config.host,
        port: config.port,
        secure: config.secure,
        username: config.username,
        password: config.password,
        from: config.from,
        limit: config.limit,
        order: order,
        created_at: new Date().toISOString(),
      };
      const result = await db.collection('smtp_domains').insertOne(doc as any);
      return {
        id: result.insertedId.toString(),
        ...doc,
      } as DomainConfig;
    } catch (error) {
      console.error('Error adding SMTP domain:', error);
      return null;
    }
  }

  /**
   * Retrieves the usage document for the given domain. If no usage document
   * exists, one is created with a window start equal to now and count of
   * zero. This ensures usage tracking always returns a valid record. The
   * returned object includes both the usage document and the underlying
   * MongoDB `_id` for internal updates.
   *
   * @param domainId String representation of the domain's ObjectId.
   */
  private async getUsageDoc(domainId: string): Promise<DomainUsage> {
    const db = await connectToDatabase();
    const domId = new ObjectId(domainId);
    let usage = await db.collection('smtp_domain_usage').findOne({ domain_id: domId });
    if (!usage) {
      const newUsage: DomainUsage = {
        domain_id: domId,
        window_start: new Date(),
        count: 0,
      };
      const result = await db.collection('smtp_domain_usage').insertOne(newUsage as any);
      usage = { _id: result.insertedId, ...newUsage } as any;
    }
    return usage as DomainUsage;
  }

  /**
   * Determines whether a domain has remaining quota in the current one‑hour
   * window. If the existing window has expired (i.e. an hour has passed
   * since the window started), the usage is reset to zero. Returns true if
   * the domain has available quota, along with the updated count and
   * window start. If no quota remains, returns false.
   *
   * @param domain Domain configuration object.
   */
  private async hasQuota(domain: DomainConfig): Promise<{ available: boolean; usage: DomainUsage }> {
    const usage = await this.getUsageDoc(domain.id);
    const now = new Date();
    const windowStart = usage.window_start;
    const elapsed = now.getTime() - windowStart.getTime();
    // Reset usage if more than an hour has elapsed since window start
    if (elapsed >= 60 * 60 * 1000) {
      usage.window_start = now;
      usage.count = 0;
      const db = await connectToDatabase();
      await db
        .collection('smtp_domain_usage')
        .updateOne({ _id: usage._id }, { $set: { window_start: usage.window_start, count: usage.count } });
    }
    // Determine if the domain has available quota
    const available = usage.count < domain.limit;
    return { available, usage };
  }

  /**
   * Increments the usage count for the given domain. This should be called
   * immediately after a successful send operation. The update is persisted
   * back to MongoDB so that concurrent requests see the updated state.
   *
   * @param domainId String representation of the domain's ObjectId.
   */
  private async incrementUsage(domainId: string): Promise<void> {
    const usage = await this.getUsageDoc(domainId);
    const now = new Date();
    const elapsed = now.getTime() - usage.window_start.getTime();
    if (elapsed >= 60 * 60 * 1000) {
      // Start a new window if the previous one has expired
      usage.window_start = now;
      usage.count = 1;
    } else {
      usage.count += 1;
    }
    const db = await connectToDatabase();
    await db
      .collection('smtp_domain_usage')
      .updateOne({ _id: usage._id }, { $set: { window_start: usage.window_start, count: usage.count } });
  }

  /**
   * Returns the next available domain that has remaining quota. Domains are
   * evaluated in order of their `order` property. If no domains have
   * available quota in the current window, undefined is returned.
   */
  async getNextAvailableDomain(): Promise<DomainConfig | undefined> {
    const domains = await this.getDomains();
    for (const domain of domains) {
      const { available } = await this.hasQuota(domain);
      if (available) {
        return domain;
      }
    }
    return undefined;
  }

  /**
   * Called by MailService after a successful send to record usage. This
   * method updates the domain's usage count. Exposing this as public makes
   * testing easier and decouples MailService from usage persistence.
   */
  async recordUsage(domainId: string): Promise<void> {
    await this.incrementUsage(domainId);
  }
}