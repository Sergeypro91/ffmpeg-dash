// Types
import { VideoJsPlayer } from 'video.js';

export interface VideoJSType {
    options: any;
    onReady: (payload: VideoJsPlayer) => void;
}
