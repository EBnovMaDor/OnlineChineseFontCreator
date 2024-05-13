import Renderer from "../core/Renderer";
import GlobalManager from "../GlobalManager";
import FontCreatorEvent from "./FontCreatorEvent";
import { FontCreatorEventType } from "./FontCreatorEventType";

export default class ZoomViewPortEvent extends FontCreatorEvent {
    /** Finger1 Last Event X,Y */
    private _finger1LastX: number;
    private _finger1LastY: number;

    /** Finger1 Current Event X,Y */
    private _finger1CurrentX: number;
    private _finger1CurrentY: number;

    /** Finger2 Last Event X,Y */
    private _finger2LastX: number;
    private _finger2LastY: number;

    /** Finger2 Current Event X,Y */
    private _finger2CurrentX: number;
    private _finger2CurrentY: number;

    constructor(finger1LastX: number, finger1LastY: number,
        finger1CurrentX: number, finger1CurrentY: number,
        finger2LastX: number, finger2LastY: number,
        finger2CurrentX: number, finger2CurrentY: number, event: Event) {
        super(FontCreatorEventType.ZoomViewPort, event);
        this._finger1LastX = finger1LastX;
        this._finger1LastY = finger1LastY;
        this._finger1CurrentX = finger1CurrentX;
        this._finger1CurrentY = finger1CurrentY;
        this._finger2LastX = finger2LastX;
        this._finger2LastY = finger2LastY;
        this._finger2CurrentX = finger2CurrentX;
        this._finger2CurrentY = finger2CurrentY;
    }

    handle() {
        let { viewPort, gui } = GlobalManager.instance
        // 通过两个手指之间的距离比例来判断放缩尺寸
        let lastDistance = Math.sqrt(
            Math.pow(this._finger1LastX - this._finger2LastX, 2)
            + Math.pow(this._finger1LastY - this._finger2LastY, 2)
        )
        let currentDistance = Math.sqrt(
            Math.pow(this._finger1CurrentX - this._finger2CurrentX, 2)
            + Math.pow(this._finger1CurrentY - this._finger2CurrentY, 2)
        )

        let scale = lastDistance / currentDistance  // >1 放大， <1 缩小

        let newWidth = viewPort.width * scale

        /** baseBuffer use to Limit */
        viewPort.setViewPortScale(newWidth)

        const lastClientPoint = {
            clientX: (this._finger1LastX + this._finger2LastX) / 2,
            clientY: (this._finger1LastY + this._finger2LastY) / 2
        }

        const normalPoint = gui.clientCoordinateToNormalCoordinate(lastClientPoint.clientX, lastClientPoint.clientY)
        const bufferPoint = viewPort.normalCoordinateToBufferCoordinate(normalPoint.normalX, normalPoint.normalY)

        const currentClientPoint = {
            clientX: (this._finger1CurrentX + this._finger2CurrentX) / 2,
            clientY: (this._finger1CurrentY + this._finger2CurrentY) / 2
        }

        let newX = bufferPoint.bufferX - (currentClientPoint.clientX - gui.canvasDivX) * viewPort.width / gui.canvasWidth
        let newY = bufferPoint.bufferY - (currentClientPoint.clientY - gui.canvasDivY) * viewPort.height / gui.canvasHeight

        viewPort.setViewPortPos(newX, newY)

        Renderer.renderGrid()
    }
}