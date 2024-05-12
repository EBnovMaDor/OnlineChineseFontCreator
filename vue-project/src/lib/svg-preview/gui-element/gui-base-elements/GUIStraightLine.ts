import GUIOnPoint from "./GUIOnPoint";
import BaseBufferLine from "../../base-buffer-element/BaseBufferLine";
import GUIAttrs from "./GUIAttrs";
import { decorateShape } from "../../util/DecoratedShape";
import Point from "../../util/Point";
import GlobalManager from "../../GlobalManager";
import type GUILine from "../interface/GUILine";
import RefreshSEBBoxEvent from "../../font-creator-event/RefreshSEBBoxEvent";
import type GUIMarkLine from "./GUIMarkLine";

export default class GUIStraightLine implements GUILine {
    private _guiElementId: number = 0
    private _guiSegmentId: number = 0

    private _baseBufferElement: BaseBufferLine
    private _virtualBufferElement: BaseBufferLine | null = null

    private _isSelected: boolean = false
    private _isVisible: boolean = true

    private _previousGUIPoint: GUIOnPoint | null = null
    private _nextGUIPoint: GUIOnPoint | null = null
    private _previousMarkLine: GUIMarkLine | null = null
    private _nextMarkLine: GUIMarkLine | null = null
    private _comment: string = ""

    constructor(startPoint: Point, endPoint: Point, previousGUIPoint: GUIOnPoint | null = null, nextGUIPoint: GUIOnPoint | null = null) {
        this._baseBufferElement = new BaseBufferLine(startPoint, endPoint, GlobalManager.instance.gui.lineGroup)
        this._virtualBufferElement = new BaseBufferLine(startPoint, endPoint, GlobalManager.instance.gui.virtualLineGroup)

        this._baseBufferElement.config = Object.assign({}, GUIAttrs.Line)
        this._virtualBufferElement.config = Object.assign({}, GUIAttrs.VirtualLine)

        decorateShape(this._baseBufferElement.konvaElement, this)
        decorateShape(this._virtualBufferElement.konvaElement, this)

        let { gui } = GlobalManager.instance
        gui.addGUIBaseElement(this)

        this._previousGUIPoint = previousGUIPoint
        this._nextGUIPoint = nextGUIPoint

        this._virtualBufferElement.konvaElement.on("pointerdblclick", (e) => {
            console.log("pointer dbl click", this)
            let currentGUILine = this
            let previousGUILine = this.previousGUIPoint!.previousGUILine
            while (previousGUILine != currentGUILine) {
                if (previousGUILine == null) break
                previousGUILine!.isSelected = true
                previousGUILine = (previousGUILine!.previousGUIPoint! as GUIOnPoint).previousGUILine
            }
            let nextGUILine = this.nextGUIPoint!.nextGUILine
            while (nextGUILine != currentGUILine) {
                if (nextGUILine == null) break
                nextGUILine!.isSelected = true
                nextGUILine = (nextGUILine!.nextGUIPoint! as GUIOnPoint).nextGUILine
            }
            GlobalManager.instance.eventHandler.addEvent(new RefreshSEBBoxEvent(e.evt))
        })
    }

    delete() {
        let { gui } = GlobalManager.instance
        gui.deleteGUIBaseElement(this)
        if (this._nextGUIPoint)
            this._nextGUIPoint.previousGUILine = null
        if (this._previousGUIPoint)
            this._previousGUIPoint.nextGUILine = null
    }

    //作为主题，通知该线的观察者——GUI 通知他的markLine
    notifyObservers(): void {
        const { gui } = GlobalManager.instance
        gui.update(this._guiElementId, this._isSelected)
    }

    update(guiElementId: number, isSelected: boolean): void {
        console.debug("update", this)
        if (this._previousGUIPoint!.isSelected && this._nextGUIPoint!.isSelected) {
            this._isSelected = true
            this._virtualBufferElement!.config.opacity = 1
        } else if (!this._previousGUIPoint!.isSelected || !this._nextGUIPoint!.isSelected) {
            this._isSelected = false
            this._virtualBufferElement!.config.opacity = 0
        }
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

    get isSelected() {
        return this._isSelected
    }

    set isSelected(isSelected: boolean) {
        console.debug("isSelected,this.isSelected", isSelected, this.isSelected, this)
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

    set previousMarkLine(previousMarkLine: GUIMarkLine | null) {
        this._previousMarkLine = previousMarkLine
    }

    set nextMarkLine(nextMarkLine: GUIMarkLine | null) {
        this._nextMarkLine = nextMarkLine
    }

    get previousGUIPoint() {
        return this._previousGUIPoint
    }

    get nextGUIPoint() {
        return this._nextGUIPoint
    }

    get previousMarkLine() {
        return this._previousMarkLine
    }

    get nextMarkLine() {
        return this._nextMarkLine
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