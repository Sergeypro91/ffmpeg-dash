// Core
import { FC, useRef, useEffect } from 'react';
import videoJs, { VideoJsPlayer } from 'video.js';
import 'video.js/dist/video-js.css';

// Types
import { VideoJSType } from './videoJSTypes';

// Style
import './VideoJS.scss';

export const VideoJS: FC<VideoJSType> = ({ options, onReady }) => {
    const videoRef = useRef(null);
    const playerRef = useRef<null | VideoJsPlayer>(null);

    useEffect(() => {
        const player = playerRef.current;

        if (!player) {
            const videoElement = videoRef.current;

            if (!videoElement) return;

            playerRef.current = videoJs(videoElement, options);
        } else {
            if (onReady) {
                onReady(player);
            }
        }

        return () => {
            if (player) {
                player.dispose();
                playerRef.current = null;
            }
        };
    }, [options, videoRef, playerRef, onReady]);

    // noinspection HtmlUnknownBooleanAttribute
    return (
        <div data-vjs-player>
            <video ref={videoRef} className="video-js vjs-big-play-centered" />
        </div>
    );
};
