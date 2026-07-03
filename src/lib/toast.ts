/**
 * Simple toast utility that dispatches custom events.
 * Usage: toast.success('Done') / toast.error('Failed')
 * Pair with <ToastContainer /> in layout.
 */

type ToastType = 'success' | 'error';

interface ToastEvent {
    msg: string;
    type: ToastType;
}

const TOAST_EVENT = 'arca:toast';

function dispatch(msg: string, type: ToastType) {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new CustomEvent<ToastEvent>(TOAST_EVENT, { detail: { msg, type } }));
}

export const toast = {
    success: (msg: string) => dispatch(msg, 'success'),
    error: (msg: string) => dispatch(msg, 'error'),
    TOAST_EVENT,
};
