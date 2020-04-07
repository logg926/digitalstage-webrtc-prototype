import {FormControl} from "baseui/form-control";
import {Input} from "baseui/input";
import {useState} from "react";
import {Button} from "baseui/button";
import Layout from "../../../components/ui/Layout";

export default () => {
    const [step, setStep] = useState<number>(1);
    const [name, setName] = useState<string>('');
    const [password, setPassword] = useState<string>('');

    if (step === 2) {
        return (
            <Layout>
                <h1>Create stage</h1>
                <p>
                    Please provide some necessary informations to create a stage that matches your needs!
                </p>
                <FormControl label={"Password"}>
                    <Input value={password} onChange={e => setPassword(e.currentTarget.value)}/>
                    <Button onClick={() => setStep(1)}>
                        Back
                    </Button>
                    <Button onClick={() => setStep(2)}>
                        Next
                    </Button>
                </FormControl>x
            </Layout>
        )
    }

    return (
        <Layout>
            <h1>Create stage</h1>
            <FormControl label={"Stage name"}>
                <Input value={name} onChange={e => setName(e.currentTarget.value)}/>
            </FormControl>
            <Button onClick={() => setStep(2)}>
                Next
            </Button>
        </Layout>
    );
}
