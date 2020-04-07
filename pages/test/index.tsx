import {Button} from "baseui/button";
import Link from "next/link";

export default () => {
    return (
        <div>
            <h1>DIGIAL STAGE - REHEARSAL ROOM</h1>
            <Link href="/test/join">
                <Button>
                    An Probe teilnehmen
                </Button>
            </Link>
            <Link href="/test/playback">
                <Button>
                    Public Djing
                </Button>
            </Link>
            <Link href="/test/click">
                <Button>
                    Synchronisierter Click
                </Button>
            </Link>
            <Link href="/test/canvasplayer">
                <Button>
                    Canvasplayer
                </Button>
            </Link>
        </div>
    );
}
