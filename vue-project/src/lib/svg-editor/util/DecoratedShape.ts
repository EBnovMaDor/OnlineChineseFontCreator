import Konva from "konva"
import type GUIBaseElement from "../gui-element/interface/GUIBaseElement"

export type DecoratedShape = (Konva.Shape | Konva.Stage) & { guiElement: GUIBaseElement }

// Directly decorate the shape, and returns itself as a DecoratedShape of Circle etc.
export function decorateShape(shape: Konva.Shape | Konva.Stage, element: GUIBaseElement) {
    (shape as any).guiElement = element
    return shape as (typeof shape) & { guiElement: GUIBaseElement }
}

// type guard of DecoratedShape
export function isDecoratedShape(shape: Konva.Shape | Konva.Stage): shape is DecoratedShape {
    return (shape as any).guiElement !== undefined
}



