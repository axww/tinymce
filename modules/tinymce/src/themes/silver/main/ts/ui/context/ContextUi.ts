import {
  AddEventsBehaviour, AlloyComponent, AlloyEvents, AlloySpec, AlloyTriggers, Behaviour, CustomEvent, GuiFactory, InlineView, Keying, NativeEvents,
  SketchSpec
} from '@ephox/alloy';
import { Arr, Cell, Id, Optional, Result } from '@ephox/katamari';
import { Class, Compare, Css, EventArgs, Focus, SugarElement, SugarShadowDom, Width } from '@ephox/sugar';

import * as ContextToolbarFocus from './ContextToolbarFocus';

const forwardSlideEvent = Id.generate('forward-slide');
export interface ForwardSlideEvent extends CustomEvent {
  readonly forwardContents: AlloySpec;
}

const backSlideEvent = Id.generate('backward-slide');
export interface BackwardSlideEvent extends CustomEvent { }

const changeSlideEvent = Id.generate('change-slide-event');
export interface ChangeSlideEvent extends CustomEvent {
  readonly contents: AlloySpec;
  readonly focus: Optional<SugarElement>;
}

const resizingClass = 'tox-pop--resizing';

interface ContextToolbarSpec {
  readonly onEscape: () => Optional<boolean>;
  readonly sink: AlloyComponent;
  readonly onHide: () => void;
  readonly onBack: () => void;
  readonly focusElement: (el: SugarElement<HTMLElement>) => void;
}

export interface ContextToolbarRenderResult {
  readonly sketch: SketchSpec;
  readonly inSubtoolbar: () => boolean;
}

const renderContextToolbar = (spec: ContextToolbarSpec): ContextToolbarRenderResult => {
  const stack = Cell<Array<{ bar: AlloyComponent; focus: Optional<SugarElement<HTMLElement>> }>>([ ]);

  const sketch = InlineView.sketch({
    dom: {
      tag: 'div',
      classes: [ 'tox-pop' ]
    },
    fireDismissalEventInstead: {
      event: 'doNotDismissYet'
    },

    onShow: (comp) => {
      stack.set([ ]);
      InlineView.getContent(comp).each((c) => {
        Css.remove(c.element, 'visibility');
      });
      Class.remove(comp.element, resizingClass);
      Css.remove(comp.element, 'width');
    },

    onHide: () => {
      stack.set([ ]);
      spec.onHide();
    },

    inlineBehaviours: Behaviour.derive([
      AddEventsBehaviour.config('context-toolbar-events', [
        AlloyEvents.runOnSource<EventArgs<TransitionEvent>>(NativeEvents.transitionend(), (comp, se) => {
          if (se.event.raw.propertyName === 'width') {
            Class.remove(comp.element, resizingClass);
            Css.remove(comp.element, 'width');
          }
        }),

        AlloyEvents.run<ChangeSlideEvent>(changeSlideEvent, (comp, se) => {
          const elem = comp.element;
          // If it was partially through a slide, clear that and measure afresh
          Css.remove(elem, 'width');

          const currentWidth = Width.get(elem);
          const hadFocus = Focus.search(comp.element).isSome();

          // Remove these so that we can property measure the width of the context form content
          Css.remove(elem, 'left');
          Css.remove(elem, 'right');
          Css.remove(elem, 'max-width');

          InlineView.setContent(comp, se.event.contents);
          Class.add(elem, resizingClass);

          const newWidth = Width.get(elem);

          // Reposition without transition to avoid it from being animated from previous position
          Css.set(elem, 'transition', 'none');
          InlineView.reposition(comp);
          Css.remove(elem, 'transition');

          Css.set(elem, 'width', currentWidth + 'px');

          se.event.focus.fold(
            () => {
              if (hadFocus) {
                ContextToolbarFocus.focusIn(comp);
              }
            },
            (f) => {
              Focus.active(SugarShadowDom.getRootNode(comp.element)).fold(
                () => Focus.focus(f),
                (active) => {
                  // We need this extra check since if the focus is aleady on the iframe we don't want to call focus on it again since that closes the context toolbar
                  if (!Compare.eq(active, f)) {
                    spec.focusElement(f);
                  }
                }
              );
            }
          );

          setTimeout(() => {
            Css.set(comp.element, 'width', newWidth + 'px');
          }, 0);
        }),

        AlloyEvents.run<ForwardSlideEvent>(forwardSlideEvent, (comp, se) => {
          InlineView.getContent(comp).each((oldContents) => {
            stack.set(stack.get().concat([
              {
                bar: oldContents,
                focus: Focus.active(SugarShadowDom.getRootNode(comp.element))
              }
            ]));
          });
          AlloyTriggers.emitWith(comp, changeSlideEvent, {
            contents: se.event.forwardContents,
            focus: Optional.none()
          });
        }),

        AlloyEvents.run<BackwardSlideEvent>(backSlideEvent, (comp, _se) => {
          spec.onBack();

          Arr.last(stack.get()).each((last) => {
            stack.set(stack.get().slice(0, stack.get().length - 1));
            AlloyTriggers.emitWith(comp, changeSlideEvent, {
              // Because we are using premade, we should have access to the same element
              // to give focus (although it isn't working)
              contents: GuiFactory.premade(last.bar),
              focus: last.focus
            });
          });
        })
      ]),
      Keying.config({
        mode: 'special',
        onEscape: (comp) => Arr.last(stack.get()).fold(
          () =>
            // Escape just focuses the content. It no longer closes the toolbar.
            spec.onEscape(),
          (_) => {
            AlloyTriggers.emit(comp, backSlideEvent);
            return Optional.some(true);
          }
        )
      })
    ]),
    lazySink: () => Result.value(spec.sink)
  });

  return {
    sketch,
    inSubtoolbar: () => stack.get().length > 0
  };
};

export {
  renderContextToolbar,
  forwardSlideEvent,
  backSlideEvent
};
