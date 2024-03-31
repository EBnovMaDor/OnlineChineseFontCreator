import Konva from "konva";
import type BaseBufferElement from "./interface/BaseBufferElement";
import Point from "../util/Point";
import GlobalManager from "../GlobalManager";
import type BaseBufferElementConfig from "./interface/BaseBufferElementConfig";

export default class BaseBufferLine implements BaseBufferElement {
    private _konvaElement: Konva.Line;
    config: BaseBufferElementConfig;

    private _point1: Point = new Point();
    private _point2: Point = new Point();

    constructor(point1: Point, point2: Point,
        konvaGroup: Konva.Group = GlobalManager.instance.gui.pointGroup,
        config: BaseBufferElementConfig = { fill: '', stroke: 'black', strokeWidth: 2, opacity: 1, isVirtual: false }) {
        this._point1 = point1
        this._point2 = point2

        let { gui, viewPort } = GlobalManager.instance

        let { normalX: normalX1, normalY: normalY1 } = viewPort.bufferCoordinateToNormalCoordinate(this._point1.x, this._point1.y)
        let { normalX: normalX2, normalY: normalY2 } = viewPort.bufferCoordinateToNormalCoordinate(this._point2.x, this._point2.y)

        let konvaLine = new Konva.Line({
            points: [
                normalX1 * gui.canvasWidth,
                normalY1 * gui.canvasHeight,
                normalX2 * gui.canvasWidth,
                normalY2 * gui.canvasHeight
            ],
            opacity: config.opacity,
            stroke: config.stroke,
            strokeWidth: config.strokeWidth
        })

        konvaGroup.add(konvaLine)

        this._konvaElement = konvaLine
        this.config = config
    }

    move(movementX: number, movementY: number, isFinalMove: boolean = false): void {
        let { viewPort, gui } = GlobalManager.instance

        let { normalX: normalX1, normalY: normalY1 } = viewPort.bufferCoordinateToNormalCoordinate(this._point1.x, this._point1.y)
        let { normalX: normalX2, normalY: normalY2 } = viewPort.bufferCoordinateToNormalCoordinate(this._point2.x, this._point2.y)

        let { canvasX: oldCanvasX1, canvasY: oldCanvasY1 } = gui.normalCoordinateToCanvasCoordinate(normalX1, normalY1)
        let { canvasX: oldCanvasX2, canvasY: oldCanvasY2 } = gui.normalCoordinateToCanvasCoordinate(normalX2, normalY2)

        let newX1 = oldCanvasX1 + movementX
        let newY1 = oldCanvasY1 + movementY

        let newX2 = oldCanvasX2 + movementX
        let newY2 = oldCanvasY2 + movementY

        let { normalX: newNormalX1, normalY: newNormalY1 } = gui.canvasCoordinateToNormalCoordinate(newX1, newY1)
        let { bufferX: newBufferX1, bufferY: newBufferY1 } = viewPort.normalCoordinateToBufferCoordinate(newNormalX1, newNormalY1)

        if (isFinalMove) {
            newBufferX1 = Math.round(newBufferX1)
            newBufferY1 = Math.round(newBufferY1)
        }

        this.attributes.point1.x = newBufferX1
        this.attributes.point1.y = newBufferY1

        let { normalX: newNormalX2, normalY: newNormalY2 } = gui.canvasCoordinateToNormalCoordinate(newX2, newY2)
        let { bufferX: newBufferX2, bufferY: newBufferY2 } = viewPort.normalCoordinateToBufferCoordinate(newNormalX2, newNormalY2)

        if (isFinalMove) {
            newBufferX2 = Math.round(newBufferX2)
            newBufferY2 = Math.round(newBufferY2)
        }

        this.attributes.point2.x = newBufferX2
        this.attributes.point2.y = newBufferY2
    }

    draw(): void {
        let { gui, viewPort } = GlobalManager.instance

        let { normalX: normalX1, normalY: normalY1 } = viewPort.bufferCoordinateToNormalCoordinate(this._point1.x, this._point1.y)
        let { normalX: normalX2, normalY: normalY2 } = viewPort.bufferCoordinateToNormalCoordinate(this._point2.x, this._point2.y)

        this.konvaElement.points([
            normalX1 * gui.canvasWidth,
            normalY1 * gui.canvasHeight,
            normalX2 * gui.canvasWidth,
            normalY2 * gui.canvasHeight
        ])
        this.konvaElement.opacity(this.config.opacity!)
        this.konvaElement.stroke(this.config.stroke)
        this.konvaElement.strokeWidth(this.config.strokeWidth)
    }

    get attributes(): { point1: Point, point2: Point } {
        return {
            point1: this._point1,
            point2: this._point2
        }
    }

    set attributes(newAttributes: { point1?: Point, point2?: Point }) {
        if (newAttributes.point1) {
            this._point1 = newAttributes.point1;
        }
    
        if (newAttributes.point2) {
            this._point2 = newAttributes.point2;
        }
    }

    get konvaElement(): Konva.Line {
        return this._konvaElement
    }

    get boudingBox(): { minX: number, minY: number, maxX: number, maxY: number } {
        return {
            minX: Math.min(this._point1.x, this._point2.x),
            minY: Math.min(this._point1.y, this._point2.y),
            maxX: Math.max(this._point1.x, this._point2.x),
            maxY: Math.max(this._point1.y, this._point2.y)
        }
    }

}