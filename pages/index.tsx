import {Button} from "baseui/button";
import Link from "next/link";

export default () => {
    return (
        <div>
            <h1>DIGITAL STAGE - PLAYGROUND</h1>
            <p>This is not the final product and just a resource for developers or testers</p>
            <Link href="/test">
                <Button>
                    See test modules
                </Button>
            </Link>
        </div>
    );
}
