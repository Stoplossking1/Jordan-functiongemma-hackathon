import html2canvas from 'html2canvas';
import { useCallback, useEffect, useRef, useState } from 'react';

import { useReactInspectorContext } from '../provider/useReactInspectorContext.ts';
import { getReactData } from '../utils/react-fiber.utils.ts';
import type { ReactElementData } from '@shared/inspector/element-inspector-types.ts';

export function useReactInspectorOverlay() {
  const { status, handleElementSelected } = useReactInspectorContext();
  const overlay = useRef<HTMLDivElement | null>(null);
  const currentElement = useRef<Element | null>(null);

  const [targetX, setTargetX] = useState(0);
  const [targetY, setTargetY] = useState(0);
  const [targetWidth, setTargetWidth] = useState(0);
  const [targetHeight, setTargetHeight] = useState(0);

  function createOverlay(): HTMLDivElement {
    if (overlay.current) return overlay.current;
    const div = document.createElement('div');
    div.style.position = 'fixed';
    div.style.border = '2px solid #3b82f6';
    div.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
    div.style.pointerEvents = 'none';
    div.style.zIndex = '999999';
    div.style.transition = 'none';
    document.body.appendChild(div);
    overlay.current = div;
    return div;
  }

  const updateOverlayPosition = useCallback(() => {
    if (!overlay.current) return;
    overlay.current.style.left = `${targetX}px`;
    overlay.current.style.top = `${targetY}px`;
    overlay.current.style.width = `${targetWidth}px`;
    overlay.current.style.height = `${targetHeight}px`;
  }, [targetX, targetY, targetWidth, targetHeight]);

  const showOverlay = useCallback(() => {
    overlay.current = createOverlay();
    overlay.current.style.display = 'block';

    updateOverlayPosition();
  }, [updateOverlayPosition]);

  function handleMouseMove(e: MouseEvent): void {
    const element = document.elementFromPoint(e.clientX, e.clientY);
    if (!element || element === overlay.current) return;

    currentElement.current = element;
    const rect = element.getBoundingClientRect();

    setTargetX(rect.left);
    setTargetY(rect.top);
    setTargetWidth(rect.width);
    setTargetHeight(rect.height);
  }

  const handleClick = useCallback(async () => {
    const elementToInspect = currentElement.current;
    if (!elementToInspect) return;

    try {
      const elementComponentData = await getReactData(elementToInspect);
      const elementCanvas = await html2canvas(elementToInspect as HTMLElement);
      const mimeType = 'image/png';
      const elementScreenshotData = elementCanvas.toDataURL(mimeType);
      const elementDataWithScreenshot: ReactElementData = {
        ...elementComponentData,
        screenshotImage: { mimeType, data: elementScreenshotData },
      };
      console.warn('Element Data with Screenshot:', elementDataWithScreenshot);
      handleElementSelected(elementDataWithScreenshot);
    } catch (error) {
      console.error('Error capturing element data:', error);
    }
  }, [handleElementSelected]);

  const onClick = useCallback(
    (e: MouseEvent) => {
      if (status !== 'on') return;

      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();

      handleClick().catch((error) => {
        console.error('Error in handleClick:', error);
      });
    },
    [status, handleClick],
  );

  const handleMouseDown = useCallback(
    (e: MouseEvent) => {
      if (status !== 'on') return;

      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
    },
    [status],
  );

  useEffect(() => {
    if (status === 'on') {
      showOverlay();
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('click', onClick, true);
      window.addEventListener('mousedown', handleMouseDown, true);
      return () => {
        if (overlay.current) {
          overlay.current.style.display = 'none';
        }
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('click', onClick, true);
        window.removeEventListener('mousedown', handleMouseDown, true);
      };
    } else {
      if (overlay.current) {
        overlay.current.style.display = 'none';
      }
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('click', onClick, true);
      window.removeEventListener('mousedown', handleMouseDown, true);
    }
  }, [status, showOverlay, onClick, handleMouseDown]);
}
