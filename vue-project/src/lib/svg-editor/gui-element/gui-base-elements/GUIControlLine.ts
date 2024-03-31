import { Shape, type ShapeConfig } from "konva/lib/Shape";
import type BaseBufferElementConfig from "../../base-buffer-element/interface/BaseBufferElementConfig";
import type GUIElement from "../interface/GUIBaseElement";
import type BaseBufferElement from "../../base-buffer-element/interface/BaseBufferElement";
import GUIOnPoint from "./GUIOnPoint";
import GUIOffPoint from "./GUIOffPoint";
import { decorateShape } from "../../util/DecoratedShape";
import GUIAttrs from "./GUIAttrs";
import BaseBufferLine from "../../base-buffer-element/BaseBufferLine";
import Point from "../../util/Point";
import GlobalManager from "../../GlobalManager";
import type GUILine from "../interface/GUILine";
import type Observer from "../../util/ObserverMode/Observer";
import type Subject from "../../util/ObserverMode/Subject";

export default class GUIControlLine implements GUILine {
    get discriminator() {
        return 'GUILine'
    }

    private _guiElementId: number = 0
    private _isVisible: boolean = true

    private _baseBufferElement: BaseBufferLine
    private _virtualBufferElement: BaseBufferLine | null = null

    private _isSelected: boolean = false

    private _onPoint: GUIOnPoint | null = null
    private _offPoint: GUIOffPoint | null = null

    constructor(startPoint: Point, endPoint: Point, onPoint: GUIOnPoint | null = null, offPoint: GUIOffPoint | null = null) {
        this._baseBufferElement = new BaseBufferLine(startPoint, endPoint, GlobalManager.instance.gui.lineGroup)
        this._virtualBufferElement = new BaseBufferLine(startPoint, endPoint, GlobalManager.instance.gui.virtualLineGroup)

        this._baseBufferElement.config = Object.assign({}, GUIAttrs.ControlLine)
        this._virtualBufferElement.config = Object.assign({}, GUIAttrs.VirtualControlLine)

        decorateShape(this._baseBufferElement.konvaElement, this)
        decorateShape(this._virtualBufferElement.konvaElement, this)

        let { gui } = GlobalManager.instance
        gui.addGUIBaseElement(this)

        this._onPoint = onPoint
        this._offPoint = offPoint
    }

    delete() {
        let { gui } = GlobalManager.instance
        gui.deleteGUIBaseElement(this)
        if(this._offPoint)
            this._offPoint.correspondingGUIControlLine = null
    }

    //作为主题，通知该线的观察者——GUI
    notifyObservers(): void {
        const { gui } = GlobalManager.instance
        gui.update(this._guiElementId, this._isSelected)
    }

    update(guiElementId: number, isSelected: boolean): void {
        console.debug("update", this)
        if (this._onPoint!.isSelected && this._offPoint!.isSelected) {
            this._isSelected = true
            this._virtualBufferElement!.config.opacity = 1
        } else if (!this._onPoint!.isSelected || !this._offPoint!.isSelected) {
            this._isSelected = false
            this._virtualBufferElement!.config.opacity = 0
        }
        this.notifyObservers()
    }

    draw(): void {
        this._baseBufferElement.draw()
    }

    get isSelected() {
        return this._isSelected
    }

    set isSelected(isSelected: boolean) {
        console.debug("isSelected,this.isSelected", isSelected, this.isSelected, this)
        const { gui } = GlobalManager.instance
        if (this._isSelected == isSelected
            && this._onPoint!.isSelected == isSelected
            && this._offPoint!.isSelected == isSelected) return
        this._isSelected = isSelected
        this._onPoint!.isSelected = isSelected
        this._offPoint!.isSelected = isSelected
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

    set onPoint(onPoint: GUIOnPoint | null) {
        this._onPoint = onPoint
    }

    get onPoint() {
        return this._onPoint
    }

    set offPoint(offPoint: GUIOffPoint | null) {
        this._offPoint = offPoint
    }

    get offPoint() {
        return this._offPoint
    }

    get previousGUIPoint() {
        return this._onPoint
    }

    get nextGUIPoint() {
        return this._offPoint
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