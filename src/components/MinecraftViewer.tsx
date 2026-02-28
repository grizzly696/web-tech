import React, { useEffect, useState, useRef } from 'react';
import { McaParser } from '@/utils/mcaParser';

interface BlockData {
  position: [number, number, number];
  color: [number, number, number];
  blockId: number;
  blockData: number;
}

interface MinecraftViewerProps {
  showControls?: boolean;
}

const BLOCK_COLORS: Record<number, [number, number, number]> = {
  1: [128, 128, 128], // Stone - gray
  2: [34, 139, 34], // Grass - green
  3: [139, 90, 43], // Dirt - brown
  4: [128, 128, 128], // Cobblestone - gray
  5: [205, 133, 63], // Wood - tan
  8: [64, 164, 223], // Water - cyan
  9: [64, 164, 223], // Water flowing - cyan
  12: [238, 214, 175], // Sand - light yellow
  13: [105, 105, 105], // Gravel - dark gray
  17: [139, 69, 19], // Log - dark brown
  18: [144, 238, 144], // Leaves - light green
};

const getBlockColor = (blockId: number): [number, number, number] => {
  return BLOCK_COLORS[blockId] || [200, 200, 200];
};

// Рисовать изометрический куб
const drawIsometricCube = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: [number, number, number]
) => {
  const [r, g, b] = color;

  // Верх куба
  ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + size * 0.5, y + size * 0.25);
  ctx.lineTo(x, y + size * 0.5);
  ctx.lineTo(x - size * 0.5, y + size * 0.25);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 0.5;
  ctx.stroke();

  // Левая сторона куба
  ctx.fillStyle = `rgb(${Math.max(0, r - 30)}, ${Math.max(0, g - 30)}, ${Math.max(0, b - 30)})`;
  ctx.beginPath();
  ctx.moveTo(x - size * 0.5, y + size * 0.25);
  ctx.lineTo(x - size * 0.5, y + size * 0.75);
  ctx.lineTo(x, y + size);
  ctx.lineTo(x, y + size * 0.5);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 0.5;
  ctx.stroke();

  // Правая сторона куба
  ctx.fillStyle = `rgb(${Math.max(0, r - 60)}, ${Math.max(0, g - 60)}, ${Math.max(0, b - 60)})`;
  ctx.beginPath();
  ctx.moveTo(x + size * 0.5, y + size * 0.25);
  ctx.lineTo(x + size * 0.5, y + size * 0.75);
  ctx.lineTo(x, y + size);
  ctx.lineTo(x, y + size * 0.5);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 0.5;
  ctx.stroke();
};

