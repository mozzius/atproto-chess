/**
 * GENERATED CODE - DO NOT MODIFY
 */
import { BlobRef, type ValidationResult } from '@atproto/lexicon'
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

export interface HandlerInput {
  encoding: 'application/json'
  body: InputSchema
}

export interface HandlerSuccess {
  encoding: 'application/json'
  body: OutputSchema
  headers?: { [key: string]: string }
}

export interface HandlerError {
  status: number
  message?: string
  error?:
    | 'GameNotFound'
    | 'NotYourTurn'
    | 'InvalidMove'
    | 'GameNotActive'
    | 'PreviousMoveRequired'
    | 'InvalidPreviousMove'
}

export type HandlerOutput = HandlerError | HandlerSuccess
