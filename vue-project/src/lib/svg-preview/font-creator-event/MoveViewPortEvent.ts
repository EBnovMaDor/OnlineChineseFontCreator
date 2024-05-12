import Renderer from "../core/Renderer";
import GlobalManager from "../GlobalManager";
import FontCreatorEvent from "./FontCreatorEvent";
import { FontCreatorEventType } from "./FontCreatorEventType";

export default class MoveViewPortEvent extends FontCreatorEvent {
    private _movementX: number;
    private _movementY: number;

    constructor(x: number, y: number, event: Event) {
        super(FontCreatorEventType.MoveViewPort, event)
        this._movementX = x;
        this._movementY = y;
    }

    handle() {
        let { viewPort, gui } = GlobalManager.instance
        /** handle event start */
        let movementX = this._movementX
        let movementY = this._movementY

        let originViewPort = viewPort.getViewPort()
        let x = originViewPort.x
        let y = originViewPort.y

        let newX = x - viewPort.normalWidthToBufferWidth(movementX / gui.canvasWidth)
        let newY = y - viewPort.normalHeightToBufferHeight(movementY / gui.canvasHeight)

        viewPort.setViewPortPos(newX, newY)

        Renderer.renderGrid()
    }

}