import R from 'react';
import { createRoot } from 'react-dom/client';
import {render, unmountComponentAtNode} from 'react-dom';

import React, {
    useState,
    useEffect
} from "react";

let wireMethod=null;
let destructMethod=null;
function newWireMethod(_this) {
    _this.root = createRoot(_this.elm);
    _this.root.render(_this.reactElm)
}
function oldWireMethod(_this) {
    render(_this.reactElm, _this.elm);
}
function newDestructMethod(_this) {
    _this.root.unmount();
}
function oldDestructMethod(_this) {
    unmountComponentAtNode(_this.elm);
}

/* exported for testing */
export class repoobject {
    
    constructor(hook, args) {
        this.res = null;
        this.hook = hook;
        this.args = args || [];
        this.listeners = [];
        this.elm = document.createElement("div");
        this.reactElm = null;
    }
    wire() {
        this.reactElm = React.createElement(({hook, args, resOut}) => {
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

        if (wireMethod===null) {            
            /* figure out if this is running old or new react */
            if (+R.version.split('.')[0] >=18) {
                wireMethod=newWireMethod
                destructMethod=newDestructMethod;
            } else {
                wireMethod = oldWireMethod;
                destructMethod=oldDestructMethod;
            }
                
        }
      
        wireMethod(this)
    }

    destruct() {
        destructMethod(this);
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
export const clearMethods=()=> {
    wireMethod=null;
    destructMethod=null;
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