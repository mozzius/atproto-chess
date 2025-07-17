import SqliteDb from 'better-sqlite3'
import {
  Kysely,
  Migration,
  MigrationProvider,
  Migrator,
  SqliteDialect,
} from 'kysely'

// Types

export type DatabaseSchema = {
  game: Game
  move: Move
  auth_session: AuthSession
  auth_state: AuthState
  cursor: Cursor
}

export type Game = {
  uri: string
  challenger: string
  challenged: string
  startsFirst: string
  status: 'pending' | 'active' | 'completed' | 'abandoned'
  winner?: string
  result?: 'white-wins' | 'black-wins' | 'draw' | 'stalemate'
  timeControl?: string
  rated: boolean
  createdAt: string
  indexedAt: string
  lastMoveAt?: string
  moveCount: number
}

export type Move = {
  uri: string
  gameUri: string
  playerDid: string
  move: string
  fen?: string
  moveNumber: number
  previousMoveUri?: string
  timeRemaining?: number
  drawOffer: boolean
  resignation: boolean
  createdAt: string
  indexedAt: string
}

export type AuthSession = {
  key: string
  session: AuthSessionJson
}

export type AuthState = {
  key: string
  state: AuthStateJson
}

export type Cursor = {
  id: number
  seq: number
}

type AuthStateJson = string

type AuthSessionJson = string

// Migrations

const migrations: Record<string, Migration> = {}

const migrationProvider: MigrationProvider = {
  async getMigrations() {
    return migrations
  },
}

migrations['004'] = {
  async up(db: Kysely<unknown>) {
    // Drop the old status table
    await db.schema.dropTable('status').execute()

    // Create game table
    await db.schema
      .createTable('game')
      .addColumn('uri', 'varchar', (col) => col.primaryKey())
      .addColumn('challenger', 'varchar', (col) => col.notNull())
      .addColumn('challenged', 'varchar', (col) => col.notNull())
      .addColumn('startsFirst', 'varchar', (col) => col.notNull())
      .addColumn('status', 'varchar', (col) => col.notNull())
      .addColumn('winner', 'varchar')
      .addColumn('result', 'varchar')
      .addColumn('timeControl', 'varchar')
      .addColumn('rated', 'boolean', (col) => col.notNull().defaultTo(false))
      .addColumn('createdAt', 'varchar', (col) => col.notNull())
      .addColumn('indexedAt', 'varchar', (col) => col.notNull())
      .addColumn('lastMoveAt', 'varchar')
      .addColumn('moveCount', 'integer', (col) => col.notNull().defaultTo(0))
      .execute()

    // Add indexes separately
    await db.schema
      .createIndex('game_challenger_challenged_created')
      .on('game')
      .columns(['challenger', 'challenged', 'createdAt'])
      .unique()
      .execute()

    // Create move table
    await db.schema
      .createTable('move')
      .addColumn('uri', 'varchar', (col) => col.primaryKey())
      .addColumn('gameUri', 'varchar', (col) => col.notNull())
      .addColumn('playerDid', 'varchar', (col) => col.notNull())
      .addColumn('move', 'varchar', (col) => col.notNull())
      .addColumn('fen', 'varchar')
      .addColumn('moveNumber', 'integer', (col) => col.notNull())
      .addColumn('previousMoveUri', 'varchar')
      .addColumn('timeRemaining', 'integer')
      .addColumn('drawOffer', 'boolean', (col) =>
        col.notNull().defaultTo(false),
      )
      .addColumn('resignation', 'boolean', (col) =>
        col.notNull().defaultTo(false),
      )
      .addColumn('createdAt', 'varchar', (col) => col.notNull())
      .addColumn('indexedAt', 'varchar', (col) => col.notNull())
      .execute()

    // Add indexes separately
    await db.schema
      .createIndex('move_game_idx')
      .on('move')
      .column('gameUri')
      .execute()

    await db.schema
      .createIndex('move_player_idx')
      .on('move')
      .column('playerDid')
      .execute()

    await db.schema
      .createIndex('move_game_number_idx')
      .on('move')
      .columns(['gameUri', 'moveNumber'])
      .execute()

    // Add foreign key-like indexes
    await db.schema
      .createIndex('game_challenger_idx')
      .on('game')
      .column('challenger')
      .execute()

    await db.schema
      .createIndex('game_challenged_idx')
      .on('game')
      .column('challenged')
      .execute()

    await db.schema
      .createIndex('game_status_idx')
      .on('game')
      .column('status')
      .execute()
  },
  async down(db: Kysely<unknown>) {
    await db.schema.dropTable('move').execute()
    await db.schema.dropTable('game').execute()

    // Recreate the status table
    await db.schema
      .createTable('status')
      .addColumn('uri', 'varchar', (col) => col.primaryKey())
      .addColumn('authorDid', 'varchar', (col) => col.notNull())
      .addColumn('status', 'varchar', (col) => col.notNull())
      .addColumn('createdAt', 'varchar', (col) => col.notNull())
      .addColumn('indexedAt', 'varchar', (col) => col.notNull())
      .execute()
  },
}

migrations['003'] = {
  async up(db: Kysely<unknown>) {},
  async down(_db: Kysely<unknown>) {},
}

migrations['002'] = {
  async up(db: Kysely<unknown>) {
    await db.schema
      .createTable('cursor')
      .addColumn('id', 'integer', (col) => col.primaryKey())
      .addColumn('seq', 'integer', (col) => col.notNull())
      .execute()

    // Insert initial cursor values:
    // id=1 is for firehose, id=2 is for jetstream
    await db
      .insertInto('cursor' as never)
      .values([
        { id: 1, seq: 0 },
        { id: 2, seq: 0 },
      ])
      .execute()
  },
  async down(db: Kysely<unknown>) {
    await db.schema.dropTable('cursor').execute()
  },
}

migrations['001'] = {
  async up(db: Kysely<unknown>) {
    await db.schema
      .createTable('status')
      .addColumn('uri', 'varchar', (col) => col.primaryKey())
      .addColumn('authorDid', 'varchar', (col) => col.notNull())
      .addColumn('status', 'varchar', (col) => col.notNull())
      .addColumn('createdAt', 'varchar', (col) => col.notNull())
      .addColumn('indexedAt', 'varchar', (col) => col.notNull())
      .execute()
    await db.schema
      .createTable('auth_session')
      .addColumn('key', 'varchar', (col) => col.primaryKey())
      .addColumn('session', 'varchar', (col) => col.notNull())
      .execute()
    await db.schema
      .createTable('auth_state')
      .addColumn('key', 'varchar', (col) => col.primaryKey())
      .addColumn('state', 'varchar', (col) => col.notNull())
      .execute()
  },
  async down(db: Kysely<unknown>) {
    await db.schema.dropTable('auth_state').execute()
    await db.schema.dropTable('auth_session').execute()
    await db.schema.dropTable('status').execute()
  },
}

// APIs

export const createDb = (location: string): Database => {
  return new Kysely<DatabaseSchema>({
    dialect: new SqliteDialect({
      database: new SqliteDb(location),
    }),
  })
}

export const migrateToLatest = async (db: Database) => {
  const migrator = new Migrator({ db, provider: migrationProvider })
  const { error } = await migrator.migrateToLatest()
  if (error) throw error
}

export type Database = Kysely<DatabaseSchema>
