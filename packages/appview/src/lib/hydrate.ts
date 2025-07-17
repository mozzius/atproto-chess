import {
  AppBskyActorDefs,
  AppBskyActorProfile,
  ComAtpchessDefs,
} from '@atpchess/lexicon'

import { AppContext } from '#/context'
import { Game, Move } from '#/db'

const INVALID_HANDLE = 'handle.invalid'

export async function gameToGameView(
  game: Game,
  ctx: AppContext,
): Promise<ComAtpchessDefs.GameView> {
  const [challengerProfile, challengedProfile] = await Promise.all([
    getPlayerView(game.challenger, ctx),
    getPlayerView(game.challenged, ctx),
  ])

  return {
    uri: game.uri,
    challenger: challengerProfile,
    challenged: challengedProfile,
    startsFirst: game.startsFirst,
    createdAt: game.createdAt,
    status: game.status,
    winner: game.winner,
    result: game.result,
    timeControl: game.timeControl,
    rated: game.rated,
    moveCount: game.moveCount,
    lastMoveAt: game.lastMoveAt,
  }
}

export async function moveToMoveView(
  move: Move,
  ctx: AppContext,
): Promise<ComAtpchessDefs.MoveView> {
  const playerProfile = await getPlayerView(move.playerDid, ctx)

  return {
    uri: move.uri,
    game: move.gameUri,
    previousMove: move.previousMoveUri,
    move: move.move,
    fen: move.fen,
    player: playerProfile,
    createdAt: move.createdAt,
    moveNumber: move.moveNumber,
    timeRemaining: move.timeRemaining,
    drawOffer: move.drawOffer,
    resignation: move.resignation,
  }
}

async function getPlayerView(
  did: string,
  ctx: AppContext,
): Promise<ComAtpchessDefs.PlayerView> {
  // Try to get handle
  const handle = await ctx.resolver
    .resolveDidToHandle(did)
    .then((h) => (h.startsWith('did:') ? INVALID_HANDLE : h))
    .catch(() => INVALID_HANDLE)

  // Try to get profile if available
  let displayName: string | undefined
  let avatar: string | undefined

  try {
    // TODO: This would need to be implemented with a proper agent or profile fetching
    // For now, just return basic info
  } catch {
    // Profile fetch failed, that's okay
  }

  return {
    did,
    handle,
    displayName,
    avatar,
    // TODO: Add rating when implemented
  }
}

export async function bskyProfileToProfileView(
  did: string,
  profile: AppBskyActorProfile.Record,
  ctx: AppContext,
): Promise<AppBskyActorDefs.ProfileView> {
  return {
    $type: 'app.bsky.actor.defs#profileView',
    did: did,
    handle: await ctx.resolver.resolveDidToHandle(did),
    avatar: profile.avatar
      ? `https://atproto.pictures/img/${did}/${profile.avatar.ref}`
      : undefined,
    displayName: profile.displayName,
    createdAt: profile.createdAt,
  }
}
