import isEventSupported from './isEventSupported';
import createSyntheticEvent from './createSyntheticEvent';
import getDomNodeId from '../getDomNodeId';
import SimpleMap from '../../utils/SimpleMap';

const BUBBLEABLE_NATIVE_EVENTS = [
        'blur', 'change', 'click', 'contextmenu', 'copy', 'cut',
        'dblclick', 'drag', 'dragend', 'dragenter', 'dragleave', 'dragover', 'dragstart', 'drop',
        'focus', 'input', 'keydown', 'keypress', 'keyup',
        'mousedown', 'mousemove', 'mouseout', 'mouseover', 'mouseup',
        'paste', 'submit', 'touchcancel', 'touchend', 'touchmove', 'touchstart', 'wheel'
    ],
    NON_BUBBLEABLE_NATIVE_EVENTS = [
        'canplay', 'canplaythrough', 'complete', 'durationchange', 'emptied', 'ended', 'error',
        'load', 'loadeddata', 'loadedmetadata', 'loadstart', 'mouseenter', 'mouseleave',
        'pause', 'play', 'playing', 'progress', 'ratechange',
        'scroll', 'seeked', 'seeking', 'stalled', 'suspend', 'timeupdate', 'volumechange', 'waiting'
    ];

const listenersStorage = new SimpleMap(),
    eventsCfg = {};

function globalEventListener(e, type) {
    type || (type = e.type);

    const cfg = eventsCfg[type];

    let target = e.target,
        listenersCount = cfg.listenersCounter,
        listeners,
        listener,
        listenersToInvoke,
        domNodeId;

    while(listenersCount > 0 && target && target !== document) {
        if(domNodeId = getDomNodeId(target, true)) {
            listeners = listenersStorage.get(domNodeId);
            if(listeners && (listener = listeners[type])) {
                if(listenersToInvoke) {
                    listenersToInvoke.push(listener);
                }
                else {
                    listenersToInvoke = [listener];
                }
                --listenersCount;
            }
        }

        target = target.parentNode;
    }

    if(listenersToInvoke) {
        const event = createSyntheticEvent(type, e),
            len = listenersToInvoke.length;

        let i = 0;

        while(i < len) {
            listenersToInvoke[i++](event);
            if(event.isPropagationStopped()) {
                break;
            }
        }
    }
}

function eventListener(e) {
    listenersStorage.get(getDomNodeId(e.target))[e.type](createSyntheticEvent(e.type, e));
}

if(typeof document !== 'undefined') {
    const focusEvents = {
        focus : 'focusin',
        blur : 'focusout'
    };

    let i = 0,
        type;

    while(i < BUBBLEABLE_NATIVE_EVENTS.length) {
        type = BUBBLEABLE_NATIVE_EVENTS[i++];
        eventsCfg[type] = {
            type : type,
            bubbles : true,
            listenersCounter : 0,
            set : false,
            setup : focusEvents[type]?
                isEventSupported(focusEvents[type])?
                    function() {
                        const type = this.type;
                        document.addEventListener(
                            focusEvents[type],
                            e => { globalEventListener(e, type); });
                    } :
                    function() {
                        document.addEventListener(
                            this.type,
                            globalEventListener,
                            true);
                    } :
                null
        };
    }

    i = 0;
    while(i < NON_BUBBLEABLE_NATIVE_EVENTS.length) {
        eventsCfg[NON_BUBBLEABLE_NATIVE_EVENTS[i++]] = {
            type : type,
            bubbles : false,
            set : false
        };
    }
}

function addListener(domNode, type, listener) {
    const cfg = eventsCfg[type];
    if(cfg) {
        if(!cfg.set) {
            cfg.setup?
                cfg.setup() :
                cfg.bubbles && document.addEventListener(type, globalEventListener, false);
            cfg.set = true;
        }

        const domNodeId = getDomNodeId(domNode);
        let listeners = listenersStorage.get(domNodeId);

        if(!listeners) {
            listenersStorage.set(domNodeId, listeners = {});
        }

        if(!listeners[type]) {
            cfg.bubbles?
                ++cfg.listenersCounter :
                domNode.addEventListener(type, eventListener, false);
        }

        listeners[type] = listener;
    }
}

function removeListener(domNode, type) {
    const domNodeId = getDomNodeId(domNode, true);

    if(domNodeId) {
        const listeners = listenersStorage.get(domNodeId);

        if(listeners && listeners[type]) {
            listeners[type] = null;

            const cfg = eventsCfg[type];

            if(cfg) {
                cfg.bubbles?
                    --cfg.listenersCounter :
                    domNode.removeEventListener(type, eventListener);
            }
        }
    }
}

function removeListeners(domNode) {
    const domNodeId = getDomNodeId(domNode, true);

    if(domNodeId) {
        const listeners = listenersStorage.get(domNodeId);

        if(listeners) {
            listenersStorage.delete(domNodeId);
            for(let type in listeners) {
                removeListener(domNode, type);
            }
        }
    }
}

export {
    addListener,
    removeListener,
    removeListeners
}
