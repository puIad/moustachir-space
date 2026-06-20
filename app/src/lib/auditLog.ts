/**
 * lib/auditLog.ts — write AuditEvent rows on every mutation.
 */

import { auditEventsRepo } from '@/store/repositories';
import type { AuditEvent, EntityName } from '@spec/entities';

let _seq = Date.now();
function nextId(): string {
  return `AUD${String(++_seq).padStart(8, '0')}`;
}

export async function logAudit(
  entity: EntityName,
  entityId: string,
  action: AuditEvent['action'],
  opts: {
    field?: string;
    before?: unknown;
    after?: unknown;
    actor?: string;
  } = {},
): Promise<AuditEvent> {
  const event: AuditEvent = {
    id: nextId(),
    entity,
    entityId,
    action,
    field: opts.field ?? null,
    before: opts.before != null ? String(opts.before) : null,
    after: opts.after != null ? String(opts.after) : null,
    actor: opts.actor ?? 'user',
    timestamp: new Date().toISOString(),
    isSample: true,
  };
  await auditEventsRepo.create(event);
  return event;
}
