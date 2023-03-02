import ReactDOM from "react-dom";
import React, {
    useState,
    useEffect,
    useRef
} from "react";

/* exported for testing */
export class repoobject {
    args = [];
    hook = null;
    listeners = [];
    elm = null;
    res = null;
    constructor(hook, args) {
        this.hook = hook;
        this.args = args || [];
        this.listeners = [];
        this.elm = document.createElement("div");
    }
    wire() {
        ReactDOM.render(
            React.createElement(() => {
                const res = this.hook(...this.args);

                this.res = res;
                this.listeners.forEach(fn => fn(res));
                return null;
            }, {}),
            this.elm
        );
    }
    destruct() {
        ReactDOM.unmountComponentAtNode(this.elm);
    }
    isSame(hook, args = []) {
        if (hook !== this.hook) return false;

        if (args.length !== this.args.length) return false;

        for (let x = 0; x < args.length; x++) {
            if (args[x] !== this.args[x]) return false;
        }

        return true;
    }
    attach(fn) {
        this.listeners.push(fn);
        return () => {
            this.listeners = this.listeners.filter(v => v !== fn);
        };
    }
}


/* exported for testing */
export let repos = [];

/* exported for testing */
export const clearRepos = () => {
    repos.forEach(v => v.destruct());
    repos = [];
}

function useCommonHook(hook, args = []) {
    const [, setrel] = useState(+new Date());

    let commonrepo = repos.find(v => v.isSame(hook, args));
    if (!commonrepo) {
        commonrepo = new repoobject(hook, args);
        repos.push(commonrepo);
        commonrepo.wire();
    }

    useEffect(() => {
        const c = commonrepo.attach(() => {
            setrel(+new Date());
        });

        return () => {
            c();

            if (!commonrepo.listeners.length) {
                commonrepo.destruct();
                repos = repos.filter(v => v !== commonrepo);
            }
        };
    }, [commonrepo]);

    return commonrepo.res;
}


export default useCommonHook;