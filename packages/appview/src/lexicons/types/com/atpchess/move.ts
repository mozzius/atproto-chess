/**
 * GENERATED CODE - DO NOT MODIFY
 */
import { BlobRef, type ValidationResult } from '@atproto/lexicon'
import { CID } from 'multiformats/cid'

import { validate as _validate } from '../../../lexicons'
import { is$typed as _is$typed, type $Typed, type OmitKey } from '../../../util'
import type * as ComAtprotoRepoStrongRef from '../atproto/repo/strongRef.js'

const is$typed = _is$typed,
  validate = _validate
const id = 'com.atpchess.move'

export interface Record {
  $type: 'com.atpchess.move'
  game: ComAtprotoRepoStrongRef.Main
  previousMove?: ComAtprotoRepoStrongRef.Main
  /** Chess move in algebraic notation (e.g., 'e4', 'Nf3', 'O-O') */
  move: string
  /** FEN string representing the board position after this move */
  fen?: string
  /** Timestamp when the move was made */
  createdAt: string
  /** Time remaining in seconds for the player who made this move */
  timeRemaining?: number
  /** Whether this move includes a draw offer */
  drawOffer?: boolean
  /** Whether this move is a resignation */
  resignation?: boolean
  [k: string]: unknown
}

const hashRecord = 'main'

export function isRecord<V>(v: V) {
  return is$typed(v, id, hashRecord)
}

export function validateRecord<V>(v: V) {
  return validate<Record & V>(v, id, hashRecord, true)
}
