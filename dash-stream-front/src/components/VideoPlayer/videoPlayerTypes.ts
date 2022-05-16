export interface VideoPlayerType {
    src: string;
    type: string;
    poster?: string;
    isActive?: boolean;
    lastTimePoint?: number;
    setTimePoint?: (time: number) => void;
}
