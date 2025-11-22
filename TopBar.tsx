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
import React from 'react';
import {DetectTypeAtom, HoverEnteredAtom, RevealOnHoverModeAtom} from './atoms';
import {useResetState} from './hooks';

export function TopBar() {
  const resetState = useResetState();
  const [revealOnHover, setRevealOnHoverMode] = useAtom(RevealOnHoverModeAtom);
  const [detectType] = useAtom(DetectTypeAtom);
  const [, setHoverEntered] = useAtom(HoverEnteredAtom);

  return (
    <div className="flex shrink-0 w-full items-center px-4 py-3 border-b border-[var(--border-color)] justify-between bg-[var(--bg-panel)] backdrop-blur-md z-30">
      <div className="flex gap-4 items-center">
         <div className="flex flex-col">
            <h1 className="text-[var(--accent-color)] font-bold tracking-widest uppercase text-sm glow-text">Gemini Spatial</h1>
            <div className="text-[10px] text-[var(--text-color-secondary)] tracking-widest">SYSTEM ONLINE</div>
         </div>
      </div>

      <div className="flex gap-4 items-center">
        <button
          onClick={() => resetState()}
          className="!p-0 !min-h-0 !border-none bg-transparent text-[10px] text-[var(--text-color-secondary)] hover:text-white tracking-wider uppercase">
          [ Reset Session ]
        </button>
        
        {(detectType === '2D bounding boxes' || detectType === 'Segmentation masks') && (
          <label className="flex items-center gap-2 cursor-pointer group">
            <div className={`w-2 h-2 rounded-full ${revealOnHover ? 'bg-[var(--accent-color)] shadow-[0_0_5px_var(--accent-color)]' : 'bg-gray-600'}`}></div>
            <input
              type="checkbox"
              className="hidden"
              checked={revealOnHover}
              onChange={(e) => {
                if (e.target.checked) setHoverEntered(false);
                setRevealOnHoverMode(e.target.checked);
              }}
            />
            <span className="text-[10px] uppercase tracking-wide text-[var(--text-color-secondary)] group-hover:text-[var(--accent-color)]">Hover Reveal</span>
          </label>
        )}
      </div>
    </div>
  );
}