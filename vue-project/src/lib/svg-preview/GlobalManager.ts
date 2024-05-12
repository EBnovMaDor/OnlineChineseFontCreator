import BaseBuffer from "./core/BaseBuffer";
import FontCreatorEventHandler from "./core/FontCreatorEventHandler";
import GUI from "./core/GUI";
import ViewPort from "./core/ViewPort";

export default class GlobalManager {
    static _instance: GlobalManager | null = null;

    private _gui: GUI | null = null;
    private _viewPort: ViewPort | null = null;
    private _baseBuffer: BaseBuffer | null = null;
    private _eventHandler: FontCreatorEventHandler | null = null

    static get instance(): GlobalManager {
        if (GlobalManager._instance == null) {
            GlobalManager._instance = new GlobalManager()
        }
        return GlobalManager._instance
    }

    get gui(): GUI {
        return this._gui!
    }

    set gui(gui: GUI) {
        this._gui = gui
    }

    get viewPort(): ViewPort {
        return this._viewPort!
    }

    set viewPort(viewPort: ViewPort) {
        this._viewPort = viewPort
    }

    get baseBuffer(): BaseBuffer {
        return this._baseBuffer!
    }

    set baseBuffer(baseBuffer: BaseBuffer) {
        this._baseBuffer = baseBuffer
    }

    get eventHandler(): FontCreatorEventHandler {
        return this._eventHandler!
    }

    set eventHandler(eventHandler: FontCreatorEventHandler) {
        this._eventHandler = eventHandler
    }

}