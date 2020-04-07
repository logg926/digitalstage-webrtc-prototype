import {styled} from "baseui";
import React from "react";

const Wrapper = styled("div", {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    backgroundColor: '#FFFFFF',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100
});
const Image = styled("img", {
    display: 'flex',
    flexGrow: 1,
    maxHeight: '60vh',
    width: 'auto',
    animationDuration: "1s",
    animationIterationCount: "infinite",
    animationName: "bounce"
});
const Text = styled("div", {
    animationDuration: "1s",
    animationIterationCount: "infinite",
    animationName: "bounce"
});

export default (props: {
    children: React.ReactNode
}) => (
    <Wrapper>
        <Text>
            {props.children}
        </Text>
    </Wrapper>
);
