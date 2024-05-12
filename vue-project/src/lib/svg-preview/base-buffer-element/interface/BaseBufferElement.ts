
import Konva from "konva";
import type BaseBufferElementConfig from "./BaseBufferElementConfig";

export default interface BaseBufferElement {
    konvaElement: Konva.Shape;
    config: BaseBufferElementConfig;
    attributes: { [key: string]: any };
    boudingBox: {
        minX: number;
        minY: number;
        maxX: number;
        maxY: number;
    }
    draw(): void;
    move(movementX: number, movementY: number, isFinalMove: boolean): void;
}
