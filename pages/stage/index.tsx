import {Input} from "baseui/input";
import React, {useEffect, useState} from "react";
import {FormControl} from "baseui/form-control";
import {Button, SIZE} from "baseui/button";
import Layout from "../../components/ui/Layout";
import {useAuth} from "../../lib/useAuth";
import LoginForm from "../../components/LoginForm";
import Loading from "../../components/ui/Loading";

export default () => {
    const [name, setName] = useState<string>();
    const [password, setPassword] = useState<string>();
    const {user, loading} = useAuth();

    useEffect(() => {
        if (!user) {
            //Router.push("/stage/login");
        }
    }, [user]);

    if (loading) {
        return (
            <Loading><h1>Loading</h1></Loading>
        )
    }

    if (!user) {
        return (
            <Layout>
                <h1>Login</h1>
                <LoginForm/>
            </Layout>
        );
    }

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
