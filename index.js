import { createRoot } from 'react-dom/client';

import React, {
    useState,
    useEffect
} from "react";

/* exported for testing */
export class repoobject {
    
    constructor(hook, args) {
        this.res = null;
        this.hook = hook;
        this.args = args || [];
        this.listeners = [];
        this.elm = document.createElement("div");
    }
    wire() {
        const reactElm = React.createElement(({hook, args, resOut}) => {
            const res = hook(...args);

            resOut(res);
            return null;
        }, {
            hook:this.hook,
            args:this.args,
            resOut:res=> {
                this.res=res,
                this.listeners.forEach(fn => fn(res));
            }
        })

        this.root = createRoot(this.elm);
        this.root.render(reactElm)
      
        
    }
    destruct() {
        this.root.unmount();
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