import React, {useEffect, useState} from "react";
import {OptionsT, Select, Value} from "baseui/select";
import {Button} from "baseui/button";
import {styled} from "baseui";
import usePlayback from "../../lib/usePlayback";
import {useDarkModeSwitch} from "../../lib/useDarkModeSwitch";
import {Checkbox, LABEL_PLACEMENT} from "baseui/checkbox";

const options: OptionsT = [
    {label: "Bass", id: "/song/bass.wav"},
    {label: "Drums", id: "/song/drums.wav"},
    {label: "Synth 1", id: "/song/synth.wav"},
    {label: "Synth 2", id: "/song/synth2.wav"}
];

const StyledCheckbox = styled(Checkbox, {
    display: 'flex',
    alignItems: 'center'
});

const Wrapper = styled("div", {
    position: 'relative',
    width: '100%',
    display: 'inline-flex',
    flexDirection: 'row',
    flexGrow: 1,
});

const Offset = styled("div", {
    display: 'flex',
    flexDirection: 'row',
    flexGrow: 1,
    whiteSpace: 'nowrap',
    paddingLeft: '16px',
    paddingRight: '16px',
    alignItems: 'center'
});

export interface PlaybackFile {
    label: string;
    url: string;
}

export default (props: {
    context?: AudioContext,
    target?: AudioNode,
    files: PlaybackFile[],
    offset: number
}) => {
    const [useTarget, setUseTarget] = useState<boolean>(true);
    const [options, setOptions] = React.useState<OptionsT>([]);
    const [value, setValue] = React.useState<Value>();
    const [startTime, setStartTime] = React.useState<number>(1585909706000);
    const {ready, playing, setPlaying, countdown} = usePlayback({
        context: props.context,
        filePath: value && value[0] && value[0].id ? value[0].id + "" : undefined,
        startTime: startTime + props.offset,
        offset: props.offset,
        target: useTarget ? props.target : undefined
    });
    const {darkMode} = useDarkModeSwitch();

    useEffect(() => {
        setOptions(
            props.files ? props.files.map((f) => ({label: f.label, id: f.url})) : []
        );
    }, [props.files]);

    return (
        <Wrapper>
            <Select
                clearable={false}
                options={options}
                placeholder="Select track"
                onChange={({value}) => {
                    setValue(value)
                }}
                value={value}/>
            <Offset $style={darkMode ? {color: 'white'} : {color: 'black'}}>
                {playing && countdown > 0 ? (
                    <>
                        {Math.ceil((countdown / 1000) - 1)}s
                    </>
                ) : (
                    <>
                        {Math.ceil(props.offset)}ms
                    </>
                )}
            </Offset>
            {props.target && (
                <StyledCheckbox
                    overrides={{
                        Root: {
                            style: () => ({
                                alignItems: 'center',
                                paddingRight: '16px'
                            }),
                        },
                    }}
                    checked={useTarget}
                    onChange={e => setUseTarget(e.currentTarget.checked)}
                    labelPlacement={LABEL_PLACEMENT.right}
                >
                    send
                </StyledCheckbox>
            )}
            {playing ? (
                <Button onClick={() => setPlaying(false)}>
                    Stop
                </Button>
            ) : (
                <Button isLoading={value && !ready} disabled={!value || value.length === 0 || !ready}
                        onClick={() => setPlaying(true)}>
                    Play
                </Button>
            )}
        </Wrapper>
    )
}
