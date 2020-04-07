import React from 'react'
import App from 'next/app'
import {Provider as StyletronProvider} from 'styletron-react'
import {debug, styletron} from '../styletron'
import {BaseProvider, DarkTheme, LightTheme} from "baseui";
import {DarkModeContext} from '../lib/useDarkModeSwitch';

interface Props {

}

interface States {
    darkMode: boolean
}

export default class MyApp extends App<Props, States> {
    state = {
        darkMode: false
    };

    render() {
        const {Component, pageProps} = this.props;
        return (
            <StyletronProvider value={styletron} debug={debug} debugAfterHydration>
                <DarkModeContext.Provider value={{
                    darkMode: this.state.darkMode,
                    setDarkMode: (enabled: boolean) => this.setState({darkMode: enabled})
                }}>
                    <BaseProvider theme={this.state.darkMode ? DarkTheme : LightTheme}>
                        <style jsx global>{`
                    @import url('https://fonts.googleapis.com/css?family=Open+Sans|Sen&display=swap');
                    html {
                        margin: 0;
                        padding: 0;
                    }
                    body {
                        margin: 0;
                        padding: 0;
                        font-family: 'Open Sans', sans-serif;
                    }
                    h1, h2, h3, h4, h5 {
                        font-family: 'Sen', sans-serif;
                    }
                    a, a:hover {
                        color: rgb(242,157,82);
                    }
                    @keyframes bounce {
                        0%   { transform: translateY(0); }
                        50%  { transform: translateY(-20px); }
                        100% { transform: translateY(0); }
                    }
                    `
                        }
                        </style>
                        <Component {...pageProps} />
                    </BaseProvider>
                </DarkModeContext.Provider>
            </StyletronProvider>
        )
    }
}
