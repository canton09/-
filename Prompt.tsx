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
  
  // Ref to track loading state in intervals
  const isLoadingRef = useRef(isLoading);
  useEffect(() => { isLoadingRef.current = isLoading; }, [isLoading]);

  // Ref to track rate limits
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
    // Prevent overlapping requests in all modes to avoid 429 errors
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
            // Video not ready
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
        // Should not happen with disabled button, but we'll see
        setIsLoading(false);
        return;
      }
      
      let mimeType = 'image/png';
      if (isLiveStreamMode) {
          // Use JPEG with 50% quality for live stream to speed up transmission
          mimeType = 'image/jpeg';
          activeDataURL = copyCanvas.toDataURL(mimeType, 0.5);
      } else {
          activeDataURL = copyCanvas.toDataURL(mimeType);
      }

      if (lines.length > 0 && !isLiveStreamMode) {
        // Only draw lines on static images for now
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
      // Force thinking to 0 in live mode for speed unless explicitly enabled and user knows what they are doing
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
        // sort largest to smallest
        const sortedBoxes = formattedBoxes.sort(
          (a: any, b: any) => b.width * b.height - a.width * a.height,
        );
        setBoundingBoxMasks(sortedBoxes);
      }
      
      // Request successful, reset backoff
      rateLimitHitRef.current = false;

    } catch (error: any) {
      console.error('Error processing request:', error);
      const errorMessage = error.message || '';
      
      // Check for rate limit error specifically
      if (errorMessage.includes('429') || errorMessage.includes('RESOURCE_EXHAUSTED')) {
          rateLimitHitRef.current = true; // Trigger backoff
          if (!isLiveStreamMode) {
            alert('您已超出 API 配额 (429 RESOURCE_EXHAUSTED)。请稍后重试。');
          } else {
             console.warn("Rate limit hit in live mode. Throttling...");
          }
      } else if (!isLiveStreamMode) {
        setResponseJson(
            JSON.stringify(
            {
                error: '处理响应时发生错误。',
                details: errorMessage,
            },
            null,
            2,
            ),
        );
        alert(
            `发生错误。请重试。\n\n详情：${errorMessage}`,
        );
      }
    } finally {
      const endTime = performance.now();
      const duration = ((endTime - startTime) / 1000).toFixed(2);
      if (!isLiveStreamMode) {
        setResponseTime(`响应时间：${duration}s`);
      }
      setIsLoading(false);
    }
  }

  // Auto-trigger loop for Live Stream Mode
  useEffect(() => {
    // Fix: Use ReturnType<typeof setTimeout> instead of NodeJS.Timeout to avoid namespace errors in environments without Node types.
    let timeoutId: ReturnType<typeof setTimeout>;

    const loop = () => {
        if (isLiveStreamMode && !isLoadingRef.current) {
            handleSend();
        }
        // Schedule next check
        // Dynamic delay: 6000ms normally, 20000ms if we hit a rate limit
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
    <div className="flex grow flex-col gap-3">
      <div className="flex justify-between items-center">
        <div className="uppercase flex items-center gap-2">
          模型：
          <select
            value={currentModel}
            onChange={(e) => {
              setSelectedModel(e.target.value);
            }}
            disabled={isLoading && !isLiveStreamMode}
            className="bg-[var(--input-color)] border border-[var(--border-color)] rounded-md p-1 text-sm normal-case font-mono">
            <option value="gemini-2.5-flash">gemini-2.5-flash (极速)</option>
            <option value="gemini-robotics-er-1.5-preview">
              gemini-robotics-er-1.5-preview
            </option>
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-1 text-sm">
        <label className="flex items-center gap-2 select-none">
          <input
            type="checkbox"
            checked={isThinkingEnabled}
            onChange={(e) => setIsThinkingEnabled(e.target.checked)}
            disabled={isLoading && !isLiveStreamMode}
          />
          启用思考
        </label>
        <div className="text-xs pl-6 text-[var(--text-color-secondary)]">
          思考功能可提高模型处理任务的推理能力，但在简单的定位任务中可能效果不佳。对于简单任务，禁用思考功能可提高速度并可能获得更好的结果。
        </div>
      </div>

      <div className="border-b my-1 border-[var(--border-color)]"></div>

      <div className="uppercase">提示词</div>

      <div className="w-full flex flex-col">
        {is2d ? (
          <div className="flex flex-col gap-2">
            <div>检测物品：</div>
            <textarea
              className="w-full bg-[var(--input-color)] rounded-lg resize-none p-4"
              placeholder="例如：汽车，树木"
              rows={1}
              value={targetPrompt}
              onChange={(e) => setTargetPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading && !isLiveStreamMode}
            />
          </div>
        ) : detectType === 'Segmentation masks' ? (
          <div className="flex flex-col gap-2">
            <div>{prompts[detectType][0]}</div>
            <textarea
              className="w-full bg-[var(--input-color)] rounded-lg resize-none p-4"
              placeholder="要分割什么？"
              rows={1}
              value={prompts[detectType][1]}
              onChange={(e) => {
                const value = e.target.value;
                const newPromptsState = {...prompts};
                if (!newPromptsState[detectType])
                  newPromptsState[detectType] = ['', '', ''];
                newPromptsState[detectType][1] = value;
                setPrompts(newPromptsState);
              }}
              onKeyDown={handleKeyDown}
              disabled={isLoading && !isLiveStreamMode}
            />
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <div>{prompts[detectType]?.[0]}</div>
            <textarea
              className="w-full bg-[var(--input-color)] rounded-lg resize-none p-4"
              placeholder="您想检测什么样的物品？"
              rows={1}
              value={prompts[detectType]?.[1] ?? ''}
              onChange={(e) => {
                const value = e.target.value;
                const newPromptsState = {...prompts};
                if (!newPromptsState[detectType])
                  newPromptsState[detectType] = ['', '', ''];
                newPromptsState[detectType][1] = value;
                setPrompts(newPromptsState);
              }}
              onKeyDown={handleKeyDown}
              disabled={isLoading && !isLiveStreamMode}
            />
          </div>
        )}
      </div>
      <div className="flex justify-between gap-3">
        <button
          className={`bg-[#3B68FF] px-12 !text-white !border-none flex items-center justify-center ${isLoading && !isLiveStreamMode || (!imageSrc && !isLiveStreamMode) ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={handleSend}
          disabled={isLoading && !isLiveStreamMode || (!imageSrc && !isLiveStreamMode)}>
          {isLoading ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {isLiveStreamMode ? '分析中...' : '发送中...'}
            </>
          ) : (
            isLiveStreamMode ? '分析暂停' : '发送'
          )}
        </button>
        <label className="flex items-center gap-2">
          温度：
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={temperature}
            onChange={(e) => setTemperature(Number(e.target.value))}
            disabled={isLoading && !isLiveStreamMode}
          />
          {temperature}
        </label>
      </div>
      {responseTime && (
        <div className="text-sm text-gray-500 mt-2">{responseTime}</div>
      )}
    </div>
  );
}