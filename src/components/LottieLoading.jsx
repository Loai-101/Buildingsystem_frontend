import Lottie from 'lottie-react';
import materialWaveAnimation from '../assets/lottie/material-wave-loading.json';
import './LottieLoading.css';

/**
 * Full-page or inline loading state using the Material wave Lottie animation.
 * @param {string} [message] - Optional text below the animation (e.g. t('common.loading')).
 * @param {boolean} [inline] - If true, uses compact layout for inline use (e.g. inside a card).
 */
export function LottieLoading({ message, inline = false }) {
  return (
    <div className={`lottie-loading ${inline ? 'lottie-loading--inline' : ''}`} role="status" aria-label={message || 'Loading'}>
      <Lottie
        animationData={materialWaveAnimation}
        loop
        className="lottie-loading-animation"
      />
      {message && <p className="lottie-loading-message">{message}</p>}
    </div>
  );
}
