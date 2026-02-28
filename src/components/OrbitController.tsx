import React, { useEffect, useRef } from 'react';
import { OrbitViewport } from '@/utils/orbitViewport';

interface OrbitControllerProps {
  viewport: OrbitViewport | null;
  onUpdate: () => void;
  children?: React.ReactNode;
}

export const OrbitController: React.FC<OrbitControllerProps> = ({
  viewport,
  onUpdate,
  children,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isPointerDown = useRef(false);
  const lastPointerPos = useRef({ x: 0, y: 0 });
  const isShiftPressed = useRef(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !viewport) return;

    const handlePointerDown = (e: PointerEvent) => {
      isPointerDown.current = true;
      lastPointerPos.current = { x: e.clientX, y: e.clientY };
      isShiftPressed.current = e.shiftKey;
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!isPointerDown.current || !viewport) return;

      const dx = e.clientX - lastPointerPos.current.x;
      const dy = e.clientY - lastPointerPos.current.y;

      if (isShiftPressed.current) {
        // Pan mode (shift + drag)
        const sensitivity = 0.5;
        viewport.panX(-dx * sensitivity);
        viewport.panY(dy * sensitivity);
      } else {
        // Rotate mode
        const sensitivity = 0.01;
        viewport.rotateZ(dx * sensitivity);
        viewport.rotateX(dy * sensitivity);
      }

      lastPointerPos.current = { x: e.clientX, y: e.clientY };
      onUpdate();
    };

    const handlePointerUp = () => {
      isPointerDown.current = false;
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (!viewport) return;

      const zoomFactor = e.deltaY > 0 ? 1.1 : 0.9;
      viewport.zoomBy(zoomFactor);
      onUpdate();
    };

    container.addEventListener('pointerdown', handlePointerDown);
    container.addEventListener('pointermove', handlePointerMove);
    container.addEventListener('pointerup', handlePointerUp);
    container.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      container.removeEventListener('pointerdown', handlePointerDown);
      container.removeEventListener('pointermove', handlePointerMove);
      container.removeEventListener('pointerup', handlePointerUp);
      container.removeEventListener('wheel', handleWheel);
    };
  }, [viewport, onUpdate]);

  return (
    <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing">
      {children}
    </div>
  );
};
