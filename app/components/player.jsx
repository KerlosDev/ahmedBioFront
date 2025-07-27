'use client';
import { useEffect, useRef } from 'react';
import Plyr from 'plyr';
import 'plyr/dist/plyr.css';

const VideoPlayer = ({ videoUrl }) => {
  const playerRef = useRef(null);
  const containerRef = useRef(null);

  const getYouTubeId = (url) => {
    const match = url?.match(
      /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
    );
    return match?.[1] || null;
  };

  const getBunnyVideoId = (url) => {
    const match = url?.match(/iframe\.mediadelivery\.net\/embed\/\d+\/([a-f0-9\-]+)/);
    return match?.[1] || null;
  };

  const getVideoType = (url) => {
    if (getYouTubeId(url)) return 'youtube';
    if (getBunnyVideoId(url)) return 'bunny';
    return null;
  };

  const videoType = getVideoType(videoUrl);
  const videoId = videoType === 'youtube' ? getYouTubeId(videoUrl) : getBunnyVideoId(videoUrl);

  // Set aspect ratio based on video type
  const aspectClass = videoId ? 'aspect-w-16 aspect-h-9' : 'aspect-w-16 aspect-h-9';

  useEffect(() => {
    if (typeof window !== 'undefined' && videoId && containerRef.current) {
      // Clear any previous player content
      containerRef.current.innerHTML = '';

      if (videoType === 'youtube') {
        // YouTube video setup
        containerRef.current.innerHTML = `
          <div id="player" data-plyr-provider="youtube" data-plyr-embed-id="${videoId}"></div>
        `;

        playerRef.current = new Plyr('#player', {
          controls: [
            'play-large',
            'play',
            'progress',
            'current-time',
            'mute',
            'volume',
            'settings',
            'fullscreen'
          ],
          settings: ['quality', 'speed'],
          youtube: {
            noCookie: false,
            rel: 0,
            showinfo: 0,
            iv_load_policy: 3,
            modestbranding: 1
          }
        });
      } else if (videoType === 'bunny') {
        // Bunny.net video setup
        containerRef.current.innerHTML = `
          <iframe 
            id="bunny-player"
            src="${videoUrl}"
            loading="lazy"
            style="border: none; position: absolute; top: 0; height: 100%; width: 100%;"
            allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
            allowfullscreen="true">
          </iframe>
        `;

        // Apply Plyr to the iframe for consistent controls
        playerRef.current = new Plyr('#bunny-player', {
          controls: [
            'play-large',
            'progress',
            'current-time',
            'mute',
            'volume',
            'fullscreen'
          ],
          fullscreen: {
            enabled: true,
            fallback: true,
            iosNative: true,
            container: null
          }
        });
      }

      // Add mobile-specific event listeners for better performance
     
    }

    // Cleanup player instance
    return () => {
      if (playerRef.current && typeof playerRef.current.destroy === 'function') {
        playerRef.current.destroy();
      }
    };
  }, [videoId, videoType, videoUrl]);

  if (!videoId || !videoType) {
    return (
      <div className="w-full h-full flex items-center justify-center text-white bg-black">
        رابط الفيديو غير صالح أو غير مدعوم
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`${aspectClass} w-full h-full relative`} 
    />
  );
};

export default VideoPlayer;