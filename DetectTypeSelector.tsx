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
import {DetectTypeAtom, HoverEnteredAtom} from './atoms';
import {DetectTypes} from './Types';

const TYPE_LABELS: Record<string, string> = {
  '2D bounding boxes': '2D 边界框',
  'Segmentation masks': '语义分割',
  'Points': '关键点',
};

export function DetectTypeSelector() {
  return (
    <div className="flex flex-col h-full">
      <div className="mb-2 text-xs font-bold text-[var(--text-color-secondary)] tracking-widest uppercase">分析模式</div>
      <div className="grid grid-cols-3 md:flex md:flex-col gap-2">
        {['2D bounding boxes', 'Segmentation masks', 'Points'].map((label) => (
          <SelectOption key={label} label={label} displayLabel={TYPE_LABELS[label]} />
        ))}
      </div>
    </div>
  );
}

const SelectOption: React.FC<{label: string; displayLabel: string}> = ({label, displayLabel}) => {
  const [detectType, setDetectType] = useAtom(DetectTypeAtom);
  const [, setHoverEntered] = useAtom(HoverEnteredAtom);

  const isActive = detectType === label;

  return (
    <button
      className={`py-2 px-2 md:py-3 text-xs md:text-sm items-center justify-center gap-2 flex md:justify-start ${isActive ? 'active' : 'opacity-60 hover:opacity-100'}`}
      style={{
         minHeight: '36px'
      }}
      onClick={() => {
        setHoverEntered(false);
        setDetectType(label as DetectTypes);
      }}>
      <div className={`w-1.5 h-1.5 rounded-sm ${isActive ? 'bg-[var(--accent-color)] shadow-[0_0_5px_var(--accent-color)]' : 'bg-[var(--text-color-secondary)]'}`}></div>
      {displayLabel}
    </button>
  );
};
