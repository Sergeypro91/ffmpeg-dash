// Core
import React, { FC, useEffect, useCallback } from 'react';

// Components
import { VideoJS } from './VideoJS/VideoJS';

// Types
import { VideoPlayerType } from './videoPlayerTypes';
import { VideoJsPlayer } from 'video.js';

// Style
import './VideoPlayer.scss';

export const VideoPlayer: FC<VideoPlayerType> = ({
    src,
    type,
    poster,
    isActive = false,
    lastTimePoint = 0,
    setTimePoint,
}) => {
    const playerRef = React.useRef<null | VideoJsPlayer>(null);

    const videoJsOptions = {
        autoplay: false,
        controls: true,
        responsive: true,
        fluid: true,
        sources: [{ src, type }],
        aspectRatio: '16:9',
        poster,
    };

    const stopVideo = useCallback(() => {
        if (playerRef.current) {
            playerRef.current.pause();
            playerRef.current.currentTime(0);
            playerRef.current.hasStarted(false);
        }
    }, []);

    const handlePlayerReady = (player: VideoJsPlayer) => {
        playerRef.current = player;
        let prevSaveDTime = 0;

        if (lastTimePoint) {
            player.currentTime(lastTimePoint);
        }

        player.on('timeupdate', () => {
            const roundTime = Math.ceil(player.currentTime());

            if (
                setTimePoint &&
                prevSaveDTime !== roundTime &&
                !(roundTime % 30)
            ) {
                prevSaveDTime = roundTime;
                setTimePoint(roundTime);
            }
        });

        player.on('ended', () => {
            if (player.isFullscreen()) {
                player.cancelFullScreen();
            }

            if (setTimePoint) {
                setTimePoint(0);
            }

            stopVideo();
        });

        player.on('dispose', () => {
            console.log('player will dispose');
        });
    };

    const handleKeyDown = useCallback(
        (e: KeyboardEvent): void => {
            const player = playerRef.current;

            const skip = (
                currTime: number,
                skipTime: number,
                duration: number,
            ): null | number => {
                const newTime = currTime + skipTime;

                if (newTime < 0) return 0;

                if (newTime >= duration) return null;

                return newTime;
            };

            const volume = (currVolume: number, setVolume: number) => {
                const newVolume = currVolume + setVolume;

                if (newVolume < 0) return 0;

                if (newVolume > 1) return 1;

                return newVolume;
            };

            if (player) {
                switch (e.code) {
                    case 'Escape':
                        stopVideo();
                        break;
                    case 'Space':
                        if (player.paused()) {
                            player.play();
                        } else {
                            player.pause();
                        }
                        break;
                    case 'ArrowRight':
                        const skipTo = skip(
                            player.currentTime(),
                            15,
                            player.duration(),
                        );

                        if (skipTo !== null) {
                            player.currentTime(skipTo);
                        }
                        break;
                    case 'ArrowLeft':
                        const rewind = skip(
                            player.currentTime(),
                            -15,
                            player.duration(),
                        );

                        if (rewind !== null) {
                            player.currentTime(rewind);
                        }
                        break;
                    case 'ArrowUp':
                        player.volume(volume(player.volume(), 0.1));
                        break;
                    case 'ArrowDown':
                        player.volume(volume(player.volume(), -0.1));
                        break;
                }
            }
        },
        [stopVideo],
    );

    useEffect(() => {
        if (isActive) {
            document.addEventListener('keydown', handleKeyDown);
        } else {
            stopVideo();
        }

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isActive, handleKeyDown, stopVideo]);

    return <VideoJS options={videoJsOptions} onReady={handlePlayerReady} />;
};
