export interface InputState {
  moveForward: boolean;
  moveBackward: boolean;
  moveLeft: boolean;
  moveRight: boolean;
  isSprinting: boolean;
  isCrouching: boolean;
  jumpPressed: boolean;
  isFiring: boolean;
  isAiming: boolean;
  reloadPressed: boolean;
  interactPressed: boolean;
  weapon1Pressed: boolean;
  weapon2Pressed: boolean;
  inspectPressed: boolean;
  pausePressed: boolean;
  mouseDeltaX: number;
  mouseDeltaY: number;
  isPointerLocked: boolean;
}

export class InputManager {
  private domElement: HTMLElement;
  private sensitivity = 0.0022;
  private invertY = false;

  public state: InputState = {
    moveForward: false,
    moveBackward: false,
    moveLeft: false,
    moveRight: false,
    isSprinting: false,
    isCrouching: false,
    jumpPressed: false,
    isFiring: false,
    isAiming: false,
    reloadPressed: false,
    interactPressed: false,
    weapon1Pressed: false,
    weapon2Pressed: false,
    inspectPressed: false,
    pausePressed: false,
    mouseDeltaX: 0,
    mouseDeltaY: 0,
    isPointerLocked: false
  };

  private boundOnKeyDown: (e: KeyboardEvent) => void;
  private boundOnKeyUp: (e: KeyboardEvent) => void;
  private boundOnMouseDown: (e: MouseEvent) => void;
  private boundOnMouseUp: (e: MouseEvent) => void;
  private boundOnMouseMove: (e: MouseEvent) => void;
  private boundOnContextMenu: (e: MouseEvent) => void;
  private boundOnPointerLockChange: () => void;
  private boundOnPointerLockError: () => void;

  public onPointerLockChangeCallback?: (locked: boolean) => void;
  public onPauseRequested?: () => void;

  constructor(domElement: HTMLElement) {
    this.domElement = domElement;

    this.boundOnKeyDown = this.onKeyDown.bind(this);
    this.boundOnKeyUp = this.onKeyUp.bind(this);
    this.boundOnMouseDown = this.onMouseDown.bind(this);
    this.boundOnMouseUp = this.onMouseUp.bind(this);
    this.boundOnMouseMove = this.onMouseMove.bind(this);
    this.boundOnContextMenu = (e) => e.preventDefault();
    this.boundOnPointerLockChange = this.onPointerLockChange.bind(this);
    this.boundOnPointerLockError = () => console.warn('Pointer lock error');

    this.setupListeners();
  }

  public setSensitivity(val: number): void {
    this.sensitivity = Math.max(0.0005, Math.min(0.02, val));
  }

  public setInvertY(invert: boolean): void {
    this.invertY = invert;
  }

  private setupListeners(): void {
    window.addEventListener('keydown', this.boundOnKeyDown);
    window.addEventListener('keyup', this.boundOnKeyUp);
    window.addEventListener('mousedown', this.boundOnMouseDown);
    window.addEventListener('mouseup', this.boundOnMouseUp);
    window.addEventListener('mousemove', this.boundOnMouseMove);
    window.addEventListener('contextmenu', this.boundOnContextMenu);
    document.addEventListener('pointerlockchange', this.boundOnPointerLockChange);
    document.addEventListener('pointerlockerror', this.boundOnPointerLockError);
  }

  public requestPointerLock(): void {
    try {
      this.domElement.requestPointerLock();
    } catch (e) {
      console.warn('Pointer lock request failed:', e);
    }
  }

  public exitPointerLock(): void {
    if (document.pointerLockElement) {
      document.exitPointerLock();
    }
  }

  private onPointerLockChange(): void {
    const isLocked = document.pointerLockElement === this.domElement;
    this.state.isPointerLocked = isLocked;
    if (this.onPointerLockChangeCallback) {
      this.onPointerLockChangeCallback(isLocked);
    }
  }

