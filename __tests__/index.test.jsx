import React, { useEffect, useMemo, useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import useCommonHook, { clearRepos, repoobject, clearMethods } from '../index';
import { act } from 'react-dom/test-utils';

let c = null;
const Guid = () => {
    return ++c
}

let mockReactVersion=null;
jest.mock('react', ()=> {
  return  {
    ...jest.requireActual('react'),
    get version() {
      console.log("VERSION GETTER", mockReactVersion)
      return mockReactVersion
    }
  }
})

describe('common hook', () => {

    beforeEach(()=> {
      mockReactVersion='18.foo.bar';
      c=0;
    })

    test.each`
      ver
      ${'17.foo.bar'}
      ${'18.foo.bar'}
      ${'20.foo.bar'}
    `('uses same instance of the hook', async ({ver}) => {
        mockReactVersion=ver;
        clearMethods();

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
        expect(container).toMatchSnapshot();

        /* updating the good in original hook should update both components to same guid */
        act(() => {
            setter(Guid());
        })
        expect(container).toMatchSnapshot();

        /* removing one component and adding one component should
        still render the same guid since there was still an instance of a hook alive */
        act(() => {
            setstate('remove1')
        })
        expect(container).toMatchSnapshot();
        act(() => {
            setstate('add1')
        })
        expect(container).toMatchSnapshot();


        /* removing all the components and adding one should give
        a new guid since no other instances of the same hook
        would be alive. (wait long enought for old hooks to be cleaned up) */
        act(() => {
            setstate('remove-all')
        })
        expect(container).toMatchSnapshot();

        await new Promise(res => setTimeout(res, 100))

        act(() => {
            setstate('add-just-one')
        })

        expect(container).toMatchSnapshot();

        /* changing arguments in a hook should generate a new hook */
        act(() => {
            setstate('change-args')
        })
        expect(container).toMatchSnapshot();

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