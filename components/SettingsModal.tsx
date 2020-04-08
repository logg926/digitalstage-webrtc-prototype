import React from "react";
import {Modal, ModalBody, ModalHeader} from "baseui/modal";
import {FormControl} from "baseui/form-control";
import SingleSelect from "./ui/SingleSelect";
import {Button} from "baseui/button";
import {styled} from "baseui";

const StyledModal = styled(Modal, {
    zIndex: 9999
});

interface AudioQualitySettings {
}

const LowAudioQualitySettings: AudioQualitySettings = {};

const HighAudioQualitySettings: AudioQualitySettings = {
    autoGainControl: false,
    channelCount: 1,
    echoCancellation: false,
    latency: 0,
    noiseSuppression: false,
    sampleRate: 48000,
    sampleSize: 16,
    volume: 1.0
};

export interface Settings {
    audio: AudioQualitySettings | boolean;
    useHighBitrate: boolean;
}

export default (props: {
    open?: boolean;
    onChange: (settings: Settings) => void
    onCloseRequested: () => void
}) => {
    const [settings, setSettings] = React.useState<Settings>({
        audio: true,
        useHighBitrate: false
    });

    return (
        <StyledModal isOpen={props.open} onClose={() => props.onCloseRequested()}>
            <ModalHeader>Settings</ModalHeader>
            <ModalBody>
                <h1>Input settings</h1>
                <FormControl label={"Audio quality"} caption="Requires reconnect (automatically)">
                    <SingleSelect
                        options={[
                            {label: 'Low', id: 'low'},
                            {label: 'High', id: 'high'}
                        ]}
                        onChange={(option) => {
                            if (option.id === "low") {
                                setSettings(prev => ({
                                    audio: LowAudioQualitySettings,
                                    useHighBitrate: false,
                                    ...prev
                                }))
                            } else if (option.id === "high") {
                                setSettings(prev => ({
                                    audio: HighAudioQualitySettings,
                                    useHighBitrate: true,
                                    ...prev
                                }))
                            }
                        }}
                    />
                </FormControl>
                <Button onClick={() => {
                    props.onChange(settings);
                    props.onCloseRequested()
                }}>
                    Apply
                </Button>
            </ModalBody>
        </StyledModal>
    );
}
