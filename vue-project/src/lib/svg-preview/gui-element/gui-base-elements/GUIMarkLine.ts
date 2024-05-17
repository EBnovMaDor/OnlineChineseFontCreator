import GUIOnPoint from "./GUIOnPoint";
import BaseBufferLine from "../../base-buffer-element/BaseBufferLine";
import GUIAttrs from "./GUIAttrs";
import { decorateShape } from "../../util/DecoratedShape";
import Point from "../../util/Point";
import GlobalManager from "../../GlobalManager";
import type GUILine from "../interface/GUILine";
import RefreshSEBBoxEvent from "../../font-creator-event/RefreshSEBBoxEvent";
import type GUIStraightLine from "./GUIStraightLine";
import type GUIControlLine from "./GUIControlLine";

export default class GUIMarkLine implements GUILine {
    private _guiElementId: number = 0
    private _guiSegmentId: number = 0

    private _baseBufferElement: BaseBufferLine
    private _virtualBufferElement: BaseBufferLine | null = null

    private _isSelected: boolean = false
    private _isVisible: boolean = true

    private _fatherGUILine: GUIStraightLine | GUIControlLine | null = null
    private _previousGUIPoint: GUIOnPoint | null = null
    private _nextGUIPoint: GUIOnPoint | null = null
    private _comment: string = ""

    private _l: number = 0

    constructor(startPoint: Point, endPoint: Point, previousGUIPoint: GUIOnPoint | null = null, nextGUIPoint: GUIOnPoint | null = null, fatherGUILine: GUIStraightLine | GUIControlLine | null = null) {
        this._baseBufferElement = new BaseBufferLine(startPoint, endPoint, GlobalManager.instance.gui.lineGroup)
        this._virtualBufferElement = new BaseBufferLine(startPoint, endPoint, GlobalManager.instance.gui.virtualLineGroup)

        this._baseBufferElement.config = Object.assign({}, GUIAttrs.MarkingLine)
        this._virtualBufferElement.config = Object.assign({}, GUIAttrs.VirtualLine)

        decorateShape(this._baseBufferElement.konvaElement, this)
        decorateShape(this._virtualBufferElement.konvaElement, this)

        let { gui } = GlobalManager.instance
        gui.addGUIBaseElement(this)

        this._previousGUIPoint = previousGUIPoint
        this._nextGUIPoint = nextGUIPoint
        this._fatherGUILine = fatherGUILine
        this._nextGUIPoint!.baseBufferElement.config = Object.assign({}, GUIAttrs.MarkingOnPoint)
    }

    delete() {
        let { gui } = GlobalManager.instance
        gui.deleteGUIBaseElement(this)
    }

    //作为主题，通知该线的观察者
    notifyObservers(): void {
        const { gui } = GlobalManager.instance
        gui.update(this._guiElementId, this._isSelected)
    }
    // 根据父线的情况被通知位置
    update(guiElementId: number, isSelected: boolean): void {
        this.notifyObservers()
    }

    get discriminator() {
        return 'GUILine'
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
    set l(l: number) {
        this._l = l
    }

    get l() {
        return this._l
    }

    get isSelected() {
        return this._isSelected
    }

    set isSelected(isSelected: boolean) {
        if (this._isSelected == isSelected
            && this._previousGUIPoint!.isSelected == isSelected
            && this._nextGUIPoint!.isSelected == isSelected) return
        const { gui } = GlobalManager.instance
        this._isSelected = isSelected
        this._previousGUIPoint!.isSelected = isSelected
        this._nextGUIPoint!.isSelected = isSelected
        if (isSelected) {
            this._virtualBufferElement!.config.opacity = 1
        } else {
            this._virtualBufferElement!.config.opacity = 0
        }
        this.notifyObservers()
    }

    get previousMarkLine() {
        return null
    }

    get nextMarkLine() {
        return null
    }

    get baseBufferElement() {
        return this._baseBufferElement
    }

    get virtualBufferElement() {
        return this._virtualBufferElement
    }

    set previousGUIPoint(previousGUIPoint: GUIOnPoint | null) {
        this._previousGUIPoint = previousGUIPoint
    }

    set nextGUIPoint(nextGUIPoint: GUIOnPoint | null) {
        this._nextGUIPoint = nextGUIPoint
    }

    set fatherGUILine(guiLine: GUIStraightLine | GUIControlLine | null) {
        this._fatherGUILine = guiLine
    }

    get previousGUIPoint() {
        return this._previousGUIPoint
    }

    get nextGUIPoint() {
        return this._nextGUIPoint
    }

    get fatherGUILine() {
        return this._fatherGUILine
    }

    get guiElementId() {
        return this._guiElementId
    }

    set guiElementId(guiElementId: number) {
        this._guiElementId = guiElementId
    }

    get guiSegmentId() {
        return this._guiSegmentId
    }

    set guiSegmentId(guiSegmentId: number) {
        this._guiSegmentId = guiSegmentId
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