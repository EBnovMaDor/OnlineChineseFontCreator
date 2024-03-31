import Konva from "konva";
import type BaseBufferElement from "./interface/BaseBufferElement";
import Point from "../util/Point";
import type BaseBufferElementConfig from "./interface/BaseBufferElementConfig";
import GlobalManager from "../GlobalManager";
import { Bezier } from "bezier-js";


export default class BaseBufferCubicCurve implements BaseBufferElement {
    private _konvaElement: Konva.Path;
    config: BaseBufferElementConfig;

    private _point1: Point = new Point();
    private _point2: Point = new Point();
    private _controlPoint1: Point = new Point();
    private _controlPoint2: Point = new Point();

    constructor(point1: Point, point2: Point, controlPoint1: Point, controlPoint2: Point,
        konvaGroup: Konva.Group = GlobalManager.instance.gui.pointGroup,
        config: BaseBufferElementConfig = { fill: '', stroke: 'black', strokeWidth: 2, opacity: 1, isVirtual: false }) {
        this._point1 = point1
        this._point2 = point2
        this._controlPoint1 = controlPoint1
        this._controlPoint2 = controlPoint2

        let { gui, viewPort } = GlobalManager.instance
        let { normalX: normalX1, normalY: normalY1 } = viewPort.bufferCoordinateToNormalCoordinate(this._point1.x, this._point1.y)
        let { normalX: normalX2, normalY: normalY2 } = viewPort.bufferCoordinateToNormalCoordinate(this._point2.x, this._point2.y)
        let { normalX: controlNormalX1, normalY: controlNormalY1 } = viewPort.bufferCoordinateToNormalCoordinate(this._controlPoint1.x, this._controlPoint1.y)
        let { normalX: controlNormalX2, normalY: controlNormalY2 } = viewPort.bufferCoordinateToNormalCoordinate(this._controlPoint2.x, this._controlPoint2.y)
        let data = `M${normalX1 * gui.canvasWidth},${normalY1 * gui.canvasHeight} C${controlNormalX1 * gui.canvasWidth},${controlNormalY1 * gui.canvasHeight} ${controlNormalX2 * gui.canvasWidth},${controlNormalY2 * gui.canvasHeight} ${normalX2 * gui.canvasWidth},${normalY2 * gui.canvasHeight}`

        let konvaLine = new Konva.Path({
            data: data,
            opacity: config.opacity,
            stroke: config.stroke,  // 设置颜色
            strokeWidth: config.strokeWidth  // 设置宽度
        })

        konvaGroup.add(konvaLine)

        this._konvaElement = konvaLine
        this.config = config
    }

    move(movementX: number, movementY: number, isFinalMove: boolean = false): void {
        let { viewPort, gui } = GlobalManager.instance

        let { normalX: normalX1, normalY: normalY1 } = viewPort.bufferCoordinateToNormalCoordinate(this._point1.x, this._point1.y)
        let { normalX: normalX2, normalY: normalY2 } = viewPort.bufferCoordinateToNormalCoordinate(this._point2.x, this._point2.y)
        let { normalX: controlNormalX1, normalY: controlNormalY1 } = viewPort.bufferCoordinateToNormalCoordinate(this._controlPoint1.x, this._controlPoint1.y)
        let { normalX: controlNormalX2, normalY: controlNormalY2 } = viewPort.bufferCoordinateToNormalCoordinate(this._controlPoint2.x, this._controlPoint2.y)

        let { canvasX: oldCanvasX1, canvasY: oldCanvasY1 } = gui.normalCoordinateToCanvasCoordinate(normalX1, normalY1)
        let { canvasX: oldCanvasX2, canvasY: oldCanvasY2 } = gui.normalCoordinateToCanvasCoordinate(normalX2, normalY2)
        let { canvasX: oldControlCanvasX1, canvasY: oldControlCanvasY1 } = gui.normalCoordinateToCanvasCoordinate(controlNormalX1, controlNormalY1)
        let { canvasX: oldControlCanvasX2, canvasY: oldControlCanvasY2 } = gui.normalCoordinateToCanvasCoordinate(controlNormalX2, controlNormalY2)

        let newX1 = oldCanvasX1 + movementX
        let newY1 = oldCanvasY1 + movementY

        let newX2 = oldCanvasX2 + movementX
        let newY2 = oldCanvasY2 + movementY

        let newControlX1 = oldControlCanvasX1 + movementX
        let newControlY1 = oldControlCanvasY1 + movementY

        let newControlX2 = oldControlCanvasX2 + movementX
        let newControlY2 = oldControlCanvasY2 + movementY

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

        let { normalX: newNormalControlX1, normalY: newNormalControlY1 } = gui.canvasCoordinateToNormalCoordinate(newControlX1, newControlY1)
        let { bufferX: newBufferControlX1, bufferY: newBufferControlY1 } = viewPort.normalCoordinateToBufferCoordinate(newNormalControlX1, newNormalControlY1)

        if (isFinalMove) {
            newBufferControlX1 = Math.round(newBufferControlX1)
            newBufferControlY1 = Math.round(newBufferControlY1)
        }

        this.attributes.controlPoint1.x = newBufferControlX1
        this.attributes.controlPoint1.y = newBufferControlY1

        let { normalX: newNormalControlX2, normalY: newNormalControlY2 } = gui.canvasCoordinateToNormalCoordinate(newControlX2, newControlY2)
        let { bufferX: newBufferControlX2, bufferY: newBufferControlY2 } = viewPort.normalCoordinateToBufferCoordinate(newNormalControlX2, newNormalControlY2)

        if (isFinalMove) {
            newBufferControlX2 = Math.round(newBufferControlX2)
            newBufferControlY2 = Math.round(newBufferControlY2)
        }

        this.attributes.controlPoint2.x = newBufferControlX2
        this.attributes.controlPoint2.y = newBufferControlY2
    }

