import React, { useEffect, useRef } from 'react';
import './Preloader.scss';
import logoVideo from '../../../public/logo_animated.mp4';

const Preloader = ({ isFadeOut }) => {
    const videoRef = useRef(null);

    useEffect(() => {
        if (videoRef.current) {
            // Пришвидшуємо в два рази, щоб вкласти кульмінацію в таймінг
            videoRef.current.playbackRate = 2.0;
        }
    }, []);

    return (
        <div className={`preloader-overlay ${isFadeOut ? 'fade-out' : ''}`}>
            <video
                ref={videoRef}
                src={logoVideo}
                autoPlay
                loop
                muted
                playsInline
                disablePictureInPicture
                className="preloader-video"
            />
        </div>
    );
};
export default Preloader;