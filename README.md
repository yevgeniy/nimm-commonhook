# nimm-commonhook

`nimm-commonhook` enables components to subscribe to a single instance of a hook. As long as at least one component maintains a subscription, the same hook instance is reused across all subscribing components. This provides a lightweight, hook-based alternative to state management solutions like Redux.

```js
import useInstance from 'nimm-commonhook';
import { useState, useEffect } from 'react';
import CartService from './some-cart-service';

const useCartItems = (userId) => {
  const [cartItems, setCartItems] = useState(null);

  useEffect(() => {
    CartService.getCartItems(userId).then(setCartItems);
  }, [userId]);

  return cartItems;
};

const DisplayCartCount = ({ userId }) => {
  const cartItems = useInstance(useCartItems, [userId]);
  if (!cartItems) return null;

  return <div>Items in Cart: {cartItems.length}</div>;
};

const DisplayCartItems = ({ userId }) => {
  const cartItems = useInstance(useCartItems, [userId]);
  if (!cartItems) return null;

  return (
    <div>
      {cartItems.map((cartItem) => (
        <CartItem key={cartItem.id} {...cartItem} />
      ))}
    </div>
  );
};
```

## Example: Cart Page

Consider a shopping cart page that displays cart items in two places:
1. **Header**: Shows the number of items in the cart.
2. **Main Section**: Renders each cart item.

The `useCartItems` hook fetches cart items from a backend service via an asynchronous call. Without optimization, each component using `useCartItems` would trigger a separate server request, leading to redundant calls. Traditional solutions, such as Redux, manage state in a centralized store to avoid this issue.

With `nimm-commonhook`, `useInstance` ensures that all components subscribing to `useCartItems` with the same `userId` share a single hook instance. This eliminates redundant server calls by reusing the same hook state across components based on the hook function reference and argument equality.

### Arguments

Different arguments (and argument lengths) evaluate as a new instance.

```js
    useInstance(useUser, [1])
    useInstance(useUser, [2])
```

### Null values

Make sure to watch for `null` values since initial subscriptions to a hook instance may not immediately return a useful value.  This happens because internally nimm-commonhook uses `createRoot` from `react-dom/client`.  This always requires asyncronous wireup when initial instance of the hook is created.

```js
    const user = useInstance(useUser, [1])
    if (!user)
        return null;
```