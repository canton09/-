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
      alert('无法访问摄像头，请确保已授予权限。');
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

  return (
    <div className="flex flex-col gap-3">
      <label className="flex items-center button bg-[#3B68FF] px-12 !text-white !border-none">
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
        <div className="w-full text-center">上传图片</div>
      </label>

      <button
        className={`button flex justify-center items-center gap-2 ${isLiveStreamMode ? 'bg-[var(--accent-color)] text-white' : 'bg-[var(--bg-color)]'}`}
        onClick={() => {
            if (isLiveStreamMode) {
                setIsLiveStreamMode(false);
            } else {
                resetState();
                setIsLiveStreamMode(true);
                setIsCameraOpen(false); // Close snapshot modal if open
            }
        }}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path d="M12 9a3.75 3.75 0 1 0 0 7.5A3.75 3.75 0 0 0 12 9Z" />
            <path fillRule="evenodd" d="M9.344 3.071a4.993 4.993 0 0 1 5.312 0l.208.107a.652.652 0 0 1 .324.59v2.461c0 .526-.205 1.036-.57 1.408a6.243 6.243 0 0 1-5.236 0 2.001 2.001 0 0 0-.57-1.408V3.768a.65.65 0 0 1 .324-.59l.208-.107ZM16.5 6.5h-9a6.5 6.5 0 0 0-6.5 6.5v1.5a6.5 6.5 0 0 0 6.5 6.5h9a6.5 6.5 0 0 0 6.5-6.5v-1.5a6.5 6.5 0 0 0-6.5-6.5Z" clipRule="evenodd" />
        </svg>
        <div>{isLiveStreamMode ? '停止实时分析' : '实时自动分析'}</div>
      </button>

      <button
        className="button bg-[var(--bg-color)] flex justify-center items-center gap-2"
        onClick={startCamera}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="w-5 h-5">
          <path d="M4.5 4.5a3 3 0 0 0-3 3v9a3 3 0 0 0 3 3h8.25a3 3 0 0 0 3-3v-9a3 3 0 0 0-3-3H4.5ZM19.94 18.75l-2.69-2.69V7.94l2.69-2.69c.944-.945 2.56-.276 2.56 1.06v11.38c0 1.336-1.616 2.005-2.56 1.06Z" />
        </svg>
        <div>拍照</div>
      </button>

      <div className="hidden">
        <button
          className="button flex gap-3 justify-center items-center"
          onClick={() => {
            setDrawMode(!drawMode);
          }}>
          <div className="text-lg"> 🎨</div>
          <div>Draw on image</div>
        </button>
      </div>

      {isCameraOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="bg-[var(--bg-color)] p-4 rounded-lg max-w-2xl w-full flex flex-col gap-4 relative shadow-2xl border border-[var(--border-color)]">
            <button
              onClick={stopCamera}
              className="absolute top-2 right-2 p-2 rounded-full bg-[var(--input-color)] hover:bg-[var(--border-color)] z-10"
              title="Close camera">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-6 h-6">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18 18 6M6 6l12 12"
                />
              </svg>
            </button>
            <h3 className="text-lg font-bold text-center mt-2">拍照</h3>
            <div className="relative bg-black rounded-lg overflow-hidden flex items-center justify-center aspect-[4/3]">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex justify-center gap-4 pt-2">
              <button onClick={stopCamera} className="button secondary">
                取消
              </button>
              <button
                onClick={captureImage}
                className="button bg-[#3B68FF] !text-white !border-none flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-5 h-5">
                  <path d="M12 9a3.75 3.75 0 1 0 0 7.5A3.75 3.75 0 0 0 12 9Z" />
                  <path
                    fillRule="evenodd"
                    d="M9.344 3.071a4.993 4.993 0 0 1 5.312 0l.208.107a.652.652 0 0 1 .324.59v2.461c0 .526-.205 1.036-.57 1.408a6.243 6.243 0 0 1-5.236 0 2.001 2.001 0 0 0-.57-1.408V3.768a.65.65 0 0 1 .324-.59l.208-.107ZM16.5 6.5h-9a6.5 6.5 0 0 0-6.5 6.5v1.5a6.5 6.5 0 0 0 6.5 6.5h9a6.5 6.5 0 0 0 6.5-6.5v-1.5a6.5 6.5 0 0 0-6.5-6.5Z"
                    clipRule="evenodd"
                  />
                </svg>
                拍摄
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}