import { Node, type NodeConfig } from "konva/lib/Node"
import BaseBufferText from "../../base-buffer-element/BaseBufferText"
import type BaseBufferElement from "../../base-buffer-element/interface/BaseBufferElement"
import type BaseBufferElementConfig from "../../base-buffer-element/interface/BaseBufferElementConfig"
import Point from "../../util/Point"
import type GUIElement from "../interface/GUIBaseElement"
import GUIPointAttr from "./GUIAttrs"
import { decorateShape } from "../../util/DecoratedShape"
import GUIAttrs from "./GUIAttrs"
import GlobalManager from "../../GlobalManager"
// import type GUILine from "../interface/GUILine"
// import GUIOffPoint from "./GUIOffPoint"
import type GUIBaseElement from "../interface/GUIBaseElement"
import BaseBufferCircle from "../../base-buffer-element/BaseBufferCircle"

export default class GUIText implements GUIBaseElement {

    private _guiElementId: number = 0

    private _baseBufferElement: BaseBufferText
    private _virtualBufferElement: BaseBufferCircle | null = null

    private _isSelected: boolean = false
    private _isVisible: boolean = true
    private _comment: string = ""

    /** if a point is not a control point, then need following attributes */
    _isTangency: boolean = false

    constructor(centerPoint: Point,text:string) {
        this._baseBufferElement = new BaseBufferText(centerPoint, "", GlobalManager.instance.gui.pointGroup)
        this._baseBufferElement.text = text
        this._baseBufferElement.config = Object.assign({}, GUIAttrs.Text)

        this._comment = text
        this._virtualBufferElement = new BaseBufferCircle(centerPoint, 0, GlobalManager.instance.gui.virtualPointGroup)
        this._virtualBufferElement.radius = GUIAttrs.VirtualTextPoint.radius
        this._virtualBufferElement.config = Object.assign({}, GUIAttrs.VirtualTextPoint)

        decorateShape(this._baseBufferElement.konvaElement, this)
        decorateShape(this._virtualBufferElement.konvaElement, this)

        let { gui } = GlobalManager.instance
        gui.addGUIBaseElement(this)

        // this._virtualBufferElement.konvaElement.on("pointerdblclick", () => {
        //     if(this._previousControlPoint && this._nextControlPoint) {
        //         this._isTangency = !this._isTangency
        //     }
        //     console.log("pointer dbl click", this)
        // })
    }

    delete() {
        let { gui } = GlobalManager.instance
        gui.deleteGUIBaseElement(this)
        // if (this._previousGUILine)
        //     this._previousGUILine.nextGUIPoint = null
        // if (this._nextGUILine)
        //     this._nextGUILine.previousGUIPoint = null
        // if (this._previousControlPoint) {
        //     this._previousControlPoint.correspondingGUIPoint = null
        //     if (this._previousControlPoint.correspondingGUIControlLine)
        //         this._previousControlPoint.correspondingGUIControlLine.onPoint = null
        // }
        // if (this._nextControlPoint) {
        //     this._nextControlPoint.correspondingGUIPoint = null
        //     if (this._nextControlPoint.correspondingGUIControlLine)
        //         this._nextControlPoint.correspondingGUIControlLine.onPoint = null
        // }
    }

    //作为主题，通知该点的观察者——前后两条线+GUI
    notifyObservers(): void {
        // if (this._previousGUILine) this._previousGUILine!.update(this._guiElementId, this._isSelected)
        // if (this._nextGUILine) this._nextGUILine!.update(this._guiElementId, this._isSelected)
        const { gui } = GlobalManager.instance
        gui.update(this._guiElementId, this._isSelected)
    }

    update(guiElementId: number, isSelected: boolean): void {

    }

    draw(): void {
        this._baseBufferElement.draw()
    }

    get comment() {
        return this._comment
    }

    set comment(comment: string) {
        this._comment = comment
        this._baseBufferElement.text = comment
    }

    get isSelected() {
        return this._isSelected
    }

    set isSelected(isSelected: boolean) {
        console.debug("isSelected,this.isSelected", isSelected, this.isSelected, this)
        if (this._isSelected == isSelected) return
        const { gui } = GlobalManager.instance
        //更新自己的状态
        this._isSelected = isSelected
        if (isSelected) {
            this._virtualBufferElement!.config.opacity = 1
        } else {
            this._virtualBufferElement!.config.opacity = 0
        }
        this.notifyObservers()
    }

    get baseBufferElement() {
        return this._baseBufferElement
    }

    get virtualBufferElement() {
        return this._virtualBufferElement
    }

    set isTangency(isTangency: boolean) {
        this._isTangency = isTangency
    }

    get isTangency() {
        return this._isTangency
    }

    // get previousGUILine() {
    //     return this._previousGUILine
    // }

    // get nextGUILine() {
    //     return this._nextGUILine
    // }

    // get previousControlPoint() {
    //     return this._previousControlPoint
    // }

    // get nextControlPoint() {
    //     return this._nextControlPoint
    // }

    // set previousGUILine(previousGUILine: GUILine | null) {
    //     this._previousGUILine = previousGUILine
    // }

    // set nextGUILine(nextGUILine: GUILine | null) {
    //     this._nextGUILine = nextGUILine
    // }

    // set previousControlPoint(previousControlPoint: GUIOffPoint | null) {
    //     this._previousControlPoint = previousControlPoint
    // }

    // set nextControlPoint(nextControlPoint: GUIOffPoint | null) {
    //     this._nextControlPoint = nextControlPoint
    // }

    get guiElementId() {
        return this._guiElementId
    }

    set guiElementId(guiElementId: number) {
        this._guiElementId = guiElementId
    }


    get isVisible() {
        return this._isVisible
    }

    set isVisible(isVisible: boolean) {
        this._isVisible = isVisible
        if (this._baseBufferElement) this._baseBufferElement.konvaElement.visible(isVisible)
        // if (this._virtualBufferElement) this._virtualBufferElement.konvaElement.visible(isVisible)
    }
}