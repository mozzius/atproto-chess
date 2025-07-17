import { AppContext } from '#/context'
import { Server } from '#/lexicons'
import createGame from './lexicons/createGame'
import getGames from './lexicons/getGames'
import getMoves from './lexicons/getMoves'
import makeMove from './lexicons/makeMove'

export * as health from './health'
export * as oauth from './oauth'

export default function (server: Server, ctx: AppContext) {
  getGames(server, ctx)
  getMoves(server, ctx)
  createGame(server, ctx)
  makeMove(server, ctx)
  return server
}
