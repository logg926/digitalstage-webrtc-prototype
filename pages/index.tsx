import {Button} from "baseui/button";
import Link from "next/link";

export default () => {
    return (
        <div>
            <h1>DIGIAL STAGE - REHEARSAL ROOM</h1>
            <Link href="/test">
                <Button>
                    An Probe teilnehmen
                </Button>
            </Link>
            <Link href="/playback">
                <Button>
                    Public Djing
                </Button>
            </Link>
            <Link href="/click">
                <Button>
                    Synchronisierter Click
                </Button>
            </Link>
        </div>
    );
}
