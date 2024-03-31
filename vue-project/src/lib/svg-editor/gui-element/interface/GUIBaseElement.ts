import type BaseBufferElement from "../../base-buffer-element/interface/BaseBufferElement";
import type Observer from "../../util/ObserverMode/Observer";
import type Subject from "../../util/ObserverMode/Subject";
import type GUIElement from "./GUIElement";

export default interface GUIBaseElement extends GUIElement, Subject, Observer {
    isSelected: boolean
    virtualBufferElement: BaseBufferElement | null
}