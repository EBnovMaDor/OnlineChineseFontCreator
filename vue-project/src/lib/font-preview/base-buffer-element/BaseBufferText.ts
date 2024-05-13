import Konva from "konva";
import type BaseBufferElement from "./interface/BaseBufferElement";
import Point from "../util/Point";
import type BaseBufferElementConfig from "./interface/BaseBufferElementConfig";
import GlobalManager from "../GlobalManager";
import { decorateShape } from "../util/DecoratedShape";

export default class BaseBufferText implements BaseBufferElement {
    private _konvaElement: Konva.Text;
    config: BaseBufferElementConfig;

    private _center: Point = new Point();
    private _text: string = ""

    constructor(center: Point, text: string = "",
        konvaGroup: Konva.Group = GlobalManager.instance.gui.pointGroup,
        config: BaseBufferElementConfig = { fill: 'white', stroke: 'black', strokeWidth: 2, opacity: 1, isVirtual: false }) {
        this._center = center
        this._text = text

        let { gui, viewPort } = GlobalManager.instance
        let { normalX, normalY } = viewPort.bufferCoordinateToNormalCoordinate(center.x, center.y)

        let konvaText = new Konva.Text({
            x: normalX * gui.canvasWidth,
            y: normalY * gui.canvasHeight,
            text: text,
            opacity: config.opacity,
            fill: config.fill,
            stroke: config.stroke,
            strokeWidth: config.strokeWidth,
        })

        konvaGroup.add(konvaText)

        this._konvaElement = konvaText;
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
        this.konvaElement.text(this._text)
        this.konvaElement.opacity(this.config.opacity!)
        this.konvaElement.stroke(this.config.stroke)
        this.konvaElement.fill(this.config.fill!)
        this.konvaElement.strokeWidth(this.config.strokeWidth)
    }

    get attributes(): { center: Point, text: string } {
        return {
            center: this._center,
            text:this._text
        }
    }

    get center():Point{
        return this._center
    }

    set center(centerPoint: Point){
        this._center = centerPoint
    }

    get text():string{
        return this._text
    }

    set text(text: string) {
        this._text = text
    }
    

    get konvaElement(): Konva.Text {
        return this._konvaElement
    }

    get boudingBox(): { minX: number, minY: number, maxX: number, maxY: number } {
        return {
            minX: this._center.x,
            minY: this._center.y,
            maxX: this._center.x,
            maxY: this._center.y
        }
    }
}