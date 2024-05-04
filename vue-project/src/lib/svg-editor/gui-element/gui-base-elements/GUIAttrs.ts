
const GUIAttrs = {
    OffPoint: {
        radius: 3,
        opacity: 1,
        fill: "white",
        stroke: "green",
        strokeWidth: 2,
        isVirtual: false
    },
    VirtualOffPoint: {
        radius: 5,
        opacity: 0,
        fill: "green",
        stroke: "green",
        strokeWidth: 2,
        isVirtual: true
    },
    OnPoint: {
        radius: 5,
        opacity: 1,
        fill: "white",
        stroke: "red",
        strokeWidth: 2,
        isVirtual: false
    },
    VirtualOnPoint: {
        radius: 7,
        opacity: 0,
        fill: "red",
        stroke: "red",
        strokeWidth: 2,
        isVirtual: true
    },
    VirtualTextPoint: {
        radius: 1,
        opacity: 0,
        fill: "blue",
        stroke: "blue",
        strokeWidth: 1,
        isVirtual: true
    },
    Line: {
        opacity: 1,
        stroke: "black",
        strokeWidth: 1,
        isVirtual: false
    },
    VirtualLine: {
        opacity: 0,
        stroke: "black",
        strokeWidth: 6,
        isVirtual: true
    },
    ControlLine: {
        opacity: 1,
        stroke: "grey",
        strokeWidth: 1,
        isVirtual: false
    },
    VirtualControlLine: {
        opacity: 0,
        stroke: "grey",
        strokeWidth: 1,
        isVirtual: true
    },
    Text: {
        opacity: 1,
        stroke: "black",
        strokeWidth: 1,
        isVirtual: false
    },
    MarkedOnPoint: {
        radius: 5,
        opacity: 1,
        fill: "Orange",
        stroke: "red",
        strokeWidth: 2,
        isVirtual: false
    },
    MarkedOffPoint: {
        radius: 3,
        opacity: 1,
        fill: "Orange",
        stroke: "green",
        strokeWidth: 2,
        isVirtual: false
    },
    MarkedLine: {
        opacity: 1,
        stroke: "Orange",
        strokeWidth: 1,
        isVirtual: false
    },
    MarkingOnPoint: {
        radius: 0,
        opacity: 0,
        fill: "blue",
        stroke: "yellow",
        strokeWidth: 0,
        isVirtual: false
    },
    MarkingLine: {
        opacity: 1,
        stroke: "red",
        strokeWidth: 1,
        isVirtual: false
    },
    MarkingRing: {
        outerRadius: 12,
        innerRadius: 10,
        opacity: 1,
        fill: "white",
        stroke: "blue",
        strokeWidth: 1,
        isVirtual: false
    }
}

export default GUIAttrs