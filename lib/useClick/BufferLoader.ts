import {IAudioBuffer, IAudioContext} from "standardized-audio-context";

const BUFFERS_TO_LOAD = {
    snare: '/sounds/snare.wav',
    kick: '/sounds/kick.wav',
};

export class BufferLoaderOld {
    private readonly context: any;
    private readonly urlList: string[];
    private readonly onload: (bufferList: IAudioBuffer[]) => void;
    private bufferList: IAudioBuffer[];
    private loadCount: number;

    constructor(context: AudioContext, urlList: string[], callback?: (bufferList: IAudioBuffer[]) => void) {
        this.context = context;
        this.urlList = urlList;
        this.onload = callback;
        this.bufferList = [];
        this.loadCount = 0;
    }

    public loadBuffer = (url, index) => {
        // Load buffer asynchronously
        const request = new XMLHttpRequest();
        request.open("GET", url, true);
        request.responseType = "arraybuffer";

        const loader = this;

        request.onload = function () {
            // Asynchronously decode the audio file data in request.response
            loader.context.decodeAudioData(
                request.response,
                function (buffer: AudioBuffer) {
                    if (!buffer) {
                        alert('error decoding file data: ' + url);
                        return;
                    }
                    loader.bufferList[index] = buffer;
                    if (++loader.loadCount == loader.urlList.length)
                        loader.onload(loader.bufferList);
                },
                function (error) {
                    console.error('decodeAudioData error', error);
                }
            );
        };

        request.onerror = function () {
            alert('BufferLoader: XHR error');
        };

        request.send();
    };

    public load = () => {
        for (let i = 0; i < this.urlList.length; ++i)
            this.loadBuffer(this.urlList[i], i);
    }
}

export interface UrlList {
    [name: string]: string;
}

export interface Buffers {
    [name: string]: IAudioBuffer
}

export const BUFFERS: Buffers = {};

export class BufferLoader {
    private readonly context: IAudioContext;
    private readonly urlList: UrlList | undefined;

    constructor(context: IAudioContext, urlList?: UrlList) {
        this.context = context;
        this.urlList = urlList;
    }

    loadBuffer = (url: string): Promise<IAudioBuffer> => {
        return new Promise<IAudioBuffer>((resolve, reject) => {
            const request = new XMLHttpRequest();
            request.open("GET", url, true);
            request.responseType = "arraybuffer";
            const loader: BufferLoader = this;
            request.onload = function () {
                // Asynchronously decode the audio file data in request.response
                loader.context.decodeAudioData(
                    request.response,
                    function (buffer: IAudioBuffer) {
                        if (!buffer) {
                            alert('error decoding file data: ' + url);
                            return reject("error decoding file data: " + url);
                        }
                        return resolve(buffer);
                    },
                    function (error) {
                        console.error('decodeAudioData error', error);
                        return reject('decodeAudioData error' + error);
                    }
                );
            };

            request.onerror = function () {
                alert('BufferLoader: XHR error');
            };

            request.send();
        });


    };

    load = async (): Promise<Buffers> => {
        if (this.urlList)
            for (const key in this.urlList) {
                BUFFERS[key] = await this.loadBuffer(this.urlList[key]);
            }
        return BUFFERS;
    }
}

export const loadBuffers = (context: IAudioContext): Promise<Buffers> => {
    return new BufferLoader(context, BUFFERS_TO_LOAD).load();
};
