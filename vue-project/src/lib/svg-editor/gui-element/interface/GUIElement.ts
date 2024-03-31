import type BaseBufferElement from "../../base-buffer-element/interface/BaseBufferElement";

export default interface GUIElement {
    guiElementId: number
    baseBufferElement: BaseBufferElement
    isVisible: boolean
}