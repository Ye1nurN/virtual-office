// Cap the physical render size on Retina/4K screens without resizing the UI.
export function cityPixelRatio(width,height,deviceRatio=1){
  return Math.min(deviceRatio,1.25,Math.sqrt(1800000/Math.max(1,width*height)));
}
