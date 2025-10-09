import { createContext, useEffect, useState } from "react";

export const Info = createContext();

export const InfoProvider = ({ children }) => {
  const [cart, setCart] = useState(() => {
    const stored = localStorage.getItem("cart");
    return stored ? JSON.parse(stored) : [];
  });

  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  const handlesubmitCart = (item) => {
    console.log("Adding to cart:", item); // ✅ Check item data

    setCart((prevCart) => {
      const exists = prevCart.find((i) => i.id === item.id);
      if (exists) {
        return prevCart.map((i) =>
          i.id === item.id
            ? {
                ...i,
                quantity: i.quantity + 1,
              }
            : i
        );
      }

      return [
        ...prevCart,
        {
          ...item,
          price: parseFloat(item.price) || 0, // ✅ ensure price is a number
          quantity: 1,
        },
      ];
    });
  };

  const decreaseQty = (id) => {
    setCart((prevCart) =>
      prevCart
        .map((item) =>
          item.id === id
            ? { ...item, quantity: item.quantity - 1 }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const removeFromCart = (id) => {
    setCart((prevCart) =>
      prevCart.filter((item) => item.id !== id)
    );
  };

  return (
    <Info.Provider
      value={{
        cart,
        setCart,
        handlesubmitCart,
        decreaseQty,
        removeFromCart,
      }}
    >
      {children}
    </Info.Provider>
  );
};
