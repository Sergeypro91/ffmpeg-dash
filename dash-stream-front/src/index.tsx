// Core
import React from 'react';
import { createRoot } from 'react-dom/client';

// Components
import App from 'App';

// Styles
import './index.scss';

const container = document.getElementById('root');
const root = createRoot(container!);

root.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
);
