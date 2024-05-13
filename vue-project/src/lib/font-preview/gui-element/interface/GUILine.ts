import type BaseBufferElement from "../../base-buffer-element/interface/BaseBufferElement";
import type GUIMarkLine from "../gui-base-elements/GUIMarkLine";
import GUIOffPoint from "../gui-base-elements/GUIOffPoint";
import GUIOnPoint from "../gui-base-elements/GUIOnPoint";
import type GUIBaseElement from "./GUIBaseElement";

export default interface GUILine extends GUIBaseElement {
    discriminator: String
    previousGUIPoint: GUIOnPoint | GUIOffPoint | null
    nextGUIPoint: GUIOnPoint | GUIOffPoint | null
    previousMarkLine : GUIMarkLine | null
    nextMarkLine : GUIMarkLine | null
}