import React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import useCommonHook, { clearRepos, repoobject } from '../index';
import { act } from 'react-dom/test-utils';

let c = 0;
const Guid = () => {
    return ++c
}

describe('common hook', () => {


    test('uses same instance of the hook', async () => {
        const coverHook = () => {
            return 'foo';
        }

        let setter;
        const hook = () => {
            const [id, setid] = useState(Guid())
            return [id, setid];
        }

        const Comp1 = ({ arg }) => {
            const [id, s] = useCommonHook(hook, [arg]) || []
            setter = s

            return <div className="comp1">{id}</div>
        }
        const Comp2 = () => {
            const [id, s] = useCommonHook(hook, [undefined]) || []
            setter = s
            return <div className="comp2">{id}</div>
        }
        const Cover = () => {
            useCommonHook(coverHook)
        }


        let setstate;
        const Root = () => {
            const [state, ss] = useState('show')
            setstate = ss;
            if (state === 'show')
                return <><Comp1 /> <Comp2 /><Cover /></>
            else if (state === 'remove1')
                return <Comp1 />
            else if (state === 'add1')
                return <><Comp2 /> <Comp1 /></>
            else if (state === 'remove-all') {
                return <div></div>
            }
            else if (state === 'add-just-one')
                return <><Comp1 /></>
            else if (state === 'change-args')
                return <><Comp1 arg={true} /></>

        }


        /* mount both hooks should render same guid */
        const { container } = render(<Root />)
        expect(container).toMatchInlineSnapshot(`
<div>
  <div
    class="comp1"
  >
    1
  </div>
   
  <div
    class="comp2"
  >
    1
  </div>
</div>
`);

        /* updating the good in original hook should update both components to same guid */
        act(() => {
            setter(Guid());
        })
        expect(container).toMatchInlineSnapshot(`
<div>
  <div
    class="comp1"
  >
    2
  </div>
   
  <div
    class="comp2"
  >
    2
  </div>
</div>
`);

        /* removing one component and adding one component should
        still render the same guid since there was still an instance of a hook alive */
        act(() => {
            setstate('remove1')
        })
        expect(container).toMatchInlineSnapshot(`
<div>
  <div
    class="comp1"
  >
    2
  </div>
</div>
`);
        act(() => {
            setstate('add1')
        })
        expect(container).toMatchInlineSnapshot(`
<div>
  <div
    class="comp2"
  >
    2
  </div>
   
  <div
    class="comp1"
  >
    2
  </div>
</div>
`);


        /* removing all the components and adding one should give
        a new guid since no other instances of the same hook
        would be alive. (wait long enought for old hooks to be cleaned up) */
        act(() => {
            setstate('remove-all')
        })
        expect(container).toMatchInlineSnapshot(`
<div>
  <div />
</div>
`);

        await new Promise(res => setTimeout(res, 100))

        act(() => {
            setstate('add-just-one')
        })

        expect(container).toMatchInlineSnapshot(`
<div>
  <div
    class="comp1"
  >
    4
  </div>
</div>
`);

        /* changing arguments in a hook should generate a new hook */
        act(() => {
            setstate('change-args')
        })
        expect(container).toMatchInlineSnapshot(`
<div>
  <div
    class="comp1"
  >
    5
  </div>
</div>
`);

        clearRepos()

    })

    test('isSame hook different', () => {
        const o = new repoobject()
        o.hook = 'a';
        expect(o.isSame('b')).toBe(false)
    })
    test('isSame different number of arguments', () => {
        const o = new repoobject()
        o.args = [1, 2]
        o.hook = 'a'
        expect(o.isSame('a', [1, 2, 3])).toBe(false)
    })
    test('isSame arguments different', () => {
        const o = new repoobject()
        o.args = [1, 2, 4]
        o.hook = 'a'
        expect(o.isSame('a', [1, 2, 3])).toBe(false)
    })
    test('isSame all equal', () => {
        const o = new repoobject()
        o.args = [1, 2, 3]
        o.hook = 'a'
        expect(o.isSame('a', [1, 2, 3])).toBe(true)
    })
    test('detatch listener', () => {
        const o = new repoobject()
        o.listeners = ['a', 'b', 'c']
        const c = o.attach('d')
        expect(o.listeners).toEqual(['a', 'b', 'c', 'd'])
        c();
        expect(o.listeners).toEqual(['a', 'b', 'c'])
    })

})