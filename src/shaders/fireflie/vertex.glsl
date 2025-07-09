uniform float uTime;

attribute float aScale;

void main() {
    vec3 position = vec3(0.0);

    position.y += sin(uTime * aScale + position.x * 0.5) * 0.2;

    position.x += cos(uTime * aScale + position.y * 0.5) * 0.2;
    position.z += sin(uTime * aScale + position.x * 0.5) * 0.2;

    csm_Position += position;

    csm_PointSize *= 0.5 + abs(sin(uTime * aScale * 1.5)) * 2.0;
}