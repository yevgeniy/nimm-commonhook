# nimm-commonhook

Subscribe to a single instance of the hook.  As long as a hook has subscriptions same hook will be used as new components subscribe to it.  This effectively functions like redux but only using hooks.

```js

import useCommonHook from 'nimm-commonhook'

const useUsers=()=> {
    const [users, setUsers] = useState(null)
    useEffect(()=> {
        UserService.getUsers().then(setUsers)
    },[])

    return users;
}

const NumberOfUsers = ()=> {
    const users = useCommonHook(useUsers);
    return <div>{users && users.length}</div>
}

const TotalOrders=()=> {
    const users = useCommonHook(useUsers);
    return <div>{users && add( ...users.map(v=>v.orders.length) )}</div>
}

```

### Arguments

Different arguments (and argument lengths) evaluate as a new instance.

```js
    useCommonHook(useUser, [1])
    useCommonHook(useUser, [2])
```

### Null values

Make sure to watch for `null` values since initial subscriptions to a hook instance may not immediately return a useful value.

```js
    const [user, updateUser] = useCommonHook(useUser, [1]) || [null, ()=>{}]
```