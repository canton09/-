/* tslint:disable */
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
// Copyright 2025 Google LLC

// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at

//     https://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {useAtom} from 'jotai';
import getStroke from 'perfect-freehand';
// Fix: Import React to make the React namespace available for type annotations.
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {ResizePayload, useResizeDetector} from 'react-resize-detector';
import {
  ActiveColorAtom,
  BoundingBoxes2DAtom,
  BoundingBoxMasksAtom,
  DetectTypeAtom,
  DrawModeAtom,
  ImageSentAtom,
  ImageSrcAtom,
  Is3DViewAtom,
  IsLiveStreamModeAtom,
  LinesAtom,
  PointsAtom,
  RevealOnHoverModeAtom,
} from './atoms';
import {lineOptions, segmentationColorsRgb} from './consts';
import {getSvgPathFromStroke} from './utils';

export function Content() {
  const [imageSrc] = useAtom(ImageSrcAtom);
  const [boundingBoxes2D] = useAtom(BoundingBoxes2DAtom);
  const [boundingBoxMasks] = useAtom(BoundingBoxMasksAtom);
  const [detectType] = useAtom(DetectTypeAtom);
  const [, setImageSent] = useAtom(ImageSentAtom);
  const [points] = useAtom(PointsAtom);
  const [revealOnHover] = useAtom(RevealOnHoverModeAtom);
  const [hoverEntered, setHoverEntered] = useState(false);
  const [hoveredBox, _setHoveredBox] = useState<number | null>(null);
  const [drawMode] = useAtom(DrawModeAtom);
  const [lines, setLines] = useAtom(LinesAtom);
  const [activeColor] = useAtom(ActiveColorAtom);
  const [isLiveStreamMode] = useAtom(IsLiveStreamModeAtom);
  const [is3DView] = useAtom(Is3DViewAtom);

  const boundingBoxContainerRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  // Ref for the transforming container to manipulate DOM directly
  const transformContainerRef = useRef<HTMLDivElement | null>(null);
  
  const [containerDims, setContainerDims] = useState({
    width: 0,
    height: 0,
  });
  const [activeMediaDimensions, setActiveMediaDimensions] = useState({
    width: 1,
    height: 1,
  });

  // Performance Optimization: Use refs for animation state to avoid re-renders on mouse move
  const targetRotation = useRef({ x: 0, y: 0 });
  const currentRotation = useRef({ x: 0, y: 0 });

  const onResize = useCallback((el: ResizePayload) => {
    if (el.width && el.height) {
      setContainerDims({
        width: el.width,
        height: el.height,
      });
    }
  }, []);

  const {ref: containerRef} = useResizeDetector({onResize});

  const boundingBoxContainer = useMemo(() => {
    const {width, height} = activeMediaDimensions;
    const aspectRatio = width / height;
    const containerAspectRatio = containerDims.width / containerDims.height;
    if (aspectRatio < containerAspectRatio) {
      return {
        height: containerDims.height,
        width: containerDims.height * aspectRatio,
      };
    } else {
      return {
        width: containerDims.width,
        height: containerDims.width / aspectRatio,
      };
    }
  }, [containerDims, activeMediaDimensions]);

  // Optimized Animation Loop
  useEffect(() => {
    let rafId: number;

    const loop = () => {
      // Lerp factor (Linear Interpolation) for smooth movement
      const ease = 0.1;

      // If not in 3D view, force target to 0
      if (!is3DView) {
          targetRotation.current = { x: 0, y: 0 };
      }

      const diffX = targetRotation.current.x - currentRotation.current.x;
      const diffY = targetRotation.current.y - currentRotation.current.y;

      if (Math.abs(diffX) < 0.005 && Math.abs(diffY) < 0.005) {
         currentRotation.current.x = targetRotation.current.x;
         currentRotation.current.y = targetRotation.current.y;
      } else {
         currentRotation.current.x += diffX * ease;
         currentRotation.current.y += diffY * ease;
      }

      if (transformContainerRef.current) {
         const { x, y } = currentRotation.current;
         
         if (is3DView || Math.abs(x) > 0.01 || Math.abs(y) > 0.01) {
             const transform = `perspective(1200px) rotateY(${x.toFixed(2)}deg) rotateX(${-y.toFixed(2)}deg) scale(0.85) translateZ(0px)`;
             transformContainerRef.current.style.transform = transform;
             transformContainerRef.current.style.boxShadow = is3DView ? '0 30px 60px -12px rgba(0,0,0,0.6)' : 'none';
         } else {
             transformContainerRef.current.style.transform = 'none';
             transformContainerRef.current.style.boxShadow = 'none';
         }
      }

      rafId = requestAnimationFrame(loop);
    };

    loop();

    return () => {
      cancelAnimationFrame(rafId);
    };
  }, [is3DView]);

  // Efficient Mouse Handler - no state updates
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!is3DView) return;

    const { innerWidth, innerHeight } = window;
    // Calculate rotation (-15 to 15 degrees)
    const x = ((e.clientX - innerWidth / 2) / (innerWidth / 2)) * 15;
    const y = ((e.clientY - innerHeight / 2) / (innerHeight / 2)) * 15;

    targetRotation.current = { x, y };
  }, [is3DView]);
  

  function setHoveredBox(e: React.PointerEvent) {
    const boxes = document.querySelectorAll('.bbox');
    const dimensionsAndIndex = Array.from(boxes).map((box, i) => {
      const {top, left, width, height} = box.getBoundingClientRect();
      return {
        top,
        left,
        width,
        height,
        index: i,
      };
    });

    const sorted = dimensionsAndIndex.sort(
      (a, b) => a.width * a.height - b.width * b.height,
    );

    const {clientX, clientY} = e;
    const found = sorted.find(({top, left, width, height}) => {
      return (
        clientX > left &&
        clientX < left + width &&
        clientY > top &&
        clientY < top + height
      );
    });
    if (found) {
      _setHoveredBox(found.index);
    } else {
      _setHoveredBox(null);
    }
  }

  const downRef = useRef<Boolean>(false);

  useEffect(() => {
    let stream: MediaStream | null = null;

    const startStream = async () => {
        if (isLiveStreamMode) {
            try {
                stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: 'environment' }
                });
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
            } catch (e) {
                console.error("Failed to start camera", e);
            }
        }
    };

    if (isLiveStreamMode) {
        startStream();
    }

    return () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
    };
  }, [isLiveStreamMode]);


  return (
    <div 
        ref={containerRef} 
        className="w-full h-full relative flex items-center justify-center z-10"
        onMouseMove={handleMouseMove}
        style={{
            perspective: '1200px',
        }}
    >
      <div 
        ref={transformContainerRef}
        className="relative flex items-center justify-center ease-out"
        style={{
             width: boundingBoxContainer.width,
             height: boundingBoxContainer.height,
             transformStyle: 'preserve-3d',
             transformOrigin: 'center center',
             willChange: 'transform',
        }}
      >
        {isLiveStreamMode ? (
            <video
                id="live-video-feed"
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="absolute top-0 left-0 w-full h-full object-contain"
                style={{
                    width: boundingBoxContainer.width,
                    height: boundingBoxContainer.height,
                    border: is3DView ? '1px solid rgba(0,243,255,0.3)' : 'none',
                    pointerEvents: 'none',
                }}
                onLoadedMetadata={(e) => {
                    setActiveMediaDimensions({
                        width: e.currentTarget.videoWidth,
                        height: e.currentTarget.videoHeight,
                    });
                }}
            />
        ) : (
            imageSrc ? (
                <img
                src={imageSrc}
                className="absolute top-0 left-0 w-full h-full object-contain"
                alt="已上传图片"
                style={{
                    width: boundingBoxContainer.width,
                    height: boundingBoxContainer.height,
                    border: is3DView ? '1px solid rgba(0,243,255,0.3)' : 'none',
                    pointerEvents: 'none',
                }}
                onLoad={(e) => {
                    setActiveMediaDimensions({
                    width: e.currentTarget.naturalWidth,
                    height: e.currentTarget.naturalHeight,
                    });
                }}
                />
            ) : null
        )}
        
        {/* Interaction Layer */}
        <div
            className={`absolute ${hoverEntered ? 'hide-box' : ''} ${drawMode ? 'cursor-crosshair' : ''}`}
            ref={boundingBoxContainerRef}
            onPointerEnter={(e) => {
            if (revealOnHover && !drawMode) {
                setHoverEntered(true);
                setHoveredBox(e);
            }
            }}
            onPointerMove={(e) => {
            if (revealOnHover && !drawMode) {
                setHoverEntered(true);
                setHoveredBox(e);
            }
            if (downRef.current) {
                const parentBounds =
                boundingBoxContainerRef.current!.getBoundingClientRect();
                setLines((prev) => [
                ...prev.slice(0, prev.length - 1),
                [
                    [
                    ...prev[prev.length - 1][0],
                    [
                        (e.clientX - parentBounds.left) /
                        boundingBoxContainer!.width,
                        (e.clientY - parentBounds.top) /
                        boundingBoxContainer!.height,
                    ],
                    ],
                    prev[prev.length - 1][1],
                ],
                ]);
            }
            }}
            onPointerLeave={(e) => {
            if (revealOnHover && !drawMode) {
                setHoverEntered(false);
                setHoveredBox(e);
            }
            }}
            onPointerDown={(e) => {
            if (drawMode) {
                setImageSent(false);
                (e.target as HTMLElement).setPointerCapture(e.pointerId);
                downRef.current = true;
                const parentBounds =
                boundingBoxContainerRef.current!.getBoundingClientRect();
                setLines((prev) => [
                ...prev,
                [
                    [
                    [
                        (e.clientX - parentBounds.left) /
                        boundingBoxContainer!.width,
                        (e.clientY - parentBounds.top) /
                        boundingBoxContainer!.height,
                    ],
                    ],
                    activeColor,
                ],
                ]);
            }
            }}
            onPointerUp={(e) => {
            if (drawMode) {
                (e.target as HTMLElement).releasePointerCapture(e.pointerId);
                downRef.current = false;
            }
            }}
            style={{
                width: boundingBoxContainer.width,
                height: boundingBoxContainer.height,
                transformStyle: 'preserve-3d',
                transform: is3DView ? 'translateZ(20px)' : 'none',
            }}>
            {lines.length > 0 && (
            <svg
                className="absolute top-0 left-0 w-full h-full"
                style={{
                pointerEvents: 'none',
                width: boundingBoxContainer?.width,
                height: boundingBoxContainer?.height,
                }}>
                {lines.map(([points, color], i) => (
                <path
                    key={i}
                    d={getSvgPathFromStroke(
                    getStroke(
                        points.map(([x, y]) => [
                        x * boundingBoxContainer!.width,
                        y * boundingBoxContainer!.height,
                        0.5,
                        ]),
                        lineOptions,
                    ),
                    )}
                    fill={color}
                />
                ))}
            </svg>
            )}
            
            {detectType === '2D bounding boxes' &&
            boundingBoxes2D.map((box, i) => (
                <div
                key={i}
                className={`absolute bbox transition-opacity duration-300 ${i === hoveredBox ? 'opacity-100' : 'opacity-80'}`}
                style={{
                    transformOrigin: 'center center',
                    top: box.y * 100 + '%',
                    left: box.x * 100 + '%',
                    width: box.width * 100 + '%',
                    height: box.height * 100 + '%',
                    transformStyle: 'preserve-3d',
                    // Lift the entire box structure in 3D mode
                    transform: is3DView ? 'translateZ(60px)' : 'translateZ(0px)',
                    transition: 'transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                }}>
                    {/* Front Face (Active Layer) */}
                    <div className="absolute inset-0 border-2 border-[var(--accent-color)] shadow-[0_0_10px_rgba(0,243,255,0.3)] flex flex-col justify-between group-hover:bg-[rgba(0,243,255,0.1)]" style={{backfaceVisibility: 'hidden'}}>
                        <div className="bg-[var(--accent-color)] text-black font-bold font-mono text-xs px-1 py-0.5 truncate w-max max-w-full shadow-sm">
                            {box.label}
                        </div>
                        {/* Tech Corners */}
                        <div className="absolute top-0 right-0 w-1.5 h-1.5 border-t-2 border-r-2 border-[var(--accent-color)]"></div>
                        <div className="absolute bottom-0 left-0 w-1.5 h-1.5 border-b-2 border-l-2 border-[var(--accent-color)]"></div>
                    </div>

                    {/* 3D Wireframe Construction (Only in 3D Mode) */}
                    {is3DView && (
                        <>
                            {/* Back Face (Projected on Image Plane) */}
                            <div className="absolute inset-0 border border-[var(--accent-color)] border-dashed opacity-30"
                                 style={{ transform: 'translateZ(-60px)' }}>
                            </div>
                            
                            {/* Connecting Edges (Wireframe effect) */}
                            {/* Top Left */}
                            <div className="absolute w-[1px] bg-gradient-to-b from-[var(--accent-color)] to-transparent opacity-50 origin-top"
                                 style={{ height: '60px', top: 0, left: -1, transform: 'rotateX(-90deg)' }}></div>
                            {/* Top Right */}
                            <div className="absolute w-[1px] bg-gradient-to-b from-[var(--accent-color)] to-transparent opacity-50 origin-top"
                                 style={{ height: '60px', top: 0, right: -1, transform: 'rotateX(-90deg)' }}></div>
                            {/* Bottom Left */}
                            <div className="absolute w-[1px] bg-gradient-to-b from-[var(--accent-color)] to-transparent opacity-50 origin-top"
                                 style={{ height: '60px', top: '100%', left: -1, transform: 'rotateX(-90deg)' }}></div>
                            {/* Bottom Right */}
                            <div className="absolute w-[1px] bg-gradient-to-b from-[var(--accent-color)] to-transparent opacity-50 origin-top"
                                 style={{ height: '60px', top: '100%', right: -1, transform: 'rotateX(-90deg)' }}></div>
                        </>
                    )}
                </div>
            ))}

            {detectType === 'Segmentation masks' &&
            boundingBoxMasks.map((box, i) => (
                <div
                key={i}
                className={`absolute bbox ${i === hoveredBox ? 'reveal' : ''}`}
                style={{
                    transformOrigin: '0 0',
                    top: box.y * 100 + '%',
                    left: box.x * 100 + '%',
                    width: box.width * 100 + '%',
                    height: box.height * 100 + '%',
                    transformStyle: 'preserve-3d',
                    transform: is3DView ? 'translateZ(40px)' : 'translateZ(0px)',
                    transition: 'transform 0.5s',
                }}>
                <BoxMask box={box} index={i} />
                
                {/* Shadow/Base Layer for Masks in 3D */}
                {is3DView && (
                    <div className="absolute inset-0 opacity-30 blur-[1px]" 
                         style={{ transform: 'translateZ(-40px) scale(0.98)', filter: 'grayscale(100%) brightness(0.5)' }}>
                         <BoxMask box={box} index={i} /> 
                    </div>
                 )}

                <div className="w-full top-0 h-0 absolute">
                    <div className="bg-[var(--accent-color)] text-black font-bold absolute -left-[2px] bottom-0 text-xs px-1 truncate max-w-full">
                    {box.label}
                    </div>
                </div>
                </div>
            ))}

            {detectType === 'Points' &&
            points.map((point, i) => {
                return (
                <div
                    key={i}
                    className="absolute"
                    style={{
                        left: `${point.point.x * 100}%`,
                        top: `${point.point.y * 100}%`,
                        transformStyle: 'preserve-3d',
                        transform: is3DView ? 'translateZ(50px)' : 'translateZ(0px)',
                        transition: 'transform 0.5s',
                    }}>
                    <div className="absolute bg-[var(--accent-color)] text-black font-bold text-center text-xs px-1 bottom-3 rounded-sm -translate-x-1/2 left-0 whitespace-nowrap shadow-lg">
                    {point.label}
                    </div>
                    {/* 3D Pin Line */}
                    {is3DView && (
                         <div className="absolute w-[1px] bg-[var(--accent-color)] h-[50px] top-0 left-0 -translate-x-1/2 origin-top" style={{transform: 'rotateX(-90deg) translateZ(-50px)'}}></div>
                    )}
                    <div className="absolute w-3 h-3 bg-[var(--accent-color)] rounded-full border border-white shadow-[0_0_10px_var(--accent-color)] -translate-x-1/2 -translate-y-1/2"></div>
                </div>
                );
            })}
        </div>
      </div>
    </div>
  );
}

function BoxMask({
  box,
  index,
}: {
  box: {
    x: number;
    y: number;
    width: number;
    height: number;
    label: string;
    imageData: string;
  };
  index: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rgb = segmentationColorsRgb[index % segmentationColorsRgb.length];

  useEffect(() => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        const image = new Image();
        image.src = box.imageData;
        image.onload = () => {
          canvasRef.current!.width = image.width;
          canvasRef.current!.height = image.height;
          ctx.imageSmoothingEnabled = false;
          ctx.drawImage(image, 0, 0);
          const pixels = ctx.getImageData(0, 0, image.width, image.height);
          const data = pixels.data;
          for (let i = 0; i < data.length; i += 4) {
            // alpha from mask
            data[i + 3] = data[i] * 0.6; // Make masks slightly transparent
            // color from palette
            data[i] = rgb[0];
            data[i + 1] = rgb[1];
            data[i + 2] = rgb[2];
          }
          ctx.putImageData(pixels, 0, 0);
        };
      }
    }
  }, [canvasRef, box.imageData, rgb]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute top-0 left-0 w-full h-full"
      style={{opacity: 0.8}}
    />
  );
}
