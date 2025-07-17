/**
 * GENERATED CODE - DO NOT MODIFY
 */
import { BlobRef, type ValidationResult } from '@atproto/lexicon'
import { HeadersMap, XRPCError } from '@atproto/xrpc'
import { CID } from 'multiformats/cid'

import { validate as _validate } from '../../../lexicons'
import { is$typed as _is$typed, type $Typed, type OmitKey } from '../../../util'
import type * as ComAtpchessDefs from './defs.js'

const is$typed = _is$typed,
  validate = _validate
const id = 'com.atpchess.makeMove'

export type QueryParams = {}

export interface InputSchema {
  /** AT-URI of the game record */
  game: string
  /** AT-URI of the previous move (required except for first move) */
  previousMove?: string
  /** Chess move in algebraic notation (e.g., 'e4', 'Nf3', 'O-O') */
  move: string
  /** FEN string representing the board position after this move */
  fen?: string
  /** Time remaining in seconds for the player making this move */
  timeRemaining?: number
  /** Whether to offer a draw with this move */
  drawOffer?: boolean
  /** Whether this move is a resignation */
  resignation?: boolean
}

export interface OutputSchema {
  move: ComAtpchessDefs.MoveView
}

export interface CallOptions {
  signal?: AbortSignal
  headers?: HeadersMap
  qp?: QueryParams
  encoding?: 'application/json'
}

export interface Response {
  success: boolean
  headers: HeadersMap
  data: OutputSchema
}

export class GameNotFoundError extends XRPCError {
  constructor(src: XRPCError) {
    super(src.status, src.error, src.message, src.headers, { cause: src })
  }
}

export class NotYourTurnError extends XRPCError {
  constructor(src: XRPCError) {
    super(src.status, src.error, src.message, src.headers, { cause: src })
  }
}

export class InvalidMoveError extends XRPCError {
  constructor(src: XRPCError) {
    super(src.status, src.error, src.message, src.headers, { cause: src })
  }
}

export class GameNotActiveError extends XRPCError {
  constructor(src: XRPCError) {
    super(src.status, src.error, src.message, src.headers, { cause: src })
  }
}

export class PreviousMoveRequiredError extends XRPCError {
  constructor(src: XRPCError) {
    super(src.status, src.error, src.message, src.headers, { cause: src })
  }
}

export class InvalidPreviousMoveError extends XRPCError {
  constructor(src: XRPCError) {
    super(src.status, src.error, src.message, src.headers, { cause: src })
  }
}

export function toKnownErr(e: any) {
  if (e instanceof XRPCError) {
    if (e.error === 'GameNotFound') return new GameNotFoundError(e)
    if (e.error === 'NotYourTurn') return new NotYourTurnError(e)
    if (e.error === 'InvalidMove') return new InvalidMoveError(e)
    if (e.error === 'GameNotActive') return new GameNotActiveError(e)
    if (e.error === 'PreviousMoveRequired')
      return new PreviousMoveRequiredError(e)
    if (e.error === 'InvalidPreviousMove')
      return new InvalidPreviousMoveError(e)
  }

  return e
}
