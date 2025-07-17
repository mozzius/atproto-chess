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
  rated: boolean
}

export interface OutputSchema {
  game: ComAtpchessDefs.GameView
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
  error?: 'InvalidPlayer' | 'ChallengeSelf'
}

export type HandlerOutput = HandlerError | HandlerSuccess
