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

// --- SVG GENERATOR FOR 20 FAMOUS BUILDING MODELS ---

const THEMES = [
  { type: '地标', name: '埃菲尔铁塔', color: '#ff9966', detail: 'lattice' },
  { type: '摩天大楼', name: '哈利法塔', color: '#00f3ff', detail: 'spire_tiered' },
  { type: '摩天大楼', name: '帝国大厦', color: '#ffcc00', detail: 'classic_tiered' },
  { type: '古迹', name: '吉萨金字塔', color: '#ffaa00', detail: 'pyramid' },
  { type: '摩天大楼', name: '台北101', color: '#00ffaa', detail: 'stacked' },
  { type: '摩天大楼', name: '双子塔', color: '#ffffff', detail: 'twin' },
  { type: '地标', name: '东方明珠', color: '#ff00ff', detail: 'spheres' },
  { type: '摩天大楼', name: '上海中心', color: '#00ccff', detail: 'twisted' },
  { type: '地标', name: '广州塔', color: '#ff0066', detail: 'waist' },
  { type: '摩天大楼', name: '碎片大厦', color: '#aaaaaa', detail: 'shard' },
  { type: '摩天大楼', name: '世贸一号', color: '#00ff00', detail: 'obelisk' },
  { type: '地标', name: 'CN塔', color: '#ff00aa', detail: 'needle_simple' },
  { type: '地标', name: '太空针塔', color: '#6600cc', detail: 'ufo' },
  { type: '摩天大楼', name: '威利斯大厦', color: '#ff4400', detail: 'bundled' },
  { type: '地标', name: '大本钟', color: '#ffff00', detail: 'clock' },
  { type: '古迹', name: '罗马斗兽场', color: '#00ffff', detail: 'stadium' },
  { type: '地标', name: '比萨斜塔', color: '#cccccc', detail: 'lean' },
  { type: '摩天大楼', name: '克莱斯勒', color: '#cc00ff', detail: 'art_deco' },
  { type: '酒店', name: '帆船酒店', color: '#ff8800', detail: 'sail' },
  { type: '建筑', name: '鸟巢体育馆', color: '#ffaa00', detail: 'nest' },
];

