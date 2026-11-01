import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { PGlite } from '@electric-sql/pglite'

const migration = await readFile(new URL('../supabase/migrations/202610260001_events_and_signups.sql', import.meta.url), 'utf8')
const seed = await readFile(new URL('../supabase/seed.sql', import.meta.url), 'utf8')

test('migration enforces names, capacity, permissions, and transactional counts', async () => {
  const db = new PGlite()
  try {
    await db.exec('create role anon; create role authenticated;')
    await db.exec(migration)
    await db.exec(seed)
    await db.exec(seed)
    assert.equal((await db.query('select * from public.events')).rows.length, 3)
    const role = '20000000-0000-0000-0000-000000000001'
    const insert = name => db.query('insert into public.signups(role_id,name) values ($1,$2) returning name', [role, name])
    const count = async () => Number((await db.query('select filled_slots from public.roles where id=$1', [role])).rows[0].filled_slots)
    await db.exec('set role anon')
    assert.equal((await insert('  Nina   Tsai  ')).rows[0].name, 'Nina Tsai')
    await assert.rejects(insert('nINA TSAI'), { code: '23505' })
    assert.equal(await count(), 1, 'duplicate rolls back the reserved slot')
    await assert.rejects(insert(' \t\n '), { code: '23514' })
    await assert.rejects(insert('x'.repeat(81)), { code: '23514' })
    assert.equal(await count(), 1)
    await insert('Alex')
    await assert.rejects(insert('Sam'), { code: '23514' })
    assert.equal(await count(), 2)
    await assert.rejects(db.exec("update public.roles set slots=10"), { code: '42501' })
    await assert.rejects(db.exec("delete from public.signups"), { code: '42501' })
    await assert.rejects(db.exec("insert into public.events(title,location,starts_at) values('bad','bad',now())"), { code: '42501' })
    await assert.rejects(db.query('insert into public.signups(role_id,name,created_at) values ($1,$2,now())', [role, 'Sam']), { code: '42501' })
    await db.exec('reset role')
    await assert.rejects(db.query('update public.roles set slots=1 where id=$1', [role]), { code: '23514' })
    await db.query('delete from public.signups where role_id=$1 and name=$2', [role, 'Alex'])
    assert.equal(await count(), 1)
    await db.exec('set role anon')
    await insert('Sam')
    assert.equal(await count(), 2)
    await db.exec('reset role')
    await db.query('delete from public.events where id=$1', ['10000000-0000-0000-0000-000000000001'])
    assert.equal((await db.query('select * from public.signups where role_id=$1', [role])).rows.length, 0)
  } finally { await db.close() }
})