    draw(): void {
        let { gui, viewPort } = GlobalManager.instance
        let { normalX: normalX1, normalY: normalY1 } = viewPort.bufferCoordinateToNormalCoordinate(this._point1.x, this._point1.y)
        let { normalX: normalX2, normalY: normalY2 } = viewPort.bufferCoordinateToNormalCoordinate(this._point2.x, this._point2.y)
        let { normalX: controlNormalX1, normalY: controlNormalY1 } = viewPort.bufferCoordinateToNormalCoordinate(this._controlPoint1.x, this._controlPoint1.y)
        let { normalX: controlNormalX2, normalY: controlNormalY2 } = viewPort.bufferCoordinateToNormalCoordinate(this._controlPoint2.x, this._controlPoint2.y)
        let data = `M${normalX1 * gui.canvasWidth},${normalY1 * gui.canvasHeight} C${controlNormalX1 * gui.canvasWidth},${controlNormalY1 * gui.canvasHeight} ${controlNormalX2 * gui.canvasWidth},${controlNormalY2 * gui.canvasHeight} ${normalX2 * gui.canvasWidth},${normalY2 * gui.canvasHeight}`
        this.konvaElement.data(data)
        this.konvaElement.fill(this.config.fill!)
        this.konvaElement.opacity(this.config.opacity!)
        this.konvaElement.strokeWidth(this.config.strokeWidth)
    }

    get attributes(): { point1: Point, point2: Point, controlPoint1: Point, controlPoint2: Point } {
        return {
            point1: this._point1,
            point2: this._point2,
            controlPoint1: this._controlPoint1,
            controlPoint2: this._controlPoint2
        }
    }

    set attributes(newAttributes: { point1?: Point, point2?: Point,controlPoint1?: Point,controlPoint2?: Point }) {
        if (newAttributes.point1) {
            this._point1 = newAttributes.point1;
        }
    
        if (newAttributes.point2) {
            this._point2 = newAttributes.point2;
        }

        if (newAttributes.controlPoint1) {
            this._controlPoint1 = newAttributes.controlPoint1;
        }

        if (newAttributes.controlPoint2) {
            this._controlPoint2 = newAttributes.controlPoint2;
        }
    }

    get konvaElement(): Konva.Path {
        return this._konvaElement;
    }

    get boudingBox(): { minX: number, minY: number, maxX: number, maxY: number } {
        const b = new Bezier(this._point1.x, this._point1.y,
            this._controlPoint1.x, this._controlPoint1.y,
            this._controlPoint2.x, this._controlPoint2.y,
            this._point2.x, this._point2.y)
        const bbox = b.bbox()
        return {
            minX: bbox.x.min,
            minY: bbox.y.min,
            maxX: bbox.x.max,
            maxY: bbox.y.max
        }
    }

}