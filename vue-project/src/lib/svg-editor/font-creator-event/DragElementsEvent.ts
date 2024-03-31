import { Shape, type ShapeConfig } from "konva/lib/Shape";
import { Stage } from "konva/lib/Stage";
import Renderer from "../core/Renderer";
import GlobalManager from "../GlobalManager";
import FontCreatorEvent from "./FontCreatorEvent";
import { FontCreatorEventType } from "./FontCreatorEventType";
import { type DecoratedShape } from "../util/DecoratedShape";
import type GUIElement from "../gui-element/interface/GUIBaseElement";
import GUI from "../core/GUI";
import ViewPort from "../core/ViewPort";
import BaseBufferCircle from "../base-buffer-element/BaseBufferCircle";

import type GUIBaseElement from "../gui-element/interface/GUIBaseElement";
import { instanceOfGUILine } from "../util/InstanceHelper";
import GUIOffPoint from "../gui-element/gui-base-elements/GUIOffPoint";
import GUIOnPoint from "../gui-element/gui-base-elements/GUIOnPoint";

export default class DragElementsEvent extends FontCreatorEvent {
    private _movementX: number;
    private _movementY: number;
    private _elements: Map<string | number, GUIBaseElement>;
    private _isFinal: boolean;

    constructor(x: number, y: number, elements: Map<string | number, GUIBaseElement>, event: Event, isFinal: boolean) {
        super(FontCreatorEventType.DragPoint, event)
        this._movementX = x;
        this._movementY = y;
        this._elements = elements;
        this._isFinal = isFinal;
    }

    handle() {
        if (this._elements.size == 0) return
        if (this._elements.size == 1) {
            //如果是单个元素的拖拽事件，那么就直接拖拽
            for (let element of this._elements.values()) {
                if (element instanceof GUIOnPoint) {
                    //如果是onPoint，直接移动，附带所有的offPoint
                    let baseBufferElement = element.baseBufferElement
                    let movementX = this._movementX;
                    let movementY = this._movementY;
                    baseBufferElement.move(movementX, movementY, this._isFinal)
                    if (element.nextControlPoint) element.nextControlPoint.baseBufferElement.move(movementX, movementY, this._isFinal)
                    if (element.previousControlPoint) element.previousControlPoint.baseBufferElement.move(movementX, movementY, this._isFinal)
                } else if (element instanceof GUIOffPoint) {
                    if (this._elements.has(element.correspondingGUIPoint!.guiElementId)) {
                        //如果是offPoint，但是对应的onPoint也被选中，那么不需要移动
                        continue;
                    } else {
                        //如果是offPoint，但是对应的onPoint没有被选中，那么就移动
                        let baseBufferElement = element.baseBufferElement
                        let movementX = this._movementX;
                        let movementY = this._movementY;
                        baseBufferElement.move(movementX, movementY, this._isFinal)
                    }
                }
            }

        } else {
            //如果是多个元素的拖拽事件，那么不需要对线操作，只要操作被选中的点即可，避免重复操作
            for (let element of this._elements.values()) {
                if (!instanceOfGUILine(element)) {
                    if (element instanceof GUIOnPoint) {
                        //如果是onPoint，直接移动，附带所有的offPoint
                        let baseBufferElement = element.baseBufferElement
                        let movementX = this._movementX;
                        let movementY = this._movementY;
                        baseBufferElement.move(movementX, movementY, this._isFinal)
                        if (element.nextControlPoint) element.nextControlPoint.baseBufferElement.move(movementX, movementY, this._isFinal)
                        if (element.previousControlPoint) element.previousControlPoint.baseBufferElement.move(movementX, movementY, this._isFinal)
                    } else if (element instanceof GUIOffPoint) {
                        if (this._elements.has(element.correspondingGUIPoint!.guiElementId)) {
                            //如果是offPoint，但是对应的onPoint也被选中，那么不需要移动
                            continue;
                        } else {
                            //如果是offPoint，但是对应的onPoint没有被选中，那么就移动
                            let baseBufferElement = element.baseBufferElement
                            let movementX = this._movementX;
                            let movementY = this._movementY;
                            baseBufferElement.move(movementX, movementY, this._isFinal)
                        }
                    }

                }
            }
        }

    }
}