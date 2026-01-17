import grapesjs from 'grapesjs';
import BlocksBasicPlugin from 'grapesjs-blocks-basic';
import TextChangePlugin from '../src/index';

const editor = grapesjs.init({
  container: '#editor',
  height: '100vh',
  width: '100%',
  plugins: [TextChangePlugin, BlocksBasicPlugin],
});

console.log('Editor initialized');


editor.on('text:input', e => {
  console.log(e.text);
});

editor.on('text:commit', e => {
  console.log(e.text);
});