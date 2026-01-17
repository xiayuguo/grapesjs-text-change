export interface TextChangeOptions {
  throttle?: number;
  debug?: boolean;
}

export interface TextChangePayload {
  component: any;
  text: string;
  el: HTMLElement;
}

export type TextChangeInputPayload = TextChangePayload & { event: InputEvent };
export type TextChangeCommitPayload = TextChangePayload & { event: FocusEvent };

export default function TextChangePlugin(editor: any, opts: TextChangeOptions = {}) {
  const options: Required<TextChangeOptions> = {
    throttle: 150,
    debug: false,
    ...opts,
  };

  const canvas = editor.Canvas;

  let boundDoc: Document | null = null;
  let composing = false;
  let lastEmit = 0;
  let destroyed = false;

  const log = (...args: unknown[]) => {
    if (options.debug) {
      console.log('[TextChangePlugin]', ...args);
    }
  };

  /**
   * Check if it's an editable target
   */
  function isEditableTarget(el: unknown): el is HTMLElement {
    return el instanceof HTMLElement && el.isContentEditable;
  }

  /**
   * Get the active component
   */
  function getActiveComponent(targetEl: HTMLElement) {
    const selected = editor.getSelected();
    if (selected) return selected;

    try {
      const view = canvas.getViewByEl(targetEl);
      return view?.model || null;
    } catch (e) {
      return null;
    }
  }

  /**
   * Emit throttled event
   */
  function emitThrottled(event: string, payload: TextChangeInputPayload | TextChangeCommitPayload) {
    const now = Date.now();
    if (now - lastEmit >= options.throttle) {
      lastEmit = now;
      editor.trigger(event, payload);
    }
  }

  /**
   * Handle input
   */
  function handleInput(e: InputEvent, force = false) {
    if (destroyed) return;

    const target = e.target as HTMLElement;
    if (!isEditableTarget(target)) return;

    const component = getActiveComponent(target);
    if (!component) return;

    const text = target.innerText;

    const payload: TextChangeInputPayload = {
      component,
      text,
      el: target,
      event: e,
    };

    if (force) {
      editor.trigger('text:input', payload);
    } else {
      emitThrottled('text:input', payload);
    }
  }

  /**
   * Handle commit
   */
  function handleCommit(e: FocusEvent) {
    if (destroyed) return;

    const target = e.target as HTMLElement;
    if (!isEditableTarget(target)) return;

    const component = getActiveComponent(target);
    if (!component) return;

    const text = target.innerText;

    editor.trigger('text:commit', {
      component,
      text,
      el: target,
      event: e,
    });
  }

  /**
   * Bind iframe document
   */
  function bindFrame(doc: Document) {
    if (!doc || destroyed) return;
    if (boundDoc === doc) {
      log('frame already bound');
      return;
    }

    unbindFrame();

    boundDoc = doc;
    log('bind frame');

    doc.addEventListener('compositionstart', onCompositionStart);
    doc.addEventListener('compositionend', onCompositionEnd);
    doc.addEventListener('input', onInput as EventListener);
    doc.addEventListener('blur', onBlur, true);
  }

  /**
   * Unbind
   */
  function unbindFrame() {
    if (!boundDoc) return;

    log('unbind frame');

    boundDoc.removeEventListener('compositionstart', onCompositionStart);
    boundDoc.removeEventListener('compositionend', onCompositionEnd);
    boundDoc.removeEventListener('input', onInput as EventListener);
    boundDoc.removeEventListener('blur', onBlur, true);

    boundDoc = null;
  }

  // --- event handlers ---

  function onCompositionStart() {
    composing = true;
  }

  function onCompositionEnd(e: CompositionEvent) {
    composing = false;
    handleInput(e as unknown as InputEvent, true);
  }

  function onInput(e: InputEvent) {
    if (composing) return;
    handleInput(e, false);
  }

  function onBlur(e: FocusEvent) {
    handleCommit(e);
  }

  /**
   * Monitor iframe lifecycle
   */
  function bindCanvasEvents() {
    editor.on('load', () => {
      const frameEl = canvas.getFrameEl();
      console.log('canvas frame load', frameEl);
      const doc = frameEl?.contentDocument;
      if (!doc) return;

      log('canvas frame load');
      bindFrame(doc);
    });

    editor.on('destroy', () => {
      destroyed = true;
      unbindFrame();
      log('destroy');
    });
  }

  bindCanvasEvents();
}
