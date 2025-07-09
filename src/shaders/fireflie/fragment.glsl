void main() {

    float distanceFromCenter = distance(gl_PointCoord, vec2(0.5));

    float strength = 0.1 / distanceFromCenter - 0.1 * 2.0;

    csm_FragColor = vec4(1.0, 1.0, 1.0, strength);
}