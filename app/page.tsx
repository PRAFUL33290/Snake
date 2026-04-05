import { SnakeGame } from "@/components/snake-game"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="mb-8 text-center">
        <h1 className="font-mono text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          <span className="text-primary">{"<"}</span>
          SNAKE
          <span className="text-primary">{"/>"}</span>
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Classic arcade game. Eat food, grow longer, avoid walls!
        </p>
      </div>
      <SnakeGame />
    </main>
  )
}
