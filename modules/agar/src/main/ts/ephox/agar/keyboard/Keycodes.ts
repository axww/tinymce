import { Arr, Optional } from '@ephox/katamari';

const keys = [
  { keyCode: 8, code: 'Backspace', key: 'Backspace' },
  { keyCode: 9, code: 'Tab', key: 'Tab' },
  { keyCode: 13, code: 'Enter', key: 'Enter' },
  { keyCode: 16, code: 'ShiftLeft', key: 'Shift', shiftKey: true },
  { keyCode: 16, code: 'ShiftRight', key: 'Shift', shiftKey: true },
  { keyCode: 17, code: 'ControlLeft', key: 'Control' },
  { keyCode: 17, code: 'ControlRight', key: 'Control' },
  { keyCode: 18, code: 'AltLeft', key: 'Alt' },
  { keyCode: 18, code: 'AltRight', key: 'Alt' },
  { keyCode: 20, code: 'CapsLock', key: 'CapsLock' },
  { keyCode: 27, code: 'Escape', key: 'Escape' },
  { keyCode: 32, code: 'Space', key: ' ', data: ' ' },
  { keyCode: 33, code: 'PageUp', key: 'PageUp' },
  { keyCode: 34, code: 'PageDown', key: 'PageDown' },
  { keyCode: 35, code: 'End', key: 'End' },
  { keyCode: 36, code: 'Home', key: 'Home' },
  { keyCode: 37, code: 'ArrowLeft', key: 'ArrowLeft' },
  { keyCode: 38, code: 'ArrowUp', key: 'ArrowUp' },
  { keyCode: 39, code: 'ArrowRight', key: 'ArrowRight' },
  { keyCode: 40, code: 'ArrowDown', key: 'ArrowDown' },
  { keyCode: 44, code: 'PrintScreen', key: 'PrintScreen' },
  { keyCode: 45, code: 'Insert', key: 'Insert' },
  { keyCode: 46, code: 'Delete', key: 'Delete' },
  { keyCode: 48, code: 'Digit0', key: '0', data: '0' },
  { keyCode: 48, code: 'Digit0', key: ')', data: ')', shiftKey: true },
  { keyCode: 49, code: 'Digit1', key: '1', data: '1' },
  { keyCode: 49, code: 'Digit1', key: '!', data: '!', shiftKey: true },
  { keyCode: 50, code: 'Digit2', key: '2', data: '2' },
  { keyCode: 50, code: 'Digit2', key: '@', data: '@', shiftKey: true },
  { keyCode: 51, code: 'Digit3', key: '3', data: '3' },
  { keyCode: 51, code: 'Digit3', key: '#', data: '#', shiftKey: true },
  { keyCode: 52, code: 'Digit4', key: '4', data: '4' },
  { keyCode: 52, code: 'Digit4', key: '$', data: '$', shiftKey: true },
  { keyCode: 53, code: 'Digit5', key: '5', data: '5' },
  { keyCode: 53, code: 'Digit5', key: '%', data: '%', shiftKey: true },
  { keyCode: 54, code: 'Digit6', key: '6', data: '6' },
  { keyCode: 54, code: 'Digit6', key: '^', data: '^', shiftKey: true },
  { keyCode: 55, code: 'Digit7', key: '7', data: '7' },
  { keyCode: 55, code: 'Digit7', key: '&', data: '&', shiftKey: true },
  { keyCode: 56, code: 'Digit8', key: '8', data: '8' },
  { keyCode: 56, code: 'Digit8', key: '*', data: '*', shiftKey: true },
  { keyCode: 57, code: 'Digit9', key: '9', data: '9' },
  { keyCode: 57, code: 'Digit9', key: '(', data: '(', shiftKey: true },
  { keyCode: 65, code: 'KeyA', key: 'a', data: 'a' },
  { keyCode: 65, code: 'KeyA', key: 'A', data: 'A', shiftKey: true },
  { keyCode: 66, code: 'KeyB', key: 'b', data: 'b' },
  { keyCode: 66, code: 'KeyB', key: 'B', data: 'B', shiftKey: true },
  { keyCode: 67, code: 'KeyC', key: 'c', data: 'c' },
  { keyCode: 67, code: 'KeyC', key: 'C', data: 'C', shiftKey: true },
  { keyCode: 68, code: 'KeyD', key: 'd', data: 'd' },
  { keyCode: 68, code: 'KeyD', key: 'D', data: 'D', shiftKey: true },
  { keyCode: 69, code: 'KeyE', key: 'e', data: 'e' },
  { keyCode: 69, code: 'KeyE', key: 'E', data: 'E', shiftKey: true },
  { keyCode: 70, code: 'KeyF', key: 'f', data: 'f' },
  { keyCode: 70, code: 'KeyF', key: 'F', data: 'F', shiftKey: true },
  { keyCode: 71, code: 'KeyG', key: 'g', data: 'g' },
  { keyCode: 71, code: 'KeyG', key: 'G', data: 'G', shiftKey: true },
  { keyCode: 72, code: 'KeyH', key: 'h', data: 'h' },
  { keyCode: 72, code: 'KeyH', key: 'H', data: 'H', shiftKey: true },
  { keyCode: 73, code: 'KeyI', key: 'i', data: 'i' },
  { keyCode: 73, code: 'KeyI', key: 'I', data: 'I', shiftKey: true },
  { keyCode: 74, code: 'KeyJ', key: 'j', data: 'j' },
  { keyCode: 74, code: 'KeyJ', key: 'J', data: 'J', shiftKey: true },
  { keyCode: 75, code: 'KeyK', key: 'k', data: 'k' },
  { keyCode: 75, code: 'KeyK', key: 'K', data: 'K', shiftKey: true },
  { keyCode: 76, code: 'KeyL', key: 'l', data: 'l' },
  { keyCode: 76, code: 'KeyL', key: 'L', data: 'L', shiftKey: true },
  { keyCode: 77, code: 'KeyM', key: 'm', data: 'm' },
  { keyCode: 77, code: 'KeyM', key: 'M', data: 'M', shiftKey: true },
  { keyCode: 78, code: 'KeyN', key: 'n', data: 'n' },
  { keyCode: 78, code: 'KeyN', key: 'N', data: 'N', shiftKey: true },
  { keyCode: 79, code: 'KeyO', key: 'o', data: 'o' },
  { keyCode: 79, code: 'KeyO', key: 'O', data: 'O', shiftKey: true },
  { keyCode: 80, code: 'KeyP', key: 'p', data: 'p' },
  { keyCode: 80, code: 'KeyP', key: 'P', data: 'P', shiftKey: true },
  { keyCode: 81, code: 'KeyQ', key: 'q', data: 'q' },
  { keyCode: 81, code: 'KeyQ', key: 'Q', data: 'Q', shiftKey: true },
  { keyCode: 82, code: 'KeyR', key: 'r', data: 'r' },
  { keyCode: 82, code: 'KeyR', key: 'R', data: 'R', shiftKey: true },
  { keyCode: 83, code: 'KeyS', key: 's', data: 's' },
  { keyCode: 83, code: 'KeyS', key: 'S', data: 'S', shiftKey: true },
  { keyCode: 84, code: 'KeyT', key: 't', data: 't' },
  { keyCode: 84, code: 'KeyT', key: 'T', data: 'T', shiftKey: true },
  { keyCode: 85, code: 'KeyU', key: 'u', data: 'u' },
  { keyCode: 85, code: 'KeyU', key: 'U', data: 'U', shiftKey: true },
  { keyCode: 86, code: 'KeyV', key: 'v', data: 'v' },
  { keyCode: 86, code: 'KeyV', key: 'V', data: 'V', shiftKey: true },
  { keyCode: 87, code: 'KeyW', key: 'w', data: 'w' },
  { keyCode: 87, code: 'KeyW', key: 'W', data: 'W', shiftKey: true },
  { keyCode: 88, code: 'KeyX', key: 'x', data: 'x' },
  { keyCode: 88, code: 'KeyX', key: 'X', data: 'X', shiftKey: true },
  { keyCode: 89, code: 'KeyY', key: 'y', data: 'y' },
  { keyCode: 89, code: 'KeyY', key: 'Y', data: 'Y', shiftKey: true },
  { keyCode: 90, code: 'KeyZ', key: 'z', data: 'z' },
  { keyCode: 90, code: 'KeyZ', key: 'Z', data: 'Z', shiftKey: true },
  { keyCode: 91, code: 'MetaLeft', key: 'Meta' },
  { keyCode: 92, code: 'MetaRight', key: 'Meta' },
  { keyCode: 93, code: 'ContextMenu', key: 'ContextMenu' },
  { keyCode: 96, code: 'Numpad0', key: '0', data: '0' },
  { keyCode: 97, code: 'Numpad1', key: '1', data: '1' },
  { keyCode: 98, code: 'Numpad2', key: '2', data: '2' },
  { keyCode: 99, code: 'Numpad3', key: '3', data: '3' },
  { keyCode: 100, code: 'Numpad4', key: '4', data: '4' },
  { keyCode: 101, code: 'Numpad5', key: '5', data: '5' },
  { keyCode: 102, code: 'Numpad6', key: '6', data: '6' },
  { keyCode: 103, code: 'Numpad7', key: '7', data: '7' },
  { keyCode: 104, code: 'Numpad8', key: '8', data: '8' },
  { keyCode: 105, code: 'Numpad9', key: '9', data: '9' },
  { keyCode: 106, code: 'NumpadMultiply', key: '*', data: '*' },
  { keyCode: 107, code: 'NumpadAdd', key: '+', data: '+' },
  { keyCode: 109, code: 'NumpadSubtract', key: '-', data: '-' },
  { keyCode: 110, code: 'NumpadDecimal', key: '.', data: '.' },
  { keyCode: 111, code: 'NumpadDivide', key: '/', data: '/' },
  { keyCode: 112, code: 'F1', key: 'F1' },
  { keyCode: 113, code: 'F2', key: 'F2' },
  { keyCode: 114, code: 'F3', key: 'F3' },
  { keyCode: 115, code: 'F4', key: 'F4' },
  { keyCode: 116, code: 'F5', key: 'F5' },
  { keyCode: 117, code: 'F6', key: 'F6' },
  { keyCode: 118, code: 'F7', key: 'F7' },
  { keyCode: 119, code: 'F8', key: 'F8' },
  { keyCode: 120, code: 'F9', key: 'F9' },
  { keyCode: 121, code: 'F10', key: 'F10' },
  { keyCode: 122, code: 'F11', key: 'F11' },
  { keyCode: 123, code: 'F12', key: 'F12' },
  { keyCode: 144, code: 'NumLock', key: 'NumLock' },
  { keyCode: 145, code: 'ScrollLock', key: 'ScrollLock' },
  { keyCode: 186, code: 'Semicolon', key: ';', data: ';' },
  { keyCode: 187, code: 'Equal', key: '=', data: '=' },
  { keyCode: 188, code: 'Comma', key: ',', data: ',' },
  { keyCode: 189, code: 'Minus', key: '-', data: '-' },
  { keyCode: 189, code: 'Minus', key: '_', data: '_', shiftKey: true },
  { keyCode: 190, code: 'Period', key: '.', data: '.' },
  { keyCode: 190, code: 'Period', key: '>', data: '>', shiftKey: true },
  { keyCode: 191, code: 'Slash', key: '/', data: '/' },
  { keyCode: 191, code: 'Slash', key: '?', data: '?', shiftKey: true },
  { keyCode: 192, code: 'Backquote', key: '`', data: '`' },
  { keyCode: 192, code: 'Backquote', key: '~', data: '~', shiftKey: true },
  { keyCode: 219, code: 'BracketLeft', key: '[', data: '[' },
  { keyCode: 219, code: 'BracketLeft', key: '{', data: '{', shiftKey: true },
  { keyCode: 220, code: 'Backslash', key: '\\', data: '\\' },
  { keyCode: 220, code: 'Backslash', key: '|', data: '|', shiftKey: true },
  { keyCode: 221, code: 'BracketRight', key: ']', data: ']' },
  { keyCode: 221, code: 'BracketRight', key: '}', data: '}', shiftKey: true },
  { keyCode: 222, code: 'Quote', key: '\'', data: '\'' },
  { keyCode: 222, code: 'Quote', key: '"', data: '"', shiftKey: true }
];

export const getKeyEventFromData = (view: typeof globalThis, event: 'keypress' | 'keydown' | 'keyup', data: string): Optional<KeyboardEvent> =>
  Arr.find(keys, (key) => key.data === data).map((key) => {
    if (event === 'keypress') {
      const charCode = data.charCodeAt(0);

      return new view.KeyboardEvent(event, {
        key: key.key,
        code: key.code,
        keyCode: charCode,
        which: charCode,
        charCode,
        shiftKey: key.shiftKey === true,
        cancelable: true,
        bubbles: true
      });
    } else {
      return new view.KeyboardEvent(event, {
        key: key.key,
        code: key.code,
        keyCode: key.keyCode,
        which: key.keyCode,
        shiftKey: key.shiftKey === true,
        cancelable: true,
        bubbles: true
      });
    }
  });
