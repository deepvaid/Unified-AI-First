// GLSL for the shared Da Vinci orb engine — single source for ALL surfaces
// (main landing, login, DaVinci Experience). Ported from src/lib/davinci-orb/
// shaders.ts (itself a port of the Marojarvis prototype). Fragment colors are
// uniforms (uInkA/uInkB/uHalo + uGlowA/B/C brand shimmer) so one shader serves
// both the static graphite pages and the theme-aware SPA.

export const MEMBRANE_VERTEX = `
    precision highp float;
    attribute float aAngle;
    attribute float aBaseRadius;
    attribute float aSeed;
    attribute float aBand;
    attribute float aBurst;
    attribute float aGain;
    attribute float aGap;
    attribute float aDepth;
    uniform float uTime;
    uniform vec2 uFieldOff;
    uniform float uAgit;
    uniform float uSpeakEnergy;
    uniform float uMicLevel;
    uniform float uAspect;
    uniform float uRadius;
    uniform float uDpr;
    uniform vec2 uPointer;
    uniform float uPointerStr;
    uniform float uShape;
    uniform float uAudio[16];
    uniform float uWave[48];
    uniform float uFlux[48];
    varying float vAlpha;
    varying float vInk;
    varying float vSeed;
    varying float vEdge;
    varying float vHueP;
    varying float vDepth;

    float hash(float n){ return fract(sin(n)*43758.5453123); }
    float noise(float x){
      float i=floor(x);
      float f=fract(x);
      f=f*f*(3.0-2.0*f);
      return mix(hash(i),hash(i+1.0),f);
    }
    float hash2(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453123); }
    float n2(vec2 p){
      vec2 i=floor(p), f=fract(p);
      f=f*f*(3.0-2.0*f);
      float a=hash2(i), b=hash2(i+vec2(1.0,0.0)), c=hash2(i+vec2(0.0,1.0)), d=hash2(i+vec2(1.0,1.0));
      return mix(mix(a,b,f.x),mix(c,d,f.x),f.y);
    }
    vec2 curl2(vec2 p){
      float e=0.12;
      float x1=n2(p+vec2(0.0,e)), x2=n2(p-vec2(0.0,e));
      float y1=n2(p+vec2(e,0.0)), y2=n2(p-vec2(e,0.0));
      return vec2(x1-x2, y2-y1)/(2.0*e); // (dN/dy, -dN/dx) — divergence-free flow
    }
    float audioAt(float x){
      float v=0.0;
      for(int i=0;i<16;i++){
        float center=(float(i)+0.5)/16.0;
        float d=abs(fract(x-center+0.5)-0.5)*16.0;
        v+=uAudio[i]*max(0.0,1.0-d);
      }
      return clamp(v,0.0,1.0);
    }
    float waveAt(float x){
      float v=0.0;
      for(int i=0;i<48;i++){
        float center=(float(i)+0.5)/48.0;
        float d=abs(fract(x-center+0.5)-0.5)*48.0;
        v+=uWave[i]*max(0.0,1.0-d);
      }
      return v;
    }
    float fluxAt(float x){
      float v=0.0;
      for(int i=0;i<48;i++){
        float center=(float(i)+0.5)/48.0;
        float d=abs(fract(x-center+0.5)-0.5)*48.0;
        v+=uFlux[i]*max(0.0,1.0-d);
      }
      return clamp(v,0.0,1.0);
    }

    void main(){
      float t=uTime;
      float angle=aAngle;
      float theta=angle/6.28318530718;
      float audio=audioAt(theta);
      float wave=waveAt(theta);
      float flux=fluxAt(theta);
      float outWave=max(0.0,wave);
      float absWave=abs(wave);
      float impact=max(flux,audio*0.9);
      float smoke=smoothstep(0.5,1.5,aBand);
      float hair=smoothstep(1.5,2.0,aBand);
      float dust=smoothstep(2.5,3.0,aBand);
      float solid=1.0-dust;            // ring particles (core/smoke/hair) vs wide dust

      // idle wave — living undulation so the ring breathes/ripples even at rest (stays round)
      float lobe=(sin(theta*6.2831853*3.0+t*0.30)+0.7*sin(theta*6.2831853*5.0-t*0.22)+0.45*sin(theta*6.2831853*7.0+t*0.15))*0.0095;

      float organic=(noise(theta*5.0+t*0.075+aSeed*0.010)-0.5)*0.0145;
      organic+=(noise(theta*13.0-t*0.115+aSeed*0.017)-0.5)*0.0085;
      // asymmetric physiological breathing — ~4.2s inhale, ~5.8s exhale (reads
      // as alive vs a metronomic sine); per-particle phase scatter kept tiny
      float bph=fract((t+aSeed*0.4)/10.0);
      float bcurve=bph<0.42 ? smoothstep(0.0,0.42,bph) : 1.0-smoothstep(0.42,1.0,bph);
      float breath=(bcurve-0.5)*0.011;
      float membrane=wave*(0.150+smoke*0.210+hair*0.290)*aGain;
      float flutter=sin(t*(5.0+uAgit*7.0)+aSeed*0.13+angle*2.0)*0.0045*flux;

      float smokeLift=(noise(theta*23.0+t*0.18+aSeed*0.023)-0.34)*(0.013+uAgit*0.022+flux*0.044);
      float hairLift=aBurst*(0.022+0.250*outWave+0.140*flux);
      float dustDrift=(noise(aSeed*0.7+t*0.06)-0.5)*0.05;   // tiny living drift across the field
      float defGate=smoothstep(0.61,0.76,aBaseRadius);   // 0 at the inner edge → inside stays a perfect circle; deformation grows outward
      float radius=aBaseRadius+(organic+breath+membrane+flutter+lobe)*solid*defGate+audio*0.012*aGain;
      radius+=smoke*smokeLift*solid*defGate;
      radius+=hair*hairLift*solid;
      radius+=dust*dustDrift;

      // idle traveling swell — a soft cursor-like wave that orbits the rim and wraps around (connects)
      float wp=fract(t*0.055);
      float ad=abs(fract(theta-wp+0.5)-0.5);
      float swell=exp(-ad*ad/(2.0*0.045*0.045))*0.020;
      radius+=swell*solid*defGate;

      // double the outer field beyond the inner edge — inner circle radius unchanged.
      // uShape (landing): wavy, inconsistent-thickness outer edge; else plain ×2.
      float thick=0.75+0.55*noise(theta*3.0+t*0.04)+0.30*sin(theta*6.2831853*5.0+t*0.07);
      float dbl=1.0+smoke*mix(1.0, thick, uShape);
      if(radius>0.60) radius=0.60+(radius-0.60)*dbl;

      float tangent=(noise(aSeed+t*0.16)-0.5)*(0.004+smoke*0.014+flux*0.026);
      tangent+=wave*0.030*(noise(theta*17.0+aSeed*0.02)-0.5)*solid;
      tangent+=dust*(noise(aSeed*1.3+t*0.05)-0.5)*0.06;
      // coherent tangential FLOW — slow smoke-like streaming around the ring.
      // Band-dependent speed (hair streams fastest, core barely moves) driven by
      // an evolving noise field so streams form, drift and dissolve naturally.
      float flowField=n2(vec2(theta*4.0+t*0.030, aDepth*2.2+t*0.022))-0.5;
      tangent+=flowField*(0.002+smoke*0.009+hair*0.020+dust*0.012);
      float rot=uTime*0.05;            // slow overall rotation of the field
      vec2 radial=vec2(cos(angle+rot),sin(angle+rot));
      vec2 tang=vec2(-radial.y,radial.x);
      vec2 pos=radial*radius+tang*tangent;

      // subtle curl-noise tendrils OUTSIDE the rim — ring stays a clean circle; only outer wisps curl
      float outer=smoothstep(0.64,1.05,aBaseRadius);
      vec2 cflow=curl2(pos*2.6+vec2(t*0.085,-t*0.07));
      pos+=cflow*(outer*0.04);
      float curveAmt=outer*clamp(length(cflow)*0.45,0.0,1.0);

      // soft magnetic cursor — gentle pull + faint swirl (uPointer is inverse-corrected in JS so this is pre-aspect)
      vec2 toP=uPointer-pos;
      float pd=length(toP);
      float pull=uPointerStr*exp(-pd*pd/(2.0*0.30*0.30));
      pos+=toP*pull*0.05;
      pos+=vec2(-toP.y,toP.x)*pull*0.02;

      // depth parallax — layers shift opposite ways with the cursor (near moves
      // with it, far against), plus the micro-saccade whole-field drift; both
      // depth-weighted so the flat ring reads as a volume.
      float dpar=aDepth-0.5;
      pos+=uPointer*uPointerStr*dpar*0.022;
      pos+=uFieldOff*(0.6+aDepth*0.8);

      if(uAspect>1.0){ pos.x/=uAspect; } else { pos.y*=uAspect; }
      gl_Position=vec4(pos,0.0,1.0);
      float size=mix(1.00,2.05,smoke)*uDpr;
      size*=1.0+flux*0.5+hair*(outWave+flux)*0.7;
      size*=1.0-dust*0.55;             // dust = tiny points
      size*=1.0-curveAmt*0.5;          // finer where caught in the curl / curved flow
      size*=mix(0.85,1.30,aDepth);     // depth-of-field: near particles render larger
      gl_PointSize=max(1.5, size);     // floor keeps the smallest sprites antialiased (no sub-pixel twinkle)
      vDepth=aDepth;

      // uneven edge darkness — broad darker/lighter sectors + finer grain, slowly drifting
      float angBroad=noise(theta*3.0+t*0.035);
      float angFine=noise(theta*11.0+aGap*0.010+t*0.06);
      float uneven=angBroad*0.6+angFine*0.4;

      float ringAlpha=mix(0.155,0.075,smoke);
      ringAlpha=mix(ringAlpha,0.110,hair);
      ringAlpha=mix(ringAlpha,0.055,dust);
      ringAlpha+=(1.0-smoke)*0.075*uShape;   // darker inner ring (landing)
      vAlpha=ringAlpha*(0.66+aGain*0.48)*(1.0+flux*1.05+absWave*0.92+hair*aBurst*0.42);
      vAlpha*=mix(1.0, 0.28+1.25*uneven, mix(0.92,0.7,dust));
      float pDark=hash(aSeed*0.013);
      vInk=clamp(0.34+flux*0.26+outWave*0.16+hair*0.18+audio*0.18+pDark*0.34+(1.0-smoke)*0.20*uShape,0.0,1.0);
      vSeed=aSeed;

      // faint spectral shimmer on the edges — travels around the rim and over time (alive at idle)
      float edge=smoke*0.6+hair*1.0+dust*0.5;
      vEdge=edge;
      vHueP=theta*2.5+t*0.05+wave*1.4;
      float lightWave=sin(theta*12.0-t*0.55+wave*6.0)*0.5+0.5;
      vAlpha*=1.0+edge*(lightWave-0.5)*0.34+edge*flux*0.26;
    }`

