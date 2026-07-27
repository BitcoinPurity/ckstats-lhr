/**
 * @jest-environment node
 *
 * buildUserWorkerRows dedups a user's workers by worker_name before the snapshot upsert. ckpool keys
 * workers by their full name, but parseWorkerName collapses distinct names to one key — a bare address
 * and a trailing-dot name both parse to the empty string. A single ON CONFLICT batch can't touch one
 * conflict key twice, so colliding workers must merge into one row (summing rates/shares, maxing the
 * bests) rather than yield a duplicate that aborts the pool's whole worker write (SQLSTATE 21000).
 */
import { buildUserWorkerRows } from '../../lib/ingest';

const now = new Date('2020-01-01T00:00:00Z');

const worker = (over: Record<string, unknown>) => ({
  workername: 'addr.rig',
  hashrate1m: '0',
  hashrate5m: '0',
  hashrate1hr: '0',
  hashrate1d: '0',
  hashrate7d: '0',
  lastshare: 0,
  started: 0,
  shares: 0,
  bestshare: 0,
  bestever: 0,
  useragent: '',
  ...over,
});

it('keeps distinct worker names as separate rows', () => {
  const rows = buildUserWorkerRows(
    [worker({ workername: 'addr.rig1' }), worker({ workername: 'addr.rig2' })],
    'poolA',
    'addr',
    now
  );
  expect(rows.map((r) => r.worker_name).sort()).toEqual(['rig1', 'rig2']);
});

it('merges a bare-address and a trailing-dot worker (both normalize to "") into one summed row', () => {
  const rows = buildUserWorkerRows(
    [
      worker({
        workername: 'addr',
        hashrate1m: '100',
        shares: 10,
        bestever: 5,
        lastshare: 1000,
        useragent: 'cgminer',
      }),
      worker({
        workername: 'addr.',
        hashrate1m: '50',
        shares: 20,
        bestever: 8,
        lastshare: 2000,
        useragent: 'bfgminer',
      }),
    ],
    'poolA',
    'addr',
    now
  );

  expect(rows).toHaveLength(1);
  const r = rows[0];
  expect(r.worker_name).toBe('');
  expect(r.hashrate1m).toBe(150); // summed
  expect(r.shares).toBe(30); // summed
  expect(r.best_ever).toBe(8); // max
  expect(r.last_share).toBe(2000); // max
  expect(r.device_raw).toBe('bfgminer'); // device follows the most-recently-active (greater lastshare)
});
