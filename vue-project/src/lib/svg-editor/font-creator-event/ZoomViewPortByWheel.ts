import Renderer from "../core/Renderer";
import GlobalManager from "../GlobalManager";
import FontCreatorEvent from "./FontCreatorEvent";
import { FontCreatorEventType } from "./FontCreatorEventType";

export default class ZoomViewPortByWheelEvent extends FontCreatorEvent {
    /** Finger1 Last Event X,Y */
    private _centerX: number;
    private _centerY: number;
    private _delta: number;

    constructor(centerX: number, centerY: number, delta: number, event: Event) {
        super(FontCreatorEventType.ZoomViewPortByWheel, event);
        this._centerX = centerX;
        this._centerY = centerY;
        this._delta = delta;
    }

    handle(): void {
        let { viewPort, gui } = GlobalManager.instance

        let scale = 1 + this._delta / 1000;
        let { width } = GlobalManager.instance.viewPort.getViewPort();
        let newWidth = width * scale;

        const lastClientPoint = {
            clientX: this._centerX,
            clientY: this._centerY
        }

        const normalPoint = gui.clientCoordinateToNormalCoordinate(lastClientPoint.clientX, lastClientPoint.clientY)
        const bufferPoint = viewPort.normalCoordinateToBufferCoordinate(normalPoint.normalX, normalPoint.normalY)

        viewPort.setViewPortScale(newWidth)

        const currentClientPoint = {
            clientX: this._centerX,
            clientY: this._centerY
        }

        let newX = bufferPoint.bufferX - (currentClientPoint.clientX - gui.canvasDivX) * viewPort.width / gui.canvasWidth
        let newY = bufferPoint.bufferY - (currentClientPoint.clientY - gui.canvasDivY) * viewPort.height / gui.canvasHeight

        viewPort.setViewPortPos(newX, newY)

        Renderer.renderGrid()
    }

}