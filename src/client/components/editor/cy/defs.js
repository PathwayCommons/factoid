import * as clientDefs from '../../../defs';

export const padding = 50;
export const minZoom = 0.5;
export const maxZoom = 3;
export const layoutAnimationDuration = clientDefs.updateDelay * 2/3;
export const layoutAnimationEasing = 'ease-in-out-quint'; // spring(500, 35)
export const positionDebounceTime = clientDefs.updateDelay;
export const docPositionDebounceTime = 0;
export const positionAnimationDuration = clientDefs.updateDelay / 2;
export const positionAnimationEasing = 'ease-in-out-quint'; // spring(500, 35)
export const addRmAnimationDuration = clientDefs.updateDelay / 3;
export const addRmAnimationEasing = 'linear';
export const editAnimationDuration = clientDefs.editAnimationDuration;
export const editAnimationEasing = 'linear';
export const editAnimationColor = 'rgb(255, 255, 0)';
export const editAnimationOpacity = 0.5;