export const MinecraftViewer: React.FC<MinecraftViewerProps> = ({
  showControls = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [blocks, setBlocks] = useState<BlockData[]>([]);
  const [sliceHeight, setSliceHeight] = useState<number>(5);
  const [isLoading, setIsLoading] = useState(true);
  const [cameraX, setCameraX] = useState(0);
  const [cameraY, setCameraY] = useState(0);
  const [zoom, setZoom] = useState(1);

  // Загрузить мир
  useEffect(() => {
    const worldData = McaParser.generateWorld(4);
    const blockDataArray: BlockData[] = worldData.blocks.map((block) => ({
      position: [block.x, block.y, block.z] as [number, number, number],
      color: getBlockColor(block.id),
      blockId: block.id,
      blockData: block.data,
    }));
    setBlocks(blockDataArray);
    setIsLoading(false);
  }, []);

  // Установить размер Canvas'а
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.parentElement?.getBoundingClientRect();
    if (rect) {
      canvas.width = rect.width;
      canvas.height = rect.height;
    }
  }, []);

  // Рисовать на Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || blocks.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Очистить canvas
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Отфильтровать блоки по высоте
    const filteredBlocks = blocks.filter((b) => b.position[1] <= sliceHeight);

    // Сортировать для правильного отрисовывания (задние сначала)
    const sortedBlocks = [...filteredBlocks].sort((a, b) => {
      const sumA = a.position[0] + a.position[2];
      const sumB = b.position[0] + b.position[2];
      return sumA - sumB;
    });

    // Рисовать блоки в изометрической проекции
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const blockSize = 8 * zoom;

    sortedBlocks.forEach((block) => {
      const x = block.position[0];
      const y = block.position[1];
      const z = block.position[2];

      // Изометрическая проекция
      const screenX =
        centerX + (x - z) * (blockSize * 0.5) + cameraX;
      const screenY =
        centerY + (x + z) * (blockSize * 0.25) - y * (blockSize * 0.5) + cameraY;

      // Рисовать куб
      drawIsometricCube(
        ctx,
        screenX,
        screenY,
        blockSize,
        block.color
      );
    });

    // Дополнительно: нарисовать сетку для ориентации
    ctx.strokeStyle = '#444444';
    ctx.lineWidth = 0.5;
    ctx.globalAlpha = 0.3;
    for (let i = -10; i <= 10; i++) {
      const sx = centerX + i * (blockSize * 0.5) + cameraX;
      ctx.beginPath();
      ctx.moveTo(sx, centerY + cameraY - 200);
      ctx.lineTo(sx, centerY + cameraY + 200);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }, [blocks, sliceHeight, cameraX, cameraY, zoom]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const arrayBuffer = event.target?.result as ArrayBuffer;
        const chunksMap = McaParser.parseRegionFile(arrayBuffer);

        if (chunksMap.size === 0) {
          console.log('Чанки не найдены, используется процедурный мир');
          return;
        }

        // Объединить чанки
        const blockDataArray: BlockData[] = [];
        let chunkIndex = 0;
        chunksMap.forEach((chunkData) => {
          const offsetX = (chunkIndex % 4) * 16;
          const offsetZ = Math.floor(chunkIndex / 4) * 16;

          chunkData.blocks.forEach((block) => {
            blockDataArray.push({
              position: [
                block.x + offsetX,
                block.y,
                block.z + offsetZ,
              ] as [number, number, number],
              color: getBlockColor(block.id),
              blockId: block.id,
              blockData: block.data,
            });
          });
          chunkIndex++;
        });

        setBlocks(blockDataArray);
      } catch (error) {
        console.error('Ошибка при парсинге файла региона:', error);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const startX = e.clientX;
    const startY = e.clientY;
    const startCameraX = cameraX;
    const startCameraY = cameraY;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;

      if (moveEvent.shiftKey) {
        // Сдвиг камеры
        setCameraX(startCameraX + dx);
        setCameraY(startCameraY + dy);
      } else {
        // Вращение (пока что сдвиг)
        setCameraX(startCameraX + dx * 0.5);
        setCameraY(startCameraY + dy * 0.5);
      }
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div className="w-full h-full flex flex-col bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 text-white p-4 border-b border-gray-700">
        <h1 className="text-2xl font-bold">Minecraft World Viewer</h1>
        <p className="text-sm text-gray-400 mt-1">
          Тащите для поворота • Shift+тащите для сдвига • Прокрутка для увеличения
        </p>
      </div>

      {/* Controls */}
      {showControls && (
        <div className="bg-gray-800 border-b border-gray-700 p-4 space-y-3">
          <div>
            <label className="block text-white text-sm font-medium mb-2">
              Срез по высоте: {sliceHeight}
            </label>
            <input
              type="range"
              min="0"
              max="20"
              value={sliceHeight}
              onChange={(e) => setSliceHeight(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <div>
            <label className="block text-white text-sm font-medium mb-2">
              Увеличение: {(zoom * 100).toFixed(0)}%
            </label>
            <input
              type="range"
              min="0.5"
              max="3"
              step="0.1"
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <div>
            <label className="block text-white text-sm font-medium mb-2">
              Загрузить файл региона (.mca)
            </label>
            <input
              type="file"
              accept=".mca"
              onChange={handleFileUpload}
              className="block w-full text-sm text-gray-400
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-600 file:text-white
                hover:file:bg-blue-700"
            />
          </div>

          <div className="text-xs text-gray-400">
            Блоков загружено: {blocks.length}
            {isLoading && ' (Загрузка...)'}
          </div>
        </div>
      )}

      {/* Canvas */}
      <div className="flex-1 relative overflow-hidden bg-gray-950">
        <canvas
          ref={canvasRef}
          className="w-full h-full cursor-grab active:cursor-grabbing"
          onMouseDown={handleCanvasMouseDown}
          onWheel={(e) => {
            e.preventDefault();
            const newZoom = e.deltaY > 0 ? zoom * 0.9 : zoom * 1.1;
            setZoom(Math.max(0.5, Math.min(3, newZoom)));
          }}
        />
      </div>

      {/* Status Bar */}
      <div className="bg-gray-800 border-t border-gray-700 p-2 text-xs text-gray-400">
        <span>
          Видимых блоков: {blocks.filter((b) => b.position[1] <= sliceHeight).length} •{' '}
          Всего: {blocks.length}
        </span>
      </div>
    </div>
  );
};
