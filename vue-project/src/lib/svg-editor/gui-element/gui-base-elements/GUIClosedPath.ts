import type BaseBufferElement from "../../base-buffer-element/interface/BaseBufferElement";
import type GUIBaseElement from "../interface/GUIBaseElement";
import type GUIElement from "../interface/GUIElement";

export default class GUIClosedPath implements GUIElement {
    private _guiElementId: number = 0;
    private _baseBufferElement: BaseBufferElement;
    private _isVisible: boolean;

    constructor(baseBufferElement: BaseBufferElement) {
        this._baseBufferElement = baseBufferElement;
        this._isVisible = true;
    }

    get baseBufferElement() {
        return this._baseBufferElement;
    }

    get guiElementId() {
        return this._guiElementId;
    }

    set guiElementId(id: number) {
        this._guiElementId = id;
    }

    get isVisible() {
        return this._isVisible;
    }

    set isVisible(isVisible: boolean) {
        this._isVisible = isVisible;
    }

}