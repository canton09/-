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
import React, {useEffect, useRef, useState} from 'react';
import {
  BumpSessionAtom,
  DrawModeAtom,
  ImageSentAtom,
  ImageSrcAtom,
  Is3DViewAtom,
  IsLiveStreamModeAtom,
  IsUploadedImageAtom,
} from './atoms';
import {useResetState} from './hooks';

export function SideControls() {
  const [, setImageSrc] = useAtom(ImageSrcAtom);
  const [drawMode, setDrawMode] = useAtom(DrawModeAtom);
  const [, setIsUploadedImage] = useAtom(IsUploadedImageAtom);
  const [, setBumpSession] = useAtom(BumpSessionAtom);
  const [, setImageSent] = useAtom(ImageSentAtom);
  const [isLiveStreamMode, setIsLiveStreamMode] = useAtom(IsLiveStreamModeAtom);
  const [is3DView, setIs3DView] = useAtom(Is3DViewAtom);
  const resetState = useResetState();

  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {facingMode: 'environment'},
      });
      setStream(mediaStream);
      setIsCameraOpen(true);
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('无法访问摄像头。');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setIsCameraOpen(false);
  };

  const captureImage = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/png');

        resetState();
        setImageSrc(dataUrl);
        setIsUploadedImage(true);
        setImageSent(false);
        setBumpSession((prev) => prev + 1);

        stopCamera();
      }
    }
  };

  useEffect(() => {
    if (isCameraOpen && videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch((e) => console.error('Error playing video:', e));
    }
  }, [isCameraOpen, stream]);

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

  return (
    <>
      <div className="mb-2 text-xs font-bold text-[var(--text-color-secondary)] tracking-widest uppercase hidden md:block">输入源</div>
      <div className="flex flex-row md:flex-col gap-2 w-full">
        {/* Upload Button */}
        <label className="button w-full hover:text-[var(--accent-color)] group" title="上传图片">
          <input
            className="hidden"
            type="file"
            accept=".jpg, .jpeg, .png, .webp"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                  resetState();
                  setIsLiveStreamMode(false);
                  setImageSrc(e.target?.result as string);
                  setIsUploadedImage(true);
                  setImageSent(false);
                  setBumpSession((prev) => prev + 1);
                };
                reader.readAsDataURL(file);
              }
            }}
          />
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 group-hover:scale-110 transition-transform">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
          </svg>
          <span className="ml-2 text-xs hidden md:inline">上传</span>
        </label>

        {/* Live Mode Toggle */}
        <button
          className={`button w-full group ${isLiveStreamMode ? '!border-[var(--accent-color)] !text-[var(--accent-color)] shadow-[0_0_10px_var(--accent-glow)]' : ''}`}
          title="实时视频流"
          onClick={() => {
              if (isLiveStreamMode) {
                  setIsLiveStreamMode(false);
              } else {
                  resetState();
                  setIsLiveStreamMode(true);
                  setIsCameraOpen(false);
              }
          }}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 group-hover:scale-110 transition-transform ${isLiveStreamMode ? 'animate-pulse' : ''}`}>
             <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
          </svg>
          <span className="ml-2 text-xs hidden md:inline">实时</span>
        </button>

        {/* Camera Snapshot */}
        <button
          className="button w-full group"
          title="拍摄快照"
          onClick={startCamera}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 group-hover:scale-110 transition-transform">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
          </svg>
          <span className="ml-2 text-xs hidden md:inline">截图</span>
        </button>

        {/* 3D View Toggle */}
        <button
          className={`button w-full group ${is3DView ? '!border-[var(--accent-color)] !text-[var(--accent-color)] shadow-[0_0_10px_var(--accent-glow)]' : ''}`}
          title="开启3D透视"
          onClick={() => setIs3DView(!is3DView)}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 group-hover:scale-110 transition-transform">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
          </svg>
          <span className="ml-2 text-xs hidden md:inline">3D 建模</span>
        </button>
      </div>

      {isCameraOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
          <div className="tech-panel p-1 max-w-lg w-full flex flex-col gap-4 relative shadow-[0_0_30px_rgba(0,243,255,0.2)] border border-[var(--accent-color)]">
            <div className="flex justify-between items-center p-3 bg-[rgba(0,243,255,0.1)]">
                <h3 className="text-sm font-bold tracking-widest text-[var(--accent-color)] uppercase">摄像头画面</h3>
                <button onClick={stopCamera} className="!p-1 !min-h-0 border-none hover:text-white text-[var(--accent-color)]">✕</button>
            </div>
            <div className="relative bg-black overflow-hidden aspect-[4/3]">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-contain"
              />
              {/* Crosshair Overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-50">
                  <div className="w-8 h-8 border-2 border-[var(--accent-color)] rounded-full"></div>
                  <div className="absolute w-full h-[1px] bg-[var(--accent-color)]"></div>
                  <div className="absolute h-full w-[1px] bg-[var(--accent-color)]"></div>
              </div>
            </div>
            <div className="flex justify-between p-4 pt-0 gap-4">
              <button onClick={stopCamera} className="flex-1 text-xs">取消</button>
              <button onClick={captureImage} className="flex-1 primary-action text-xs">拍摄</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
