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
const id = 'com.atpchess.createGame'

export type QueryParams = {}

export interface InputSchema {
  /** DID of the player being challenged */
  challenged: string
  /** DID of the player who will play white (must be either the challenger or challenged) */
  startsFirst: string
  /** Time control format (e.g., '5+0', '10+5', 'correspondence') */
  timeControl?: string
  /** Whether this game should be rated */
  rated?: boolean
}

export interface OutputSchema {
  game: ComAtpchessDefs.GameView
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

export class InvalidPlayerError extends XRPCError {
  constructor(src: XRPCError) {
    super(src.status, src.error, src.message, src.headers, { cause: src })
  }
}

export class ChallengeSelfError extends XRPCError {
  constructor(src: XRPCError) {
    super(src.status, src.error, src.message, src.headers, { cause: src })
  }
}

export function toKnownErr(e: any) {
  if (e instanceof XRPCError) {
    if (e.error === 'InvalidPlayer') return new InvalidPlayerError(e)
    if (e.error === 'ChallengeSelf') return new ChallengeSelfError(e)
  }

  return e
}
