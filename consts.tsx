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

export const colors = [
  'rgb(0, 0, 0)',
  'rgb(255, 255, 255)',
  'rgb(213, 40, 40)',
  'rgb(250, 123, 23)',
  'rgb(240, 186, 17)',
  'rgb(8, 161, 72)',
  'rgb(26, 115, 232)',
  'rgb(161, 66, 244)',
];

function hexToRgb(hex: string) {
  const r = parseInt(hex.substring(1, 3), 16);
  const g = parseInt(hex.substring(3, 5), 16);
  const b = parseInt(hex.substring(5, 7), 16);
  return [r, g, b];
}

export const segmentationColors = [
  '#E6194B',
  '#3C89D0',
  '#3CB44B',
  '#FFE119',
  '#911EB4',
  '#42D4F4',
  '#F58231',
  '#F032E6',
  '#BFEF45',
  '#469990',
];
export const segmentationColorsRgb = segmentationColors.map((c) => hexToRgb(c));

export const imageOptions: string[] = await Promise.all(
  [
    'aloha-arms-table.png',
    'cart.png',
    'mango.png',
    'gameboard.png',
    'aloha_desk.png',
    'soarm-block.png',
    'top-down-fruits.png',
    'aloha-arms-trash.jpg',
    'grapes.png',
  ].map(async (i) =>
    URL.createObjectURL(
      await (
        await fetch(
          `https://storage.googleapis.com/generativeai-downloads/images/robotics/applet-robotics-spatial-understanding/${i}`,
        )
      ).blob(),
    ),
  ),
);

export const lineOptions = {
  size: 8,
  thinning: 0,
  smoothing: 0,
  streamline: 0,
  simulatePressure: false,
};

export const defaultPromptParts = {
  '2D bounding boxes': [
    '请找出',
    '物品',
    '的位置，以JSON列表形式返回。不要返回掩码。限制25个物品。label字段必须使用中文。',
  ],
  'Segmentation masks': [
    `给出`,
    '所有物体',
    `的分割掩码。输出一个JSON列表，其中每个条目包含 'box_2d'（2D边界框）、'mask'（分割掩码）和 'label'（中文文本标签）。使用描述性的中文标签。`,
  ],
  Points: [
    '指出',
    '物品',
    '，不超过10个。答案应遵循json格式：[{"point": <point>, "label": <中文标签>}, ...]。点坐标为归一化到0-1000的[y, x]格式。',
  ],
};

export const defaultPrompts = {
  '2D bounding boxes': defaultPromptParts['2D bounding boxes'].join(' '),
  'Segmentation masks': defaultPromptParts['Segmentation masks'].join(''),
  Points: defaultPromptParts.Points.join(' '),
};

const safetyLevel = 'only_high';

export const safetySettings = new Map();

safetySettings.set('harassment', safetyLevel);
safetySettings.set('hate_speech', safetyLevel);
safetySettings.set('sexually_explicit', safetyLevel);
safetySettings.set('dangerous_content', safetyLevel);
safetySettings.set('civic_integrity', safetyLevel);