function generateTechSvg(index: number): string {
  const theme = THEMES[index % THEMES.length];
  const c = theme.color;
  
  // Base SVG with grid
  let svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 600' width='800' height='600' style='background:#030508'>
    <defs>
      <filter id='glow'><feGaussianBlur stdDeviation='2.5' result='blur'/><feComposite in='SourceGraphic' in2='blur' operator='over'/></filter>
      <linearGradient id='grad' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='${c}' stop-opacity='0.1'/><stop offset='1' stop-color='${c}' stop-opacity='0'/></linearGradient>
      <pattern id='grid' width='40' height='40' patternUnits='userSpaceOnUse'><path d='M 40 0 L 0 0 0 40' fill='none' stroke='${c}' stroke-opacity='0.1' stroke-width='1'/></pattern>
    </defs>
    <rect width='100%' height='100%' fill='url(#grid)'/>`;

  // 3D Model Group (Centered, Scaled)
  // The 'spin' animation simulates 3D wireframe rotation by scaling X: 1 -> 0 -> -1 -> 0 -> 1
  const spinAnim = `<animateTransform attributeName='transform' type='scale' values='1 1; 0.01 1; -1 1; -0.01 1; 1 1' keyTimes='0; 0.25; 0.5; 0.75; 1' dur='12s' repeatCount='indefinite' />`;
  
  svg += `<g transform='translate(400, 300) scale(0.9)' filter='url(#glow)'>`;
  svg += `<g>${spinAnim}`; // Inner rotating group

  // Common styles
  const stroke = `stroke='${c}' stroke-width='3' fill='url(#grad)' vector-effect='non-scaling-stroke'`;
  const strokeLight = `stroke='${c}' stroke-width='1' fill='none' opacity='0.5' vector-effect='non-scaling-stroke'`;

  switch (theme.detail) {
    case 'lattice': // Eiffel
        svg += `<path d='M-60 250 Q0 -100 0 -280 Q0 -100 60 250 H-60' ${stroke} />`;
        svg += `<line x1='-45' y1='100' x2='45' y2='100' ${strokeLight} />`;
        svg += `<line x1='-30' y1='0' x2='30' y2='0' ${strokeLight} />`;
        svg += `<line x1='-15' y1='-100' x2='15' y2='-100' ${strokeLight} />`;
        svg += `<path d='M0 -280 L0 250' stroke='${c}' stroke-width='1' stroke-dasharray='5 5' />`;
        break;
        
    case 'spire_tiered': // Burj Khalifa
        svg += `<polygon points='0,-280 -10,-100 10,-100' ${stroke} />`;
        svg += `<rect x='-20' y='-100' width='40' height='100' ${stroke} />`;
        svg += `<rect x='-30' y='0' width='60' height='100' ${stroke} />`;
        svg += `<rect x='-45' y='100' width='90' height='150' ${stroke} />`;
        break;

    case 'classic_tiered': // Empire State
        svg += `<rect x='-50' y='100' width='100' height='150' ${stroke} />`;
        svg += `<rect x='-35' y='-50' width='70' height='150' ${stroke} />`;
        svg += `<rect x='-20' y='-150' width='40' height='100' ${stroke} />`;
        svg += `<line x1='0' y1='-150' x2='0' y2='-250' stroke='${c}' stroke-width='4' />`;
        break;

    case 'pyramid': // Giza
        svg += `<polygon points='0,-150 -180,150 180,150' ${stroke} />`;
        // Internal wireframe lines
        svg += `<line x1='0' y1='-150' x2='0' y2='150' ${strokeLight} />`;
        svg += `<line x1='-90' y1='0' x2='90' y2='0' ${strokeLight} />`;
        svg += `<line x1='-45' y1='-75' x2='45' y2='-75' ${strokeLight} />`;
        break;

    case 'stacked': // Taipei 101
        for(let i=0; i<8; i++) {
             let y = -200 + i*50;
             svg += `<polygon points='-30,${y} 30,${y} 40,${y+50} -40,${y+50}' ${stroke} />`;
        }
        svg += `<rect x='-10' y='-250' width='20' height='50' ${stroke} />`;
        break;

    case 'twin': // Petronas
        svg += `<g transform='translate(-60,0)'><rect x='-30' y='-150' width='60' height='400' ${stroke} /><polygon points='-30,-150 30,-150 0,-250' ${stroke} /></g>`;
        svg += `<g transform='translate(60,0)'><rect x='-30' y='-150' width='60' height='400' ${stroke} /><polygon points='-30,-150 30,-150 0,-250' ${stroke} /></g>`;
        svg += `<rect x='-30' y='50' width='60' height='20' ${stroke} />`; // Bridge
        break;

    case 'spheres': // Oriental Pearl
        svg += `<line x1='0' y1='-250' x2='0' y2='250' stroke='${c}' stroke-width='6' />`;
        svg += `<circle cx='0' cy='-150' r='25' ${stroke} />`;
        svg += `<circle cx='0' cy='50' r='40' ${stroke} />`;
        svg += `<line x1='-60' y1='250' x2='0' y2='50' ${strokeLight} />`;
        svg += `<line x1='60' y1='250' x2='0' y2='50' ${strokeLight} />`;
        break;
        
    case 'twisted': // Shanghai Tower
        svg += `<path d='M-40 250 Q-60 0 -20 -250 L20 -250 Q60 0 40 250 Z' ${stroke} />`;
        svg += `<path d='M-40 250 Q0 0 20 -250' ${strokeLight} />`;
        break;

    case 'waist': // Canton Tower
        svg += `<path d='M-40 -250 Q-10 0 -40 250 L40 250 Q10 0 40 -250 Z' ${stroke} />`;
        svg += `<line x1='-25' y1='-250' x2='25' y2='250' ${strokeLight} />`;
        svg += `<line x1='25' y1='-250' x2='-25' y2='250' ${strokeLight} />`;
        break;

    case 'shard': // The Shard
        svg += `<polygon points='0,-250 -60,250 60,250' ${stroke} />`;
        svg += `<line x1='0' y1='-250' x2='0' y2='250' ${strokeLight} />`;
        svg += `<line x1='-30' y1='0' x2='30' y2='0' ${strokeLight} />`;
        break;

    case 'obelisk': // One WTC
        svg += `<polygon points='-40,250 40,250 30,-150 -30,-150' ${stroke} />`;
        svg += `<polygon points='-30,-150 30,-150 0,-280' ${stroke} />`; // Spire base
        svg += `<line x1='0' y1='-280' x2='0' y2='-350' stroke='${c}' stroke-width='2' />`;
        svg += `<line x1='-40' y1='250' x2='30' y2='-150' ${strokeLight} />`;
        svg += `<line x1='40' y1='250' x2='-30' y2='-150' ${strokeLight} />`;
        break;

    case 'needle_simple': // CN Tower
        svg += `<line x1='0' y1='-300' x2='0' y2='250' stroke='${c}' stroke-width='8' />`;
        svg += `<rect x='-30' y='-180' width='60' height='40' rx='10' ${stroke} />`; // Pod
        svg += `<rect x='-20' y='-100' width='40' height='20' rx='5' ${stroke} />`; // Lower Pod
        break;

    case 'ufo': // Space Needle
        svg += `<path d='M-50 250 L-20 -150 L20 -150 L50 250' fill='none' stroke='${c}' stroke-width='4' />`;
        svg += `<line x1='0' y1='250' x2='0' y2='-150' stroke='${c}' stroke-width='4' />`;
        svg += `<ellipse cx='0' cy='-150' rx='60' ry='15' ${stroke} />`;
        svg += `<line x1='0' y1='-150' x2='0' y2='-220' stroke='${c}' stroke-width='4' />`;
        break;

    case 'bundled': // Willis
        svg += `<rect x='-60' y='-50' width='40' height='300' ${stroke} />`;
        svg += `<rect x='-20' y='-150' width='40' height='400' ${stroke} />`;
        svg += `<rect x='20' y='-50' width='40' height='300' ${stroke} />`;
        svg += `<rect x='-20' y='-220' width='40' height='70' ${strokeLight} />`; // Antennas
        break;

    case 'clock': // Big Ben
        svg += `<rect x='-40' y='-100' width='80' height='350' ${stroke} />`;
        svg += `<rect x='-45' y='-180' width='90' height='80' ${stroke} />`; // Clock face area
        svg += `<circle cx='0' cy='-140' r='30' fill='none' stroke='${c}' stroke-width='2' />`;
        svg += `<polygon points='-45,-180 45,-180 0,-250' ${stroke} />`;
        break;

    case 'stadium': // Colosseum
        svg += `<ellipse cx='0' cy='50' rx='180' ry='80' ${stroke} />`;
        svg += `<ellipse cx='0' cy='0' rx='180' ry='80' ${stroke} />`;
        svg += `<ellipse cx='0' cy='-50' rx='180' ry='80' ${stroke} />`;
        svg += `<line x1='-180' y1='-50' x2='-180' y2='50' ${strokeLight} />`;
        svg += `<line x1='180' y1='-50' x2='180' y2='50' ${strokeLight} />`;
        break;
        
    case 'lean': // Pisa
        svg += `<g transform='rotate(10)'>`;
        svg += `<rect x='-40' y='-200' width='80' height='400' ${stroke} />`;
        for(let j=0; j<6; j++) {
            svg += `<line x1='-40' y1='${-200 + j*60}' x2='40' y2='${-200 + j*60}' ${strokeLight} />`;
        }
        svg += `</g>`;
        break;

    case 'art_deco': // Chrysler
        svg += `<rect x='-40' y='-50' width='80' height='300' ${stroke} />`;
        svg += `<path d='M-40 -50 A 40 40 0 0 1 40 -50' fill='none' stroke='${c}' stroke-width='2' />`;
        svg += `<path d='M-30 -80 A 30 30 0 0 1 30 -80' fill='none' stroke='${c}' stroke-width='2' />`;
        svg += `<path d='M-20 -110 A 20 20 0 0 1 20 -110' fill='none' stroke='${c}' stroke-width='2' />`;
        svg += `<line x1='0' y1='-110' x2='0' y2='-200' stroke='${c}' stroke-width='2' />`;
        break;

    case 'sail': // Burj Al Arab
        svg += `<path d='M-40 250 Q100 0 -40 -250 L-40 250' ${stroke} />`;
        svg += `<line x1='-40' y1='-250' x2='-80' y2='250' stroke='${c}' stroke-width='4' />`; // Mast
        svg += `<line x1='-40' y1='150' x2='20' y2='150' ${strokeLight} />`;
        break;

    case 'nest': // Bird Nest
        svg += `<ellipse cx='0' cy='100' rx='180' ry='60' ${stroke} />`;
        svg += `<path d='M-150 100 Q0 -50 150 100' fill='none' stroke='${c}' stroke-width='2' />`;
        svg += `<path d='M-100 120 L100 80 M-120 90 L120 110' ${strokeLight} />`;
        break;

    default:
        svg += `<rect x='-50' y='-200' width='100' height='400' ${stroke} />`;
        break;
  }

  svg += `</g></g>`; // Close groups

  // HUD Elements
  svg += `<g fill='${c}' font-family='monospace' font-size='14'>
      <text x='20' y='30'>目标: ${theme.name}</text>
      <text x='20' y='50'>类型: ${theme.type}</text>
      <text x='650' y='30' text-anchor='end'>MODEL_ID: ${Math.floor(Math.random()*9000)+1000}</text>
      <text x='650' y='50' text-anchor='end'>ROTATION: ACTIVE</text>
      
      <!-- Scifi Corners -->
      <path d='M20 580 L20 550 M20 580 L50 580' fill='none' stroke='${c}' stroke-width='2' />
      <path d='M780 580 L780 550 M780 580 L750 580' fill='none' stroke='${c}' stroke-width='2' />
      <path d='M20 20 L20 50 M20 20 L50 20' fill='none' stroke='${c}' stroke-width='2' />
      <path d='M780 20 L780 50 M780 20 L750 20' fill='none' stroke='${c}' stroke-width='2' />
      
      <!-- Scanning Bar -->
      <rect x='20' y='550' width='${Math.random() * 200 + 100}' height='6' fill='${c}' opacity='0.5'>
         <animate attributeName='width' values='100;300;100' dur='4s' repeatCount='indefinite'/>
      </rect>
    </g>
  </svg>`;

  // Robust utf8 to base64 encoding (replaces unescape)
  try {
      const encoded = btoa(encodeURIComponent(svg).replace(/%([0-9A-F]{2})/g,
          function(match, p1) {
              return String.fromCharCode(parseInt(p1, 16));
          }));
      return 'data:image/svg+xml;base64,' + encoded;
  } catch(e) {
      console.error("SVG Encoding error", e);
      return "";
  }
}

// Generate the 20 images array
export const imageOptions: string[] = Array.from({ length: 20 }, (_, i) => generateTechSvg(i));

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
