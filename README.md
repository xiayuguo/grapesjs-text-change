# grapesjs-text-change

Reliable text input listener for GrapesJS canvas iframe.

## ✨ Features

- IME safe (Chinese / Japanese input)
- Throttled input events
- Auto rebind when iframe reloads
- HMR safe
- TypeScript support

## 📦 Install

```bash
npm install grapesjs-text-change
```


## 🚀 Usage

```ts
import TextChangePlugin from 'grapesjs-text-change';

editor.use(TextChangePlugin, {
  throttle: 200,
});

editor.on('text:input', e => {
  console.log(e.text);
});

editor.on('text:commit', e => {
  console.log(e.text);
});
```

## 📄 Events
| Event       | Description               |
| ----------- | ------------------------- |
| text:input  | Throttled real-time input |
| text:commit | Triggered on blur         |


## 📝 License
MIT