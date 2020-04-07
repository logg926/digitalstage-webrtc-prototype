import {Button} from "baseui/button";
import Link from "next/link";

export default () => {
    return (
        <div>
            <h1>DIGIAL STAGE - REHEARSAL ROOM</h1>
            <Link href="/test">
                <Button>
                    Zu den Tests
                </Button>
            </Link>
            <Link href="/stage">
                <Button>
                    Zum Frontend
                </Button>
            </Link>
        </div>
    );
}
