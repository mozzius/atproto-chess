/**
 * GENERATED CODE - DO NOT MODIFY
 */
import { BlobRef, type ValidationResult } from '@atproto/lexicon'
import { CID } from 'multiformats/cid'

import { validate as _validate } from '../../../lexicons'
import { is$typed as _is$typed, type $Typed, type OmitKey } from '../../../util'

const is$typed = _is$typed,
  validate = _validate
const id = 'com.atpchess.defs'

export interface GameView {
  $type?: 'com.atpchess.defs#gameView'
  uri: string
  challenger: PlayerView
  challenged: PlayerView
  startsFirst: string
  createdAt: string
  /** Current status of the game */
  status: 'pending' | 'active' | 'completed' | 'abandoned' | (string & {})
  /** DID of the winning player (if game is completed) */
  winner?: string
  /** Result of the game (if completed) */
  result?: 'white-wins' | 'black-wins' | 'draw' | 'stalemate' | (string & {})
  timeControl?: string
  rated?: boolean
  /** Total number of moves in the game */
  moveCount?: number
  /** Timestamp of the last move */
  lastMoveAt?: string
}

const hashGameView = 'gameView'

export function isGameView<V>(v: V) {
  return is$typed(v, id, hashGameView)
}

export function validateGameView<V>(v: V) {
  return validate<GameView & V>(v, id, hashGameView)
}

export interface MoveView {
  $type?: 'com.atpchess.defs#moveView'
  uri: string
  game: string
  previousMove?: string
  move: string
  fen?: string
  player: PlayerView
  createdAt: string
  /** Move number in the game (1-based) */
  moveNumber: number
  timeRemaining?: number
  drawOffer?: boolean
  resignation?: boolean
}

const hashMoveView = 'moveView'

export function isMoveView<V>(v: V) {
  return is$typed(v, id, hashMoveView)
}

export function validateMoveView<V>(v: V) {
  return validate<MoveView & V>(v, id, hashMoveView)
}

export interface PlayerView {
  $type?: 'com.atpchess.defs#playerView'
  did: string
  handle: string
  displayName?: string
  avatar?: string
  /** Chess rating (e.g., ELO) */
  rating?: number
}

const hashPlayerView = 'playerView'

export function isPlayerView<V>(v: V) {
  return is$typed(v, id, hashPlayerView)
}

export function validatePlayerView<V>(v: V) {
  return validate<PlayerView & V>(v, id, hashPlayerView)
}
