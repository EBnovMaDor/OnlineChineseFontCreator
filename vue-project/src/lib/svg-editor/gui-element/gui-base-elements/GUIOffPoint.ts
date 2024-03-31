import BaseBufferCircle from "../../base-buffer-element/BaseBufferCircle"
import type BaseBufferElement from "../../base-buffer-element/interface/BaseBufferElement"
import Point from "../../util/Point"
import type GUIElement from "../interface/GUIBaseElement"
import GUIOnPoint from "./GUIOnPoint"
import { decorateShape } from "../../util/DecoratedShape"
import GUIAttrs from "./GUIAttrs"
import GlobalManager from "../../GlobalManager"
import GUIControlLine from "./GUIControlLine"
import type GUIBaseElement from "../interface/GUIBaseElement"

export default class GUIOffPoint implements GUIBaseElement {

    private _guiElementId: number = 0
    private _baseBufferElement: BaseBufferCircle
    private _virtualBufferElement: BaseBufferCircle | null = null

    private _isSelected: boolean = false
    private _isVisible: boolean = true

    _correspondingGUIPoint: GUIOnPoint | null = null
    _correspondingGUIControlLine: GUIControlLine | null = null

    constructor(centerPoint: Point, corrPoint: GUIOnPoint | null = null) {
        this._baseBufferElement = new BaseBufferCircle(centerPoint, 1, GlobalManager.instance.gui.pointGroup)
        this._baseBufferElement.radius = GUIAttrs.OffPoint.radius
        this._baseBufferElement.config = Object.assign({}, GUIAttrs.OffPoint)

        this._virtualBufferElement = new BaseBufferCircle(centerPoint, 1, GlobalManager.instance.gui.virtualPointGroup)
        this._virtualBufferElement.radius = GUIAttrs.VirtualOffPoint.radius
        this._virtualBufferElement.config = Object.assign({}, GUIAttrs.VirtualOffPoint)

        decorateShape(this._baseBufferElement.konvaElement, this)
        decorateShape(this._virtualBufferElement.konvaElement, this)

        let { gui } = GlobalManager.instance
        gui.addGUIBaseElement(this)

        this._correspondingGUIPoint = corrPoint
    }

    delete() {
        let { gui } = GlobalManager.instance
        gui.deleteGUIBaseElement(this)
        // 对于offpoint而言并不知道自己对于onpoint而言是前控制点还是后控制点
        // if(this._correspondingGUIPoint)
        //     this._correspondingGUIPoint.previousControlPoint = null
        if(this._correspondingGUIControlLine)
            this._correspondingGUIControlLine.offPoint = null
    }

    //作为主题，通知该点的观察者——对应的线
    notifyObservers(): void {
        if (this._correspondingGUIControlLine) this._correspondingGUIControlLine!.update(this._guiElementId, this._isSelected)
        const { gui } = GlobalManager.instance
        gui.update(this._guiElementId, this._isSelected)
    }

    update(guiElementId: number, isSelected: boolean): void {

    }

    draw(): void {
        this._baseBufferElement.draw()
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

    set correspondingGUIPoint(correspondingGUIPoint: GUIOnPoint | null) {
        this._correspondingGUIPoint = correspondingGUIPoint
    }

    get correspondingGUIPoint() {
        return this._correspondingGUIPoint
    }

    set correspondingGUIControlLine(correspondingGUIControlLine: GUIControlLine | null) {
        this._correspondingGUIControlLine = correspondingGUIControlLine
    }

    get correspondingGUIControlLine() {
        return this._correspondingGUIControlLine
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
        if (this._virtualBufferElement) this._virtualBufferElement.konvaElement.visible(isVisible)
    }
}