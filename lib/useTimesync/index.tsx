import React, {useEffect, useState} from "react";
import * as timesync from 'timesync';
import {SERVER_PORT, SERVER_URL} from "../../env";

const server: string = SERVER_URL + ':' + SERVER_PORT + '/timesync';

const useTimesync = () => {
    const [offset, setOffset] = useState<number | undefined>();
    const [sync, SetSync] = useState<Timesync | undefined>();

    useEffect(() => {
        const sync: Timesync = timesync.create({
            server: server,
            repeat: 5
        });

        sync.on('change', function (offset) {
            setOffset(offset);
        });

        SetSync(sync);

        return () => {
            sync.destroy();
        }
    }, []);

    return {
        timesync: sync,
        offset
    };
};

export const withTimesync = (Component) => {
    const WithTimesync = (props) => {
        const {offset, timesync} = useTimesync();
        return (
            <Component offset={offset} timesync={timesync} {...props}/>
        )
    };
    return WithTimesync;
};

export default useTimesync;
