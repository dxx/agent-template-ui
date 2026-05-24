import { useEffect, useState } from 'react';
import styles from './ProgressBar.module.scss';

let showProgressFn: (() => void) | null = null;
let hideProgressFn: (() => void) | null = null;

export function registerProgressFunctions(show: () => void, hide: () => void) {
  showProgressFn = show;
  hideProgressFn = hide;
}

export function showProgress() {
  showProgressFn?.();
}

export function hideProgress() {
  hideProgressFn?.();
}

export default function ProgressBar() {
  const [visible, setVisible] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    registerProgressFunctions(
      () => {
        setFadeOut(false);
        setVisible(true);
      },
      () => {
        setFadeOut(true);
        setTimeout(() => {
          setVisible(false);
          setFadeOut(false);
        }, 400);
      }
    );
  }, []);

  if (!visible) return null;

  return <div className={`${styles.progressBar} ${fadeOut ? styles.fadeOut : ''}`} />;
}