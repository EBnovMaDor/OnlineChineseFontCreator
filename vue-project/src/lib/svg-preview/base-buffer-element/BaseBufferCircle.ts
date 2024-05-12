import Konva from "konva";
import type BaseBufferElement from "./interface/BaseBufferElement";
import Point from "../util/Point";
import type BaseBufferElementConfig from "./interface/BaseBufferElementConfig";
import GlobalManager from "../GlobalManager";
import { decorateShape } from "../util/DecoratedShape";

export default class BaseBufferCircle implements BaseBufferElement {
    private _konvaElement: Konva.Circle;
    config: BaseBufferElementConfig;

    private _center: Point = new Point();
    private _radius: number = 0

    constructor(center: Point, radius: number = 1,
        konvaGroup: Konva.Group = GlobalManager.instance.gui.pointGroup,
        config: BaseBufferElementConfig = { fill: 'white', stroke: 'black', strokeWidth: 2, opacity: 1, isVirtual: false }) {
        this._center = center
        this._radius = radius

        let { gui, viewPort } = GlobalManager.instance
        let { normalX, normalY } = viewPort.bufferCoordinateToNormalCoordinate(center.x, center.y)

        let konvaCircle = new Konva.Circle({
            x: normalX * gui.canvasWidth,
            y: normalY * gui.canvasHeight,
            radius: radius,
            opacity: config.opacity,
            fill: config.fill,
            stroke: config.stroke,
            strokeWidth: config.strokeWidth,
        })

        konvaGroup.add(konvaCircle)

        this._konvaElement = konvaCircle;
        this.config = config
    }

    move(movementX: number, movementY: number, isFinalMove: boolean = false): void {
        let { viewPort, gui } = GlobalManager.instance

        let { normalX: oldNormalX, normalY: oldNormalY } = viewPort.bufferCoordinateToNormalCoordinate(this.attributes.center.x, this.attributes.center.y)
        let { canvasX: oldCanvasX, canvasY: oldCanvasY } = gui.normalCoordinateToCanvasCoordinate(oldNormalX, oldNormalY)

        let newX = oldCanvasX + movementX
        let newY = oldCanvasY + movementY

        let { normalX, normalY } = gui.canvasCoordinateToNormalCoordinate(newX, newY)
        let { bufferX, bufferY } = viewPort.normalCoordinateToBufferCoordinate(normalX, normalY)

        if (isFinalMove) {
            bufferX = Math.round(bufferX)
            bufferY = Math.round(bufferY)
        }

        this.attributes.center.x = bufferX
        this.attributes.center.y = bufferY
    }


    public draw() {
        let { gui, viewPort } = GlobalManager.instance
        let { normalX, normalY } = viewPort.bufferCoordinateToNormalCoordinate(this._center.x, this._center.y)

        this.konvaElement.x(normalX * gui.canvasWidth)
        this.konvaElement.y(normalY * gui.canvasHeight)
        this.konvaElement.radius(this._radius)
        this.konvaElement.opacity(this.config.opacity!)
        this.konvaElement.stroke(this.config.stroke)
        this.konvaElement.fill(this.config.fill!)
        this.konvaElement.strokeWidth(this.config.strokeWidth)
    }

    get attributes(): { center: Point, radius: number } {
        return {
            center: this._center,
            radius: this._radius
        }
    }

    get center():Point{
        return this._center
    }

    set center(centerPoint: Point){
        this._center = centerPoint
    }

    set radius(radius: number) {
        this._radius = radius
    }

    get konvaElement(): Konva.Circle {
        return this._konvaElement
    }

    get boudingBox(): { minX: number, minY: number, maxX: number, maxY: number } {
        return {
            minX: this._center.x - this._radius,
            minY: this._center.y - this._radius,
            maxX: this._center.x + this._radius,
            maxY: this._center.y + this._radius
        }
    }
}