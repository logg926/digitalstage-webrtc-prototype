import {Input} from "baseui/input";
import {useState} from "react";
import {FormControl} from "baseui/form-control";
import {Button, SIZE} from "baseui/button";
import Layout from "../../components/ui/Layout";

export default () => {
    const [name, setName] = useState<string>();
    const [password, setPassword] = useState<string>();

    return (
        <Layout>
            <h1>Join stage</h1>
            <FormControl label={"Stage name"}>
                <Input value={name} onChange={e => setName(e.currentTarget.value)}/>
            </FormControl>
            <FormControl label={"Passwort"}
                         caption={"Ask your director or creator of the stage for the password"}>
                <Input type="password" value={password} onChange={e => setPassword(e.currentTarget.value)}/>
            </FormControl>
            <Button size={SIZE.large}>
                Join
            </Button>
        </Layout>
    );
}
