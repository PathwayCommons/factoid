import * as defs from '../defs';
import anime from 'animejs';

const animateDomForEdit = domEle => anime({
  targets: domEle,
  backgroundColor: [defs.editAnimationWhite, defs.editAnimationColor, defs.editAnimationWhite],
  duration: defs.editAnimationDuration,
  easing: defs.editAnimationEasing
});

export { animateDomForEdit };
