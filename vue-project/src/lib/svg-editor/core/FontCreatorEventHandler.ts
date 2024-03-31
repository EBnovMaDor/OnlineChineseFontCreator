import FontCreatorEvent from "../font-creator-event/FontCreatorEvent";
import Queue from "../util/Queue";

export default class FontCreatorEventHandler {
    /** font-event */
    private _fontCreatorEventQueue: Queue<FontCreatorEvent> = new Queue<FontCreatorEvent>()

    public addEvent(event: FontCreatorEvent) {
        this._fontCreatorEventQueue.enqueue(event)
    }

    public handleEvents() {
        while (!this._fontCreatorEventQueue.isEmpty()) {
            let event = this._fontCreatorEventQueue.dequeue()
            event!.handle()
        }
    }
}