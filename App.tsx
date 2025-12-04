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
import React, {useEffect, useRef} from 'react';
import {Content} from './Content';
import {DetectTypeSelector} from './DetectTypeSelector';
import {ExtraModeControls} from './ExtraModeControls';
import {Prompt} from './Prompt';
import {SideControls} from './SideControls';
import {TopBar} from './TopBar';
import {ImageSrcAtom, InitFinishedAtom, IsLiveStreamModeAtom, IsUploadedImageAtom} from './atoms';
import {imageOptions} from './consts';
import {useResetState} from './hooks';

function App() {
  const [initFinished] = useAtom(InitFinishedAtom);
  const [isUploadedImage] = useAtom(IsUploadedImageAtom);
  const [isLiveStreamMode] = useAtom(IsLiveStreamModeAtom);
  const [, setImageSrc] = useAtom(ImageSrcAtom);
  const resetState = useResetState();
  
  // Timer for random demo image rotation
  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval>;

    if (!isUploadedImage && !isLiveStreamMode) {
      intervalId = setInterval(() => {
        // Pick a random image from the 20 options
        const randomIndex = Math.floor(Math.random() * imageOptions.length);
        const nextImage = imageOptions[randomIndex];
        
        setImageSrc((current) => {
            // Avoid setting the same image consecutively if possible
            if (current === nextImage && imageOptions.length > 1) {
                const nextIndex = (randomIndex + 1) % imageOptions.length;
                return imageOptions[nextIndex];
            }
            return nextImage;
        });
        
        // Optional: clear previous detection results when image changes automatically
        // resetState(); 
        // Note: We might NOT want to resetState() fully if we want to keep the "Scan" effect, 
        // but typically a new image means we should clear old boxes.
        resetState();

      }, 10000); // 10 seconds
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isUploadedImage, isLiveStreamMode, setImageSrc, resetState]);


  useEffect(() => {
    // Enforce dark mode for tech theme
    document.documentElement.classList.add('dark');
  }, []);

  return (
    <div className="flex flex-col h-[100dvh] bg-[var(--bg-color)] text-[var(--text-color-primary)] overflow-hidden">
      {/* Main Viewport Area */}
      <div className="flex grow flex-col relative overflow-hidden">
        <TopBar />
        <div className="flex grow relative overflow-hidden bg-[radial-gradient(circle_at_center,_rgba(0,243,255,0.05)_0%,_transparent_70%)]">
          {initFinished ? <Content /> : null}
          
          {/* Grid Overlay Effect */}
          <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(0,243,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,243,255,0.02)_1px,transparent_1px)] bg-[length:40px_40px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_80%)]"></div>
        </div>
        <ExtraModeControls />
      </div>

      {/* Bottom Command Center Panel */}
      <div className="flex flex-col md:flex-row shrink-0 w-full z-20 tech-panel border-t border-[var(--border-color)] shadow-[0_-4px_20px_rgba(0,0,0,0.5)]">
        <div className="flex flex-col md:flex-row w-full max-w-7xl mx-auto p-4 gap-4">
            {/* Control Group 1: Tools (Camera/Upload/Live) */}
            <div className="flex flex-row md:flex-col gap-3 items-center justify-between md:justify-start md:border-r border-b md:border-b-0 border-[var(--border-color)] md:pr-4 pb-4 md:pb-0 shrink-0">
                <SideControls />
            </div>

            {/* Control Group 2: Mode Selector */}
            <div className="flex flex-col shrink-0 md:w-48 border-b md:border-b-0 md:border-r border-[var(--border-color)] md:pr-4 pb-4 md:pb-0">
                 <DetectTypeSelector />
            </div>

            {/* Control Group 3: Prompt & Execute */}
            <div className="flex grow min-w-0">
                <Prompt />
            </div>
        </div>
      </div>
    </div>
  );
}

export default App;