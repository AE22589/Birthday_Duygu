/* Quest I input/state primitives v1.6.5 */
(function(root, factory){
  if(typeof module === 'object' && module.exports) module.exports = factory();
  else root.DuyguGameLogic = factory();
})(typeof globalThis !== 'undefined' ? globalThis : window, function(){
  'use strict';
  const LANES = Object.freeze([25,50,75]);
  function clampLane(lane){ return Math.max(0, Math.min(LANES.length - 1, Number(lane))); }
  function moveLane(currentLane, direction){
    const dir = Number(direction);
    if(dir !== -1 && dir !== 1) return clampLane(currentLane);
    return clampLane(Number(currentLane) + dir);
  }
  function swipeDirection(startX, endX, threshold=28){
    const dx = Number(endX) - Number(startX);
    if(Math.abs(dx) <= threshold) return 0;
    return dx < 0 ? -1 : 1;
  }
  return Object.freeze({ LANES, clampLane, moveLane, swipeDirection });
});