export const MEMBRANE_FRAGMENT = `
    precision highp float;
    uniform float uTime;
    uniform float uOpacity;
    uniform float uInkGain;
    uniform vec3 uInkA;
    uniform vec3 uInkB;
    uniform vec3 uGlowA;
    uniform vec3 uGlowB;
    uniform vec3 uGlowC;
    varying float vAlpha;
    varying float vInk;
    varying float vSeed;
    varying float vEdge;
    varying float vHueP;
    varying float vDepth;
    float hash(float n){ return fract(sin(n)*43758.5453123); }
    // brand 3-stop shimmer (ping-pong so the cycle wraps without a seam)
    vec3 brandGrad(float h){
      float x=abs(fract(h)*2.0-1.0);
      vec3 c=mix(uGlowA,uGlowB,smoothstep(0.0,0.55,x));
      return mix(c,uGlowC,smoothstep(0.55,1.0,x));
    }
    void main(){
      vec2 p=gl_PointCoord-0.5;
      float d=length(p);
      // bokeh: mid-depth particles are crisp, off-plane ones soften + fade a touch
      float blur=abs(vDepth-0.5)*2.0;
      float disc=1.0-smoothstep(mix(0.08,0.02,blur),0.50,d);
      disc*=0.78+0.22*(1.0-smoothstep(0.0,0.32,d));
      disc*=1.0-blur*0.18;
      float grain=0.92+0.08*hash(vSeed);
      vec3 ink=mix(uInkA,uInkB,vInk);
      float hueAmt=vEdge*0.18;
      vec3 col=mix(ink,ink*0.65+brandGrad(vHueP)*0.45,hueAmt);
      gl_FragColor=vec4(col,vAlpha*disc*grain*uOpacity*uInkGain);
    }`

