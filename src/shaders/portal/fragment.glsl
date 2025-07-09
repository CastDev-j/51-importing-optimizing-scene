uniform float uTime;
uniform vec3 uColorStart;
uniform vec3 uColorEnd;

varying vec2 vUv;


#include ../includes/perlin.glsl

void main() {

    // Displacement
    vec2 displacement = vUv + cnoise(vec3(vUv * 5.0, uTime * 0.1));

    float strengh = cnoise(vec3(displacement * 5.0, uTime * 0.2));

    // Outer glow 
    float outerGlow = distance(vUv, vec2(0.5)) * 5.0 - 1.6;

    strengh += outerGlow;

    strengh += step(-0.2, strengh) * 0.8;

    // strengh = clamp(strengh, 0.0, 1.0); // this result dont convince me

    vec3 color = mix(uColorStart, uColorEnd, strengh);

    gl_FragColor = vec4(color, 1.0);

    #include <colorspace_fragment>
}