"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Play, RotateCcw, Pause } from "lucide-react"

const GRID_SIZE = 20
const CELL_SIZE = 20
const INITIAL_SPEED = 150

type Position = { x: number; y: number }
type Direction = "UP" | "DOWN" | "LEFT" | "RIGHT"

export function SnakeGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [snake, setSnake] = useState<Position[]>([{ x: 10, y: 10 }])
  const [food, setFood] = useState<Position>({ x: 15, y: 15 })
  const [direction, setDirection] = useState<Direction>("RIGHT")
  const [gameStatus, setGameStatus] = useState<"idle" | "playing" | "paused" | "gameover">("idle")
  const [score, setScore] = useState(0)
  const [highScore, setHighScore] = useState(0)
  const directionRef = useRef(direction)
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null)

  const generateFood = useCallback((currentSnake: Position[]): Position => {
    let newFood: Position
    do {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      }
    } while (currentSnake.some((segment) => segment.x === newFood.x && segment.y === newFood.y))
    return newFood
  }, [])

  const resetGame = useCallback(() => {
    const initialSnake = [{ x: 10, y: 10 }]
    setSnake(initialSnake)
    setFood(generateFood(initialSnake))
    setDirection("RIGHT")
    directionRef.current = "RIGHT"
    setScore(0)
    setGameStatus("idle")
  }, [generateFood])

  const startGame = useCallback(() => {
    if (gameStatus === "gameover") {
      resetGame()
    }
    setGameStatus("playing")
  }, [gameStatus, resetGame])

  const pauseGame = useCallback(() => {
    setGameStatus("paused")
  }, [])

  const moveSnake = useCallback(() => {
    setSnake((prevSnake) => {
      const head = { ...prevSnake[0] }
      const currentDirection = directionRef.current

      switch (currentDirection) {
        case "UP":
          head.y -= 1
          break
        case "DOWN":
          head.y += 1
          break
        case "LEFT":
          head.x -= 1
          break
        case "RIGHT":
          head.x += 1
          break
      }

      // Check wall collision
      if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
        setGameStatus("gameover")
        return prevSnake
      }

      // Check self collision
      if (prevSnake.some((segment) => segment.x === head.x && segment.y === head.y)) {
        setGameStatus("gameover")
        return prevSnake
      }

      const newSnake = [head, ...prevSnake]

      // Check food collision
      if (head.x === food.x && head.y === food.y) {
        setScore((prev) => {
          const newScore = prev + 10
          setHighScore((currentHigh) => Math.max(currentHigh, newScore))
          return newScore
        })
        setFood(generateFood(newSnake))
      } else {
        newSnake.pop()
      }

      return newSnake
    })
  }, [food, generateFood])

  useEffect(() => {
    directionRef.current = direction
  }, [direction])

  useEffect(() => {
    if (gameStatus === "playing") {
      gameLoopRef.current = setInterval(moveSnake, INITIAL_SPEED)
    } else {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current)
      }
    }

    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current)
      }
    }
  }, [gameStatus, moveSnake])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameStatus !== "playing" && gameStatus !== "paused") {
        if (e.key === " " || e.key === "Enter") {
          startGame()
        }
        return
      }

      if (e.key === " ") {
        if (gameStatus === "playing") {
          pauseGame()
        } else if (gameStatus === "paused") {
          setGameStatus("playing")
        }
        return
      }

      const keyDirections: Record<string, Direction> = {
        ArrowUp: "UP",
        ArrowDown: "DOWN",
        ArrowLeft: "LEFT",
        ArrowRight: "RIGHT",
        w: "UP",
        s: "DOWN",
        a: "LEFT",
        d: "RIGHT",
        W: "UP",
        S: "DOWN",
        A: "LEFT",
        D: "RIGHT",
      }

      const newDirection = keyDirections[e.key]
      if (!newDirection) return

      const opposites: Record<Direction, Direction> = {
        UP: "DOWN",
        DOWN: "UP",
        LEFT: "RIGHT",
        RIGHT: "LEFT",
      }

      if (opposites[newDirection] !== directionRef.current) {
        setDirection(newDirection)
        directionRef.current = newDirection
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [gameStatus, startGame, pauseGame])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Clear canvas
    ctx.fillStyle = "#0a1628"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Draw grid
    ctx.strokeStyle = "#1a2d4a"
    ctx.lineWidth = 0.5
    for (let i = 0; i <= GRID_SIZE; i++) {
      ctx.beginPath()
      ctx.moveTo(i * CELL_SIZE, 0)
      ctx.lineTo(i * CELL_SIZE, GRID_SIZE * CELL_SIZE)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(0, i * CELL_SIZE)
      ctx.lineTo(GRID_SIZE * CELL_SIZE, i * CELL_SIZE)
      ctx.stroke()
    }

    // Draw food with glow effect
    ctx.shadowBlur = 15
    ctx.shadowColor = "#f59e0b"
    ctx.fillStyle = "#f59e0b"
    ctx.beginPath()
    ctx.arc(
      food.x * CELL_SIZE + CELL_SIZE / 2,
      food.y * CELL_SIZE + CELL_SIZE / 2,
      CELL_SIZE / 2 - 2,
      0,
      Math.PI * 2
    )
    ctx.fill()
    ctx.shadowBlur = 0

    // Draw snake
    snake.forEach((segment, index) => {
      const isHead = index === 0
      ctx.shadowBlur = isHead ? 10 : 5
      ctx.shadowColor = "#22c55e"
      ctx.fillStyle = isHead ? "#4ade80" : "#22c55e"
      ctx.beginPath()
      ctx.roundRect(
        segment.x * CELL_SIZE + 1,
        segment.y * CELL_SIZE + 1,
        CELL_SIZE - 2,
        CELL_SIZE - 2,
        isHead ? 6 : 4
      )
      ctx.fill()
      ctx.shadowBlur = 0
    })
  }, [snake, food])

  const handleDirectionClick = (newDirection: Direction) => {
    if (gameStatus !== "playing") return

    const opposites: Record<Direction, Direction> = {
      UP: "DOWN",
      DOWN: "UP",
      LEFT: "RIGHT",
      RIGHT: "LEFT",
    }

    if (opposites[newDirection] !== directionRef.current) {
      setDirection(newDirection)
      directionRef.current = newDirection
    }
  }

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Score Display */}
      <div className="flex items-center gap-8">
        <div className="flex flex-col items-center">
          <span className="text-xs uppercase tracking-widest text-muted-foreground">Score</span>
          <span className="font-mono text-4xl font-bold text-primary">{score}</span>
        </div>
        <div className="h-12 w-px bg-border" />
        <div className="flex flex-col items-center">
          <span className="text-xs uppercase tracking-widest text-muted-foreground">High Score</span>
          <span className="font-mono text-4xl font-bold text-accent">{highScore}</span>
        </div>
      </div>

      {/* Game Canvas */}
      <div className="relative rounded-lg border-2 border-border bg-card p-1 shadow-lg shadow-primary/10">
        <canvas
          ref={canvasRef}
          width={GRID_SIZE * CELL_SIZE}
          height={GRID_SIZE * CELL_SIZE}
          className="rounded"
        />

        {/* Overlay for idle/paused/gameover states */}
        {gameStatus !== "playing" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center rounded bg-background/80 backdrop-blur-sm">
            {gameStatus === "idle" && (
              <>
                <h2 className="mb-2 text-2xl font-bold text-foreground">Snake Game</h2>
                <p className="mb-4 text-sm text-muted-foreground">Use arrow keys or WASD to move</p>
              </>
            )}
            {gameStatus === "paused" && (
              <h2 className="mb-4 text-2xl font-bold text-foreground">Paused</h2>
            )}
            {gameStatus === "gameover" && (
              <>
                <h2 className="mb-2 text-2xl font-bold text-destructive">Game Over</h2>
                <p className="mb-4 text-lg text-foreground">Final Score: {score}</p>
              </>
            )}
            <Button onClick={startGame} size="lg" className="gap-2">
              {gameStatus === "gameover" ? (
                <>
                  <RotateCcw className="h-5 w-5" /> Play Again
                </>
              ) : (
                <>
                  <Play className="h-5 w-5" /> {gameStatus === "paused" ? "Resume" : "Start Game"}
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex flex-col items-center gap-4">
        <div className="flex items-center gap-2">
          {gameStatus === "playing" ? (
            <Button variant="secondary" size="sm" onClick={pauseGame} className="gap-2">
              <Pause className="h-4 w-4" /> Pause
            </Button>
          ) : gameStatus === "paused" ? (
            <Button variant="secondary" size="sm" onClick={startGame} className="gap-2">
              <Play className="h-4 w-4" /> Resume
            </Button>
          ) : null}
          {(gameStatus === "paused" || gameStatus === "gameover") && (
            <Button variant="outline" size="sm" onClick={resetGame} className="gap-2">
              <RotateCcw className="h-4 w-4" /> Reset
            </Button>
          )}
        </div>

        {/* Mobile Direction Controls */}
        <div className="grid grid-cols-3 gap-1 md:hidden">
          <div />
          <Button
            variant="secondary"
            size="icon"
            onClick={() => handleDirectionClick("UP")}
            disabled={gameStatus !== "playing"}
            aria-label="Move up"
          >
            <ArrowUp className="h-5 w-5" />
          </Button>
          <div />
          <Button
            variant="secondary"
            size="icon"
            onClick={() => handleDirectionClick("LEFT")}
            disabled={gameStatus !== "playing"}
            aria-label="Move left"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            onClick={() => handleDirectionClick("DOWN")}
            disabled={gameStatus !== "playing"}
            aria-label="Move down"
          >
            <ArrowDown className="h-5 w-5" />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            onClick={() => handleDirectionClick("RIGHT")}
            disabled={gameStatus !== "playing"}
            aria-label="Move right"
          >
            <ArrowRight className="h-5 w-5" />
          </Button>
        </div>

        {/* Keyboard hint for desktop */}
        <p className="hidden text-xs text-muted-foreground md:block">
          Press <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-xs">Space</kbd> to pause/resume
        </p>
      </div>
    </div>
  )
}
