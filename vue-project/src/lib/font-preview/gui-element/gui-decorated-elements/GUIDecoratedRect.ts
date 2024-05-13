import GlobalManager from "../../GlobalManager";
import BaseBufferRect from "../../base-buffer-element/BaseBufferRect";
import type BaseBufferElement from "../../base-buffer-element/interface/BaseBufferElement";
import type GUIDecorate from "../interface/GUIDecoratedElement";

export default class GUIDecoratedRect implements GUIDecorate {
    private _guiElementId: number = 0;
    private _isVisible: boolean = true;
    private _baseBufferElement: BaseBufferRect;

    constructor(baseBufferElement: BaseBufferRect) {
        this._baseBufferElement = baseBufferElement;

        let { gui } = GlobalManager.instance
        gui.addGUIDecoratedElement(this)
    }


    get baseBufferElement() {
        return this._baseBufferElement
    }

    get guiElementId() {
        return this._guiElementId
    }

    set guiElementId(id: number) {
        this._guiElementId = id
    }

    get isVisible() {
        return this._isVisible
    }

}