import { MinecraftViewer } from "@/components/MinecraftViewer"

function App() {
  return (
    <div className="w-screen h-screen">
      <MinecraftViewer showControls={true} />
    </div>
  )
}

export default App