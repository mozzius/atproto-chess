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
const id = 'com.atpchess.getMoves'

export type QueryParams = {
  /** AT-URI of the game record */
  game: string
  /** Maximum number of moves to return */
  limit: number
  /** Pagination cursor */
  cursor?: string
}
export type InputSchema = undefined

export interface OutputSchema {
  game?: ComAtpchessDefs.GameView
  /** List of moves in chronological order */
  moves: ComAtpchessDefs.MoveView[]
  /** Pagination cursor for next page */
  cursor?: string
}

export type HandlerInput = void

export interface HandlerSuccess {
  encoding: 'application/json'
  body: OutputSchema
  headers?: { [key: string]: string }
}

export interface HandlerError {
  status: number
  message?: string
}

export type HandlerOutput = HandlerError | HandlerSuccess
