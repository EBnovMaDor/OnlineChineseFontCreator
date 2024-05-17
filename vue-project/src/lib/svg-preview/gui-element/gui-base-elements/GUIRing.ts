import { Node, type NodeConfig } from "konva/lib/Node"
import BaseBufferCircle from "../../base-buffer-element/BaseBufferCircle"
import type BaseBufferElement from "../../base-buffer-element/interface/BaseBufferElement"
import type BaseBufferElementConfig from "../../base-buffer-element/interface/BaseBufferElementConfig"
import Point from "../../util/Point"
import type GUIElement from "../interface/GUIBaseElement"
import GUIPointAttr from "./GUIAttrs"
import { decorateShape } from "../../util/DecoratedShape"
import GUIAttrs from "./GUIAttrs"
import GlobalManager from "../../GlobalManager"
import type GUILine from "../interface/GUILine"
import GUIOnPoint from "./GUIOnPoint"

import type GUIBaseElement from "../interface/GUIBaseElement"
import BaseBufferRing from "../../base-buffer-element/BaseBufferRing"

export default class GUIRing implements GUIBaseElement {

    private _guiElementId: number = 0

    private _baseBufferElement: BaseBufferRing
    private _isSelected: boolean = false
    private _isVisible: boolean = true
    private _comment: string = ""

    /** if a point is not a control point, then need following attributes */
    _isTangency: boolean = false

    _fatherPoint : GUIOnPoint | null = null

    constructor(centerPoint: Point) {
        this._baseBufferElement = new BaseBufferRing(centerPoint, 10,12, GlobalManager.instance.gui.pointGroup)
        this._baseBufferElement.innerRadius = GUIAttrs.MarkingRing.innerRadius
        this._baseBufferElement.outerRadius = GUIAttrs.MarkingRing.outerRadius
        this._baseBufferElement.config = Object.assign({}, GUIAttrs.MarkingRing)

        decorateShape(this._baseBufferElement.konvaElement, this)

        let { gui } = GlobalManager.instance
        gui.addGUIBaseElement(this)

    }

    delete() {
        let { gui } = GlobalManager.instance
        gui.deleteGUIBaseElement(this)
    }

    //作为主题，通知该点的观察者——前后两条线+GUI
    notifyObservers(): void {
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
    }

    get fatherPoint(){
        return this._fatherPoint
    }

    set fatherPoint(fatherPoint: GUIOnPoint | null){
        this._fatherPoint = fatherPoint
    }

    get isSelected() {
        return this._isSelected
    }
    get guiSegmentId() {
        return -1
    }

    set isSelected(isSelected: boolean) {
        if (this._isSelected == isSelected) return
        const { gui } = GlobalManager.instance
        //更新自己的状态
        this._isSelected = isSelected
        this.notifyObservers()
    }

    get baseBufferElement() {
        return this._baseBufferElement
    }

    get virtualBufferElement() {
        return null
    }

    set isTangency(isTangency: boolean) {
        this._isTangency = isTangency
    }

    get isTangency() {
        return this._isTangency
    }

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
    }
}