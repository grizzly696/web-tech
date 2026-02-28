import { Viewport } from '@deck.gl/core';

interface OrbitViewportState {
  distance: number;
  rotationX: number;
  rotationZ: number;
  zoom: number;
  target: [number, number, number];
}

export class OrbitViewport extends Viewport {
  state: OrbitViewportState;

  constructor(props: any = {}) {
    const {
      distance = 100,
      rotationX = 0,
      rotationZ = 0,
      zoom = 1,
      target = [0, 0, 0],
      ...rest
    } = props;

    super({
      ...rest,
      viewMatrix: new Float32Array(16),
      projectionMatrix: new Float32Array(16),
    });

    this.state = {
      distance,
      rotationX,
      rotationZ,
      zoom,
      target: target as [number, number, number],
    };

    this._updateMatrices();
  }

  private _updateMatrices() {
    const { distance, rotationX, rotationZ, zoom, target } = this.state;

    // Calculate camera position based on spherical coordinates
    const phi = rotationX;
    const theta = rotationZ;

    const cameraX = target[0] + distance * Math.sin(phi) * Math.cos(theta);
    const cameraY = target[1] + distance * Math.sin(phi) * Math.sin(theta);
    const cameraZ = target[2] + distance * Math.cos(phi);

    // Simple perspective matrix
    const aspect = this.width / this.height;
    const fov = Math.PI / 4;
    const f = 1 / Math.tan(fov / 2);

    // Projection matrix
    const near = 0.1;
    const far = 10000;
    const projMatrix = new Float32Array(16);
    projMatrix[0] = f / aspect;
    projMatrix[5] = f;
    projMatrix[10] = (far + near) / (near - far);
    projMatrix[11] = -1;
    projMatrix[14] = (2 * far * near) / (near - far);
    this.projectionMatrix = projMatrix;

    // Simple view matrix (looking at target from camera position)
    const viewMatrix = new Float32Array(16);
    const forward = [
      target[0] - cameraX,
      target[1] - cameraY,
      target[2] - cameraZ,
    ];
    const len = Math.sqrt(forward[0] ** 2 + forward[1] ** 2 + forward[2] ** 2);
    forward[0] /= len;
    forward[1] /= len;
    forward[2] /= len;

    const right = [0, 0, 1]; // up vector
    const cross = [
      forward[1] * right[2] - forward[2] * right[1],
      forward[2] * right[0] - forward[0] * right[2],
      forward[0] * right[1] - forward[1] * right[0],
    ];
    const len2 = Math.sqrt(cross[0] ** 2 + cross[1] ** 2 + cross[2] ** 2);
    cross[0] /= len2;
    cross[1] /= len2;
    cross[2] /= len2;

    const up = [
      cross[1] * forward[2] - cross[2] * forward[1],
      cross[2] * forward[0] - cross[0] * forward[2],
      cross[0] * forward[1] - cross[1] * forward[0],
    ];

    viewMatrix[0] = cross[0];
    viewMatrix[1] = up[0];
    viewMatrix[2] = -forward[0];
    viewMatrix[4] = cross[1];
    viewMatrix[5] = up[1];
    viewMatrix[6] = -forward[1];
    viewMatrix[8] = cross[2];
    viewMatrix[9] = up[2];
    viewMatrix[10] = -forward[2];
    viewMatrix[12] = -(cross[0] * cameraX + cross[1] * cameraY + cross[2] * cameraZ);
    viewMatrix[13] = -(up[0] * cameraX + up[1] * cameraY + up[2] * cameraZ);
    viewMatrix[14] = forward[0] * cameraX + forward[1] * cameraY + forward[2] * cameraZ;
    viewMatrix[15] = 1;

    this.viewMatrix = viewMatrix;
  }

  rotateX(angle: number) {
    this.state.rotationX += angle;
    this._updateMatrices();
  }

  rotateZ(angle: number) {
    this.state.rotationZ += angle;
    this._updateMatrices();
  }

  panX(amount: number) {
    this.state.target[0] += amount;
    this._updateMatrices();
  }

  panY(amount: number) {
    this.state.target[1] += amount;
    this._updateMatrices();
  }

  zoomBy(factor: number) {
    this.state.distance *= factor;
    this.state.distance = Math.max(10, Math.min(500, this.state.distance));
    this._updateMatrices();
  }
}
