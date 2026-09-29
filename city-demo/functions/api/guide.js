import {handleGuide} from '../../server/guideHandler.mjs';
export const onRequest=({request,env})=>handleGuide(request,env);
