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

import {GoogleGenAI} from '@google/genai';
import {useAtom} from 'jotai';
import getStroke from 'perfect-freehand';
import React, {useEffect, useRef, useState} from 'react';
import {
  BoundingBoxMasksAtom,
  BoundingBoxes2DAtom,
  DetectTypeAtom,
  HoverEnteredAtom,
  ImageSrcAtom,
  IsLiveStreamModeAtom,
  IsLoadingAtom,
  IsThinkingEnabledAtom,
  LinesAtom,
  PointsAtom,
  PromptsAtom,
  RequestJsonAtom,
  ResponseJsonAtom,
  SelectedModelAtom,
  TemperatureAtom,
} from './atoms';
import {lineOptions} from './consts';
import {DetectTypes} from './Types';
import {getSvgPathFromStroke, loadImage} from './utils';

const ai = new GoogleGenAI({apiKey: process.env.API_KEY});

export function Prompt() {
  const [temperature, setTemperature] = useAtom(TemperatureAtom);
  const [, setBoundingBoxes2D] = useAtom(BoundingBoxes2DAtom);
  const [, setBoundingBoxMasks] = useAtom(BoundingBoxMasksAtom);
  const [detectType] = useAtom(DetectTypeAtom);
  const [, setPoints] = useAtom(PointsAtom);
  const [, setHoverEntered] = useAtom(HoverEnteredAtom);
  const [lines] = useAtom(LinesAtom);
  const [imageSrc] = useAtom(ImageSrcAtom);
  const [isLiveStreamMode] = useAtom(IsLiveStreamModeAtom);
  const [targetPrompt, setTargetPrompt] = useState('物品');
  const [selectedModel, setSelectedModel] = useAtom(SelectedModelAtom);
  const [isThinkingEnabled, setIsThinkingEnabled] = useAtom(
    IsThinkingEnabledAtom,
  );

  const [prompts, setPrompts] = useAtom(PromptsAtom);
  const [isLoading, setIsLoading] = useAtom(IsLoadingAtom);
  const [, setRequestJson] = useAtom(RequestJsonAtom);
  const [, setResponseJson] = useAtom(ResponseJsonAtom);
  const [responseTime, setResponseTime] = useState<string | null>(null);
  
  const isLoadingRef = useRef(isLoading);
  useEffect(() => { isLoadingRef.current = isLoading; }, [isLoading]);

  const rateLimitHitRef = useRef(false);

  const is2d = detectType === '2D bounding boxes';
  const currentModel = selectedModel;

  const get2dPrompt = () =>
    `检测 ${targetPrompt}，不超过20个物品。输出一个JSON列表，每个条目包含 'box_2d' 中的2D边界框和 'label' 中的中文文本标签。`;

  const getGenericPrompt = (type: DetectTypes) => {
    if (!prompts[type] || prompts[type].length < 3)
      return prompts[type]?.join(' ') || '';
    const [p0, p1, p2] = prompts[type];
    return `${p0} ${p1}${p2}`;
  };

  async function handleSend() {
    if (isLoadingRef.current) return;
    
    setIsLoading(true);
    if (!isLiveStreamMode) {
        setRequestJson('');
        setResponseJson('');
        setResponseTime(null);
    }
    
    const startTime = performance.now();
    try {
      let activeDataURL;
      const maxSize = isLiveStreamMode ? 320 : 640;
      const copyCanvas = document.createElement('canvas');
      const ctx = copyCanvas.getContext('2d')!;

      if (isLiveStreamMode) {
        const video = document.getElementById('live-video-feed') as HTMLVideoElement;
        if (video && video.videoWidth > 0) {
            const scale = Math.min(maxSize / video.videoWidth, maxSize / video.videoHeight);
            copyCanvas.width = video.videoWidth * scale;
            copyCanvas.height = video.videoHeight * scale;
            ctx.drawImage(video, 0, 0, copyCanvas.width, copyCanvas.height);
        } else {
            setIsLoading(false);
            return;
        }
      } else if (imageSrc) {
        const image = await loadImage(imageSrc);
        const scale = Math.min(maxSize / image.width, maxSize / image.height);
        copyCanvas.width = image.width * scale;
        copyCanvas.height = image.height * scale;
        ctx.drawImage(image, 0, 0, image.width * scale, image.height * scale);
      } else {
        setIsLoading(false);
        return;
      }
      
      let mimeType = 'image/png';
      if (isLiveStreamMode) {
          mimeType = 'image/jpeg';
          activeDataURL = copyCanvas.toDataURL(mimeType, 0.5);
      } else {
          activeDataURL = copyCanvas.toDataURL(mimeType);
      }

      if (lines.length > 0 && !isLiveStreamMode) {
        for (const line of lines) {
          const p = new Path2D(
            getSvgPathFromStroke(
              getStroke(
                line[0].map(([x, y]) => [
                  x * copyCanvas.width,
                  y * copyCanvas.height,
                  0.5,
                ]),
                lineOptions,
              ),
            ),
          );
          ctx.fillStyle = line[1];
          ctx.fill(p);
        }
        activeDataURL = copyCanvas.toDataURL('image/png');
        mimeType = 'image/png';
      }

      setHoverEntered(false);
      const config: {
        temperature: number;
        thinkingConfig?: {thinkingBudget: number};
        responseMimeType?: string;
      } = {
        temperature,
        responseMimeType: 'application/json',
      };

      const model = currentModel;

      let setThinkingBudgetZero = !isThinkingEnabled;
      if (isLiveStreamMode && !isThinkingEnabled) {
          setThinkingBudgetZero = true;
      }

      if (setThinkingBudgetZero) {
        config.thinkingConfig = {thinkingBudget: 0};
      }

      let textPromptToSend = '';
      if (is2d) {
        textPromptToSend = get2dPrompt();
      } else {
        textPromptToSend = getGenericPrompt(detectType);
      }

      const requestPayload = {
        model,
        contents: {
          parts: [
            {
              inlineData: {
                data: activeDataURL.split(',')[1],
                mimeType: mimeType,
              },
            },
            {text: textPromptToSend},
          ],
        },
        config,
      };

      if (!isLiveStreamMode) {
        const displayPayload = JSON.parse(JSON.stringify(requestPayload));
        displayPayload.contents.parts[0].inlineData.data =
            '<BASE64_IMAGE_DATA_REDACTED>';
        setRequestJson(JSON.stringify(displayPayload, null, 2));
      }

      const genAIResponse = await ai.models.generateContent(requestPayload);

      let response = genAIResponse.text;

      if (response.includes('```json')) {
        response = response.split('```json')[1].split('```')[0];
      }
      try {
        const parsed = JSON.parse(response);
        if (!isLiveStreamMode) {
            setResponseJson(JSON.stringify(parsed, null, 2));
        }
      } catch (e) {
        if (!isLiveStreamMode) setResponseJson(response);
      }
      const parsedResponse = JSON.parse(response);
      if (detectType === '2D bounding boxes') {
        const formattedBoxes = parsedResponse.map(
          (box: {box_2d: [number, number, number, number]; label: string}) => {
            const [ymin, xmin, ymax, xmax] = box.box_2d;
            return {
              x: xmin / 1000,
              y: ymin / 1000,
              width: (xmax - xmin) / 1000,
              height: (ymax - ymin) / 1000,
              label: box.label,
            };
          },
        );
        setHoverEntered(false);
        setBoundingBoxes2D(formattedBoxes);
      } else if (detectType === 'Points') {
        const formattedPoints = parsedResponse.map(
          (point: {point: [number, number]; label: string}) => {
            return {
              point: {
                x: point.point[1] / 1000,
                y: point.point[0] / 1000,
              },
              label: point.label,
            };
          },
        );
        setPoints(formattedPoints);
      } else if (detectType === 'Segmentation masks') {
        const formattedBoxes = parsedResponse.map(
          (box: {
            box_2d: [number, number, number, number];
            label: string;
            mask: ImageData;
          }) => {
            const [ymin, xmin, ymax, xmax] = box.box_2d;
            return {
              x: xmin / 1000,
              y: ymin / 1000,
              width: (xmax - xmin) / 1000,
              height: (ymax - ymin) / 1000,
              label: box.label,
              imageData: box.mask,
            };
          },
        );
        setHoverEntered(false);
        const sortedBoxes = formattedBoxes.sort(
          (a: any, b: any) => b.width * b.height - a.width * a.height,
        );
        setBoundingBoxMasks(sortedBoxes);
      }
      
      rateLimitHitRef.current = false;

    } catch (error: any) {
      console.error('Error processing request:', error);
      const errorMessage = error.message || '';
      
      if (errorMessage.includes('429') || errorMessage.includes('RESOURCE_EXHAUSTED')) {
          rateLimitHitRef.current = true;
          if (!isLiveStreamMode) {
            alert('API Quota Exceeded (429). Retrying automatically in live mode.');
          }
      } else if (!isLiveStreamMode) {
        setResponseJson(
            JSON.stringify({error: 'Error', details: errorMessage}, null, 2)
        );
      }
    } finally {
      const endTime = performance.now();
      const duration = ((endTime - startTime) / 1000).toFixed(2);
      if (!isLiveStreamMode) {
        setResponseTime(`${duration}s`);
      }
      setIsLoading(false);
    }
  }

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    const loop = () => {
        if (isLiveStreamMode && !isLoadingRef.current) {
            handleSend();
        }
        const delay = rateLimitHitRef.current ? 20000 : 6000;
        timeoutId = setTimeout(loop, delay);
    };
    if (isLiveStreamMode) {
        loop();
    }
    return () => {
        clearTimeout(timeoutId);
    };
  }, [isLiveStreamMode, detectType, targetPrompt, prompts, currentModel, temperature, isThinkingEnabled]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !isLoading) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col gap-3 h-full">
      {/* Control Bar */}
      <div className="flex justify-between items-center text-[var(--text-color-secondary)] text-xs">
        <div className="flex items-center gap-2">
          <div className="uppercase tracking-wider font-bold">MODEL_CONFIG:</div>
          <select
            value={currentModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            disabled={isLoading && !isLiveStreamMode}
            className="bg-transparent border border-[var(--border-color)] text-[var(--text-color-primary)] py-1 px-2 text-xs">
            <option value="gemini-2.5-flash">GEMINI-2.5-FLASH (FAST)</option>
            <option value="gemini-robotics-er-1.5-preview">GEMINI-ROBOTICS</option>
          </select>
        </div>
        {responseTime && <div className="font-mono text-[var(--accent-color)]">{responseTime}</div>}
      </div>

      <div className="flex gap-4 items-center text-xs text-[var(--text-color-secondary)]">
         <label className="flex items-center gap-2 cursor-pointer hover:text-[var(--accent-color)]">
          <input
            type="checkbox"
            checked={isThinkingEnabled}
            onChange={(e) => setIsThinkingEnabled(e.target.checked)}
            disabled={isLoading && !isLiveStreamMode}
            className="w-3 h-3"
          />
          ENABLE THINKING
        </label>
        <label className="flex items-center gap-2">
          TEMP: {temperature}
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={temperature}
            onChange={(e) => setTemperature(Number(e.target.value))}
            disabled={isLoading && !isLiveStreamMode}
            className="w-16 h-1"
          />
        </label>
      </div>

      {/* Prompt Area */}
      <div className="flex flex-col grow gap-2">
        <div className="uppercase text-xs font-bold text-[var(--text-color-secondary)] tracking-widest">
            {is2d ? 'Target Object' : 'Instruction'}
        </div>
        <div className="flex gap-3 items-stretch grow">
            <div className="grow relative group">
                {/* Decoration corners */}
                <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-[var(--accent-color)] opacity-50"></div>
                <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-[var(--accent-color)] opacity-50"></div>
                
                <textarea
                className="w-full h-full bg-[var(--input-bg)] border border-[var(--border-color)] p-3 text-sm font-mono resize-none focus:border-[var(--accent-color)] transition-colors"
                placeholder={is2d ? "e.g. car, bottle" : "Describe what to detect..."}
                value={is2d ? targetPrompt : (detectType === 'Segmentation masks' ? prompts[detectType][1] : (prompts[detectType]?.[1] ?? ''))}
                onChange={(e) => {
                    const val = e.target.value;
                    if(is2d) {
                        setTargetPrompt(val);
                    } else {
                        const newPrompts = {...prompts};
                        if (!newPrompts[detectType]) newPrompts[detectType] = ['', '', ''];
                        newPrompts[detectType][1] = val;
                        setPrompts(newPrompts);
                    }
                }}
                onKeyDown={handleKeyDown}
                disabled={isLoading && !isLiveStreamMode}
                />
            </div>

            <button
            className={`primary-action w-24 md:w-32 flex-col gap-1 ${isLoading && !isLiveStreamMode ? 'opacity-70' : ''}`}
            onClick={handleSend}
            disabled={isLoading && !isLiveStreamMode || (!imageSrc && !isLiveStreamMode)}>
            {isLoading ? (
                <>
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin mb-1"></div>
                <div className="text-[10px]">PROCESSING</div>
                </>
            ) : (
                isLiveStreamMode ? (
                    <>
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse mb-1"></div>
                    <div>STOP</div>
                    </>
                ) : (
                    <>
                    <div className="text-lg">RUN</div>
                    <div className="text-[10px] font-normal tracking-widest">EXECUTE</div>
                    </>
                )
            )}
            </button>
        </div>
      </div>
    </div>
  );
}