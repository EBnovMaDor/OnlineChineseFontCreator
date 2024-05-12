import Konva from "konva";
import type BaseBufferElement from "./interface/BaseBufferElement";
import Point from "../util/Point";
import type BaseBufferElementConfig from "./interface/BaseBufferElementConfig";
import GlobalManager from "../GlobalManager";
import { decorateShape } from "../util/DecoratedShape";

export default class BaseBufferRing implements BaseBufferElement {
    private _konvaElement: Konva.Ring;
    config: BaseBufferElementConfig;

    private _center: Point = new Point();
    private _innerRadius: number = 0
    private _outerRadius: number = 0

    constructor(center: Point, innerRadius: number = 10, outerRadius:number = 12,
        konvaGroup: Konva.Group = GlobalManager.instance.gui.pointGroup,
        config: BaseBufferElementConfig = { fill: 'white', stroke: 'blue', strokeWidth: 1, opacity: 1, isVirtual: false }) {
        this._center = center
        this._innerRadius = innerRadius
        this._outerRadius = outerRadius

        let { gui, viewPort } = GlobalManager.instance
        let { normalX, normalY } = viewPort.bufferCoordinateToNormalCoordinate(center.x, center.y)

        let konvaRing = new Konva.Ring({
            x: normalX * gui.canvasWidth,
            y: normalY * gui.canvasHeight,
            innerRadius: innerRadius,
            outerRadius:outerRadius,
            opacity: config.opacity,
            fill: config.fill,
            stroke: config.stroke,
            strokeWidth: config.strokeWidth,
        })

        konvaGroup.add(konvaRing)

        this._konvaElement = konvaRing;
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

        this.konvaElement.innerRadius(this._innerRadius)
        this.konvaElement.outerRadius(this._outerRadius)
        this.konvaElement.opacity(this.config.opacity!)
        this.konvaElement.stroke(this.config.stroke)
        this.konvaElement.fill(this.config.fill!)
        this.konvaElement.strokeWidth(this.config.strokeWidth)
    }

    get attributes(): { center: Point, innerRadius: number ,outerRadius:number} {
        return {
            center: this._center,
            innerRadius: this._innerRadius,
            outerRadius: this._outerRadius
        }
    }

    get center():Point{
        return this._center
    }

    set center(centerPoint: Point){
        this._center = centerPoint
    }

    set innerRadius(innerRadius: number) {
        this._innerRadius = innerRadius
    }
    set outerRadius(outerRadius:number) {
        this._outerRadius = outerRadius
    }

    get konvaElement(): Konva.Ring {
        return this._konvaElement
    }

    get boudingBox(): { minX: number, minY: number, maxX: number, maxY: number } {
        return {
            minX: this._center.x - this._outerRadius,
            minY: this._center.y - this._outerRadius,
            maxX: this._center.x + this._outerRadius,
            maxY: this._center.y + this._outerRadius
        }
    }
}