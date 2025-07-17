import { ComAtpchessGame, ComAtpchessMove } from '@atpchess/lexicon'
import { IdResolver } from '@atproto/identity'
import { Firehose, MemoryRunner, type Event } from '@atproto/sync'
import pino from 'pino'

import type { Database } from '#/db'

export async function createFirehoseIngester(
  db: Database,
  idResolver: IdResolver,
) {
  const logger = pino({ name: 'firehose ingestion' })

  const cursor = await db
    .selectFrom('cursor')
    .where('id', '=', 1)
    .select('seq')
    .executeTakeFirst()

  logger.info(`start cursor: ${cursor?.seq}`)

  // For throttling cursor writes
  let lastCursorWrite = 0

  const runner = new MemoryRunner({
    startCursor: cursor?.seq || undefined,
    setCursor: async (seq) => {
      const now = Date.now()

      if (now - lastCursorWrite >= 10000) {
        lastCursorWrite = now
        await db
          .updateTable('cursor')
          .set({ seq })
          .where('id', '=', 1)
          .execute()
      }
    },
  })

  return new Firehose({
    idResolver,
    runner,
    handleEvent: async (evt: Event) => {
      // Watch for write events
      if (evt.event === 'create' || evt.event === 'update') {
        const now = new Date()
        const record = evt.record

        // If the write is a chess game
        if (
          evt.collection === 'com.atpchess.game' &&
          ComAtpchessGame.isRecord(record)
        ) {
          const validatedRecord = ComAtpchessGame.validateRecord(record)
          if (!validatedRecord.success) return

          // Store the game in our SQLite
          await db
            .insertInto('game')
            .values({
              uri: evt.uri.toString(),
              challenger: validatedRecord.value.challenger,
              challenged: validatedRecord.value.challenged,
              startsFirst: validatedRecord.value.startsFirst,
              status: 'pending',
              timeControl: validatedRecord.value.timeControl,
              rated: validatedRecord.value.rated || false,
              createdAt: validatedRecord.value.createdAt,
              indexedAt: now.toISOString(),
              moveCount: 0,
            })
            .onConflict((oc) =>
              oc.column('uri').doUpdateSet({
                indexedAt: now.toISOString(),
              }),
            )
            .execute()
        }
        // If the write is a chess move
        else if (
          evt.collection === 'com.atpchess.move' &&
          ComAtpchessMove.isRecord(record)
        ) {
          const validatedRecord = ComAtpchessMove.validateRecord(record)
          if (!validatedRecord.success) return

          // Get the current move count for this game
          const game = await db
            .selectFrom('game')
            .where('uri', '=', validatedRecord.value.game.uri)
            .select(['moveCount', 'challenger', 'challenged', 'startsFirst'])
            .executeTakeFirst()

          if (!game) {
            logger.warn(
              { gameUri: validatedRecord.value.game.uri },
              'Move references non-existent game',
            )
            return
          }

          const moveNumber = game.moveCount + 1

          // Store the move in our SQLite
          await db
            .insertInto('move')
            .values({
              uri: evt.uri.toString(),
              gameUri: validatedRecord.value.game.uri,
              playerDid: evt.did,
              move: validatedRecord.value.move,
              fen: validatedRecord.value.fen,
              moveNumber,
              previousMoveUri: validatedRecord.value.previousMove?.uri,
              timeRemaining: validatedRecord.value.timeRemaining,
              drawOffer: validatedRecord.value.drawOffer || false,
              resignation: validatedRecord.value.resignation || false,
              createdAt: validatedRecord.value.createdAt,
              indexedAt: now.toISOString(),
            })
            .onConflict((oc) =>
              oc.column('uri').doUpdateSet({
                move: validatedRecord.value.move,
                fen: validatedRecord.value.fen,
                timeRemaining: validatedRecord.value.timeRemaining,
                drawOffer: validatedRecord.value.drawOffer || false,
                resignation: validatedRecord.value.resignation || false,
                indexedAt: now.toISOString(),
              }),
            )
            .execute()

          // Update game with latest move info
          const updates: any = {
            lastMoveAt: validatedRecord.value.createdAt,
            moveCount: moveNumber,
            status: 'active',
            indexedAt: now.toISOString(),
          }

          // Check for game end conditions
          if (validatedRecord.value.resignation) {
            updates.status = 'completed'
            // The player who resigned loses
            updates.winner =
              evt.did === game.challenger ? game.challenged : game.challenger
            updates.result =
              evt.did === game.startsFirst ? 'black-wins' : 'white-wins'
          }

          await db
            .updateTable('game')
            .set(updates)
            .where('uri', '=', validatedRecord.value.game.uri)
            .execute()
        }
      } else if (evt.event === 'delete') {
        if (evt.collection === 'com.atpchess.game') {
          // Mark game as abandoned rather than deleting
          await db
            .updateTable('game')
            .set({
              status: 'abandoned',
              indexedAt: new Date().toISOString(),
            })
            .where('uri', '=', evt.uri.toString())
            .execute()
        } else if (evt.collection === 'com.atpchess.move') {
          // Remove the move from our SQLite
          await db
            .deleteFrom('move')
            .where('uri', '=', evt.uri.toString())
            .execute()

          // TODO: Update game move count
        }
      }
    },
    onError: (err: Error) => {
      logger.error({ err }, 'error on firehose ingestion')
    },
    filterCollections: ['com.atpchess.game', 'com.atpchess.move'],
    excludeIdentity: true,
    excludeAccount: true,
  })
}
