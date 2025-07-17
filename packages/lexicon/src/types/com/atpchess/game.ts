/**
 * GENERATED CODE - DO NOT MODIFY
 */
import { BlobRef, type ValidationResult } from '@atproto/lexicon'
import { CID } from 'multiformats/cid'

import { validate as _validate } from '../../../lexicons'
import { is$typed as _is$typed, type $Typed, type OmitKey } from '../../../util'

const is$typed = _is$typed,
  validate = _validate
const id = 'com.atpchess.game'

export interface Record {
  $type: 'com.atpchess.game'
  /** DID of the player initiating the challenge */
  challenger: string
  /** DID of the player being challenged */
  challenged: string
  /** DID of the player who makes the first move (plays white) */
  startsFirst: string
  /** Timestamp when the game was created */
  createdAt: string
  /** Optional time control format (e.g., '5+0', '10+5', 'correspondence') */
  timeControl?: string
  /** Whether this game is rated */
  rated: boolean
  [k: string]: unknown
}

const hashRecord = 'main'

export function isRecord<V>(v: V) {
  return is$typed(v, id, hashRecord)
}

export function validateRecord<V>(v: V) {
  return validate<Record & V>(v, id, hashRecord, true)
}
