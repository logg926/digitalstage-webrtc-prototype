import {TimeSignature} from "../useClick";


export interface Offer {
    type?: RTCSdpType;
    sdp?: string
}

export interface Answer {
    type?: RTCSdpType;
    sdp?: string
}

export interface Room {
    offer: Offer;
    // answers is a sub collection
    click: {
        playing: boolean;
        startTime: number,
        bpm: number,
        timeSignature: TimeSignature
    };
}
