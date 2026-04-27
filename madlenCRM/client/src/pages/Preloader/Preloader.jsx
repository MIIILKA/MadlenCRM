import React, { useEffect, useRef } from 'react';
import './Preloader.scss';

// ПРИБЕРИ ЦЕЙ РЯДОК: import logoVideo from '../../public/logo_animated.mp4';

const Preloader = ({ isFadeOut }) => {
    const videoRef = useRef(null);

    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.playbackRate = 2.0; // Твоя швидкість х2
        }
    }, []);

    return (
        <div className={`preloader-overlay ${isFadeOut ? 'fade-out' : ''}`}>
            <div className="video-container">
                <video
                    ref={videoRef}
                    src="/logo_animated.mp4"
                    autoPlay
                    loop
                    muted
                    playsInline
                    disablePictureInPicture
                    className="preloader-video"
                />
            </div>
        </div>
    );
};

export default Preloader;