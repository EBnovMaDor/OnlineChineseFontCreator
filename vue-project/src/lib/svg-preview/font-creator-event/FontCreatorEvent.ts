import { FontCreatorEventType } from "./FontCreatorEventType";

export default abstract class FontCreatorEvent {
    private _type: FontCreatorEventType;
    private _event: Event | null = null;

    constructor(type: FontCreatorEventType, event: Event) {
        this._type = type;
        this._event = event;
    }

    get type(): FontCreatorEventType {
        return this._type;
    }

    get event(): Event | null {
        return this._event;
    }

    /** 如何处理该事件 */
    abstract handle(): void;

}