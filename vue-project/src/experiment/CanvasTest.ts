import Konva from "konva";

export default class CanvasTest {
    private _divElement: HTMLDivElement;
    public static anim: Konva.Animation | null = null;
    private _fps: number = 60;
    private _konvacanvas: Konva.Stage;
    private _mainLayer: Konva.Layer;
    constructor(divId: string) {
        this._divElement = document.getElementById(divId) as HTMLDivElement;
        if (this._divElement == null) throw new Error('Cannot find designated Div')

        /** 初始化Canvas */
        // this._konvacanvas = new Konva.Stage({
        //     container: divId,   // id of container <div>
        //     width: this.canvasWidth,
        //     height: this.canvasHeight,
        // });

        // this._mainLayer = new Konva.Layer()
        // this._konvacanvas.add(this._mainLayer);

        // for (let i = 0; i < 10000; i++) {
        //     this._mainLayer.add(new Konva.Line({
        //         points: [Math.random() * 100, Math.random() * 100, Math.random() * 500, Math.random() * 500],
        //         stroke: 'black',
        //         strokeWidth: 1,
        //         lineCap: 'round',
        //         lineJoin: 'round',
        //     }))
        // }

        // CanvasTest.anim = new Konva.Animation((frame) => {
        //     this._fps = frame?.frameRate!
        // }, this._mainLayer);

        // CanvasTest.anim.start();

        var canvas = document.createElement('canvas')
        this._divElement.appendChild(canvas)
        canvas.width = this.canvasWidth
        canvas.height = this.canvasHeight

        let point1: Array<number> = []
        let point2: Array<number> = []
        let point3: Array<number> = []
        let point4: Array<number> = []
        for (let i = 0; i < 10000; i++) {
            point1.push(Math.random() * 100)
            point2.push(Math.random() * 100)
            point3.push(Math.random() * 600)
            point4.push(Math.random() * 600)
        }

        function draw() {
            let ctx = canvas.getContext('2d')
            for (let i = 0; i < 10000; i++) {
                ctx!.beginPath();
                ctx!.moveTo(point1[i], point2[i]);
                ctx!.lineTo(point3[i], point4[i]);
                ctx!.closePath();
                ctx!.stroke();
            }
        }
        let that = this

        function step() {
            draw()
            that._fps = 1000 / (performance.now() - lastTime)
            lastTime = performance.now()
            window.requestAnimationFrame(step);
        }

        let lastTime = performance.now()

        window.requestAnimationFrame(step);


    }

    get canvasWidth(): number {
        return this._divElement.clientWidth!
    }

    get canvasHeight(): number {
        return this._divElement.clientHeight!
    }

    get fps(): number {
        return this._fps
    }
}