  private onKeyDown(e: KeyboardEvent): void {
    // If not locked and pressing Escape or tab, let browser behave
    if (e.code === 'Escape') {
      if (this.onPauseRequested) {
        this.onPauseRequested();
      }
      return;
    }

    if (!this.state.isPointerLocked) return;

    switch (e.code) {
      case 'KeyW':
      case 'ArrowUp':
        this.state.moveForward = true;
        break;
      case 'KeyS':
      case 'ArrowDown':
        this.state.moveBackward = true;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        this.state.moveLeft = true;
        break;
      case 'KeyD':
      case 'ArrowRight':
        this.state.moveRight = true;
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        this.state.isSprinting = true;
        break;
      case 'ControlLeft':
      case 'ControlRight':
      case 'KeyC':
        this.state.isCrouching = true;
        break;
      case 'Space':
        this.state.jumpPressed = true;
        break;
      case 'KeyR':
        this.state.reloadPressed = true;
        break;
      case 'KeyE':
        this.state.interactPressed = true;
        break;
      case 'Digit1':
        this.state.weapon1Pressed = true;
        break;
      case 'Digit2':
        this.state.weapon2Pressed = true;
        break;
      case 'KeyX':
        this.state.inspectPressed = true;
        break;
    }
  }

  private onKeyUp(e: KeyboardEvent): void {
    switch (e.code) {
      case 'KeyW':
      case 'ArrowUp':
        this.state.moveForward = false;
        break;
      case 'KeyS':
      case 'ArrowDown':
        this.state.moveBackward = false;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        this.state.moveLeft = false;
        break;
      case 'KeyD':
      case 'ArrowRight':
        this.state.moveRight = false;
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        this.state.isSprinting = false;
        break;
      case 'ControlLeft':
      case 'ControlRight':
      case 'KeyC':
        this.state.isCrouching = false;
        break;
      case 'Space':
        this.state.jumpPressed = false;
        break;
      case 'KeyR':
        this.state.reloadPressed = false;
        break;
      case 'KeyE':
        this.state.interactPressed = false;
        break;
      case 'Digit1':
        this.state.weapon1Pressed = false;
        break;
      case 'Digit2':
        this.state.weapon2Pressed = false;
        break;
      case 'KeyX':
        this.state.inspectPressed = false;
        break;
    }
  }

  private onMouseDown(e: MouseEvent): void {
    if (!this.state.isPointerLocked) return;

    if (e.button === 0) {
      this.state.isFiring = true;
    } else if (e.button === 2) {
      this.state.isAiming = true;
    }
  }

  private onMouseUp(e: MouseEvent): void {
    if (e.button === 0) {
      this.state.isFiring = false;
    } else if (e.button === 2) {
      this.state.isAiming = false;
    }
  }

  private onMouseMove(e: MouseEvent): void {
    if (!this.state.isPointerLocked) return;

    this.state.mouseDeltaX += e.movementX * this.sensitivity;
    this.state.mouseDeltaY += (this.invertY ? -e.movementY : e.movementY) * this.sensitivity;
  }

  /**
   * Consume mouse movement deltas so they don't accumulate across frames
   */
  public consumeMouseDeltas(): { x: number; y: number } {
    const dx = this.state.mouseDeltaX;
    const dy = this.state.mouseDeltaY;
    this.state.mouseDeltaX = 0;
    this.state.mouseDeltaY = 0;
    return { x: dx, y: dy };
  }

  public resetInputState(): void {
    this.state.moveForward = false;
    this.state.moveBackward = false;
    this.state.moveLeft = false;
    this.state.moveRight = false;
    this.state.isSprinting = false;
    this.state.isCrouching = false;
    this.state.jumpPressed = false;
    this.state.isFiring = false;
    this.state.isAiming = false;
    this.state.reloadPressed = false;
    this.state.interactPressed = false;
    this.state.weapon1Pressed = false;
    this.state.weapon2Pressed = false;
    this.state.inspectPressed = false;
    this.state.mouseDeltaX = 0;
    this.state.mouseDeltaY = 0;
  }

  public dispose(): void {
    this.exitPointerLock();
    window.removeEventListener('keydown', this.boundOnKeyDown);
    window.removeEventListener('keyup', this.boundOnKeyUp);
    window.removeEventListener('mousedown', this.boundOnMouseDown);
    window.removeEventListener('mouseup', this.boundOnMouseUp);
    window.removeEventListener('mousemove', this.boundOnMouseMove);
    window.removeEventListener('contextmenu', this.boundOnContextMenu);
    document.removeEventListener('pointerlockchange', this.boundOnPointerLockChange);
    document.removeEventListener('pointerlockerror', this.boundOnPointerLockError);
  }
}
