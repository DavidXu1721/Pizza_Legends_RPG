import {useEffect} from 'react';

function useScript(src, flags= [], type='', integrity, crossOrigin="anonymous") {
  useEffect(() => {
    const script = document.createElement("script");
    script.src = src;

    script.async= flags.includes('async');  
    script.defer= flags.includes('defer'); 
    script.type= type;

    if (integrity){
      script.integrity = integrity;
    }

    script.crossOrigin = crossOrigin;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, [src, integrity, crossOrigin])
}

export default useScript;