export const AMBIENT_VERTEX = `
    precision highp float;
    attribute vec2 aPos; attribute float aDepth; attribute float aSeed;
    uniform float uTime; uniform float uAspect; uniform float uDpr;
    uniform vec2 uPointer; uniform float uPointerStr; uniform vec2 uFieldOff;
    varying float vA;
    void main(){
      float t=uTime; float depth=aDepth; vec2 pos=aPos;
      // gentle drift + depth-driven parallax (nearer = moves more) → 3D feel
      pos += vec2(sin(t*0.06+aSeed*0.7), cos(t*0.05+aSeed*0.9)) * (0.008 + depth*0.030);
      float rr = length(aPos);
      float radial = clamp(rr/3.33, 0.0, 1.0);
      float rot = t*(0.050 - radial*0.038 + depth*0.006);   // near edge keeps pace with the ring; outward lags (subtle), tiny depth variation
      float c=cos(rot), s=sin(rot);
      pos = mat2(c,-s,s,c) * pos;
      // cursor parallax + saccade drift — the dust field leans toward the
      // pointer, near layers more than far → the whole scene gains depth
      pos += uPointer*uPointerStr*(depth-0.5)*0.030;
      pos += uFieldOff*(0.5+depth*0.9);
      if(uAspect>1.0){ pos.x/=uAspect; } else { pos.y*=uAspect; }
      gl_Position=vec4(pos,0.0,1.0);
      gl_PointSize = max(1.5, mix(1.2, 2.4, depth) * uDpr);   // static size + floor → steady halo points, no twinkle
      vA = mix(0.026, 0.085, depth) * (0.82 + 0.18*smoothstep(3.33, 0.3, length(aPos))); // fills to the edges (nearly even, a hair denser near the orb)
    }`

export const AMBIENT_FRAGMENT = `
    precision highp float;
    uniform float uOpacity;
    uniform float uInkGain;
    uniform vec3 uHalo;
    varying float vA;
    void main(){
      float d=length(gl_PointCoord-0.5);
      float disc=1.0-smoothstep(0.1,0.5,d);
      gl_FragColor=vec4(uHalo, vA*disc*uOpacity*0.5*uInkGain);
    }`
