import { useEffect, useState } from 'react'
import { Chess, Move, Square } from 'chess.js'

interface ChessBoardProps {
  fen?: string
  onMove?: (move: string, fen: string) => void
  isMyTurn?: boolean
  orientation?: 'white' | 'black'
  disabled?: boolean
}

const ChessBoard = ({
  fen,
  onMove,
  isMyTurn = false,
  orientation = 'white',
  disabled = false,
}: ChessBoardProps) => {
  const [chess] = useState(new Chess())
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null)
  const [possibleMoves, setPossibleMoves] = useState<Square[]>([])
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(
    null,
  )
  const [boardState, setBoardState] = useState(chess.board())

  useEffect(() => {
    if (fen) {
      chess.load(fen)
      setBoardState(chess.board())
    }
  }, [fen, chess])

  const getPieceSymbol = (piece: { type: string; color: 'w' | 'b' }) => {
    const symbols = {
      pw: '♟',
      pb: '♙',
      nw: '♞',
      nb: '♘',
      bw: '♗',
      bb: '♝',
      rw: '♜',
      rb: '♖',
      qw: '♛',
      qb: '♕',
      kw: '♚',
      kb: '♔',
    }
    return symbols[`${piece.type}${piece.color}` as keyof typeof symbols]
  }

  const getSquareColor = (row: number, col: number) => {
    const isLight = (row + col) % 2 === 0
    return isLight
      ? 'bg-amber-100 hover:bg-amber-200'
      : 'bg-amber-700 hover:bg-amber-800'
  }

  const getSquareHighlight = (square: Square) => {
    if (selectedSquare === square) {
      return 'ring-4 ring-blue-500 ring-inset'
    }
    if (possibleMoves.includes(square)) {
      return 'ring-2 ring-green-500 ring-inset'
    }
    if (lastMove && (lastMove.from === square || lastMove.to === square)) {
      return 'ring-2 ring-yellow-500 ring-inset'
    }
    return ''
  }

  const squareToCoords = (square: Square): [number, number] => {
    const file = square.charCodeAt(0) - 'a'.charCodeAt(0)
    const rank = parseInt(square[1]) - 1
    return [7 - rank, file]
  }

  const coordsToSquare = (row: number, col: number): Square => {
    const actualRow = orientation === 'white' ? row : 7 - row
    const actualCol = orientation === 'white' ? col : 7 - col
    const file = String.fromCharCode('a'.charCodeAt(0) + actualCol)
    const rank = 8 - actualRow
    return `${file}${rank}` as Square
  }

  const handleSquareClick = (square: Square) => {
    if (disabled || !isMyTurn) return

    const piece = chess.get(square)

    // If clicking on own piece, select it
    if (piece && piece.color === chess.turn()) {
      setSelectedSquare(square)
      const moves = chess.moves({ square, verbose: true }) as Move[]
      setPossibleMoves(moves.map((m) => m.to))
    }
    // If a piece is selected and clicking on a valid move square
    else if (selectedSquare && possibleMoves.includes(square)) {
      try {
        const move = chess.move({
          from: selectedSquare,
          to: square,
          promotion: 'q', // Always promote to queen for simplicity
        })

        if (move && onMove) {
          setLastMove({ from: selectedSquare, to: square })
          onMove(move.san, chess.fen())
        }

        setSelectedSquare(null)
        setPossibleMoves([])
        setBoardState(chess.board())
      } catch (err) {
        console.error('Invalid move:', err)
      }
    }
    // Clicking elsewhere deselects
    else {
      setSelectedSquare(null)
      setPossibleMoves([])
    }
  }

  const renderBoard = () => {
    const board = []
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const square = coordsToSquare(row, col)
        const [actualRow, actualCol] = squareToCoords(square)
        const piece = boardState[actualRow][actualCol]

        board.push(
          <div
            key={square}
            onClick={() => handleSquareClick(square)}
            className={`
              aspect-square flex items-center justify-center text-5xl
              cursor-pointer transition-colors
              ${getSquareColor(row, col)}
              ${getSquareHighlight(square)}
              ${!isMyTurn || disabled ? 'cursor-not-allowed opacity-75' : ''}
            `}
          >
            {piece && (
              <span className="select-none">{getPieceSymbol(piece)}</span>
            )}
          </div>,
        )
      }
    }
    return board
  }

  const files = orientation === 'white' ? 'abcdefgh' : 'hgfedcba'
  const ranks = orientation === 'white' ? '87654321' : '12345678'

  return (
    <div className="inline-block">
      <div className="flex">
        <div className="flex flex-col justify-around mr-2 text-sm text-gray-600 dark:text-gray-400">
          {ranks.split('').map((rank) => (
            <div key={rank} className="h-12 flex items-center">
              {rank}
            </div>
          ))}
        </div>
        <div>
          <div className="grid grid-cols-8 gap-0 border-2 border-gray-800 dark:border-gray-600">
            {renderBoard()}
          </div>
          <div className="flex justify-around mt-2 text-sm text-gray-600 dark:text-gray-400">
            {files.split('').map((file) => (
              <div key={file} className="w-12 text-center">
                {file}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Game status */}
      <div className="mt-4 text-center">
        {chess.isCheckmate() && (
          <div className="text-red-600 font-bold">Checkmate!</div>
        )}
        {chess.isDraw() && <div className="text-gray-600 font-bold">Draw!</div>}
        {chess.isCheck() && !chess.isCheckmate() && (
          <div className="text-orange-600 font-bold">Check!</div>
        )}
        {!isMyTurn && !chess.isGameOver() && (
          <div className="text-gray-500">Waiting for opponent's move...</div>
        )}
      </div>
    </div>
  )
}

export default ChessBoard
