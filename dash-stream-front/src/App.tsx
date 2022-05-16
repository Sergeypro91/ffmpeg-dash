import React from 'react';
import { VideoPlayer } from './components/VideoPlayer/VideoPlayer';

import './App.css';

const App = () => {
    const setTimePoint = (time: number) => {
        console.log('SAVE VIEWED TIME', time);
    };

    return (
        <div className="App">
            <span>This is test MPEG-DASH streaming</span>

            <VideoPlayer
                src="http://127.0.0.1:8080/output/manifest.mpd"
                type="application/dash+xml"
                poster="https://images.kinorium.com/movie/poster/2389884/w1500_50419411.jpg"
                isActive
                lastTimePoint={60}
                setTimePoint={setTimePoint}
            />
        </div>
    );
};

export default App;
